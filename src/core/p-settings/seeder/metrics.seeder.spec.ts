import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { MetricsSeeder } from './metrics.seeder';
import { MetricsRepository } from '../repositories';
import { MetricsEntity } from '../entities';

describe('MetricsSeeder', () => {
    let seeder: MetricsSeeder;
    let mockLogger: { info: jest.Mock; error: jest.Mock };
    let mockRaMetricsRepository: { find: jest.Mock; createMany: jest.Mock };

    beforeEach(async () => {
        mockLogger = {
            info: jest.fn(),
            error: jest.fn(),
        };

        mockRaMetricsRepository = {
            find: jest.fn(),
            createMany: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MetricsSeeder,
                {
                    provide: WINSTON_MODULE_PROVIDER,
                    useValue: mockLogger,
                },
                {
                    provide: MetricsRepository,
                    useValue: mockRaMetricsRepository,
                },
            ],
        }).compile();

        seeder = module.get<MetricsSeeder>(MetricsSeeder);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('when no metrics exist in DB', () => {
        it('should insert all 14 metrics and log correctly', async () => {
            mockRaMetricsRepository.find.mockResolvedValue([]);
            mockRaMetricsRepository.createMany.mockResolvedValue(undefined);

            await seeder.seed();

            expect(mockLogger.info).toHaveBeenCalledWith('[MetricsSeeder] Seeding started');
            expect(mockRaMetricsRepository.find).toHaveBeenCalledWith({
                where: { deleted: false },
            });
            expect(mockLogger.info).toHaveBeenCalledWith(
                '[MetricsSeeder] Found 0 existing metrics',
            );
            expect(mockLogger.info).toHaveBeenCalledWith(
                '[MetricsSeeder] Inserting 14 new metrics',
            );
            expect(mockRaMetricsRepository.createMany).toHaveBeenCalledTimes(1);

            const insertedEntities: MetricsEntity[] =
                mockRaMetricsRepository.createMany.mock.calls[0][0];

            expect(insertedEntities).toHaveLength(14);
            insertedEntities.forEach((e) => expect(e).toBeInstanceOf(MetricsEntity));

            expect(mockLogger.info).toHaveBeenCalledWith(
                '[MetricsSeeder] Seeding completed successfully',
            );
            expect(mockLogger.error).not.toHaveBeenCalled();
        });

        it('should correctly map entities — with description', async () => {
            mockRaMetricsRepository.find.mockResolvedValue([]);
            mockRaMetricsRepository.createMany.mockResolvedValue(undefined);

            await seeder.seed();

            const inserted: MetricsEntity[] = mockRaMetricsRepository.createMany.mock.calls[0][0];

            const coc = inserted.find((e) => e.label === 'CoC');
            expect(coc).toBeDefined();
            expect(coc!.icon).toBe('coc');
            expect(coc!.description).toBe('Cash on cash');
        });

        it('should correctly map entities — without description (null)', async () => {
            mockRaMetricsRepository.find.mockResolvedValue([]);
            mockRaMetricsRepository.createMany.mockResolvedValue(undefined);

            await seeder.seed();

            const inserted: MetricsEntity[] = mockRaMetricsRepository.createMany.mock.calls[0][0];

            const roi = inserted.find((e) => e.label === 'ROI');
            expect(roi).toBeDefined();
            expect(roi!.icon).toBe('roi');
            expect(roi!.description).toBeNull();
        });
    });

    describe('when all metrics already exist in DB', () => {
        it('should not call createMany and log no new metrics', async () => {
            const existingMetrics = [
                { label: 'CoC', icon: 'coc', description: 'Cash on cash' },
                {
                    label: 'NOI',
                    icon: 'noi',
                    description: 'Net Operation Income',
                },
                { label: 'ROI', icon: 'roi', description: undefined },
                { label: 'GOI', icon: 'goi', description: undefined },
                {
                    label: 'OER',
                    icon: 'oer',
                    description: 'Operating Expense Ratio',
                },
                { label: 'Yearly Income', icon: 'y_i', description: undefined },
                {
                    label: 'GRM',
                    icon: 'grm',
                    description: 'Gross Rent Multiplier',
                },
                { label: 'BER', icon: 'er', description: undefined },
                {
                    label: 'AGM',
                    icon: 'arm',
                    description: 'Annual Gross Multiplier',
                },
                { label: 'Cap Rate', icon: 'caprate', description: undefined },
                {
                    label: 'Cash Flow',
                    icon: 'cash_flow',
                    description: undefined,
                },
                {
                    label: 'Playback Period',
                    icon: 'period',
                    description: undefined,
                },
                { label: 'DSCR', icon: 'dscr', description: undefined },
                {
                    label: 'Full Term Roi',
                    icon: 'm_roi',
                    description: undefined,
                },
            ];

            mockRaMetricsRepository.find.mockResolvedValue(existingMetrics);

            await seeder.seed();

            expect(mockLogger.info).toHaveBeenCalledWith(
                '[MetricsSeeder] Found 14 existing metrics',
            );
            expect(mockLogger.info).toHaveBeenCalledWith(
                '[MetricsSeeder] No new metrics to insert',
            );
            expect(mockRaMetricsRepository.createMany).not.toHaveBeenCalled();
            expect(mockLogger.error).not.toHaveBeenCalled();
        });
    });

    describe('when some metrics already exist in DB', () => {
        it('should insert only the missing metrics', async () => {
            const existingMetrics = [
                { label: 'CoC', icon: 'coc', description: 'Cash on cash' },
                {
                    label: 'NOI',
                    icon: 'noi',
                    description: 'Net Operation Income',
                },
            ];

            mockRaMetricsRepository.find.mockResolvedValue(existingMetrics);
            mockRaMetricsRepository.createMany.mockResolvedValue(undefined);

            await seeder.seed();

            const inserted: MetricsEntity[] = mockRaMetricsRepository.createMany.mock.calls[0][0];

            expect(inserted).toHaveLength(12);
            expect(inserted.find((e) => e.label === 'CoC')).toBeUndefined();
            expect(inserted.find((e) => e.label === 'NOI')).toBeUndefined();
            expect(inserted.find((e) => e.label === 'ROI')).toBeDefined();
        });

        it('should correctly build the deduplication key with whitespace trimming', async () => {
            const existingMetrics = [
                {
                    label: '  CoC  ',
                    icon: '  coc  ',
                    description: '  Cash on cash  ',
                },
            ];

            mockRaMetricsRepository.find.mockResolvedValue(existingMetrics);
            mockRaMetricsRepository.createMany.mockResolvedValue(undefined);

            await seeder.seed();

            const inserted: MetricsEntity[] = mockRaMetricsRepository.createMany.mock.calls[0][0];

            expect(inserted.find((e) => e.label === 'CoC')).toBeUndefined();
            expect(inserted).toHaveLength(13);
        });
    });

    describe('when createMany throws an error', () => {
        it('should log the error and rethrow it', async () => {
            mockRaMetricsRepository.find.mockResolvedValue([]);
            const dbError = new Error('DB connection failed');
            mockRaMetricsRepository.createMany.mockRejectedValue(dbError);

            await expect(seeder.seed()).rejects.toThrow('DB connection failed');

            expect(mockLogger.error).toHaveBeenCalledWith(
                '[MetricsSeeder] Failed to seed metrics',
                {
                    error: dbError,
                },
            );
            expect(mockLogger.info).not.toHaveBeenCalledWith(
                '[MetricsSeeder] Seeding completed successfully',
            );
        });
    });
});
