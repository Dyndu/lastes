import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';
import { PSettingsService } from './p-settings.service';
import { MetricsEntity } from '../entities';
import { In } from 'typeorm';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('MetricsService', () => {
    let service: MetricsService;

    const mockPSettingsService = {
        logger: {
            info: jest.fn(),
        },
        errorHandler: {
            notFound: jest.fn((_message: string, userMessage: string) => {
                throw new Error(userMessage);
            }),
        },
        metricsRepository: {
            find: jest.fn(),
        },
        transformPSettingService: {
            transformMetrics: jest.fn(),
        },
    };

    const buildMetric = (id: string): MetricsEntity => ({ id }) as MetricsEntity;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MetricsService,
                {
                    provide: PSettingsService,
                    useValue: mockPSettingsService,
                },
            ],
        }).compile();

        service = module.get<MetricsService>(MetricsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('retrieveMetrics', () => {
        it('should log the retrieval attempt with the provided ids', async () => {
            const ids = ['m1', 'm2'];
            mockPSettingsService.metricsRepository.find.mockResolvedValue(ids.map(buildMetric));

            await service.retrieveMetrics(ids);

            expect(mockPSettingsService.logger.info).toHaveBeenCalledWith(
                'Retrieve metrics with ids m1, m2',
            );
        });

        it('should call find with correct where clause using In and deleted=false', async () => {
            const ids = ['m1', 'm2'];
            mockPSettingsService.metricsRepository.find.mockResolvedValue(ids.map(buildMetric));

            await service.retrieveMetrics(ids);

            expect(mockPSettingsService.metricsRepository.find).toHaveBeenCalledWith({
                where: { id: In(ids), deleted: false },
            });
        });

        it('should return the metrics when all ids are found', async () => {
            const ids = ['m1', 'm2'];
            const metrics = ids.map(buildMetric);
            mockPSettingsService.metricsRepository.find.mockResolvedValue(metrics);

            const result = await service.retrieveMetrics(ids);

            expect(result).toEqual(metrics);
        });

        it('should throw notFound when retrieved count differs from requested ids count', async () => {
            const ids = ['m1', 'm2', 'm3'];
            mockPSettingsService.metricsRepository.find.mockResolvedValue([buildMetric('m1')]);

            await expect(service.retrieveMetrics(ids)).rejects.toThrow('Metrics not found');

            expect(mockPSettingsService.errorHandler.notFound).toHaveBeenCalledWith(
                'Metrics found length 1 is different from provided ids 3',
                'Metrics not found',
            );
        });

        it('should include correct lengths in the notFound internal message', async () => {
            const ids = ['m1', 'm2'];
            mockPSettingsService.metricsRepository.find.mockResolvedValue([]);

            try {
                await service.retrieveMetrics(ids);
            } catch {}

            expect(mockPSettingsService.errorHandler.notFound).toHaveBeenCalledWith(
                expect.stringContaining('0'),
                expect.any(String),
            );
            expect(mockPSettingsService.errorHandler.notFound).toHaveBeenCalledWith(
                expect.stringContaining('2'),
                expect.any(String),
            );
        });

        it('should not throw when a single id is found', async () => {
            const ids = ['m1'];
            mockPSettingsService.metricsRepository.find.mockResolvedValue([buildMetric('m1')]);

            await expect(service.retrieveMetrics(ids)).resolves.not.toThrow();
        });

        it('should log with empty string when ids array is empty', async () => {
            mockPSettingsService.metricsRepository.find.mockResolvedValue([]);

            await service.retrieveMetrics([]);

            expect(mockPSettingsService.logger.info).toHaveBeenCalledWith(
                'Retrieve metrics with ids ',
            );
        });

        it('should not call notFound when ids is empty and find returns empty', async () => {
            mockPSettingsService.metricsRepository.find.mockResolvedValue([]);

            await service.retrieveMetrics([]);

            expect(mockPSettingsService.errorHandler.notFound).not.toHaveBeenCalled();
        });
    });

    describe('getAllMetrics', () => {
        it('should log the retrieval attempt', async () => {
            const metrics = [buildMetric('m1'), buildMetric('m2')];
            mockPSettingsService.metricsRepository.find.mockResolvedValue(metrics);
            mockPSettingsService.transformPSettingService.transformMetrics.mockReturnValue(metrics);

            await service.getAllMetrics();

            expect(mockPSettingsService.logger.info).toHaveBeenCalledWith(
                'Get all non deleted metrics',
            );
        });

        it('should call find with deleted=false', async () => {
            const metrics = [buildMetric('m1')];
            mockPSettingsService.metricsRepository.find.mockResolvedValue(metrics);
            mockPSettingsService.transformPSettingService.transformMetrics.mockReturnValue(metrics);

            await service.getAllMetrics();

            expect(mockPSettingsService.metricsRepository.find).toHaveBeenCalledWith({
                where: { deleted: false },
            });
        });

        it('should call transformMetrics with the retrieved metrics', async () => {
            const metrics = [buildMetric('m1'), buildMetric('m2')];
            mockPSettingsService.metricsRepository.find.mockResolvedValue(metrics);
            mockPSettingsService.transformPSettingService.transformMetrics.mockReturnValue(metrics);

            await service.getAllMetrics();

            expect(
                mockPSettingsService.transformPSettingService.transformMetrics,
            ).toHaveBeenCalledWith(metrics);
        });

        it('should return the transformed metrics', async () => {
            const metrics = [buildMetric('m1')];
            const transformed = [{ id: 'm1', transformed: true }];
            mockPSettingsService.metricsRepository.find.mockResolvedValue(metrics);
            mockPSettingsService.transformPSettingService.transformMetrics.mockReturnValue(
                transformed,
            );

            const result = await service.getAllMetrics();

            expect(result).toEqual(transformed);
        });

        it('should return empty array when no metrics exist', async () => {
            mockPSettingsService.metricsRepository.find.mockResolvedValue([]);
            mockPSettingsService.transformPSettingService.transformMetrics.mockReturnValue([]);

            const result = await service.getAllMetrics();

            expect(result).toEqual([]);
        });
    });
});
