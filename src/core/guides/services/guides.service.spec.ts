import { Test, TestingModule } from '@nestjs/testing';
import { GuidesService } from './guides.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { GuidesRepository, GuidesStatsRepository, UserGuideLikeRepository } from '../repositories';
import { ErrorHandlerService } from '../../../common/response';
import { OtherUtils } from '../../../utils/services/tools';
import { CategoriesService } from '../../categories/categories.service';
import { PreGuideService } from './pre-guide.service';
import { FileLinksService } from '../../files/services/file-links.service';
import { SocketService } from '../../../helpers/socket/socket.service';
import { PreUserService, UsersEntityTransformService, UsersService } from '../../users/services';
import { CacheService } from '../../../helpers/cache/cache.service';
import { GuidesStatsService } from './guides-stats.service';
import { GuideEntity, GuidesStatsEntity } from '../entities';
import { GuideReactionEnum, GuideStatusEnum } from '../../../common/enum';
import { UserGuideLikeService } from './user-guide-like.service';
import { CurrentUserInterface } from '../../../interface';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('GuidesService', () => {
    let service: GuidesService;
    let logger: any;
    let preGuideService: any;
    let guideStatsService: any;
    let guidesRepo: any;
    let gStatsRepo: any;
    let errorHandler: any;
    let otherUtils: any;
    let fileLinkService: any;
    let categoryService: any;
    let socketService: any;
    let transformService: any;
    let cacheService: any;
    let userService: any;
    let uGLikeService: any;

    beforeEach(async () => {
        logger = {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
        };

        userService = {
            preUserService: {
                retrieveUserByCriteria: jest.fn(),
            },
        };

        uGLikeService = {
            setGuideReaction: jest.fn(),
        };

        preGuideService = {
            retrieveGuideByCriteria: jest.fn(),
            ensureUniqueGuideLabel: jest.fn(),
            prepareGuideData: jest.fn(),
            persistGuide: jest.fn(),
            handlePostCreation: jest.fn(),
            scheduleInvalidateCache: jest.fn(),
            retrieveGuidesQuery: jest.fn(),
            prepareGuideUpdates: jest.fn(),
            updateGuideDetails: jest.fn(),
            handlePostUpdate: jest.fn(),
            handlePostDelete: jest.fn(),
            retrieveUserGuide: jest.fn(),
        };

        guideStatsService = {
            getSingleton: jest.fn(),
        };

        guidesRepo = {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
        };

        gStatsRepo = {
            findOne: jest.fn(),
            save: jest.fn(),
        };

        const uGLikeRepo = {
            findOne: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
        };

        errorHandler = {
            handleError: jest.fn(),
        };

        otherUtils = {
            generateSlug: jest.fn(),
        };

        fileLinkService = {
            unlinkAndCleanup: jest.fn(),
        };

        categoryService = {
            findById: jest.fn(),
        };

        socketService = {
            emit: jest.fn(),
        };

        transformService = {
            transformEntity: jest.fn(),
            transformFiles: jest.fn(),
        };

        cacheService = {
            generateRedisKey: jest.fn(),
            retrieveGenericPaginated: jest.fn(),
            deleteKeysByBase: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GuidesService,
                { provide: WINSTON_MODULE_PROVIDER, useValue: logger },
                { provide: PreGuideService, useValue: preGuideService },
                { provide: GuidesStatsService, useValue: guideStatsService },
                { provide: GuidesRepository, useValue: guidesRepo },
                { provide: GuidesStatsRepository, useValue: gStatsRepo },
                { provide: ErrorHandlerService, useValue: errorHandler },
                { provide: OtherUtils, useValue: otherUtils },
                { provide: FileLinksService, useValue: fileLinkService },
                { provide: CategoriesService, useValue: categoryService },
                { provide: SocketService, useValue: socketService },
                { provide: UsersService, useValue: userService },
                { provide: UserGuideLikeService, useValue: uGLikeService },
                { provide: UserGuideLikeRepository, useValue: uGLikeRepo },
                {
                    provide: PreUserService,
                    useValue: userService.preUserService,
                },
                {
                    provide: UsersEntityTransformService,
                    useValue: transformService,
                },
                { provide: CacheService, useValue: cacheService },
            ],
        }).compile();

        service = module.get<GuidesService>(GuidesService);
        module.get<UsersService>(UsersService);
        module.get<UserGuideLikeService>(UserGuideLikeService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('transformGuide', () => {
        it('should transform a guide entities with all properties', () => {
            const mockCategory = { id: 'cat-1', name: 'Category 1' };
            const mockFile = {
                id: 'file-1',
                url: 'https://example.com/file.pdf',
            };
            const mockTransformedCategory = {
                id: 'cat-1',
                label: 'Category 1',
            };
            const mockTransformedFile = {
                id: 'file-1',
                path: '/files/file.pdf',
            };

            const guideEntity: GuideEntity = {
                id: 'guide-1',
                label: 'Test Guide',
                description: 'This is a test guide',
                status: GuideStatusEnum.PUBLISHED,
                category: mockCategory,
                file: {
                    id: 'file-link-1',
                    file: mockFile,
                },
            } as any;

            transformService.transformEntity.mockReturnValue(mockTransformedCategory);
            transformService.transformFiles.mockReturnValue(mockTransformedFile);

            const result = service.transformGuide(guideEntity);

            expect(result).toEqual({
                id: 'guide-1',
                label: 'Test Guide',
                description: 'This is a test guide',
                status: GuideStatusEnum.PUBLISHED,
                category: mockTransformedCategory,
                file: mockTransformedFile,
            });
            expect(transformService.transformEntity).toHaveBeenCalledWith(mockCategory);
            expect(transformService.transformFiles).toHaveBeenCalledWith(mockFile);
        });

        it('should handle guide with draft status', () => {
            const guideEntity: GuideEntity = {
                id: 'guide-2',
                label: 'Draft Guide',
                description: 'Draft description',
                status: GuideStatusEnum.DRAFT,
                category: { id: 'cat-2' },
                file: { id: 'file-link-2', file: { id: 'file-2' } },
            } as any;

            transformService.transformEntity.mockReturnValue({ id: 'cat-2' });
            transformService.transformFiles.mockReturnValue({ id: 'file-2' });

            const result = service.transformGuide(guideEntity);

            expect(result.status).toBe(GuideStatusEnum.DRAFT);
        });
    });

    describe('userGuideRelations', () => {
        it('should return correct relations array for user guides', () => {
            const result = service.userGuideRelations();

            expect(result).toEqual(['file', 'file.file', 'category', 'likes', 'likes.user']);
        });

        it('should always return same relations', () => {
            const result1 = service.userGuideRelations();
            const result2 = service.userGuideRelations();

            expect(result1).toEqual(result2);
        });

        it('should return array with 5 elements', () => {
            const result = service.userGuideRelations();

            expect(result).toHaveLength(5);
        });
    });

    describe('transformGStats', () => {
        it('should transform guide stats entities correctly', () => {
            const statsEntity: GuidesStatsEntity = {
                id: 'stats-1',
                total: 100,
                draft: 25,
                published: 75,
            } as any;

            const result = service.transformGStats(statsEntity);

            expect(result).toEqual({
                total: 100,
                draft: 25,
                published: 75,
            });
        });

        it('should handle stats with zero values', () => {
            const statsEntity: GuidesStatsEntity = {
                id: 'stats-2',
                total: 0,
                draft: 0,
                published: 0,
            } as any;

            const result = service.transformGStats(statsEntity);

            expect(result).toEqual({
                total: 0,
                draft: 0,
                published: 0,
            });
        });

        it('should handle stats with large numbers', () => {
            const statsEntity: GuidesStatsEntity = {
                id: 'stats-3',
                total: 999999,
                draft: 500000,
                published: 499999,
            } as any;

            const result = service.transformGStats(statsEntity);

            expect(result).toEqual({
                total: 999999,
                draft: 500000,
                published: 499999,
            });
        });
    });

    describe('userGuides', () => {
        it('should retrieve user guides with all filters', async () => {
            const user: CurrentUserInterface = {
                id: 'user-123',
                role: 'user',
            } as any;
            const page = 1;
            const limit = 10;
            const filterItems = {
                categories: ['cat-1', 'cat-2'],
                isVideo: true,
                searchTerm: 'Tutorial',
            };
            const mockBaseKey =
                'guides:role:user:isVideo:true:search:tutorial:categories:cat-1,cat-2';
            const mockPaginatedResult = {
                data: [
                    {
                        id: 'guide-1',
                        label: 'Video Tutorial',
                        isVideo: true,
                    },
                ],
                meta: {
                    total: 1,
                    page: 1,
                    limit: 10,
                    totalPages: 1,
                },
            };

            cacheService.generateRedisKey.mockReturnValue(mockBaseKey);
            cacheService.retrieveGenericPaginated.mockResolvedValue(mockPaginatedResult);

            const result = await service.userGuides(user, page, limit, filterItems);

            expect(logger.info).toHaveBeenCalledWith(
                'Retrieve user guides from cache or database.',
            );
            expect(cacheService.generateRedisKey).toHaveBeenCalledWith('guides', {
                role: 'user',
                isVideo: true,
                search: 'tutorial',
                categories: 'cat-1,cat-2',
            });
            expect(cacheService.retrieveGenericPaginated).toHaveBeenCalledWith(
                mockBaseKey,
                page,
                limit,
                {
                    searchTerm: 'Tutorial',
                    isVideo: true,
                    liked: undefined,
                    categories: ['cat-1', 'cat-2'],
                },
                expect.any(Function),
                expect.any(Function),
            );
            expect(result).toEqual(mockPaginatedResult);
        });

        it('should retrieve user guides without filters', async () => {
            const user: CurrentUserInterface = {
                id: 'user-123',
                role: 'user',
            } as any;
            const page = 1;
            const limit = 10;
            const filterItems = {};
            const mockBaseKey = 'guides:role:user';

            cacheService.generateRedisKey.mockReturnValue(mockBaseKey);
            cacheService.retrieveGenericPaginated.mockResolvedValue({
                data: [],
                meta: {},
            });

            await service.userGuides(user, page, limit, filterItems);

            expect(cacheService.generateRedisKey).toHaveBeenCalledWith('guides', {
                role: 'user',
            });
        });

        it('should retrieve user guides with only isVideo filter', async () => {
            const user: CurrentUserInterface = {
                id: 'user-123',
                role: 'user',
            } as any;
            const page = 1;
            const limit = 10;
            const filterItems = { isVideo: false };
            const mockBaseKey = 'guides:role:user:isVideo:false';

            cacheService.generateRedisKey.mockReturnValue(mockBaseKey);
            cacheService.retrieveGenericPaginated.mockResolvedValue({
                data: [],
                meta: {},
            });

            await service.userGuides(user, page, limit, filterItems);

            expect(cacheService.generateRedisKey).toHaveBeenCalledWith('guides', {
                role: 'user',
                isVideo: false,
            });
        });

        it('should retrieve user guides with only categories filter', async () => {
            const user: CurrentUserInterface = {
                id: 'user-123',
                role: 'admin',
            } as any;
            const page = 1;
            const limit = 10;
            const filterItems = { categories: ['cat-1'] };
            const mockBaseKey = 'guides:role:admin:categories:cat-1';

            cacheService.generateRedisKey.mockReturnValue(mockBaseKey);
            cacheService.retrieveGenericPaginated.mockResolvedValue({
                data: [],
                meta: {},
            });

            await service.userGuides(user, page, limit, filterItems);

            expect(cacheService.generateRedisKey).toHaveBeenCalledWith('guides', {
                role: 'admin',
                categories: 'cat-1',
            });
        });

        it('should retrieve user guides with liked filter', async () => {
            const user: CurrentUserInterface = {
                id: 'user-123',
                role: 'user',
            } as any;
            const page = 1;
            const limit = 10;
            const filterItems = { liked: true };
            const mockBaseKey = 'guides:role:user:liked:true-user-123';

            cacheService.generateRedisKey.mockReturnValue(mockBaseKey);
            cacheService.retrieveGenericPaginated.mockResolvedValue({
                data: [],
                meta: {},
            });

            await service.userGuides(user, page, limit, filterItems);

            expect(cacheService.generateRedisKey).toHaveBeenCalledWith('guides', {
                role: 'user',
                liked: 'true-user-123',
            });
        });

        it('should convert searchTerm to lowercase', async () => {
            const user: CurrentUserInterface = {
                id: 'user-123',
                role: 'user',
            } as any;
            const page = 1;
            const limit = 10;
            const filterItems = { searchTerm: 'UPPERCASE' };
            const mockBaseKey = 'guides:role:user:search:uppercase';

            cacheService.generateRedisKey.mockReturnValue(mockBaseKey);
            cacheService.retrieveGenericPaginated.mockResolvedValue({
                data: [],
                meta: {},
            });

            await service.userGuides(user, page, limit, filterItems);

            expect(cacheService.generateRedisKey).toHaveBeenCalledWith('guides', {
                role: 'user',
                search: 'uppercase',
            });
        });

        it('should not include empty categories array in cache key', async () => {
            const user: CurrentUserInterface = {
                id: 'user-123',
                role: 'user',
            } as any;
            const page = 1;
            const limit = 10;
            const filterItems = { categories: [] };
            const mockBaseKey = 'guides:role:user';

            cacheService.generateRedisKey.mockReturnValue(mockBaseKey);
            cacheService.retrieveGenericPaginated.mockResolvedValue({
                data: [],
                meta: {},
            });

            await service.userGuides(user, page, limit, filterItems);

            expect(cacheService.generateRedisKey).toHaveBeenCalledWith('guides', {
                role: 'user',
            });
        });
    });

    describe('userGuideDetails', () => {
        it('should retrieve user guide details with user reaction', async () => {
            const user: CurrentUserInterface = { id: 'user-123' } as any;
            const guideId = 'guide-123';
            const mockGuide: GuideEntity = {
                id: guideId,
                label: 'Test Guide',
                description: 'Test Description',
                status: GuideStatusEnum.PUBLISHED,
                category: { id: 'cat-1' },
                file: { id: 'file-link-1', file: { id: 'file-1' } },
                likes: [
                    {
                        id: 'like-1',
                        user: { id: 'user-123' },
                        reaction: 'LIKE',
                    },
                    {
                        id: 'like-2',
                        user: { id: 'user-456' },
                        reaction: 'DISLIKE',
                    },
                ],
            } as any;

            preGuideService.retrieveGuideByCriteria.mockResolvedValue(mockGuide);
            transformService.transformEntity.mockReturnValue({ id: 'cat-1' });
            transformService.transformFiles.mockReturnValue({ id: 'file-1' });

            const result = await service.userGuideDetails(user, guideId);

            expect(logger.info).toHaveBeenCalledWith(`User guide details for ${guideId}`);
            expect(preGuideService.retrieveGuideByCriteria).toHaveBeenCalledWith({ id: guideId }, [
                'file',
                'file.file',
                'category',
                'likes',
                'likes.user',
            ]);
            expect(result.reaction).toEqual({
                id: 'like-1',
                user: { id: 'user-123' },
                reaction: 'LIKE',
            });
        });

        it('should return null reaction when user has not reacted', async () => {
            const user: CurrentUserInterface = { id: 'user-999' } as any;
            const guideId = 'guide-123';
            const mockGuide: GuideEntity = {
                id: guideId,
                label: 'Test Guide',
                file: { id: 'file-link-1', file: { id: 'file-1' } },
                likes: [
                    {
                        id: 'like-1',
                        user: { id: 'user-123' },
                        reaction: 'LIKE',
                    },
                ],
            } as any;

            preGuideService.retrieveGuideByCriteria.mockResolvedValue(mockGuide);
            transformService.transformEntity.mockReturnValue({ id: 'cat-1' });
            transformService.transformFiles.mockReturnValue({ id: 'file-1' });

            const result = await service.userGuideDetails(user, guideId);

            expect(result.reaction).toBeNull();
        });

        it('should return null reaction when guide has no likes', async () => {
            const user: CurrentUserInterface = { id: 'user-123' } as any;
            const guideId = 'guide-123';
            const mockGuide: GuideEntity = {
                id: guideId,
                label: 'Test Guide',
                file: { id: 'file-link-1', file: { id: 'file-1' } },
                likes: [],
            } as any;

            preGuideService.retrieveGuideByCriteria.mockResolvedValue(mockGuide);
            transformService.transformEntity.mockReturnValue({ id: 'cat-1' });
            transformService.transformFiles.mockReturnValue({ id: 'file-1' });

            const result = await service.userGuideDetails(user, guideId);

            expect(result.reaction).toBeNull();
        });
    });

    describe('transformGuides', () => {
        it('should transform an array of guide entities', () => {
            const guides: GuideEntity[] = [
                {
                    id: 'guide-1',
                    label: 'Guide 1',
                    description: 'Description 1',
                    status: GuideStatusEnum.PUBLISHED,
                    category: { id: 'cat-1' },
                    file: { id: 'fl-1', file: { id: 'file-1' } },
                } as any,
                {
                    id: 'guide-2',
                    label: 'Guide 2',
                    description: 'Description 2',
                    status: GuideStatusEnum.DRAFT,
                    category: { id: 'cat-2' },
                    file: { id: 'fl-2', file: { id: 'file-2' } },
                } as any,
            ];

            transformService.transformEntity.mockReturnValue({
                id: 'transformed-cat',
            });
            transformService.transformFiles.mockReturnValue({
                id: 'transformed-file',
            });

            const result = service.transformGuides(guides);

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('guide-1');
            expect(result[1].id).toBe('guide-2');
        });

        it('should return empty array when given empty array', () => {
            const guides: GuideEntity[] = [];

            const result = service.transformGuides(guides);

            expect(result).toEqual([]);
            expect(result).toHaveLength(0);
        });

        it('should handle single guide in array', () => {
            const guides: GuideEntity[] = [
                {
                    id: 'guide-solo',
                    label: 'Solo Guide',
                    description: 'Solo Description',
                    status: GuideStatusEnum.PUBLISHED,
                    category: { id: 'cat-solo' },
                    file: { id: 'fl-solo', file: { id: 'file-solo' } },
                } as any,
            ];

            transformService.transformEntity.mockReturnValue({
                id: 'cat-solo',
            });
            transformService.transformFiles.mockReturnValue({
                id: 'file-solo',
            });

            const result = service.transformGuides(guides);

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('guide-solo');
        });
    });

    describe('guideRelations', () => {
        it('should return correct relations array', () => {
            const result = service.guideRelations();

            expect(result).toEqual(['file', 'file.file', 'category']);
        });

        it('should always return same relations', () => {
            const result1 = service.guideRelations();
            const result2 = service.guideRelations();

            expect(result1).toEqual(result2);
        });

        it('should return array with 3 elements', () => {
            const result = service.guideRelations();

            expect(result).toHaveLength(3);
        });
    });

    describe('guideStats', () => {
        it('should retrieve and transform guide stats successfully', async () => {
            const mockStats: GuidesStatsEntity = {
                id: 'stats-1',
                total: 150,
                draft: 50,
                published: 100,
            } as any;

            guideStatsService.getSingleton.mockResolvedValue(mockStats);

            const result = await service.guideStats();

            expect(logger.info).toHaveBeenCalledWith('Retrieving guide stats');
            expect(guideStatsService.getSingleton).toHaveBeenCalled();
            expect(result).toEqual({
                total: 150,
                draft: 50,
                published: 100,
            });
        });

        it('should handle stats with zero published guides', async () => {
            const mockStats: GuidesStatsEntity = {
                id: 'stats-2',
                total: 10,
                draft: 10,
                published: 0,
            } as any;

            guideStatsService.getSingleton.mockResolvedValue(mockStats);

            const result = await service.guideStats();

            expect(result).toEqual({
                total: 10,
                draft: 10,
                published: 0,
            });
        });

        it('should handle stats with zero draft guides', async () => {
            const mockStats: GuidesStatsEntity = {
                id: 'stats-3',
                total: 20,
                draft: 0,
                published: 20,
            } as any;

            guideStatsService.getSingleton.mockResolvedValue(mockStats);

            const result = await service.guideStats();

            expect(result).toEqual({
                total: 20,
                draft: 0,
                published: 20,
            });
        });

        it('should handle empty stats (all zeros)', async () => {
            const mockStats: GuidesStatsEntity = {
                id: 'stats-4',
                total: 0,
                draft: 0,
                published: 0,
            } as any;

            guideStatsService.getSingleton.mockResolvedValue(mockStats);

            const result = await service.guideStats();

            expect(result).toEqual({
                total: 0,
                draft: 0,
                published: 0,
            });
        });

        it('should propagate error if getSingleton throws', async () => {
            const error = new Error('Database connection failed');
            guideStatsService.getSingleton.mockRejectedValue(error);

            await expect(service.guideStats()).rejects.toThrow('Database connection failed');
            expect(logger.info).toHaveBeenCalledWith('Retrieving guide stats');
        });

        it('should log before retrieving stats', async () => {
            const mockStats: GuidesStatsEntity = {
                id: 'stats-5',
                total: 5,
                draft: 2,
                published: 3,
            } as any;

            guideStatsService.getSingleton.mockResolvedValue(mockStats);

            await service.guideStats();

            expect(logger.info).toHaveBeenCalledTimes(1);
            expect(logger.info).toHaveBeenCalledWith('Retrieving guide stats');
        });
    });

    describe('allGuides', () => {
        it('should retrieve guides from cache successfully', async () => {
            const page = 1;
            const limit = 10;
            const filterItems = {
                status: GuideStatusEnum.PUBLISHED,
                searchTerm: 'test',
            };
            const mockBaseKey = 'guides:status:published:search:test';
            const mockPaginatedResult = {
                data: [
                    {
                        id: 'guide-1',
                        label: 'Test Guide',
                        description: 'Description',
                        status: GuideStatusEnum.PUBLISHED,
                        category: { id: 'cat-1' },
                        file: { id: 'file-1' },
                    },
                ],
                meta: {
                    total: 1,
                    page: 1,
                    limit: 10,
                    totalPages: 1,
                },
            };

            cacheService.generateRedisKey.mockReturnValue(mockBaseKey);
            cacheService.retrieveGenericPaginated.mockResolvedValue(mockPaginatedResult);

            const result = await service.allGuides(page, limit, filterItems);

            expect(logger.info).toHaveBeenCalledWith('Retrieve guides from cache or database.');
            expect(cacheService.generateRedisKey).toHaveBeenCalledWith('guides', {
                status: GuideStatusEnum.PUBLISHED,
                search: 'test',
            });
            expect(cacheService.retrieveGenericPaginated).toHaveBeenCalledWith(
                mockBaseKey,
                page,
                limit,
                {
                    status: GuideStatusEnum.PUBLISHED,
                    searchTerm: 'test',
                },
                expect.any(Function),
                expect.any(Function),
            );
            expect(result).toEqual(mockPaginatedResult);
        });

        it('should retrieve guides without filters', async () => {
            const page = 1;
            const limit = 10;
            const filterItems = {};
            const mockBaseKey = 'guides';

            cacheService.generateRedisKey.mockReturnValue(mockBaseKey);
            cacheService.retrieveGenericPaginated.mockResolvedValue({
                data: [],
                meta: {},
            });

            await service.allGuides(page, limit, filterItems);

            expect(cacheService.generateRedisKey).toHaveBeenCalledWith('guides', {});
        });

        it('should retrieve guides with only status filter', async () => {
            const page = 1;
            const limit = 10;
            const filterItems = { status: GuideStatusEnum.DRAFT };
            const mockBaseKey = 'guides:status:draft';

            cacheService.generateRedisKey.mockReturnValue(mockBaseKey);
            cacheService.retrieveGenericPaginated.mockResolvedValue({
                data: [],
                meta: {},
            });

            await service.allGuides(page, limit, filterItems);

            expect(cacheService.generateRedisKey).toHaveBeenCalledWith('guides', {
                status: GuideStatusEnum.DRAFT,
            });
        });

        it('should retrieve guides with only searchTerm filter', async () => {
            const page = 1;
            const limit = 10;
            const filterItems = { searchTerm: 'Tutorial' };
            const mockBaseKey = 'guides:search:tutorial';

            cacheService.generateRedisKey.mockReturnValue(mockBaseKey);
            cacheService.retrieveGenericPaginated.mockResolvedValue({
                data: [],
                meta: {},
            });

            await service.allGuides(page, limit, filterItems);

            expect(cacheService.generateRedisKey).toHaveBeenCalledWith('guides', {
                search: 'tutorial',
            });
        });

        it('should convert searchTerm to lowercase', async () => {
            const page = 1;
            const limit = 10;
            const filterItems = { searchTerm: 'UPPERCASE' };
            const mockBaseKey = 'guides:search:uppercase';

            cacheService.generateRedisKey.mockReturnValue(mockBaseKey);
            cacheService.retrieveGenericPaginated.mockResolvedValue({
                data: [],
                meta: {},
            });

            await service.allGuides(page, limit, filterItems);

            expect(cacheService.generateRedisKey).toHaveBeenCalledWith('guides', {
                search: 'uppercase',
            });
        });
    });

    describe('guideDetails', () => {
        it('should retrieve guide details successfully', async () => {
            const guideId = 'guide-123';
            const mockGuide: GuideEntity = {
                id: guideId,
                label: 'Test Guide',
                description: 'Test Description',
                status: GuideStatusEnum.PUBLISHED,
                category: { id: 'cat-1', name: 'Category' },
                file: {
                    id: 'file-link-1',
                    file: { id: 'file-1', url: 'https://example.com/file.pdf' },
                },
            } as any;

            preGuideService.retrieveGuideByCriteria.mockResolvedValue(mockGuide);
            transformService.transformEntity.mockReturnValue({ id: 'cat-1' });
            transformService.transformFiles.mockReturnValue({ id: 'file-1' });

            const result = await service.guideDetails(guideId);

            expect(logger.info).toHaveBeenCalledWith(`Guide details for ${guideId}`);
            expect(preGuideService.retrieveGuideByCriteria).toHaveBeenCalledWith({ id: guideId }, [
                'file',
                'file.file',
                'category',
            ]);
            expect(result).toEqual({
                id: guideId,
                label: 'Test Guide',
                description: 'Test Description',
                status: GuideStatusEnum.PUBLISHED,
                category: { id: 'cat-1' },
                file: { id: 'file-1' },
            });
        });

        it('should propagate error if guide not found', async () => {
            const guideId = 'non-existent';
            const error = new Error('Guide not found');

            preGuideService.retrieveGuideByCriteria.mockRejectedValue(error);

            await expect(service.guideDetails(guideId)).rejects.toThrow('Guide not found');
        });
    });

    describe('createGuide', () => {
        it('should create guide successfully', async () => {
            const createDto = {
                label: 'New Guide',
                isVideo: true,
                content: 'content',
                description: 'New Description',
                categoryId: 'cat-1',
                fileId: 'file-1',
                status: GuideStatusEnum.DRAFT,
            };
            const mockGuideData = {
                label: 'New Guide',
                description: 'New Description',
                isVideo: true,
                content: 'content',
                category: { id: 'cat-1' },
                file: { id: 'file-link-1' },
                status: GuideStatusEnum.DRAFT,
            };
            const mockGuide = { id: 'guide-new', ...mockGuideData };

            preGuideService.ensureUniqueGuideLabel.mockResolvedValue(undefined);
            preGuideService.prepareGuideData.mockResolvedValue(mockGuideData);
            preGuideService.persistGuide.mockResolvedValue(mockGuide);
            preGuideService.handlePostCreation.mockResolvedValue(undefined);
            preGuideService.scheduleInvalidateCache.mockResolvedValue(undefined);

            const result = await service.createGuide(createDto);

            expect(logger.info).toHaveBeenCalledWith(
                `Create a new guide ${JSON.stringify(createDto)}`,
            );
            expect(preGuideService.ensureUniqueGuideLabel).toHaveBeenCalledWith('New Guide');
            expect(preGuideService.prepareGuideData).toHaveBeenCalledWith(createDto);
            expect(preGuideService.persistGuide).toHaveBeenCalledWith(mockGuideData);
            expect(preGuideService.handlePostCreation).toHaveBeenCalledWith(
                mockGuide,
                GuideStatusEnum.DRAFT,
            );
            expect(result).toEqual({ message: 'Guide created successfully' });
        });

        it('should create guide with published status', async () => {
            const createDto = {
                label: 'Published Guide',
                description: 'Published Description',
                content: 'Published Content',
                categoryId: 'cat-1',
                isVideo: true,
                fileId: 'file-1',
                status: GuideStatusEnum.PUBLISHED,
            };
            const mockGuide = {
                id: 'guide-pub',
                status: GuideStatusEnum.PUBLISHED,
            };

            preGuideService.ensureUniqueGuideLabel.mockResolvedValue(undefined);
            preGuideService.prepareGuideData.mockResolvedValue({});
            preGuideService.persistGuide.mockResolvedValue(mockGuide);
            preGuideService.handlePostCreation.mockResolvedValue(undefined);

            await service.createGuide(createDto);

            expect(preGuideService.handlePostCreation).toHaveBeenCalledWith(
                mockGuide,
                GuideStatusEnum.PUBLISHED,
            );
        });

        it('should throw error if label is not unique', async () => {
            const createDto = {
                label: 'Duplicate Guide',
                description: 'Description',
                categoryId: 'cat-1',
                content: 'Published Content',
                fileId: 'file-1',
                isVideo: true,
                status: GuideStatusEnum.DRAFT,
            };
            const error = new Error('Label already exists');

            preGuideService.ensureUniqueGuideLabel.mockRejectedValue(error);

            await expect(service.createGuide(createDto)).rejects.toThrow('Label already exists');
            expect(preGuideService.prepareGuideData).not.toHaveBeenCalled();
        });

        it('should schedule cache invalidation in background', async () => {
            const createDto = {
                label: 'New Guide',
                description: 'Description',
                categoryId: 'cat-1',
                content: 'Published Content',
                isVideo: false,
                fileId: 'file-1',
                status: GuideStatusEnum.DRAFT,
            };

            preGuideService.ensureUniqueGuideLabel.mockResolvedValue(undefined);
            preGuideService.prepareGuideData.mockResolvedValue({});
            preGuideService.persistGuide.mockResolvedValue({ id: 'guide-1' });
            preGuideService.handlePostCreation.mockResolvedValue(undefined);
            preGuideService.scheduleInvalidateCache.mockResolvedValue(undefined);

            await service.createGuide(createDto);

            await new Promise(setImmediate);

            expect(preGuideService.scheduleInvalidateCache).toHaveBeenCalled();
        });
    });

    describe('loadGuideWithRelations', () => {
        it('should load guide with all relations', async () => {
            const guideId = 'guide-123';
            const mockGuide: GuideEntity = {
                id: guideId,
                label: 'Guide',
                file: { id: 'fl-1', file: { id: 'file-1' } },
                category: { id: 'cat-1' },
            } as any;

            preGuideService.retrieveGuideByCriteria.mockResolvedValue(mockGuide);

            const result = await service.loadGuideWithRelations(guideId);

            expect(preGuideService.retrieveGuideByCriteria).toHaveBeenCalledWith({ id: guideId }, [
                'file',
                'file.file',
                'category',
            ]);
            expect(result).toEqual(mockGuide);
        });

        it('should propagate error if guide not found', async () => {
            const guideId = 'non-existent';
            const error = new Error('Guide not found');

            preGuideService.retrieveGuideByCriteria.mockRejectedValue(error);

            await expect(service.loadGuideWithRelations(guideId)).rejects.toThrow(
                'Guide not found',
            );
        });
    });

    describe('updateGuide', () => {
        beforeEach(() => {
            preGuideService.prepareGuideUpdates = jest.fn();
            preGuideService.updateGuideDetails = jest.fn();
            preGuideService.handlePostUpdate = jest.fn();
        });

        it('should update guide successfully', async () => {
            const guideId = 'guide-123';
            const updateDto = {
                label: 'Updated Guide',
                description: 'Updated Description',
                status: GuideStatusEnum.PUBLISHED,
            };
            const mockGuide: GuideEntity = {
                id: guideId,
                label: 'Old Guide',
                status: GuideStatusEnum.DRAFT,
                file: { id: 'file-link-1' },
            } as any;
            const mockUpdatedGuide: GuideEntity = {
                id: guideId,
                label: 'Updated Guide',
                status: GuideStatusEnum.PUBLISHED,
                file: { id: 'file-link-1' },
            } as any;
            const mockUpdates = { label: 'Updated Guide' };

            preGuideService.retrieveGuideByCriteria
                .mockResolvedValueOnce(mockGuide)
                .mockResolvedValueOnce(mockUpdatedGuide);
            preGuideService.prepareGuideUpdates.mockResolvedValue(mockUpdates);
            preGuideService.updateGuideDetails.mockResolvedValue(undefined);
            preGuideService.handlePostUpdate.mockResolvedValue(undefined);
            preGuideService.scheduleInvalidateCache.mockResolvedValue(undefined);

            const result = await service.updateGuide(guideId, updateDto);

            expect(logger.info).toHaveBeenCalledWith(
                `Update guide with id: ${guideId} with data ${JSON.stringify(updateDto)}`,
            );
            expect(preGuideService.retrieveGuideByCriteria).toHaveBeenCalledTimes(2);
            expect(preGuideService.prepareGuideUpdates).toHaveBeenCalledWith(updateDto, mockGuide);
            expect(preGuideService.updateGuideDetails).toHaveBeenCalledWith(mockGuide, mockUpdates);
            expect(preGuideService.handlePostUpdate).toHaveBeenCalledWith(
                mockUpdatedGuide,
                GuideStatusEnum.DRAFT,
                GuideStatusEnum.PUBLISHED,
            );
            expect(result).toEqual({ message: 'Guide updated successfully' });
        });

        it('should update guide with new file and cleanup old file', async () => {
            const guideId = 'guide-123';
            const updateDto = {
                fileId: 'new-file-1',
                label: 'Updated Guide',
            };
            const mockGuide: GuideEntity = {
                id: guideId,
                file: { id: 'old-file-link-1' },
                status: GuideStatusEnum.DRAFT,
            } as any;
            const mockUpdatedGuide: GuideEntity = {
                id: guideId,
                file: { id: 'new-file-link-1' },
                status: GuideStatusEnum.DRAFT,
            } as any;

            preGuideService.retrieveGuideByCriteria
                .mockResolvedValueOnce(mockGuide)
                .mockResolvedValueOnce(mockUpdatedGuide);
            preGuideService.prepareGuideUpdates.mockResolvedValue({});
            preGuideService.updateGuideDetails.mockResolvedValue(undefined);
            preGuideService.handlePostUpdate.mockResolvedValue(undefined);
            fileLinkService.unlinkAndCleanup.mockResolvedValue(undefined);

            await service.updateGuide(guideId, updateDto);

            await new Promise(setImmediate);

            expect(fileLinkService.unlinkAndCleanup).toHaveBeenCalledWith('old-file-link-1');
        });

        it('should not cleanup file if fileId not in updateDto', async () => {
            const guideId = 'guide-123';
            const updateDto = {
                label: 'Updated Guide',
            };
            const mockGuide: GuideEntity = {
                id: guideId,
                file: { id: 'file-link-1' },
                status: GuideStatusEnum.DRAFT,
            } as any;

            preGuideService.retrieveGuideByCriteria
                .mockResolvedValueOnce(mockGuide)
                .mockResolvedValueOnce(mockGuide);
            preGuideService.prepareGuideUpdates.mockResolvedValue({});
            preGuideService.updateGuideDetails.mockResolvedValue(undefined);
            preGuideService.handlePostUpdate.mockResolvedValue(undefined);

            await service.updateGuide(guideId, updateDto);

            await new Promise(setImmediate);

            expect(fileLinkService.unlinkAndCleanup).not.toHaveBeenCalled();
        });

        it('should schedule cache invalidation in background', async () => {
            const guideId = 'guide-123';
            const updateDto = { label: 'Updated' };
            const mockGuide: GuideEntity = {
                id: guideId,
                status: GuideStatusEnum.DRAFT,
            } as any;

            preGuideService.retrieveGuideByCriteria
                .mockResolvedValueOnce(mockGuide)
                .mockResolvedValueOnce(mockGuide);
            preGuideService.prepareGuideUpdates.mockResolvedValue({});
            preGuideService.updateGuideDetails.mockResolvedValue(undefined);
            preGuideService.handlePostUpdate.mockResolvedValue(undefined);
            preGuideService.scheduleInvalidateCache.mockResolvedValue(undefined);

            await service.updateGuide(guideId, updateDto);

            await new Promise(setImmediate);

            expect(preGuideService.scheduleInvalidateCache).toHaveBeenCalled();
        });

        it('should create guide with content and isVideo fields', async () => {
            const createDto = {
                label: 'Video Guide',
                description: 'Video Description',
                content: 'Video Content',
                categoryId: 'cat-1',
                fileId: 'file-1',
                status: GuideStatusEnum.PUBLISHED,
                isVideo: true,
            };
            const mockGuide = { id: 'guide-video', isVideo: true };

            preGuideService.ensureUniqueGuideLabel.mockResolvedValue(undefined);
            preGuideService.prepareGuideData.mockResolvedValue({});
            preGuideService.persistGuide.mockResolvedValue(mockGuide);
            preGuideService.handlePostCreation.mockResolvedValue(undefined);

            const result = await service.createGuide(createDto);

            expect(preGuideService.prepareGuideData).toHaveBeenCalledWith(createDto);
            expect(result).toEqual({ message: 'Guide created successfully' });
        });

        it('should propagate error if guide not found', async () => {
            const guideId = 'non-existent';
            const updateDto = { label: 'Updated' };
            const error = new Error('Guide not found');

            preGuideService.retrieveGuideByCriteria.mockRejectedValue(error);

            await expect(service.updateGuide(guideId, updateDto)).rejects.toThrow(
                'Guide not found',
            );
        });
    });

    describe('reactToGuide', () => {
        it('should allow user to react to guide successfully', async () => {
            const user: CurrentUserInterface = { id: 'user-123' } as any;
            const guideId = 'guide-123';
            const reactionDto = { reaction: GuideReactionEnum.LIKE };
            const mockUser = { id: 'user-123', name: 'Test User' };
            const mockGuide = { id: 'guide-123', label: 'Test Guide' };
            const mockReactionResult = { id: 'like-1', reaction: 'LIKE' };

            userService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockUser);
            preGuideService.retrieveGuideByCriteria.mockResolvedValue(mockGuide);
            uGLikeService.setGuideReaction.mockResolvedValue(mockReactionResult);

            const result = await service.reactToGuide(user, guideId, reactionDto);

            expect(logger.info).toHaveBeenCalledWith(`React To guide with id: ${guideId}`);
            expect(userService.preUserService.retrieveUserByCriteria).toHaveBeenCalledWith({
                id: 'user-123',
            });
            expect(preGuideService.retrieveGuideByCriteria).toHaveBeenCalledWith({ id: guideId });
            expect(uGLikeService.setGuideReaction).toHaveBeenCalledWith(
                mockUser,
                mockGuide,
                'LIKE',
            );
            expect(result).toEqual(mockReactionResult);
        });

        it('should handle DISLIKE reaction', async () => {
            const user: CurrentUserInterface = { id: 'user-123' } as any;
            const guideId = 'guide-123';
            const reactionDto = { reaction: GuideReactionEnum.DISLIKE };
            const mockUser = { id: 'user-123' };
            const mockGuide = { id: 'guide-123' };
            const mockReactionResult = { id: 'like-1', reaction: 'DISLIKE' };

            userService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockUser);
            preGuideService.retrieveGuideByCriteria.mockResolvedValue(mockGuide);
            uGLikeService.setGuideReaction.mockResolvedValue(mockReactionResult);

            await service.reactToGuide(user, guideId, reactionDto);

            expect(uGLikeService.setGuideReaction).toHaveBeenCalledWith(
                mockUser,
                mockGuide,
                'DISLIKE',
            );
        });

        it('should propagate error if user not found', async () => {
            const user: CurrentUserInterface = { id: 'non-existent' } as any;
            const guideId = 'guide-123';
            const reactionDto = { reaction: GuideReactionEnum.LIKE };
            const error = new Error('User not found');

            userService.preUserService.retrieveUserByCriteria.mockRejectedValue(error);

            await expect(service.reactToGuide(user, guideId, reactionDto)).rejects.toThrow(
                'User not found',
            );
        });

        it('should propagate error if guide not found', async () => {
            const user: CurrentUserInterface = { id: 'user-123' } as any;
            const guideId = 'non-existent';
            const reactionDto = { reaction: GuideReactionEnum.LIKE };
            const mockUser = { id: 'user-123' };
            const error = new Error('Guide not found');

            userService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockUser);
            preGuideService.retrieveGuideByCriteria.mockRejectedValue(error);

            await expect(service.reactToGuide(user, guideId, reactionDto)).rejects.toThrow(
                'Guide not found',
            );
        });
    });

    describe('deleteGuide', () => {
        beforeEach(() => {
            preGuideService.handlePostDelete = jest.fn();
        });

        it('should delete guide successfully', async () => {
            const guideId = 'guide-123';
            const mockGuide: GuideEntity = {
                id: guideId,
                label: 'Guide to Delete',
                file: { id: 'file-link-1' },
                status: GuideStatusEnum.DRAFT,
            } as any;

            preGuideService.retrieveGuideByCriteria.mockResolvedValue(mockGuide);
            guidesRepo.delete.mockResolvedValue({ affected: 1 });
            preGuideService.handlePostDelete.mockResolvedValue(undefined);
            fileLinkService.unlinkAndCleanup.mockResolvedValue(undefined);
            cacheService.deleteKeysByBase.mockResolvedValue(undefined);

            const result = await service.deleteGuide(guideId);

            expect(logger.info).toHaveBeenCalledWith(`Delete guide with id: ${guideId}`);
            expect(preGuideService.retrieveGuideByCriteria).toHaveBeenCalledWith({ id: guideId }, [
                'file',
                'file.file',
                'category',
            ]);
            expect(guidesRepo.delete).toHaveBeenCalledWith({ id: guideId });
            expect(preGuideService.handlePostDelete).toHaveBeenCalledWith(
                mockGuide,
                GuideStatusEnum.DRAFT,
            );
            expect(result).toEqual({ message: 'Guide deleted successfully' });
        });

        it('should cleanup file and invalidate cache in background', async () => {
            const guideId = 'guide-123';
            const mockGuide: GuideEntity = {
                id: guideId,
                file: { id: 'file-link-1' },
                status: GuideStatusEnum.PUBLISHED,
            } as any;

            preGuideService.retrieveGuideByCriteria.mockResolvedValue(mockGuide);
            guidesRepo.delete.mockResolvedValue({ affected: 1 });
            preGuideService.handlePostDelete.mockResolvedValue(undefined);
            fileLinkService.unlinkAndCleanup.mockResolvedValue(undefined);
            cacheService.deleteKeysByBase.mockResolvedValue(undefined);

            await service.deleteGuide(guideId);

            await new Promise(setImmediate);

            expect(fileLinkService.unlinkAndCleanup).toHaveBeenCalledWith('file-link-1');
            expect(cacheService.deleteKeysByBase).toHaveBeenCalledWith('guides');
        });

        it('should handle deletion of published guide', async () => {
            const guideId = 'guide-pub';
            const mockGuide: GuideEntity = {
                id: guideId,
                file: { id: 'file-link-pub' },
                status: GuideStatusEnum.PUBLISHED,
            } as any;

            preGuideService.retrieveGuideByCriteria.mockResolvedValue(mockGuide);
            guidesRepo.delete.mockResolvedValue({ affected: 1 });
            preGuideService.handlePostDelete.mockResolvedValue(undefined);

            await service.deleteGuide(guideId);

            expect(preGuideService.handlePostDelete).toHaveBeenCalledWith(
                mockGuide,
                GuideStatusEnum.PUBLISHED,
            );
        });

        it('should propagate error if guide not found', async () => {
            const guideId = 'non-existent';
            const error = new Error('Guide not found');

            preGuideService.retrieveGuideByCriteria.mockRejectedValue(error);

            await expect(service.deleteGuide(guideId)).rejects.toThrow('Guide not found');
            expect(guidesRepo.delete).not.toHaveBeenCalled();
        });

        it('should propagate error if deletion fails', async () => {
            const guideId = 'guide-123';
            const mockGuide: GuideEntity = {
                id: guideId,
                file: { id: 'file-link-1' },
                status: GuideStatusEnum.DRAFT,
            } as any;
            const error = new Error('Database error');

            preGuideService.retrieveGuideByCriteria.mockResolvedValue(mockGuide);
            guidesRepo.delete.mockRejectedValue(error);

            await expect(service.deleteGuide(guideId)).rejects.toThrow('Database error');
        });
    });
});
