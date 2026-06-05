import { Test, TestingModule } from '@nestjs/testing';
import { PreAnalysisService } from './pre-analysis.service';
import { AnalysisService } from './analysis.service';
import { AnalysisEntity } from '../entities';
import { ModuleEntity } from '../../modules/entities';
import { PropertyEntity } from '../../properties/entities/property.entity';
import { UserEntity } from '../../users/entities/user.entity';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const makeModule = (overrides: Partial<ModuleEntity> = {}): ModuleEntity =>
    ({ id: 'module-1', ...overrides }) as ModuleEntity;

const makeProperty = (overrides: Partial<PropertyEntity> = {}): PropertyEntity =>
    ({ id: 'prop-1', ...overrides }) as PropertyEntity;

const makeUser = (overrides: Partial<UserEntity> = {}): UserEntity =>
    ({ id: 'user-1', ...overrides }) as UserEntity;

describe('PreAnalysisService', () => {
    let service: PreAnalysisService;

    const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
    };

    const mockRepo = {
        getRepository: jest.fn().mockReturnValue({
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
        }),
        findActiveOne: jest.fn(),
    };

    const mockLogger = { info: jest.fn() };
    const mockErrorHandler = { notFound: jest.fn() };
    const mockOtherUtils = {
        formatCriteria: jest.fn().mockReturnValue('id = 1'),
    };
    const mockCacheService = { deleteKeysByBase: jest.fn() };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PreAnalysisService,
                {
                    provide: AnalysisService,
                    useValue: {
                        analysisRepo: mockRepo,
                        logger: mockLogger,
                        errorHandler: mockErrorHandler,
                        otherUtils: mockOtherUtils,
                        cacheService: mockCacheService,
                    },
                },
            ],
        }).compile();

        service = module.get<PreAnalysisService>(PreAnalysisService);
    });

    describe('buildAnalysisBaseQuery', () => {
        const baseFilters = { moduleId: 'module-1', userId: 'user-1' };

        it('should create a query builder on the analysis repository', () => {
            service.buildAnalysisBaseQuery(baseFilters);

            expect(mockRepo.getRepository).toHaveBeenCalled();
            expect(mockRepo.getRepository().createQueryBuilder).toHaveBeenCalledWith('an');
        });

        it('should join createdBy, module and property relations', () => {
            service.buildAnalysisBaseQuery(baseFilters);

            expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith('an.createdBy', 'createdBy');
            expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith('an.module', 'module');
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
                'an.property',
                'property',
            );
        });

        it('should filter out deleted analyses', () => {
            service.buildAnalysisBaseQuery(baseFilters);

            expect(mockQueryBuilder.where).toHaveBeenCalledWith('an.deleted = false');
        });

        it('should apply userId filter', () => {
            service.buildAnalysisBaseQuery(baseFilters);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('createdBy.id = :userId', {
                userId: 'user-1',
            });
        });

        it('should apply moduleId filter', () => {
            service.buildAnalysisBaseQuery(baseFilters);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('module.id = :moduleId', {
                moduleId: 'module-1',
            });
        });

        it('should NOT apply searchTerm filter when not provided', () => {
            service.buildAnalysisBaseQuery(baseFilters);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(2);
        });

        it('should apply searchTerm filter when provided', () => {
            service.buildAnalysisBaseQuery({
                ...baseFilters,
                searchTerm: 'Springfield',
            });

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(3);
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                expect.stringContaining('LOWER(property.formattedAddress) LIKE :searchTerm'),
                { searchTerm: '%springfield%' },
            );
        });

        it('should trim and lowercase the searchTerm before applying it', () => {
            service.buildAnalysisBaseQuery({
                ...baseFilters,
                searchTerm: '  MyCity  ',
            });

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(expect.any(String), {
                searchTerm: '%mycity%',
            });
        });

        it('should match against all expected fields in the searchTerm condition', () => {
            service.buildAnalysisBaseQuery({
                ...baseFilters,
                searchTerm: 'test',
            });

            const searchCall = mockQueryBuilder.andWhere.mock.calls.find(
                ([sql]) => typeof sql === 'string' && sql.includes('LIKE :searchTerm'),
            );

            expect(searchCall).toBeDefined();
            const [sql] = searchCall!;
            expect(sql).toContain('LOWER(property.formattedAddress) LIKE :searchTerm');
            expect(sql).toContain('LOWER(an.description) LIKE :searchTerm');
            expect(sql).toContain('LOWER(property.city) LIKE :searchTerm');
            expect(sql).toContain('LOWER(property.state) LIKE :searchTerm');
            expect(sql).toContain('LOWER(property.zipCode) LIKE :searchTerm');
        });

        it('should return the query builder', () => {
            const result = service.buildAnalysisBaseQuery(baseFilters);

            expect(result).toBe(mockQueryBuilder);
        });
    });

    describe('buildAnalysisEntity', () => {
        it('should return an AnalysisEntity instance', () => {
            const result = service.buildAnalysisEntity(makeModule(), makeProperty(), makeUser());

            expect(result).toBeInstanceOf(AnalysisEntity);
        });

        it('should assign module, property and createdBy', () => {
            const module = makeModule();
            const property = makeProperty();
            const user = makeUser();

            const result = service.buildAnalysisEntity(module, property, user);

            expect(result.module).toBe(module);
            expect(result.property).toBe(property);
            expect(result.createdBy).toBe(user);
        });

        it('should assign description when provided', () => {
            const result = service.buildAnalysisEntity(
                makeModule(),
                makeProperty(),
                makeUser(),
                'My description',
            );

            expect(result.description).toBe('My description');
        });

        it('should leave description undefined when not provided', () => {
            const result = service.buildAnalysisEntity(makeModule(), makeProperty(), makeUser());

            expect(result.description).toBeUndefined();
        });
    });

    describe('retrieveUserAnalysis', () => {
        const baseFilters = { moduleId: 'module-1', userId: 'user-1' };

        it('should apply ordering by property.updatedAt DESC', () => {
            service.retrieveUserAnalysis(baseFilters, 0, 10);

            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('an.updatedAt', 'DESC');
        });

        it('should apply offset and limit for pagination', () => {
            service.retrieveUserAnalysis(baseFilters, 20, 5);

            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(20);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
        });

        it('should apply offset = 0 and limit = 10 correctly', () => {
            service.retrieveUserAnalysis(baseFilters, 0, 10);

            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
        });

        it('should pass searchTerm down to the base query when provided', () => {
            service.retrieveUserAnalysis({ ...baseFilters, searchTerm: 'beach' }, 0, 10);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                expect.stringContaining('LOWER(property.formattedAddress) LIKE :searchTerm'),
                { searchTerm: '%beach%' },
            );
        });

        it('should return the query builder', () => {
            const result = service.retrieveUserAnalysis(baseFilters, 0, 10);

            expect(result).toBe(mockQueryBuilder);
        });
    });

    describe('retrieveAnalyseByCriteria', () => {
        const criteria = { id: 'analysis-1' };
        const mockAnalysis = { id: 'analysis-1' } as any;

        it('should format the criteria and log the search', async () => {
            mockRepo.findActiveOne.mockResolvedValue(mockAnalysis);

            await service.retrieveAnalyseByCriteria(criteria);

            expect(mockOtherUtils.formatCriteria).toHaveBeenCalledWith(criteria);
            expect(mockLogger.info).toHaveBeenCalledWith('Find an analyse by criteria: id = 1');
        });

        it('should call findActiveOne with the repository, criteria and no relations', async () => {
            mockRepo.findActiveOne.mockResolvedValue(mockAnalysis);

            await service.retrieveAnalyseByCriteria(criteria);

            expect(mockRepo.findActiveOne).toHaveBeenCalledWith(mockRepo, criteria, undefined);
        });

        it('should call findActiveOne with relations when provided', async () => {
            mockRepo.findActiveOne.mockResolvedValue(mockAnalysis);

            await service.retrieveAnalyseByCriteria(criteria, ['module', 'property']);

            expect(mockRepo.findActiveOne).toHaveBeenCalledWith(mockRepo, criteria, [
                'module',
                'property',
            ]);
        });

        it('should return the found analysis entities', async () => {
            mockRepo.findActiveOne.mockResolvedValue(mockAnalysis);

            const result = await service.retrieveAnalyseByCriteria(criteria);

            expect(result).toBe(mockAnalysis);
        });

        it('should call notFound when analysis does not exist', async () => {
            mockRepo.findActiveOne.mockResolvedValue(null);

            await service.retrieveAnalyseByCriteria(criteria);

            expect(mockErrorHandler.notFound).toHaveBeenCalledWith(
                'Add not found with criteria: id = 1',
                'Add not found',
            );
        });
    });

    describe('invalidateUserACache', () => {
        it('should call deleteKeysByBase with the correct pattern', async () => {
            mockCacheService.deleteKeysByBase.mockResolvedValue(undefined);

            await service.invalidateUserACache('user-1', 'module-1');

            expect(mockCacheService.deleteKeysByBase).toHaveBeenCalledWith(
                'analysis-user-1-module-1',
            );
        });

        it('should call deleteKeysByBase with pattern for different ids', async () => {
            mockCacheService.deleteKeysByBase.mockResolvedValue(undefined);

            await service.invalidateUserACache('user-42', 'module-99');

            expect(mockCacheService.deleteKeysByBase).toHaveBeenCalledWith(
                'analysis-user-42-module-99',
            );
        });
    });
});
