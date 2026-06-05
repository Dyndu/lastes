import { Test, TestingModule } from '@nestjs/testing';
import { PreGuideService } from './pre-guide.service';
import { GuidesService } from './guides.service';
import { GuideEntity } from '../entities';
import {
    FileUsageEnum,
    GuideReactionEnum,
    GuideStatusEnum,
    SocketEventEnum,
} from '../../../common/enum';
import { CategoryEntity } from '../../categories/entities/category.entity';
import { FileLinksEntity } from '../../files/entities/file-links.entity';
import { CreateGuideDto, UpdateGuideDto } from '../dto';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('PreGuideService', () => {
    let service: PreGuideService;
    let guidesService: any;
    let mockGuidesRepo: any;

    const mockGuideEntity: GuideEntity = {
        id: '123',
        label: 'Test Guide',
        description: 'Test Description',
        status: GuideStatusEnum.DRAFT,
        deleted: false,
        updatedAt: new Date(),
    } as GuideEntity;

    const mockCategoryEntity: CategoryEntity = {
        id: 'cat-123',
        name: 'Test Category',
    } as any;

    const mockFileLinksEntity: FileLinksEntity = {
        id: 'file-123',
    } as FileLinksEntity;

    beforeEach(async () => {
        mockGuidesRepo = {
            findActiveOne: jest.fn(),
            getRepository: jest.fn().mockReturnValue({
                createQueryBuilder: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
            }),
            update: jest.fn(),
            assertUniqueActive: jest.fn(),
            create: jest.fn(),
        };

        const mockGuidesService = {
            guidesRepo: mockGuidesRepo,
            logger: {
                info: jest.fn(),
            },
            errorHandler: {
                notFound: jest.fn(),
                validation: jest.fn(),
            },
            otherUtils: {
                formatCriteria: jest.fn((criteria) => JSON.stringify(criteria)),
            },
            categoryService: {
                retrieveCategoryByCriteria: jest.fn(),
            },
            fileLinkService: {
                linkFileToEntity: jest.fn(),
            },
            transformGuide: jest.fn(),
            transformGStats: jest.fn((stats) => stats),
            socketService: {
                sendDataToRoute: jest.fn(),
            },
            cacheService: {
                deleteKeysByBase: jest.fn(),
            },
            guideStatsService: {
                onCreate: jest.fn(),
                onStatusChange: jest.fn(),
                onDelete: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PreGuideService,
                {
                    provide: GuidesService,
                    useValue: mockGuidesService,
                },
            ],
        }).compile();

        service = module.get<PreGuideService>(PreGuideService);
        guidesService = module.get(GuidesService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('retrieveGuideByCriteria', () => {
        it('should retrieve a guide successfully', async () => {
            const criteria = { id: '123' };
            const relations = ['category', 'file'];

            mockGuidesRepo.findActiveOne.mockResolvedValue(mockGuideEntity);

            const result = await service.retrieveGuideByCriteria(criteria, relations);

            expect(guidesService.otherUtils.formatCriteria).toHaveBeenCalledWith(criteria);
            expect(guidesService.logger.info).toHaveBeenCalled();
            expect(mockGuidesRepo.findActiveOne).toHaveBeenCalledWith(
                mockGuidesRepo,
                criteria,
                relations,
            );
            expect(result).toEqual(mockGuideEntity);
        });

        it('should retrieve a guide without relations', async () => {
            const criteria = { id: '123' };

            mockGuidesRepo.findActiveOne.mockResolvedValue(mockGuideEntity);

            const result = await service.retrieveGuideByCriteria(criteria);

            expect(mockGuidesRepo.findActiveOne).toHaveBeenCalledWith(
                mockGuidesRepo,
                criteria,
                undefined,
            );
            expect(result).toEqual(mockGuideEntity);
        });

        it('should throw not found error when guide does not exist', async () => {
            const criteria = { id: 'non-existent' };

            mockGuidesRepo.findActiveOne.mockResolvedValue(null);
            guidesService.errorHandler.notFound.mockImplementation(() => {
                throw new Error('Guide not found');
            });

            await expect(service.retrieveGuideByCriteria(criteria)).rejects.toThrow(
                'Guide not found',
            );

            expect(guidesService.errorHandler.notFound).toHaveBeenCalled();
        });
    });

    describe('buildGuideQuery', () => {
        it('should build query without filters', () => {
            service.buildGuideQuery({});

            expect(mockGuidesRepo.getRepository).toHaveBeenCalled();
        });

        it('should build query with status filter', () => {
            const mockQuery = {
                andWhere: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
            };

            mockGuidesRepo.getRepository = jest.fn().mockReturnValue({
                createQueryBuilder: jest.fn().mockReturnValue(mockQuery),
            });

            service.buildGuideQuery({ status: GuideStatusEnum.DRAFT });

            expect(mockQuery.andWhere).toHaveBeenCalledWith('guides.status = :status', {
                status: GuideStatusEnum.DRAFT,
            });
        });

        it('should build query with search term filter', () => {
            const mockQuery = {
                andWhere: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
            };

            mockGuidesRepo.getRepository = jest.fn().mockReturnValue({
                createQueryBuilder: jest.fn().mockReturnValue(mockQuery),
            });

            const searchTerm = 'test';
            service.buildGuideQuery({ searchTerm });

            const likePattern = `%${searchTerm}%`;
            expect(mockQuery.andWhere).toHaveBeenCalledWith(expect.stringContaining('ILIKE'), {
                searchTerm: likePattern,
            });
        });

        it('should build query with both status and search term filters', () => {
            const mockQuery = {
                andWhere: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
            };

            mockGuidesRepo.getRepository = jest.fn().mockReturnValue({
                createQueryBuilder: jest.fn().mockReturnValue(mockQuery),
            });

            service.buildGuideQuery({
                status: GuideStatusEnum.PUBLISHED,
                searchTerm: 'test',
            });

            expect(mockQuery.andWhere).toHaveBeenCalledTimes(3);
        });

        it('should handle empty filters object', () => {
            const mockQuery = {
                andWhere: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
            };

            mockGuidesRepo.getRepository = jest.fn().mockReturnValue({
                createQueryBuilder: jest.fn().mockReturnValue(mockQuery),
            });

            service.buildGuideQuery({});

            expect(mockQuery.andWhere).toHaveBeenCalledWith('guides.deleted = false');
            expect(mockQuery.leftJoinAndSelect).toHaveBeenCalledTimes(3);
        });
    });

    describe('retrieveGuidesQuery', () => {
        it('should build paginated query with offset and limit', () => {
            const offset = 0;
            const limit = 10;
            const filters = { status: GuideStatusEnum.DRAFT };

            const result = service.retrieveGuidesQuery(offset, limit, filters);

            expect(result).toBeDefined();
        });

        it('should build paginated query without filters', () => {
            const offset = 10;
            const limit = 20;

            const result = service.retrieveGuidesQuery(offset, limit, {});

            expect(result).toBeDefined();
        });
    });

    describe('retrieveUserGuide', () => {
        it('should build query for user guides with default filters', () => {
            const userId = 'user-123';
            const offset = 0;
            const limit = 10;
            const filters = {};

            const result = service.retrieveUserGuide(userId, offset, limit, filters);

            expect(result).toBeDefined();
        });

        it('should build query with searchTerm filter', () => {
            const mockQuery = {
                andWhere: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                innerJoin: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
            };

            mockGuidesRepo.getRepository = jest.fn().mockReturnValue({
                createQueryBuilder: jest.fn().mockReturnValue(mockQuery),
            });

            const userId = 'user-123';
            const offset = 0;
            const limit = 10;
            const filters = { searchTerm: 'test search' };

            service.retrieveUserGuide(userId, offset, limit, filters);

            expect(mockQuery.andWhere).toHaveBeenCalledWith(
                expect.stringContaining('ILIKE'),
                expect.objectContaining({ searchTerm: '%test search%' }),
            );
        });

        it('should build query with categories filter', () => {
            const mockQuery = {
                andWhere: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                innerJoin: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
            };

            mockGuidesRepo.getRepository = jest.fn().mockReturnValue({
                createQueryBuilder: jest.fn().mockReturnValue(mockQuery),
            });

            const userId = 'user-123';
            const offset = 0;
            const limit = 10;
            const filters = { categories: ['cat-1', 'cat-2'] };

            service.retrieveUserGuide(userId, offset, limit, filters);

            expect(mockQuery.andWhere).toHaveBeenCalledWith('category.id IN (:...categories)', {
                categories: ['cat-1', 'cat-2'],
            });
        });

        it('should not apply categories filter when array is empty', () => {
            const mockQuery = {
                andWhere: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                innerJoin: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
            };

            mockGuidesRepo.getRepository = jest.fn().mockReturnValue({
                createQueryBuilder: jest.fn().mockReturnValue(mockQuery),
            });

            const userId = 'user-123';
            const offset = 0;
            const limit = 10;
            const filters = { categories: [] };

            service.retrieveUserGuide(userId, offset, limit, filters);

            expect(mockQuery.andWhere).not.toHaveBeenCalledWith(
                'category.id IN (:...categories)',
                expect.anything(),
            );
        });

        it('should build query with isVideo true filter', () => {
            const mockQuery = {
                andWhere: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                innerJoin: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
            };

            mockGuidesRepo.getRepository = jest.fn().mockReturnValue({
                createQueryBuilder: jest.fn().mockReturnValue(mockQuery),
            });

            const userId = 'user-123';
            const offset = 0;
            const limit = 10;
            const filters = { isVideo: true };

            service.retrieveUserGuide(userId, offset, limit, filters);

            expect(mockQuery.andWhere).toHaveBeenCalledWith('guides.isVideo = :isVideo', {
                isVideo: true,
            });
        });

        it('should build query with isVideo false filter', () => {
            const mockQuery = {
                andWhere: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                innerJoin: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
            };

            mockGuidesRepo.getRepository = jest.fn().mockReturnValue({
                createQueryBuilder: jest.fn().mockReturnValue(mockQuery),
            });

            const userId = 'user-123';
            const offset = 0;
            const limit = 10;
            const filters = { isVideo: false };

            service.retrieveUserGuide(userId, offset, limit, filters);

            expect(mockQuery.andWhere).toHaveBeenCalledWith('guides.isVideo = :isVideo', {
                isVideo: false,
            });
        });

        it('should not apply isVideo filter when undefined', () => {
            const mockQuery = {
                andWhere: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                innerJoin: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
            };

            mockGuidesRepo.getRepository = jest.fn().mockReturnValue({
                createQueryBuilder: jest.fn().mockReturnValue(mockQuery),
            });

            const userId = 'user-123';
            const offset = 0;
            const limit = 10;
            const filters = { isVideo: undefined };

            service.retrieveUserGuide(userId, offset, limit, filters);

            expect(mockQuery.andWhere).not.toHaveBeenCalledWith(
                'guides.isVideo = :isVideo',
                expect.anything(),
            );
        });

        it('should build query with liked filter', () => {
            const mockQuery = {
                andWhere: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                innerJoin: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
            };

            mockGuidesRepo.getRepository = jest.fn().mockReturnValue({
                createQueryBuilder: jest.fn().mockReturnValue(mockQuery),
            });

            const userId = 'user-123';
            const offset = 0;
            const limit = 10;
            const filters = { liked: true };

            service.retrieveUserGuide(userId, offset, limit, filters);

            expect(mockQuery.innerJoin).toHaveBeenCalledWith(
                'guides.likes',
                'ugl',
                'ugl.userId = :userId AND ugl.reaction = :reaction',
                {
                    userId: 'user-123',
                    reaction: GuideReactionEnum.LIKE,
                },
            );
        });

        it('should not apply liked filter when false', () => {
            const mockQuery = {
                andWhere: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                innerJoin: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
            };

            mockGuidesRepo.getRepository = jest.fn().mockReturnValue({
                createQueryBuilder: jest.fn().mockReturnValue(mockQuery),
            });

            const userId = 'user-123';
            const offset = 0;
            const limit = 10;
            const filters = { liked: false };

            service.retrieveUserGuide(userId, offset, limit, filters);

            expect(mockQuery.innerJoin).not.toHaveBeenCalled();
        });

        it('should build query with all filters combined', () => {
            const mockQuery = {
                andWhere: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                innerJoin: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
            };

            mockGuidesRepo.getRepository = jest.fn().mockReturnValue({
                createQueryBuilder: jest.fn().mockReturnValue(mockQuery),
            });

            const userId = 'user-123';
            const offset = 5;
            const limit = 15;
            const filters = {
                searchTerm: 'guide',
                categories: ['cat-1'],
                isVideo: true,
                liked: true,
            };

            const result = service.retrieveUserGuide(userId, offset, limit, filters);

            expect(mockQuery.orderBy).toHaveBeenCalledWith('guides.updatedAt', 'DESC');
            expect(mockQuery.skip).toHaveBeenCalledWith(5);
            expect(mockQuery.take).toHaveBeenCalledWith(15);
            expect(result).toBeDefined();
        });

        it('should apply pagination correctly', () => {
            const mockQuery = {
                andWhere: jest.fn().mockReturnThis(),
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                innerJoin: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
            };

            mockGuidesRepo.getRepository = jest.fn().mockReturnValue({
                createQueryBuilder: jest.fn().mockReturnValue(mockQuery),
            });

            const userId = 'user-123';

            service.retrieveUserGuide(userId, 20, 50, {});

            expect(mockQuery.skip).toHaveBeenCalledWith(20);
            expect(mockQuery.take).toHaveBeenCalledWith(50);
        });
    });

    describe('buildGuideEntity', () => {
        it('should create a new guide entities with required and optional fields', () => {
            const required = {
                label: 'New Guide',
                status: GuideStatusEnum.DRAFT,
                category: mockCategoryEntity,
                isVideo: false,
                file: mockFileLinksEntity,
            };

            const optional = {
                description: 'New Description',
                content: 'New Content',
            };

            const result = service.buildGuideEntity(required, optional);

            expect(result).toBeInstanceOf(GuideEntity);
            expect(result.label).toBe(required.label);
            expect(result.isVideo).toBe(required.isVideo);
            expect(result.status).toBe(required.status);
            expect(result.description).toBe(optional.description);
            expect(result.content).toBe(optional.content);
            expect(result.category).toBe(required.category);
            expect(result.file).toBe(required.file);
        });

        it('should create a guide entities without optional description and content', () => {
            const required = {
                label: 'New Guide',
                status: GuideStatusEnum.PUBLISHED,
                isVideo: false,
                category: mockCategoryEntity,
                file: mockFileLinksEntity,
            };

            const optional = {
                description: null as any,
                content: null as any,
            };

            const result = service.buildGuideEntity(required, optional);

            expect(result).toBeInstanceOf(GuideEntity);
            expect(result.description).toBeNull();
            expect(result.content).toBeNull();
        });
    });

    describe('updateGuideDetails', () => {
        it('should return message when no updates provided', async () => {
            const result = await service.updateGuideDetails(mockGuideEntity, {});

            expect(result).toEqual({
                message: 'No updates provided for guide',
            });
            expect(mockGuidesRepo.update).not.toHaveBeenCalled();
        });

        it('should return message when updates object is undefined', async () => {
            const result = await service.updateGuideDetails(mockGuideEntity, undefined);

            expect(result).toEqual({
                message: 'No updates provided for guide',
            });
            expect(mockGuidesRepo.update).not.toHaveBeenCalled();
        });

        it('should update string fields (label, description)', async () => {
            const updates = {
                label: '  Updated Label  ',
                description: '  Updated Description  ',
            };

            mockGuidesRepo.update.mockResolvedValue({ affected: 1 } as any);

            await service.updateGuideDetails(mockGuideEntity, updates);

            expect(mockGuidesRepo.update).toHaveBeenCalledWith(
                { id: mockGuideEntity.id },
                {
                    label: 'Updated Label',
                    description: 'Updated Description',
                },
            );
        });

        it('should update status field', async () => {
            const updates = { status: GuideStatusEnum.DRAFT };

            mockGuidesRepo.update.mockResolvedValue({ affected: 1 } as any);

            await service.updateGuideDetails(mockGuideEntity, updates);

            expect(mockGuidesRepo.update).toHaveBeenCalledWith(
                { id: mockGuideEntity.id },
                { status: GuideStatusEnum.DRAFT },
            );
        });

        it('should call update with empty payload when only empty strings provided', async () => {
            mockGuidesRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateGuideDetails(mockGuideEntity, {
                label: '   ',
            });

            expect(mockGuidesRepo.update).toHaveBeenCalledWith({ id: mockGuideEntity.id }, {});
        });

        it('should update entities fields (category, file)', async () => {
            const updates = {
                category: mockCategoryEntity,
                file: mockFileLinksEntity,
            };

            mockGuidesRepo.update.mockResolvedValue({ affected: 1 } as any);

            await service.updateGuideDetails(mockGuideEntity, updates);

            expect(mockGuidesRepo.update).toHaveBeenCalledWith(
                { id: mockGuideEntity.id },
                {
                    category: mockCategoryEntity,
                    file: mockFileLinksEntity,
                },
            );
        });

        it('should ignore empty string fields', async () => {
            const updates = {
                label: '   ',
                description: '',
            };

            mockGuidesRepo.update.mockResolvedValue({ affected: 1 } as any);

            await service.updateGuideDetails(mockGuideEntity, updates);

            expect(mockGuidesRepo.update).toHaveBeenCalledWith(
                { id: mockGuideEntity.id },
                { description: '' },
            );
        });

        it('should update multiple fields at once', async () => {
            const updates = {
                label: 'New Label',
                description: 'New Description',
                status: GuideStatusEnum.PUBLISHED,
                category: mockCategoryEntity,
            };

            mockGuidesRepo.update.mockResolvedValue({ affected: 1 } as any);

            await service.updateGuideDetails(mockGuideEntity, updates);

            expect(mockGuidesRepo.update).toHaveBeenCalledWith(
                { id: mockGuideEntity.id },
                {
                    label: 'New Label',
                    description: 'New Description',
                    status: GuideStatusEnum.PUBLISHED,
                    category: mockCategoryEntity,
                },
            );
        });

        it('should handle null description to clear it', async () => {
            const updates = {
                description: null!,
            };

            mockGuidesRepo.update.mockResolvedValue({ affected: 1 } as any);

            await service.updateGuideDetails(mockGuideEntity, updates);

            expect(mockGuidesRepo.update).toHaveBeenCalledWith(
                { id: mockGuideEntity.id },
                { description: null },
            );
        });

        it('should handle null content to clear it', async () => {
            const updates = {
                content: null!,
            };

            mockGuidesRepo.update.mockResolvedValue({ affected: 1 } as any);

            await service.updateGuideDetails(mockGuideEntity, updates);

            expect(mockGuidesRepo.update).toHaveBeenCalledWith(
                { id: mockGuideEntity.id },
                { content: null },
            );
        });

        it('should update content field', async () => {
            const updates = {
                content: '  Updated Content  ',
            };

            mockGuidesRepo.update.mockResolvedValue({ affected: 1 } as any);

            await service.updateGuideDetails(mockGuideEntity, updates);

            expect(mockGuidesRepo.update).toHaveBeenCalledWith(
                { id: mockGuideEntity.id },
                { content: 'Updated Content' },
            );
        });

        it('should update isVideo field', async () => {
            const updates = {
                isVideo: true,
            };

            mockGuidesRepo.update.mockResolvedValue({ affected: 1 } as any);

            await service.updateGuideDetails(mockGuideEntity, updates);

            expect(mockGuidesRepo.update).toHaveBeenCalledWith(
                { id: mockGuideEntity.id },
                { isVideo: true },
            );
        });
    });

    describe('ensureUniqueGuideLabel', () => {
        it('should pass when label is unique', async () => {
            mockGuidesRepo.assertUniqueActive.mockResolvedValue(undefined);

            await expect(service.ensureUniqueGuideLabel('Unique Label')).resolves.not.toThrow();

            expect(mockGuidesRepo.assertUniqueActive).toHaveBeenCalledWith(
                mockGuidesRepo,
                {},
                { label: 'Unique Label' },
                'Guide',
            );
        });

        it('should throw validation error when label is not unique', async () => {
            const errors = { label: 'Label already exists' };

            mockGuidesRepo.assertUniqueActive.mockImplementation((_repo: any, errorsObj: any) => {
                Object.assign(errorsObj, errors);
                return Promise.resolve();
            });

            guidesService.errorHandler.validation.mockImplementation(() => {
                throw new Error('Validation error');
            });

            await expect(service.ensureUniqueGuideLabel('Duplicate Label')).rejects.toThrow(
                'Validation error',
            );

            expect(guidesService.errorHandler.validation).toHaveBeenCalledWith(errors);
        });
    });

    describe('ensureUniqueGuideLabelForUpdate', () => {
        it('should pass when label is unique for update', async () => {
            mockGuidesRepo.assertUniqueActive.mockResolvedValue(undefined);

            await expect(
                service.ensureUniqueGuideLabelForUpdate('Unique Label', mockGuideEntity),
            ).resolves.not.toThrow();

            expect(mockGuidesRepo.assertUniqueActive).toHaveBeenCalledWith(
                mockGuidesRepo,
                {},
                { label: 'Unique Label' },
                'Guide',
                mockGuideEntity.id,
            );
        });

        it('should throw validation error when label is not unique for update', async () => {
            const errors = { label: 'Label already exists' };

            mockGuidesRepo.assertUniqueActive.mockImplementation((_repo: any, errorsObj: any) => {
                Object.assign(errorsObj, errors);
                return Promise.resolve();
            });

            guidesService.errorHandler.validation.mockImplementation(() => {
                throw new Error('Validation error');
            });

            await expect(
                service.ensureUniqueGuideLabelForUpdate('Duplicate Label', mockGuideEntity),
            ).rejects.toThrow('Validation error');

            expect(guidesService.errorHandler.validation).toHaveBeenCalledWith(errors);
        });
    });

    describe('prepareGuideData', () => {
        it('should prepare guide data with all fields', async () => {
            const createDto: CreateGuideDto = {
                label: '  New Guide  ',
                description: '  New Description  ',
                content: '  New Content  ',
                isVideo: false,
                status: GuideStatusEnum.DRAFT,
                categoryId: 'cat-123',
                fileId: 'file-123',
            };

            guidesService.categoryService.retrieveCategoryByCriteria.mockResolvedValue(
                mockCategoryEntity,
            );
            guidesService.fileLinkService.linkFileToEntity.mockResolvedValue(mockFileLinksEntity);

            const result = await service.prepareGuideData(createDto);

            expect(result).toEqual({
                label: 'New Guide',
                description: 'New Description',
                content: 'New Content',
                isVideo: false,
                status: GuideStatusEnum.DRAFT,
                category: mockCategoryEntity,
                file: mockFileLinksEntity,
            });

            expect(guidesService.categoryService.retrieveCategoryByCriteria).toHaveBeenCalledWith({
                id: 'cat-123',
            });
            expect(guidesService.fileLinkService.linkFileToEntity).toHaveBeenCalledWith(
                'file-123',
                FileUsageEnum.GUIDES,
            );
        });

        it('should prepare guide data without description', async () => {
            const createDto: CreateGuideDto = {
                label: 'New Guide',
                status: GuideStatusEnum.PUBLISHED,
                categoryId: 'cat-123',
                fileId: 'file-123',
            } as any;

            guidesService.categoryService.retrieveCategoryByCriteria.mockResolvedValue(
                mockCategoryEntity,
            );
            guidesService.fileLinkService.linkFileToEntity.mockResolvedValue(mockFileLinksEntity);

            const result = await service.prepareGuideData(createDto);

            expect(result.description).toBeNull();
            expect(result.content).toBeNull();
        });

        it('should prepare guide data without content', async () => {
            const createDto: CreateGuideDto = {
                label: 'New Guide',
                description: 'Test Description',
                status: GuideStatusEnum.PUBLISHED,
                categoryId: 'cat-123',
                fileId: 'file-123',
            } as any;

            guidesService.categoryService.retrieveCategoryByCriteria.mockResolvedValue(
                mockCategoryEntity,
            );
            guidesService.fileLinkService.linkFileToEntity.mockResolvedValue(mockFileLinksEntity);

            const result = await service.prepareGuideData(createDto);

            expect(result.content).toBeNull();
        });
    });

    describe('persistGuide', () => {
        it('should persist a guide to repository', async () => {
            const guideData = {
                label: 'Test Guide',
                description: 'Test Description',
                status: GuideStatusEnum.DRAFT,
                category: mockCategoryEntity,
                file: mockFileLinksEntity,
            };

            mockGuidesRepo.create.mockResolvedValue(mockGuideEntity);

            const result = await service.persistGuide(guideData);

            expect(mockGuidesRepo.create).toHaveBeenCalled();
            expect(result).toEqual(mockGuideEntity);
        });

        it('should build and persist guide entities', async () => {
            const spy = jest.spyOn(service, 'buildGuideEntity');
            mockGuidesRepo.create.mockResolvedValue(mockGuideEntity);

            await service.persistGuide({
                label: 'Test',
                description: 'Desc',
                status: GuideStatusEnum.DRAFT,
                category: mockCategoryEntity,
                file: mockFileLinksEntity,
            });

            expect(spy).toHaveBeenCalled();
            expect(mockGuidesRepo.create).toHaveBeenCalledWith(expect.any(GuideEntity));
        });
    });

    describe('notifyGuideChange', () => {
        it('should send guide creation notification via socket', () => {
            guidesService.transformGuide.mockReturnValue({
                id: '123',
                label: 'Test',
            });

            service.notifyGuideChange(mockGuideEntity, SocketEventEnum.NEW_GUIDE_CREATED);

            expect(guidesService.socketService.sendDataToRoute).toHaveBeenCalledWith(
                '/guides',
                SocketEventEnum.NEW_GUIDE_CREATED,
                { payload: [{ id: '123', label: 'Test' }] },
            );
            expect(guidesService.transformGuide).toHaveBeenCalledWith(mockGuideEntity);
        });

        it('should send guide update notification via socket', () => {
            guidesService.transformGuide.mockReturnValue({
                id: '123',
                label: 'Updated',
            });

            service.notifyGuideChange(mockGuideEntity, SocketEventEnum.GUIDE_UPDATED);

            expect(guidesService.socketService.sendDataToRoute).toHaveBeenCalledWith(
                '/guides',
                SocketEventEnum.GUIDE_UPDATED,
                {
                    payload: [{ id: '123', label: 'Updated' }],
                },
            );
        });
    });

    describe('notifyStatsUpdated', () => {
        it('should send stats update notification via socket', () => {
            const stats = { draft: 5, published: 10 };
            guidesService.transformGStats.mockReturnValue(stats);

            service.notifyStatsUpdated(stats);

            expect(guidesService.transformGStats).toHaveBeenCalledWith(stats);
            expect(guidesService.socketService.sendDataToRoute).toHaveBeenCalledWith(
                '/guides/badge-count',
                SocketEventEnum.GUIDE_BADGE_COUNT,
                { payload: stats },
            );
        });

        it('should handle empty stats', () => {
            const stats = {};
            guidesService.transformGStats.mockReturnValue(stats);

            service.notifyStatsUpdated(stats);

            expect(guidesService.transformGStats).toHaveBeenCalledWith(stats);
            expect(guidesService.socketService.sendDataToRoute).toHaveBeenCalledWith(
                '/guides/badge-count',
                SocketEventEnum.GUIDE_BADGE_COUNT,
                { payload: stats },
            );
        });
    });

    describe('scheduleInvalidateCache', () => {
        it('should invalidate guides cache', async () => {
            guidesService.cacheService.deleteKeysByBase.mockResolvedValue(undefined);

            await service.scheduleInvalidateCache();

            expect(guidesService.cacheService.deleteKeysByBase).toHaveBeenCalledWith('guides');
        });

        it('should propagate cache deletion error', async () => {
            guidesService.cacheService.deleteKeysByBase.mockRejectedValue(new Error('cache error'));

            await expect(service.scheduleInvalidateCache()).rejects.toThrow('cache error');
        });
    });

    describe('handlePostCreation', () => {
        it('should handle post creation actions', async () => {
            const stats = { draft: 1, published: 0 };
            guidesService.guideStatsService.onCreate.mockResolvedValue(stats);
            guidesService.transformGuide.mockReturnValue({ id: '123' });
            guidesService.transformGStats.mockReturnValue(stats);

            await service.handlePostCreation(mockGuideEntity, GuideStatusEnum.DRAFT);

            expect(guidesService.guideStatsService.onCreate).toHaveBeenCalledWith(
                GuideStatusEnum.DRAFT,
            );
            expect(guidesService.socketService.sendDataToRoute).toHaveBeenCalledTimes(2);
        });

        it('should emit NEW_GUIDE_CREATED event', async () => {
            guidesService.guideStatsService.onCreate.mockResolvedValue({});
            guidesService.transformGuide.mockReturnValue({ id: '123' });
            guidesService.transformGStats.mockReturnValue({});

            await service.handlePostCreation(mockGuideEntity, GuideStatusEnum.DRAFT);

            expect(guidesService.socketService.sendDataToRoute).toHaveBeenCalledWith(
                '/guides',
                SocketEventEnum.NEW_GUIDE_CREATED,
                expect.any(Object),
            );
        });

        it('should handle post creation for published guide', async () => {
            const stats = { draft: 0, published: 1 };
            guidesService.guideStatsService.onCreate.mockResolvedValue(stats);
            guidesService.transformGuide.mockReturnValue({ id: '456' });
            guidesService.transformGStats.mockReturnValue(stats);

            await service.handlePostCreation(mockGuideEntity, GuideStatusEnum.PUBLISHED);

            expect(guidesService.guideStatsService.onCreate).toHaveBeenCalledWith(
                GuideStatusEnum.PUBLISHED,
            );
        });
    });

    describe('prepareGuideUpdates', () => {
        it('should prepare updates with label change', async () => {
            const updateDto: UpdateGuideDto = {
                label: 'Updated Label',
            };

            mockGuidesRepo.assertUniqueActive.mockResolvedValue(undefined);

            const result = await service.prepareGuideUpdates(updateDto, mockGuideEntity);

            expect(result).toEqual({
                label: 'Updated Label',
            });
        });

        it('should prepare updates with description change', async () => {
            const updateDto: UpdateGuideDto = {
                description: 'Updated Description',
            };

            const result = await service.prepareGuideUpdates(updateDto, mockGuideEntity);

            expect(result).toEqual({
                description: 'Updated Description',
            });
        });

        it('should prepare updates with content change', async () => {
            const updateDto: UpdateGuideDto = {
                content: 'Updated Content',
            };

            const result = await service.prepareGuideUpdates(updateDto, mockGuideEntity);

            expect(result).toEqual({
                content: 'Updated Content',
            });
        });

        it('should prepare updates with isVideo change', async () => {
            const updateDto: UpdateGuideDto = {
                isVideo: true,
            };

            const result = await service.prepareGuideUpdates(updateDto, mockGuideEntity);

            expect(result).toEqual({
                isVideo: true,
            });
        });

        it('should prepare updates with status change', async () => {
            const updateDto: UpdateGuideDto = {
                status: GuideStatusEnum.PUBLISHED,
            };

            const result = await service.prepareGuideUpdates(updateDto, mockGuideEntity);

            expect(result).toEqual({
                status: GuideStatusEnum.PUBLISHED,
            });
        });

        it('should prepare updates with category change', async () => {
            const updateDto: UpdateGuideDto = {
                categoryId: 'new-cat-123',
            };

            guidesService.categoryService.retrieveCategoryByCriteria.mockResolvedValue(
                mockCategoryEntity,
            );

            const result = await service.prepareGuideUpdates(updateDto, mockGuideEntity);

            expect(result).toEqual({
                category: mockCategoryEntity,
            });
            expect(guidesService.categoryService.retrieveCategoryByCriteria).toHaveBeenCalledWith({
                id: 'new-cat-123',
            });
        });

        it('should prepare updates with file change', async () => {
            const updateDto: UpdateGuideDto = {
                fileId: 'new-file-123',
            };

            guidesService.fileLinkService.linkFileToEntity.mockResolvedValue(mockFileLinksEntity);

            const result = await service.prepareGuideUpdates(updateDto, mockGuideEntity);

            expect(result).toEqual({
                file: mockFileLinksEntity,
            });
            expect(guidesService.fileLinkService.linkFileToEntity).toHaveBeenCalledWith(
                'new-file-123',
                FileUsageEnum.GUIDES,
            );
        });

        it('should prepare updates with multiple changes', async () => {
            const updateDto: UpdateGuideDto = {
                label: 'New Label',
                description: 'New Description',
                content: 'New Content',
                isVideo: true,
                status: GuideStatusEnum.PUBLISHED,
                categoryId: 'cat-456',
                fileId: 'file-456',
            };

            mockGuidesRepo.assertUniqueActive.mockResolvedValue(undefined);
            guidesService.categoryService.retrieveCategoryByCriteria.mockResolvedValue(
                mockCategoryEntity,
            );
            guidesService.fileLinkService.linkFileToEntity.mockResolvedValue(mockFileLinksEntity);

            const result = await service.prepareGuideUpdates(updateDto, mockGuideEntity);

            expect(result).toEqual({
                label: 'New Label',
                description: 'New Description',
                content: 'New Content',
                isVideo: true,
                status: GuideStatusEnum.PUBLISHED,
                category: mockCategoryEntity,
                file: mockFileLinksEntity,
            });
        });

        it('should prepare empty updates when no fields provided', async () => {
            const updateDto: UpdateGuideDto = {};

            const result = await service.prepareGuideUpdates(updateDto, mockGuideEntity);

            expect(result).toEqual({});
        });

        it('should ignore empty label string', async () => {
            const updateDto: UpdateGuideDto = {
                label: '',
            };

            const result = await service.prepareGuideUpdates(updateDto, mockGuideEntity);

            expect(result).toEqual({});
        });

        it('should handle description set to empty string', async () => {
            const updateDto: UpdateGuideDto = {
                description: '',
            };

            const result = await service.prepareGuideUpdates(updateDto, mockGuideEntity);

            expect(result).toEqual({
                description: '',
            });
        });

        it('should handle description set to null', async () => {
            const updateDto: UpdateGuideDto = {
                description: null as any,
            };

            const result = await service.prepareGuideUpdates(updateDto, mockGuideEntity);

            expect(result).toEqual({
                description: null,
            });
        });

        it('should handle content set to empty string', async () => {
            const updateDto: UpdateGuideDto = {
                content: '',
            };

            const result = await service.prepareGuideUpdates(updateDto, mockGuideEntity);

            expect(result).toEqual({
                content: '',
            });
        });

        it('should handle content set to null', async () => {
            const updateDto: UpdateGuideDto = {
                content: null as any,
            };

            const result = await service.prepareGuideUpdates(updateDto, mockGuideEntity);

            expect(result).toEqual({
                content: null,
            });
        });

        it('should handle isVideo set to false', async () => {
            const updateDto: UpdateGuideDto = {
                isVideo: false,
            };

            const result = await service.prepareGuideUpdates(updateDto, mockGuideEntity);

            expect(result).toEqual({
                isVideo: false,
            });
        });
    });

    describe('handlePostUpdate', () => {
        it('should always notify guide update and stats', async () => {
            const stats = { draft: 1, published: 0 };
            guidesService.guideStatsService.onStatusChange.mockResolvedValue(stats);
            guidesService.transformGuide.mockReturnValue({ id: '123' });
            guidesService.transformGStats.mockReturnValue(stats);

            await service.handlePostUpdate(mockGuideEntity, GuideStatusEnum.DRAFT);

            expect(guidesService.socketService.sendDataToRoute).toHaveBeenCalledWith(
                '/guides',
                SocketEventEnum.GUIDE_UPDATED,
                expect.any(Object),
            );
        });

        it('should handle post update actions with status change', async () => {
            const stats = { draft: 1, published: 1 };
            guidesService.guideStatsService.onStatusChange.mockResolvedValue(stats);
            guidesService.transformGuide.mockReturnValue({ id: '123' });
            guidesService.transformGStats.mockReturnValue(stats);

            await service.handlePostUpdate(
                mockGuideEntity,
                GuideStatusEnum.DRAFT,
                GuideStatusEnum.PUBLISHED,
            );

            expect(guidesService.guideStatsService.onStatusChange).toHaveBeenCalledWith(
                GuideStatusEnum.DRAFT,
                GuideStatusEnum.PUBLISHED,
            );
            expect(guidesService.socketService.sendDataToRoute).toHaveBeenCalledTimes(2);
        });

        it('should handle post update actions without status change', async () => {
            const stats = { draft: 1, published: 0 };
            guidesService.guideStatsService.onStatusChange.mockResolvedValue(stats);
            guidesService.transformGuide.mockReturnValue({ id: '123' });
            guidesService.transformGStats.mockReturnValue(stats);

            await service.handlePostUpdate(mockGuideEntity, GuideStatusEnum.DRAFT);

            expect(guidesService.guideStatsService.onStatusChange).toHaveBeenCalledWith(
                GuideStatusEnum.DRAFT,
                undefined,
            );
        });
    });

    describe('handlePostDelete', () => {
        it('should handle post delete actions', async () => {
            const stats = { draft: 0, published: 5 };
            guidesService.guideStatsService.onDelete.mockResolvedValue(stats);
            guidesService.transformGStats.mockReturnValue(stats);

            await service.handlePostDelete(mockGuideEntity, GuideStatusEnum.DRAFT);

            expect(guidesService.guideStatsService.onDelete).toHaveBeenCalledWith(
                GuideStatusEnum.DRAFT,
            );
            expect(guidesService.socketService.sendDataToRoute).toHaveBeenCalledWith(
                '/guides',
                SocketEventEnum.GUIDE_DELETED,
                {
                    payload: [{ id: mockGuideEntity.id }],
                },
            );
            expect(guidesService.socketService.sendDataToRoute).toHaveBeenCalledWith(
                '/guides/badge-count',
                SocketEventEnum.GUIDE_BADGE_COUNT,
                { payload: stats },
            );
        });

        it('should handle post delete for published guide', async () => {
            const stats = { draft: 5, published: 4 };
            guidesService.guideStatsService.onDelete.mockResolvedValue(stats);
            guidesService.transformGStats.mockReturnValue(stats);

            await service.handlePostDelete(mockGuideEntity, GuideStatusEnum.PUBLISHED);

            expect(guidesService.guideStatsService.onDelete).toHaveBeenCalledWith(
                GuideStatusEnum.PUBLISHED,
            );
        });
    });
});
