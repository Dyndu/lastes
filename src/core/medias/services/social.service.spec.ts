import { Test, TestingModule } from '@nestjs/testing';
import { SocialService } from './social.service';
import { MediasService } from './medias.service';
import { SocialRepository } from '../repositories';
import { SocialEntity } from '../entities';
import { SocketEventEnum } from '../../../common/enum';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('SocialService', () => {
    let service: SocialService;
    let mediasService: any;
    let socialRepository: jest.Mocked<SocialRepository>;
    let logger: any;
    let errorHandler: any;
    let socketService: any;

    const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    };

    const mockErrorHandler = {
        notFound: jest.fn().mockImplementation((message, _title) => {
            throw new Error(message);
        }),
        badRequest: jest.fn().mockImplementation((message, _title) => {
            throw new Error(message);
        }),
        unauthorized: jest.fn().mockImplementation((message, _title) => {
            throw new Error(message);
        }),
    };

    const mockSocketService = {
        sendDataToRoute: jest.fn(),
    };

    const mockSocialRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SocialService,
                {
                    provide: MediasService,
                    useValue: {
                        logger: mockLogger,
                        errorHandler: mockErrorHandler,
                        socketService: mockSocketService,
                        socialRepository: mockSocialRepository,
                    },
                },
            ],
        }).compile();

        service = module.get<SocialService>(SocialService);
        mediasService = module.get<MediasService>(MediasService);
        socialRepository = mediasService.socialRepository;
        logger = mediasService.logger;
        errorHandler = mediasService.errorHandler;
        socketService = mediasService.socketService;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('allSocials', () => {
        it('should return all non-deleted social networks', async () => {
            const mockSocials = [
                { id: '1', label: 'Facebook', isActive: true },
                { id: '2', label: 'Instagram', isActive: false },
                { id: '3', label: 'X', isActive: true },
            ] as SocialEntity[];

            socialRepository.find.mockResolvedValue(mockSocials);

            const result = await service.allSocials();

            expect(logger.info).toHaveBeenCalledWith('All social networks');
            expect(socialRepository.find).toHaveBeenCalledWith({
                where: { deleted: false },
                select: ['id', 'label', 'isActive'],
            });
            expect(result).toEqual(mockSocials);
        });

        it('should return empty array when no social networks exist', async () => {
            socialRepository.find.mockResolvedValue([]);

            const result = await service.allSocials();

            expect(logger.info).toHaveBeenCalledWith('All social networks');
            expect(socialRepository.find).toHaveBeenCalledWith({
                where: { deleted: false },
                select: ['id', 'label', 'isActive'],
            });
            expect(result).toEqual([]);
        });

        it('should only select id, label, and isActive fields', async () => {
            socialRepository.find.mockResolvedValue([]);

            await service.allSocials();

            expect(socialRepository.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    select: ['id', 'label', 'isActive'],
                }),
            );
        });
    });

    describe('toggleSocial', () => {
        const socialId = '123e4567-e89b-12d3-a456-426614174000';

        it('should activate an inactive social network and emit socket event', async () => {
            const mockSocial = {
                id: socialId,
                label: 'Facebook',
                isActive: false,
                deleted: false,
            } as SocialEntity;

            const updatedSocial = {
                id: socialId,
                label: 'Facebook',
                isActive: true,
            } as SocialEntity;

            socialRepository.findOne
                .mockResolvedValueOnce(mockSocial)
                .mockResolvedValueOnce(updatedSocial);
            socialRepository.update.mockResolvedValue(undefined!);

            const result = await service.toggleSocial(socialId);

            expect(logger.info).toHaveBeenCalledWith(`Toggle Social Service with id ${socialId}`);
            expect(socialRepository.findOne).toHaveBeenNthCalledWith(1, {
                where: { id: socialId, deleted: false },
            });
            expect(socialRepository.update).toHaveBeenCalledWith(
                { id: socialId },
                { isActive: true },
            );
            expect(socialRepository.findOne).toHaveBeenNthCalledWith(2, {
                where: { id: socialId, deleted: false },
                select: ['id', 'label', 'isActive'],
            });
            expect(socketService.sendDataToRoute).toHaveBeenCalledWith(
                '/social',
                SocketEventEnum.SOCIAL_NETWORK_UPDATED,
                [
                    {
                        payload: updatedSocial,
                    },
                ],
            );
            expect(result).toEqual({
                message: 'Social network  active successfully',
            });
        });

        it('should deactivate an active social network and emit socket event', async () => {
            const mockSocial = {
                id: socialId,
                label: 'Instagram',
                isActive: true,
                deleted: false,
            } as SocialEntity;

            const updatedSocial = {
                id: socialId,
                label: 'Instagram',
                isActive: false,
            } as SocialEntity;

            socialRepository.findOne
                .mockResolvedValueOnce(mockSocial)
                .mockResolvedValueOnce(updatedSocial);
            socialRepository.update.mockResolvedValue(undefined!);

            const result = await service.toggleSocial(socialId);

            expect(logger.info).toHaveBeenCalledWith(`Toggle Social Service with id ${socialId}`);
            expect(socialRepository.findOne).toHaveBeenNthCalledWith(1, {
                where: { id: socialId, deleted: false },
            });
            expect(socialRepository.update).toHaveBeenCalledWith(
                { id: socialId },
                { isActive: false },
            );
            expect(socialRepository.findOne).toHaveBeenNthCalledWith(2, {
                where: { id: socialId, deleted: false },
                select: ['id', 'label', 'isActive'],
            });
            expect(socketService.sendDataToRoute).toHaveBeenCalledWith(
                '/social',
                SocketEventEnum.SOCIAL_NETWORK_UPDATED,
                [
                    {
                        payload: updatedSocial,
                    },
                ],
            );
            expect(result).toEqual({
                message: 'Social network  deactivate successfully',
            });
        });

        it('should throw not found error when social network does not exist', async () => {
            socialRepository.findOne.mockResolvedValue(null);

            await expect(service.toggleSocial(socialId)).rejects.toThrow(
                `Social network with id: ${socialId} not found`,
            );

            expect(logger.info).toHaveBeenCalledWith(`Toggle Social Service with id ${socialId}`);
            expect(socialRepository.findOne).toHaveBeenCalledWith({
                where: { id: socialId, deleted: false },
            });
            expect(errorHandler.notFound).toHaveBeenCalledWith(
                `Social network with id: ${socialId} not found`,
                'Social not found',
            );
            expect(socialRepository.update).not.toHaveBeenCalled();
            expect(socketService.sendDataToRoute).not.toHaveBeenCalled();
        });

        it('should throw not found error when social network is deleted', async () => {
            const deletedSocialId = 'deleted-social-id';
            socialRepository.findOne.mockResolvedValue(null);

            await expect(service.toggleSocial(deletedSocialId)).rejects.toThrow(
                `Social network with id: ${deletedSocialId} not found`,
            );

            expect(socialRepository.findOne).toHaveBeenCalledWith({
                where: { id: deletedSocialId, deleted: false },
            });
            expect(errorHandler.notFound).toHaveBeenCalledWith(
                `Social network with id: ${deletedSocialId} not found`,
                'Social not found',
            );
            expect(socketService.sendDataToRoute).not.toHaveBeenCalled();
        });

        it('should emit socket event with correct route and event type', async () => {
            const mockSocial = {
                id: socialId,
                label: 'LinkedIn',
                isActive: false,
                deleted: false,
            } as SocialEntity;

            const updatedSocial = {
                id: socialId,
                label: 'LinkedIn',
                isActive: true,
            } as SocialEntity;

            socialRepository.findOne
                .mockResolvedValueOnce(mockSocial)
                .mockResolvedValueOnce(updatedSocial);

            await service.toggleSocial(socialId);

            expect(socketService.sendDataToRoute).toHaveBeenCalledWith(
                '/social',
                SocketEventEnum.SOCIAL_NETWORK_UPDATED,
                expect.any(Array),
            );
        });

        it('should emit socket event with updated social data in payload', async () => {
            const mockSocial = {
                id: socialId,
                label: 'Discord',
                isActive: true,
                deleted: false,
            } as SocialEntity;

            const updatedSocial = {
                id: socialId,
                label: 'Discord',
                isActive: false,
            } as SocialEntity;

            socialRepository.findOne
                .mockResolvedValueOnce(mockSocial)
                .mockResolvedValueOnce(updatedSocial);

            await service.toggleSocial(socialId);

            const socketCall = socketService.sendDataToRoute.mock.calls[0];
            expect(socketCall[2]).toEqual([
                {
                    payload: updatedSocial,
                },
            ]);
        });

        it('should fetch updated social data with correct select fields', async () => {
            const mockSocial = {
                id: socialId,
                label: 'Whatsapp',
                isActive: false,
                deleted: false,
            } as SocialEntity;

            const updatedSocial = {
                id: socialId,
                label: 'Whatsapp',
                isActive: true,
            } as SocialEntity;

            socialRepository.findOne
                .mockResolvedValueOnce(mockSocial)
                .mockResolvedValueOnce(updatedSocial);

            await service.toggleSocial(socialId);

            expect(socialRepository.findOne).toHaveBeenNthCalledWith(2, {
                where: { id: socialId, deleted: false },
                select: ['id', 'label', 'isActive'],
            });
        });

        it('should call findOne exactly twice during toggle operation', async () => {
            const mockSocial = {
                id: socialId,
                label: 'X',
                isActive: true,
                deleted: false,
            } as SocialEntity;

            const updatedSocial = {
                id: socialId,
                label: 'X',
                isActive: false,
            } as SocialEntity;

            socialRepository.findOne
                .mockResolvedValueOnce(mockSocial)
                .mockResolvedValueOnce(updatedSocial);

            await service.toggleSocial(socialId);

            expect(socialRepository.findOne).toHaveBeenCalledTimes(2);
        });
    });
});
