import { Test, TestingModule } from '@nestjs/testing';
import { Between, MoreThanOrEqual } from 'typeorm';
import { subDays, subWeeks, subYears, subMonths } from 'date-fns';
import { AnalysisUsageService } from './analysis-usage.service';
import { AnalysisService } from './analysis.service';
import { AnalysisEntity, AnalysisUsageEntity } from '../entities';
import { ModuleEntity } from '../../modules/entities';
import { UsagePeriod } from '../../../common/enum';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
};

const mockUsageRepo = {
    create: jest.fn(),
    count: jest.fn(),
    getRepository: jest.fn(() => ({
        createQueryBuilder: jest.fn(() => mockQueryBuilder),
    })),
};

const mockModuleRepository = {
    getRepository: jest.fn(() => ({
        createQueryBuilder: jest.fn(() => mockQueryBuilder),
    })),
};

const mockAnalysisService = {
    analysisUsageRepo: mockUsageRepo,
    moduleService: {
        moduleRepository: mockModuleRepository,
    },
};

describe('AnalysisUsageService', () => {
    let service: AnalysisUsageService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AnalysisUsageService,
                { provide: AnalysisService, useValue: mockAnalysisService },
            ],
        }).compile();

        service = module.get<AnalysisUsageService>(AnalysisUsageService);
    });

    describe('repo (getter)', () => {
        it('should return analysisUsageRepo from analysisService', () => {
            expect(service.repo).toBe(mockUsageRepo);
        });
    });

    describe('getPeriodRange', () => {
        const FIXED_NOW = new Date('2024-06-15T12:00:00.000Z');

        beforeEach(() => {
            jest.useFakeTimers();
            jest.setSystemTime(FIXED_NOW);
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should return 1 day ago for ONE_DAY', () => {
            const result = service.getPeriodRange(UsagePeriod.ONE_DAY);
            expect(result).toEqual(subDays(FIXED_NOW, 1));
        });

        it('should return 1 week ago for ONE_WEEK', () => {
            const result = service.getPeriodRange(UsagePeriod.ONE_WEEK);
            expect(result).toEqual(subWeeks(FIXED_NOW, 1));
        });

        it('should return 1 month ago for ONE_MONTH', () => {
            const result = service.getPeriodRange(UsagePeriod.ONE_MONTH);
            expect(result).toEqual(subMonths(FIXED_NOW, 1));
        });

        it('should return 1 year ago for ONE_YEAR', () => {
            const result = service.getPeriodRange(UsagePeriod.ONE_YEAR);
            expect(result).toEqual(subYears(FIXED_NOW, 1));
        });
    });

    describe('getPreviousPeriodRange', () => {
        const FIXED_NOW = new Date('2024-06-15T12:00:00.000Z');

        beforeEach(() => {
            jest.useFakeTimers();
            jest.setSystemTime(FIXED_NOW);
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should return previous day range for ONE_DAY', () => {
            const to = subDays(FIXED_NOW, 1);
            const { from, to: resultTo } = service.getPreviousPeriodRange(UsagePeriod.ONE_DAY);
            expect(resultTo).toEqual(to);
            expect(from).toEqual(subDays(to, 1));
        });

        it('should return previous week range for ONE_WEEK', () => {
            const to = subWeeks(FIXED_NOW, 1);
            const { from, to: resultTo } = service.getPreviousPeriodRange(UsagePeriod.ONE_WEEK);
            expect(resultTo).toEqual(to);
            expect(from).toEqual(subWeeks(to, 1));
        });

        it('should return previous month range for ONE_MONTH', () => {
            const to = subMonths(FIXED_NOW, 1);
            const { from, to: resultTo } = service.getPreviousPeriodRange(UsagePeriod.ONE_MONTH);
            expect(resultTo).toEqual(to);
            expect(from).toEqual(subMonths(to, 1));
        });

        it('should return previous year range for ONE_YEAR', () => {
            const to = subYears(FIXED_NOW, 1);
            const { from, to: resultTo } = service.getPreviousPeriodRange(UsagePeriod.ONE_YEAR);
            expect(resultTo).toEqual(to);
            expect(from).toEqual(subYears(to, 1));
        });
    });

    describe('buildAUsageEntity', () => {
        it('should build an AnalysisUsageEntity with analysis and module assigned', () => {
            const analysis = { id: 'a1' } as AnalysisEntity;
            const module = { id: 'm1' } as ModuleEntity;

            const result = service.buildAUsageEntity({ analysis, module });

            expect(result).toBeInstanceOf(AnalysisUsageEntity);
            expect(result.analysis).toBe(analysis);
            expect(result.module).toBe(module);
        });
    });

    describe('createAUsage', () => {
        it('should create and persist an AnalysisUsageEntity', async () => {
            const module = { id: 'm1' } as ModuleEntity;
            const analysis = { id: 'a1', module } as AnalysisEntity;
            const savedEntity = { id: 'u1' } as AnalysisUsageEntity;

            mockUsageRepo.create.mockResolvedValue(savedEntity);

            const result = await service.createAUsage(analysis);

            expect(mockUsageRepo.create).toHaveBeenCalledTimes(1);
            const entityArg = mockUsageRepo.create.mock.calls[0][0] as AnalysisUsageEntity;
            expect(entityArg).toBeInstanceOf(AnalysisUsageEntity);
            expect(entityArg.analysis).toBe(analysis);
            expect(entityArg.module).toBe(module);
            expect(result).toBe(savedEntity);
        });
    });

    describe('getTotalUsageChart', () => {
        const from = new Date('2024-01-01');
        const fakeRows = [{ label: 'Jan 2024', usages: 5 }];

        beforeEach(() => {
            mockQueryBuilder.getRawMany.mockResolvedValue(fakeRows);
        });

        it('should use month truncation and Mon YYYY label for ONE_YEAR', async () => {
            const result = await service.getTotalUsageChart(UsagePeriod.ONE_YEAR, from);

            expect(mockQueryBuilder.select).toHaveBeenCalledWith(
                expect.stringContaining("'Mon YYYY'"),
                'label',
            );
            expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith(
                expect.stringContaining("'month'"),
            );
            expect(result).toBe(fakeRows);
        });

        it('should use day truncation and DD Mon label for non-YEAR period', async () => {
            const result = await service.getTotalUsageChart(UsagePeriod.ONE_MONTH, from);

            expect(mockQueryBuilder.select).toHaveBeenCalledWith(
                expect.stringContaining("'DD Mon'"),
                'label',
            );
            expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith(expect.stringContaining("'day'"));
            expect(result).toBe(fakeRows);
        });

        it('should filter with the provided from date', async () => {
            await service.getTotalUsageChart(UsagePeriod.ONE_WEEK, from);
            expect(mockQueryBuilder.where).toHaveBeenCalledWith('u.createdAt >= :from', { from });
        });

        it('should order ASC', async () => {
            await service.getTotalUsageChart(UsagePeriod.ONE_DAY, from);
            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(expect.any(String), 'ASC');
        });
    });

    describe('getTotalUsage', () => {
        const FIXED_NOW = new Date('2024-06-15T12:00:00.000Z');

        beforeEach(() => {
            jest.useFakeTimers();
            jest.setSystemTime(FIXED_NOW);
            mockQueryBuilder.getRawMany.mockResolvedValue([]);
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should return correct stats with positive evolution for ONE_MONTH', async () => {
            mockUsageRepo.count.mockResolvedValueOnce(10).mockResolvedValueOnce(5);

            const result = await service.getTotalUsage(UsagePeriod.ONE_MONTH);

            expect(result.total).toBe(10);
            expect(result.previous).toBe(5);
            expect(result.evolution).toBe(100);
            expect(result.period).toBe(UsagePeriod.ONE_MONTH);
            expect(result.chart).toBeDefined();
        });

        it('should return evolution null when previous is 0', async () => {
            mockUsageRepo.count.mockResolvedValueOnce(10).mockResolvedValueOnce(0);

            const result = await service.getTotalUsage(UsagePeriod.ONE_WEEK);

            expect(result.evolution).toBeNull();
        });

        it('should return chart null for ONE_DAY period', async () => {
            mockUsageRepo.count.mockResolvedValueOnce(3).mockResolvedValueOnce(2);

            const result = await service.getTotalUsage(UsagePeriod.ONE_DAY);

            expect(result.chart).toBeNull();
        });

        it('should call count with MoreThanOrEqual for current period', async () => {
            mockUsageRepo.count.mockResolvedValue(0);

            await service.getTotalUsage(UsagePeriod.ONE_WEEK);

            const firstCall = mockUsageRepo.count.mock.calls[0][0];
            expect(firstCall.where.createdAt).toEqual(MoreThanOrEqual(subWeeks(FIXED_NOW, 1)));
        });

        it('should call count with Between for previous period', async () => {
            mockUsageRepo.count.mockResolvedValue(0);

            await service.getTotalUsage(UsagePeriod.ONE_WEEK);

            const secondCall = mockUsageRepo.count.mock.calls[1][0];
            const prevTo = subWeeks(FIXED_NOW, 1);
            const prevFrom = subWeeks(prevTo, 1);
            expect(secondCall.where.createdAt).toEqual(Between(prevFrom, prevTo));
        });

        it('should handle negative evolution correctly', async () => {
            mockUsageRepo.count.mockResolvedValueOnce(2).mockResolvedValueOnce(10);

            const result = await service.getTotalUsage(UsagePeriod.ONE_YEAR);

            expect(result.evolution).toBe(-80);
        });
    });

    describe('getUsageRepartition', () => {
        const fakeRows = [
            { moduleId: 'm1', moduleLabel: 'Module A', moduleIcon: 'icon-a', usages: 10 },
        ];

        beforeEach(() => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
            mockQueryBuilder.getRawMany.mockResolvedValue(fakeRows);
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should return repartition data', async () => {
            const result = await service.getUsageRepartition(UsagePeriod.ONE_MONTH);
            expect(result).toBe(fakeRows);
        });

        it('should group by module id, label, and icon', async () => {
            await service.getUsageRepartition(UsagePeriod.ONE_WEEK);
            expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith('m.id');
            expect(mockQueryBuilder.addGroupBy).toHaveBeenCalledWith('m.label');
            expect(mockQueryBuilder.addGroupBy).toHaveBeenCalledWith('m.icon');
        });

        it('should order by usages DESC', async () => {
            await service.getUsageRepartition(UsagePeriod.ONE_YEAR);
            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('usages', 'DESC');
        });

        it('should left join usages with date filter', async () => {
            const from = subMonths(new Date('2024-06-15T12:00:00.000Z'), 1);
            await service.getUsageRepartition(UsagePeriod.ONE_MONTH);
            expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
                'm.usages',
                'u',
                'u.createdAt >= :from AND u.deletedAt IS NULL',
                { from },
            );
        });
    });
});
