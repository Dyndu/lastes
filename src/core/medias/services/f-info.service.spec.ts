import { Test, TestingModule } from '@nestjs/testing';
import { MediasService } from './medias.service';
import { FooterInfoRepository } from '../repositories';
import { FooterInfoEntity } from '../entities';
import { UpdateInfoDto } from '../dto/update-info.dto';
import { FInfoService } from './f-info.service';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('FInfoService', () => {
    let service: FInfoService;
    let mediasService: any;
    let fInfoRepo: jest.Mocked<FooterInfoRepository>;
    let logger: any;
    let errorHandler: any;
    let otherUtils: any;

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
    };

    const mockOtherUtils = {
        validateAndParsePhone: jest.fn(),
    };

    const mockFooterInfoRepository = {
        findOne: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FInfoService,
                {
                    provide: MediasService,
                    useValue: {
                        logger: mockLogger,
                        errorHandler: mockErrorHandler,
                        otherUtils: mockOtherUtils,
                        fInfoRepo: mockFooterInfoRepository,
                    },
                },
            ],
        }).compile();

        service = module.get<FInfoService>(FInfoService);
        mediasService = module.get<MediasService>(MediasService);
        fInfoRepo = mediasService.fInfoRepo;
        logger = mediasService.logger;
        errorHandler = mediasService.errorHandler;
        otherUtils = mediasService.otherUtils;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('footerInfo', () => {
        it('should return footer information successfully', async () => {
            const mockFooterInfo = {
                id: '123',
                phoneNumber: '+22951227041',
                email: 'test@example.com',
                facebook: 'https://www.facebook.com/page',
                instagram: 'https://www.instagram.com/user',
                linkedIn: 'https://www.linkedin.com/in/profile',
                twitter: 'https://x.com/username',
                discord: 'https://discord.com/invite/abc',
                deleted: false,
            } as FooterInfoEntity;

            fInfoRepo.findOne.mockResolvedValue(mockFooterInfo);

            const result = await service.footerInfo();

            expect(logger.info).toHaveBeenCalledWith('Retrieving footer information');
            expect(fInfoRepo.findOne).toHaveBeenCalledWith({
                where: { deleted: false },
                select: [
                    'phoneNumber',
                    'email',
                    'facebook',
                    'instagram',
                    'linkedIn',
                    'twitter',
                    'discord',
                ],
            });
            expect(result).toEqual(mockFooterInfo);
        });

        it('should return null when no footer information exists', async () => {
            fInfoRepo.findOne.mockResolvedValue(null);

            const result = await service.footerInfo();

            expect(logger.info).toHaveBeenCalledWith('Retrieving footer information');
            expect(fInfoRepo.findOne).toHaveBeenCalledWith({
                where: { deleted: false },
                select: [
                    'phoneNumber',
                    'email',
                    'facebook',
                    'instagram',
                    'linkedIn',
                    'twitter',
                    'discord',
                ],
            });
            expect(result).toBeNull();
        });

        it('should only select specified fields', async () => {
            fInfoRepo.findOne.mockResolvedValue(null);

            await service.footerInfo();

            expect(fInfoRepo.findOne).toHaveBeenCalledWith(
                expect.objectContaining({
                    select: [
                        'phoneNumber',
                        'email',
                        'facebook',
                        'instagram',
                        'linkedIn',
                        'twitter',
                        'discord',
                    ],
                }),
            );
        });
    });

    describe('updateFInfo', () => {
        const mockExistingData = {
            id: '123',
            phoneNumber: '+22951227041',
            email: 'old@example.com',
            facebook: 'https://www.facebook.com/oldpage',
            instagram: 'https://www.instagram.com/olduser',
            linkedIn: 'https://www.linkedin.com/in/oldprofile',
            twitter: 'https://x.com/oldusername',
            discord: 'https://discord.com/invite/old',
            deleted: false,
        } as FooterInfoEntity;

        it('should update all fields when all are provided', async () => {
            const updateDto: UpdateInfoDto = {
                email: 'new@example.com',
                instagram: 'https://www.instagram.com/newuser',
                phoneNumber: '+22999999999',
                discord: 'https://discord.com/invite/new',
                linkedIn: 'https://www.linkedin.com/in/newprofile',
                twitter: 'https://x.com/newusername',
                facebook: 'https://www.facebook.com/newpage',
            };

            fInfoRepo.findOne.mockResolvedValue({ ...mockExistingData });
            fInfoRepo.update.mockResolvedValue(undefined!);
            otherUtils.validateAndParsePhone.mockReturnValue(true);

            const result = await service.updateFInfo(updateDto);

            expect(logger.info).toHaveBeenCalledWith('Updating footer information');
            expect(fInfoRepo.findOne).toHaveBeenCalledWith({
                where: { deleted: false },
            });
            expect(otherUtils.validateAndParsePhone).toHaveBeenCalledWith('+22999999999');
            expect(fInfoRepo.update).toHaveBeenCalledWith(
                { id: '123' },
                expect.objectContaining({
                    email: 'new@example.com',
                    instagram: 'https://www.instagram.com/newuser',
                    phoneNumber: '+22999999999',
                    discord: 'https://discord.com/invite/new',
                    linkedIn: 'https://www.linkedin.com/in/newprofile',
                    twitter: 'https://x.com/newusername',
                    facebook: 'https://www.facebook.com/newpage',
                }),
            );
            expect(result).toEqual({
                message: 'Footer information updated successfully',
            });
        });

        it('should update only email when only email is provided', async () => {
            const updateDto: UpdateInfoDto = {
                email: 'newemail@example.com',
            };

            const dataToUpdate = { ...mockExistingData };
            fInfoRepo.findOne.mockResolvedValue(dataToUpdate);
            fInfoRepo.update.mockResolvedValue(undefined!);

            const result = await service.updateFInfo(updateDto);

            expect(logger.info).toHaveBeenCalledWith('Updating footer information');
            expect(fInfoRepo.update).toHaveBeenCalledWith(
                { id: '123' },
                expect.objectContaining({
                    email: 'newemail@example.com',
                }),
            );
            expect(otherUtils.validateAndParsePhone).not.toHaveBeenCalled();
            expect(result).toEqual({
                message: 'Footer information updated successfully',
            });
        });

        it('should update only instagram when only instagram is provided', async () => {
            const updateDto: UpdateInfoDto = {
                instagram: 'https://www.instagram.com/brandnew',
            };

            const dataToUpdate = { ...mockExistingData };
            fInfoRepo.findOne.mockResolvedValue(dataToUpdate);
            fInfoRepo.update.mockResolvedValue(undefined!);

            const result = await service.updateFInfo(updateDto);

            expect(fInfoRepo.update).toHaveBeenCalledWith(
                { id: '123' },
                expect.objectContaining({
                    instagram: 'https://www.instagram.com/brandnew',
                }),
            );
            expect(result).toEqual({
                message: 'Footer information updated successfully',
            });
        });

        it('should update only discord when only discord is provided', async () => {
            const updateDto: UpdateInfoDto = {
                discord: 'https://discord.com/invite/brandnew',
            };

            const dataToUpdate = { ...mockExistingData };
            fInfoRepo.findOne.mockResolvedValue(dataToUpdate);
            fInfoRepo.update.mockResolvedValue(undefined!);

            const result = await service.updateFInfo(updateDto);

            expect(fInfoRepo.update).toHaveBeenCalledWith(
                { id: '123' },
                expect.objectContaining({
                    discord: 'https://discord.com/invite/brandnew',
                }),
            );
            expect(result).toEqual({
                message: 'Footer information updated successfully',
            });
        });

        it('should update only linkedIn when only linkedIn is provided', async () => {
            const updateDto: UpdateInfoDto = {
                linkedIn: 'https://www.linkedin.com/in/brandnew',
            };

            const dataToUpdate = { ...mockExistingData };
            fInfoRepo.findOne.mockResolvedValue(dataToUpdate);
            fInfoRepo.update.mockResolvedValue(undefined!);

            const result = await service.updateFInfo(updateDto);

            expect(fInfoRepo.update).toHaveBeenCalledWith(
                { id: '123' },
                expect.objectContaining({
                    linkedIn: 'https://www.linkedin.com/in/brandnew',
                }),
            );
            expect(result).toEqual({
                message: 'Footer information updated successfully',
            });
        });

        it('should update only twitter when only twitter is provided', async () => {
            const updateDto: UpdateInfoDto = {
                twitter: 'https://x.com/brandnew',
            };

            const dataToUpdate = { ...mockExistingData };
            fInfoRepo.findOne.mockResolvedValue(dataToUpdate);
            fInfoRepo.update.mockResolvedValue(undefined!);

            const result = await service.updateFInfo(updateDto);

            expect(fInfoRepo.update).toHaveBeenCalledWith(
                { id: '123' },
                expect.objectContaining({
                    twitter: 'https://x.com/brandnew',
                }),
            );
            expect(result).toEqual({
                message: 'Footer information updated successfully',
            });
        });

        it('should update only facebook when only facebook is provided', async () => {
            const updateDto: UpdateInfoDto = {
                facebook: 'https://www.facebook.com/brandnew',
            };

            const dataToUpdate = { ...mockExistingData };
            fInfoRepo.findOne.mockResolvedValue(dataToUpdate);
            fInfoRepo.update.mockResolvedValue(undefined!);

            const result = await service.updateFInfo(updateDto);

            expect(fInfoRepo.update).toHaveBeenCalledWith(
                { id: '123' },
                expect.objectContaining({
                    facebook: 'https://www.facebook.com/brandnew',
                }),
            );
            expect(result).toEqual({
                message: 'Footer information updated successfully',
            });
        });

        it('should update only phoneNumber and validate it when only phoneNumber is provided', async () => {
            const updateDto: UpdateInfoDto = {
                phoneNumber: '+22988888888',
            };

            const dataToUpdate = { ...mockExistingData };
            fInfoRepo.findOne.mockResolvedValue(dataToUpdate);
            fInfoRepo.update.mockResolvedValue(undefined!);
            otherUtils.validateAndParsePhone.mockReturnValue(true);

            const result = await service.updateFInfo(updateDto);

            expect(otherUtils.validateAndParsePhone).toHaveBeenCalledWith('+22988888888');
            expect(fInfoRepo.update).toHaveBeenCalledWith(
                { id: '123' },
                expect.objectContaining({
                    phoneNumber: '+22988888888',
                }),
            );
            expect(result).toEqual({
                message: 'Footer information updated successfully',
            });
        });

        it('should throw not found error when footer information does not exist', async () => {
            const updateDto: UpdateInfoDto = {
                email: 'new@example.com',
            };

            fInfoRepo.findOne.mockResolvedValue(null);

            await expect(service.updateFInfo(updateDto)).rejects.toThrow(
                'Footer information not found',
            );

            expect(logger.info).toHaveBeenCalledWith('Updating footer information');
            expect(fInfoRepo.findOne).toHaveBeenCalledWith({
                where: { deleted: false },
            });
            expect(errorHandler.notFound).toHaveBeenCalledWith(
                'Footer information not found',
                'Information not found.',
            );
            expect(fInfoRepo.update).not.toHaveBeenCalled();
        });

        it('should update multiple fields but not all', async () => {
            const updateDto: UpdateInfoDto = {
                email: 'partial@example.com',
                facebook: 'https://www.facebook.com/partial',
                phoneNumber: '+22977777777',
            };

            const dataToUpdate = { ...mockExistingData };
            fInfoRepo.findOne.mockResolvedValue(dataToUpdate);
            fInfoRepo.update.mockResolvedValue(undefined!);
            otherUtils.validateAndParsePhone.mockReturnValue(true);

            const result = await service.updateFInfo(updateDto);

            expect(otherUtils.validateAndParsePhone).toHaveBeenCalledWith('+22977777777');
            expect(fInfoRepo.update).toHaveBeenCalledWith(
                { id: '123' },
                expect.objectContaining({
                    email: 'partial@example.com',
                    facebook: 'https://www.facebook.com/partial',
                    phoneNumber: '+22977777777',
                }),
            );
            expect(result).toEqual({
                message: 'Footer information updated successfully',
            });
        });

        it('should not update fields that are undefined in the DTO', async () => {
            const updateDto: UpdateInfoDto = {
                email: 'only-email@example.com',
            };

            const dataToUpdate = { ...mockExistingData };
            fInfoRepo.findOne.mockResolvedValue(dataToUpdate);
            fInfoRepo.update.mockResolvedValue(undefined!);

            await service.updateFInfo(updateDto);

            const updatedData = fInfoRepo.update.mock.calls[0][1];

            expect(updatedData.instagram).toBe('https://www.instagram.com/olduser');
            expect(updatedData.discord).toBe('https://discord.com/invite/old');
            expect(updatedData.linkedIn).toBe('https://www.linkedin.com/in/oldprofile');
            expect(updatedData.twitter).toBe('https://x.com/oldusername');
            expect(updatedData.facebook).toBe('https://www.facebook.com/oldpage');
            expect(updatedData.phoneNumber).toBe('+22951227041');
        });

        it('should call validateAndParsePhone before updating phone number', async () => {
            const updateDto: UpdateInfoDto = {
                phoneNumber: '+22966666666',
            };

            const dataToUpdate = { ...mockExistingData };
            fInfoRepo.findOne.mockResolvedValue(dataToUpdate);
            fInfoRepo.update.mockResolvedValue(undefined!);
            otherUtils.validateAndParsePhone.mockReturnValue(true);

            await service.updateFInfo(updateDto);

            expect(otherUtils.validateAndParsePhone).toHaveBeenCalled();
            expect(otherUtils.validateAndParsePhone).toHaveBeenCalledWith('+22966666666');
        });

        it('should update with empty DTO (no fields provided)', async () => {
            const updateDto: UpdateInfoDto = {};

            const dataToUpdate = { ...mockExistingData };
            fInfoRepo.findOne.mockResolvedValue(dataToUpdate);
            fInfoRepo.update.mockResolvedValue(undefined!);

            const result = await service.updateFInfo(updateDto);

            expect(fInfoRepo.update).toHaveBeenCalledWith({ id: '123' }, mockExistingData);
            expect(otherUtils.validateAndParsePhone).not.toHaveBeenCalled();
            expect(result).toEqual({
                message: 'Footer information updated successfully',
            });
        });
    });
});
