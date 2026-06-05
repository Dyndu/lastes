import { Test, TestingModule } from '@nestjs/testing';
import { UserGuideLikeService } from './user-guide-like.service';
import { GuidesService } from './guides.service';
import { GuideReactionEnum } from '../../../common/enum';
import { UserEntity } from '../../users/entities/user.entity';
import { GuideEntity, UserGuideLikeEntity } from '../entities';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('UserGuideLikeService', () => {
    let service: UserGuideLikeService;
    let guidesService: any;
    let mockUGLikesRepo: any;

    const mockUserEntity: UserEntity = {
        id: 'user-123',
        email: 'test@example.com',
    } as UserEntity;

    const mockGuideEntity: GuideEntity = {
        id: 'guide-123',
        label: 'Test Guide',
    } as GuideEntity;

    const mockUserGuideLikeEntity: UserGuideLikeEntity = {
        id: 'like-123',
        user: mockUserEntity,
        guide: mockGuideEntity,
        reaction: GuideReactionEnum.LIKE,
        deleted: false,
    } as UserGuideLikeEntity;

    beforeEach(async () => {
        mockUGLikesRepo = {
            findOne: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
        };

        const mockGuidesService = {
            uGLikesRepo: mockUGLikesRepo,
            cacheService: {
                deleteKeysByBase: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserGuideLikeService,
                {
                    provide: GuidesService,
                    useValue: mockGuidesService,
                },
            ],
        }).compile();

        service = module.get<UserGuideLikeService>(UserGuideLikeService);
        guidesService = module.get(GuidesService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('setGuideReaction', () => {
        it('should update existing reaction when link exists', async () => {
            mockUGLikesRepo.findOne.mockResolvedValue(mockUserGuideLikeEntity);
            mockUGLikesRepo.update.mockResolvedValue({ affected: 1 });
            guidesService.cacheService.deleteKeysByBase.mockResolvedValue(undefined);

            const result = await service.setGuideReaction(
                mockUserEntity,
                mockGuideEntity,
                GuideReactionEnum.DISLIKE,
            );

            expect(mockUGLikesRepo.findOne).toHaveBeenCalledWith({
                where: { user: { id: mockUserEntity.id }, deleted: false },
            });
            expect(mockUGLikesRepo.update).toHaveBeenCalledWith(
                { id: mockUserGuideLikeEntity.id },
                { reaction: GuideReactionEnum.DISLIKE },
            );
            expect(mockUGLikesRepo.create).not.toHaveBeenCalled();
            expect(guidesService.cacheService.deleteKeysByBase).toHaveBeenCalledWith('guides');
            expect(result).toEqual({
                message: 'Guide reaction set successfully',
            });
        });

        it('should update existing reaction to null when link exists', async () => {
            mockUGLikesRepo.findOne.mockResolvedValue(mockUserGuideLikeEntity);
            mockUGLikesRepo.update.mockResolvedValue({ affected: 1 });
            guidesService.cacheService.deleteKeysByBase.mockResolvedValue(undefined);

            const result = await service.setGuideReaction(mockUserEntity, mockGuideEntity, null);

            expect(mockUGLikesRepo.update).toHaveBeenCalledWith(
                { id: mockUserGuideLikeEntity.id },
                { reaction: null },
            );
            expect(result).toEqual({
                message: 'Guide reaction set successfully',
            });
        });

        it('should create new reaction when link does not exist', async () => {
            mockUGLikesRepo.findOne.mockResolvedValue(null);
            mockUGLikesRepo.create.mockResolvedValue(mockUserGuideLikeEntity);
            guidesService.cacheService.deleteKeysByBase.mockResolvedValue(undefined);

            const result = await service.setGuideReaction(
                mockUserEntity,
                mockGuideEntity,
                GuideReactionEnum.LIKE,
            );

            expect(mockUGLikesRepo.findOne).toHaveBeenCalledWith({
                where: { user: { id: mockUserEntity.id }, deleted: false },
            });
            expect(mockUGLikesRepo.update).not.toHaveBeenCalled();
            expect(mockUGLikesRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    guide: mockGuideEntity,
                    user: mockUserEntity,
                    reaction: GuideReactionEnum.LIKE,
                }),
            );
            expect(guidesService.cacheService.deleteKeysByBase).toHaveBeenCalledWith('guides');
            expect(result).toEqual({
                message: 'Guide reaction set successfully',
            });
        });

        it('should create new reaction with null value when link does not exist', async () => {
            mockUGLikesRepo.findOne.mockResolvedValue(null);
            mockUGLikesRepo.create.mockResolvedValue({
                ...mockUserGuideLikeEntity,
                reaction: null,
            });
            guidesService.cacheService.deleteKeysByBase.mockResolvedValue(undefined);

            const result = await service.setGuideReaction(mockUserEntity, mockGuideEntity, null);

            expect(mockUGLikesRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    guide: mockGuideEntity,
                    user: mockUserEntity,
                    reaction: null,
                }),
            );
            expect(result).toEqual({
                message: 'Guide reaction set successfully',
            });
        });

        it('should invalidate cache after setting reaction', async () => {
            mockUGLikesRepo.findOne.mockResolvedValue(mockUserGuideLikeEntity);
            mockUGLikesRepo.update.mockResolvedValue({ affected: 1 });
            guidesService.cacheService.deleteKeysByBase.mockResolvedValue(undefined);

            await service.setGuideReaction(mockUserEntity, mockGuideEntity, GuideReactionEnum.LIKE);

            expect(guidesService.cacheService.deleteKeysByBase).toHaveBeenCalledWith('guides');
        });

        it('should handle LIKE reaction', async () => {
            mockUGLikesRepo.findOne.mockResolvedValue(null);
            mockUGLikesRepo.create.mockResolvedValue(mockUserGuideLikeEntity);
            guidesService.cacheService.deleteKeysByBase.mockResolvedValue(undefined);

            await service.setGuideReaction(mockUserEntity, mockGuideEntity, GuideReactionEnum.LIKE);

            expect(mockUGLikesRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    reaction: GuideReactionEnum.LIKE,
                }),
            );
        });

        it('should handle DISLIKE reaction', async () => {
            mockUGLikesRepo.findOne.mockResolvedValue(null);
            mockUGLikesRepo.create.mockResolvedValue({
                ...mockUserGuideLikeEntity,
                reaction: GuideReactionEnum.DISLIKE,
            });
            guidesService.cacheService.deleteKeysByBase.mockResolvedValue(undefined);

            await service.setGuideReaction(
                mockUserEntity,
                mockGuideEntity,
                GuideReactionEnum.DISLIKE,
            );

            expect(mockUGLikesRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    reaction: GuideReactionEnum.DISLIKE,
                }),
            );
        });

        it('should create UserGuideLikeEntity instance when creating new reaction', async () => {
            mockUGLikesRepo.findOne.mockResolvedValue(null);
            mockUGLikesRepo.create.mockResolvedValue(mockUserGuideLikeEntity);
            guidesService.cacheService.deleteKeysByBase.mockResolvedValue(undefined);

            await service.setGuideReaction(mockUserEntity, mockGuideEntity, GuideReactionEnum.LIKE);

            const createCall = mockUGLikesRepo.create.mock.calls[0][0];
            expect(createCall).toBeInstanceOf(UserGuideLikeEntity);
            expect(createCall.guide).toBe(mockGuideEntity);
            expect(createCall.user).toBe(mockUserEntity);
            expect(createCall.reaction).toBe(GuideReactionEnum.LIKE);
        });
    });
});
