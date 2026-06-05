import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { AnalysisService } from './analysis.service';
import { PreAnalysisService } from './pre-analysis.service';
import { AnalysisUsageService } from './analysis-usage.service';
import { TransformAEntityService } from './transform-a-entity.service';
import { AnalysisRepository, AnalysisUsageRepository } from '../repositories';
import { CacheService } from '../../../helpers/cache/cache.service';
import { ErrorHandlerService } from '../../../common/response';
import { OtherUtils } from '../../../utils/services/tools';
import { UsersService } from '../../users/services';
import { ModulesService } from '../../modules/services';
import { PropertiesService } from '../../properties/services';
import { AnalysisEntity } from '../entities';
import { UsagePeriod } from '../../../common/enum';
import { CurrentUserInterface } from '../../../interface';
import { AnalysisCreateDto } from '../dto/analysis-create.dto';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };

const mockUser = { id: 'user-1', email: 'test@test.com' };
const mockModuleEntity = { id: 'mod-1', isActive: true, usageCount: 5 };
const mockPropertyEntity = { id: 'prop-1' };
const mockAnalysisEntity = {
    id: 'analysis-1',
    description: 'Test analysis',
    createdAt: new Date('2024-01-01'),
    module: mockModuleEntity,
} as unknown as AnalysisEntity;

const mockPreAnalysisService = {
    retrieveUserAnalysis: jest.fn(),
    retrieveAnalyseByCriteria: jest.fn(),
    buildAnalysisEntity: jest.fn(),
    invalidateUserACache: jest.fn(),
};

const mockAnalysisUsageService = {
    getTotalUsage: jest.fn(),
    getUsageRepartition: jest.fn(),
    createAUsage: jest.fn(),
};

const mockTransformAEntityService = {
    transformAs: jest.fn(),
};

const mockAnalysisRepo = {
    create: jest.fn(),
    update: jest.fn(),
};

const mockAnalysisUsageRepo = {};

const mockUserService = {
    preUserService: {
        retrieveUserByCriteria: jest.fn(),
    },
};

const mockModuleService = {
    preModuleService: {
        findModuleByCriteria: jest.fn(),
        updateModuleDetails: jest.fn(),
    },
};

const mockPropertyService = {
    getOrCreateProperty: jest.fn(),
};

const mockCacheService = {
    generateRedisKey: jest.fn(),
    retrieveGenericPaginated: jest.fn(),
};

const mockErrorHandler = {};
const mockOtherUtils = {};

describe('AnalysisService', () => {
    let service: AnalysisService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AnalysisService,
                { provide: WINSTON_MODULE_PROVIDER, useValue: mockLogger },
                { provide: PreAnalysisService, useValue: mockPreAnalysisService },
                { provide: AnalysisUsageService, useValue: mockAnalysisUsageService },
                { provide: TransformAEntityService, useValue: mockTransformAEntityService },
                { provide: AnalysisRepository, useValue: mockAnalysisRepo },
                { provide: AnalysisUsageRepository, useValue: mockAnalysisUsageRepo },
                { provide: UsersService, useValue: mockUserService },
                { provide: ModulesService, useValue: mockModuleService },
                { provide: PropertiesService, useValue: mockPropertyService },
                { provide: CacheService, useValue: mockCacheService },
                { provide: ErrorHandlerService, useValue: mockErrorHandler },
                { provide: OtherUtils, useValue: mockOtherUtils },
            ],
        }).compile();

        service = module.get<AnalysisService>(AnalysisService);
    });

    describe('getUser', () => {
        it('should retrieve a user by id', async () => {
            mockUserService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockUser);

            const result = await service.getUser('user-1');

            expect(mockUserService.preUserService.retrieveUserByCriteria).toHaveBeenCalledWith({
                id: 'user-1',
            });
            expect(result).toBe(mockUser);
        });
    });

    describe('getUserModuleAnalyses', () => {
        it('should generate cache key and call retrieveGenericPaginated', async () => {
            const fakePaginatedResult = { items: [], total: 0 };
            mockCacheService.generateRedisKey.mockReturnValue('cache-key');
            mockCacheService.retrieveGenericPaginated.mockResolvedValue(fakePaginatedResult);

            const result = await service.getUserModuleAnalyses('user-1', 'mod-1', 1, 10);

            expect(mockCacheService.generateRedisKey).toHaveBeenCalledWith(
                'analysis-user-1-mod-1',
                {},
            );
            expect(mockCacheService.retrieveGenericPaginated).toHaveBeenCalledWith(
                'cache-key',
                1,
                10,
                { userId: 'user-1', moduleId: 'mod-1', searchTerm: undefined },
                expect.any(Function),
                expect.any(Function),
            );
            expect(result).toBe(fakePaginatedResult);
        });

        it('should include searchTerm in cache key when provided', async () => {
            mockCacheService.generateRedisKey.mockReturnValue('cache-key-search');
            mockCacheService.retrieveGenericPaginated.mockResolvedValue({ items: [], total: 0 });

            await service.getUserModuleAnalyses('user-1', 'mod-1', 1, 10, 'mySearch');

            expect(mockCacheService.generateRedisKey).toHaveBeenCalledWith(
                'analysis-user-1-mod-1',
                {
                    search: 'mysearch',
                },
            );
        });

        it('should call retrieveUserAnalysis via the paginator callback', async () => {
            mockCacheService.generateRedisKey.mockReturnValue('key');
            mockPreAnalysisService.retrieveUserAnalysis.mockResolvedValue([]);
            mockCacheService.retrieveGenericPaginated.mockImplementation(
                async (_key, _page, _limit, _ctx, fetcher) => fetcher(0, 10),
            );

            await service.getUserModuleAnalyses('user-1', 'mod-1', 1, 10, 'term');

            expect(mockPreAnalysisService.retrieveUserAnalysis).toHaveBeenCalledWith(
                { moduleId: 'mod-1', userId: 'user-1', searchTerm: 'term' },
                0,
                10,
            );
        });

        it('should call transformAs via the transformer callback', async () => {
            const entities = [mockAnalysisEntity];
            mockCacheService.generateRedisKey.mockReturnValue('key');
            mockTransformAEntityService.transformAs.mockReturnValue([]);
            mockCacheService.retrieveGenericPaginated.mockImplementation(
                async (_key, _page, _limit, _ctx, _fetcher, transformer) => transformer(entities),
            );

            await service.getUserModuleAnalyses('user-1', 'mod-1', 1, 10);

            expect(mockTransformAEntityService.transformAs).toHaveBeenCalledWith(entities);
        });

        it('should log the retrieval', async () => {
            mockCacheService.generateRedisKey.mockReturnValue('key');
            mockCacheService.retrieveGenericPaginated.mockResolvedValue([]);

            await service.getUserModuleAnalyses('user-1', 'mod-1', 1, 10);

            expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('user-1'));
        });
    });

    describe('analysisDetails', () => {
        const currentUser = { id: 'user-1' } as CurrentUserInterface;

        it('should return id, description, and createdAt', async () => {
            mockPreAnalysisService.retrieveAnalyseByCriteria.mockResolvedValue(mockAnalysisEntity);

            const result = await service.analysisDetails(currentUser, 'analysis-1');

            expect(result).toEqual({
                id: 'analysis-1',
                description: mockAnalysisEntity.description,
                createdAt: mockAnalysisEntity.createdAt,
            });
        });

        it('should retrieve by user ownership and id', async () => {
            mockPreAnalysisService.retrieveAnalyseByCriteria.mockResolvedValue(mockAnalysisEntity);

            await service.analysisDetails(currentUser, 'analysis-1');

            expect(mockPreAnalysisService.retrieveAnalyseByCriteria).toHaveBeenCalledWith({
                createdBy: { id: 'user-1' },
                id: 'analysis-1',
            });
        });

        it('should log the operation', async () => {
            mockPreAnalysisService.retrieveAnalyseByCriteria.mockResolvedValue(mockAnalysisEntity);

            await service.analysisDetails(currentUser, 'analysis-1');

            expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('analysis-1'));
        });
    });

    describe('updateAnalysis', () => {
        const currentUser = { id: 'user-1' } as CurrentUserInterface;

        beforeEach(() => {
            mockPreAnalysisService.retrieveAnalyseByCriteria.mockResolvedValue(mockAnalysisEntity);
        });

        it('should update description when provided', async () => {
            mockAnalysisRepo.update.mockResolvedValue({});

            const result = await service.updateAnalysis(
                currentUser,
                'analysis-1',
                '  New description  ',
            );

            expect(mockAnalysisRepo.update).toHaveBeenCalledWith(
                { id: 'analysis-1' },
                { description: 'New description' },
            );
            expect(result).toEqual({ message: 'Analysis updated successfully.' });
        });

        it('should not call update when description is undefined', async () => {
            const result = await service.updateAnalysis(currentUser, 'analysis-1', undefined);

            expect(mockAnalysisRepo.update).not.toHaveBeenCalled();
            expect(result).toEqual({ message: 'Analysis updated successfully.' });
        });

        it('should not call update when description is empty string', async () => {
            const result = await service.updateAnalysis(currentUser, 'analysis-1', '');

            expect(mockAnalysisRepo.update).not.toHaveBeenCalled();
            expect(result).toEqual({ message: 'Analysis updated successfully.' });
        });

        it('should verify ownership before updating', async () => {
            await service.updateAnalysis(currentUser, 'analysis-1', 'desc');

            expect(mockPreAnalysisService.retrieveAnalyseByCriteria).toHaveBeenCalledWith({
                createdBy: { id: 'user-1' },
                id: 'analysis-1',
            });
        });

        it('should log the operation', async () => {
            await service.updateAnalysis(currentUser, 'analysis-1');

            expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('analysis-1'));
        });
    });

    describe('createAnalysis', () => {
        const currentUser = { id: 'user-1' } as CurrentUserInterface;
        const dto: AnalysisCreateDto = {
            moduleId: 'mod-1',
            propertyId: 'prop-1',
            description: 'New analysis',
        };

        beforeEach(() => {
            mockUserService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockUser);
            mockModuleService.preModuleService.findModuleByCriteria.mockResolvedValue(
                mockModuleEntity,
            );
            mockPropertyService.getOrCreateProperty.mockResolvedValue(mockPropertyEntity);
            mockPreAnalysisService.buildAnalysisEntity.mockReturnValue(mockAnalysisEntity);
            mockAnalysisRepo.create.mockResolvedValue(mockAnalysisEntity);
            mockAnalysisUsageService.createAUsage.mockResolvedValue({});
            mockModuleService.preModuleService.updateModuleDetails.mockResolvedValue({});
            mockPreAnalysisService.invalidateUserACache.mockResolvedValue(undefined);
        });

        it('should create an analysis and return success message', async () => {
            const result = await service.createAnalysis(currentUser, dto);

            expect(result).toEqual({ message: 'Analysis created successfully.' });
        });

        it('should fetch user and module in parallel', async () => {
            await service.createAnalysis(currentUser, dto);

            expect(mockUserService.preUserService.retrieveUserByCriteria).toHaveBeenCalledWith({
                id: 'user-1',
            });
            expect(mockModuleService.preModuleService.findModuleByCriteria).toHaveBeenCalledWith({
                id: 'mod-1',
                isActive: true,
            });
        });

        it('should get or create the property', async () => {
            await service.createAnalysis(currentUser, dto);

            expect(mockPropertyService.getOrCreateProperty).toHaveBeenCalledWith(
                mockUser,
                'prop-1',
            );
        });

        it('should build and persist the analysis entity', async () => {
            await service.createAnalysis(currentUser, dto);

            expect(mockPreAnalysisService.buildAnalysisEntity).toHaveBeenCalledWith(
                mockModuleEntity,
                mockPropertyEntity,
                mockUser,
                dto.description,
            );
            expect(mockAnalysisRepo.create).toHaveBeenCalledWith(mockAnalysisEntity);
        });

        it('should create a usage record', async () => {
            await service.createAnalysis(currentUser, dto);

            expect(mockAnalysisUsageService.createAUsage).toHaveBeenCalledWith(mockAnalysisEntity);
        });

        it('should increment module usage count', async () => {
            await service.createAnalysis(currentUser, dto);

            expect(mockModuleService.preModuleService.updateModuleDetails).toHaveBeenCalledWith(
                mockModuleEntity,
                { usageCount: mockModuleEntity.usageCount + 1 },
            );
        });

        it('should invalidate the user analysis cache', async () => {
            await service.createAnalysis(currentUser, dto);

            expect(mockPreAnalysisService.invalidateUserACache).toHaveBeenCalledWith(
                'user-1',
                'mod-1',
            );
        });

        it('should log the creation', async () => {
            await service.createAnalysis(currentUser, dto);

            expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('user-1'));
        });
    });

    describe('getTotalUsageStats', () => {
        it('should delegate to analysisUsageService.getTotalUsage', async () => {
            const fakeStats = {
                total: 10,
                previous: 5,
                evolution: 100,
                period: UsagePeriod.ONE_MONTH,
                chart: [],
            };
            mockAnalysisUsageService.getTotalUsage.mockResolvedValue(fakeStats);

            const result = await service.getTotalUsageStats(UsagePeriod.ONE_MONTH);

            expect(mockAnalysisUsageService.getTotalUsage).toHaveBeenCalledWith(
                UsagePeriod.ONE_MONTH,
            );
            expect(result).toBe(fakeStats);
        });

        it('should log the operation', async () => {
            mockAnalysisUsageService.getTotalUsage.mockResolvedValue({});

            await service.getTotalUsageStats(UsagePeriod.ONE_WEEK);

            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.stringContaining(UsagePeriod.ONE_WEEK),
            );
        });
    });

    describe('getUsageRepartition', () => {
        it('should delegate to analysisUsageService.getUsageRepartition', async () => {
            const fakeRepartition = [{ moduleId: 'm1', usages: 5 }];
            mockAnalysisUsageService.getUsageRepartition.mockResolvedValue(fakeRepartition);

            const result = await service.getUsageRepartition(UsagePeriod.ONE_YEAR);

            expect(mockAnalysisUsageService.getUsageRepartition).toHaveBeenCalledWith(
                UsagePeriod.ONE_YEAR,
            );
            expect(result).toBe(fakeRepartition);
        });

        it('should log the operation', async () => {
            mockAnalysisUsageService.getUsageRepartition.mockResolvedValue([]);

            await service.getUsageRepartition(UsagePeriod.ONE_DAY);

            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.stringContaining(UsagePeriod.ONE_DAY),
            );
        });
    });

    describe('saveUsage', () => {
        beforeEach(() => {
            mockPreAnalysisService.retrieveAnalyseByCriteria.mockResolvedValue(mockAnalysisEntity);
            mockAnalysisUsageService.createAUsage.mockResolvedValue({});
            mockModuleService.preModuleService.updateModuleDetails.mockResolvedValue({});
        });

        it('should save usage and return success message', async () => {
            const result = await service.saveUsage('analysis-1');

            expect(result).toEqual({ message: 'Analysis usage saved successfully.' });
        });

        it('should retrieve analysis with module relation', async () => {
            await service.saveUsage('analysis-1');

            expect(mockPreAnalysisService.retrieveAnalyseByCriteria).toHaveBeenCalledWith(
                { id: 'analysis-1' },
                ['module'],
            );
        });

        it('should create usage record for the retrieved analysis', async () => {
            await service.saveUsage('analysis-1');

            expect(mockAnalysisUsageService.createAUsage).toHaveBeenCalledWith(mockAnalysisEntity);
        });

        it('should increment module usage count', async () => {
            await service.saveUsage('analysis-1');

            expect(mockModuleService.preModuleService.updateModuleDetails).toHaveBeenCalledWith(
                mockModuleEntity,
                { usageCount: mockModuleEntity.usageCount + 1 },
            );
        });

        it('should log the operation', async () => {
            await service.saveUsage('analysis-1');

            expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('analysis-1'));
        });
    });
});
