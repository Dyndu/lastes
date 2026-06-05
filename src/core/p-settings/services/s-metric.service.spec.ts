import { Test, TestingModule } from '@nestjs/testing';
import { SMetricService } from './s-metric.service';
import { PSettingsService } from './p-settings.service';
import { PSettingEntity, MetricsEntity, SMetricEntity } from '../entities';
import { In } from 'typeorm';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('SMetricService', () => {
    let service: SMetricService;

    const mockPSettingsService = {
        errorHandler: {
            forbidden: jest.fn((_message: string, userMessage: string) => {
                throw new Error(userMessage);
            }),
        },
        sMetricRepository: {
            find: jest.fn(),
            createMany: jest.fn(),
            delete: jest.fn(),
        },
    };

    const buildProfile = (id = 'profile-1'): PSettingEntity => ({ id }) as PSettingEntity;

    const buildMetric = (id: string): MetricsEntity => ({ id }) as MetricsEntity;

    const buildSMetric = (metricId: string, id = `sm-${metricId}`): SMetricEntity =>
        ({
            id,
            metric: buildMetric(metricId),
            deleted: false,
        }) as SMetricEntity;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SMetricService,
                {
                    provide: PSettingsService,
                    useValue: mockPSettingsService,
                },
            ],
        }).compile();

        service = module.get<SMetricService>(SMetricService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('buildSMetricEntity', () => {
        it('should return an instance of SMetricEntity', () => {
            const result = service.buildSMetricEntity(buildMetric('m1'), buildProfile());
            expect(result).toBeInstanceOf(SMetricEntity);
        });

        it('should assign metric and setting correctly', () => {
            const metric = buildMetric('m1');
            const setting = buildProfile('p1');
            const result = service.buildSMetricEntity(metric, setting);
            expect(result.metric).toBe(metric);
            expect(result.setting).toBe(setting);
        });

        it('should return a new instance on each call', () => {
            const metric = buildMetric('m1');
            const setting = buildProfile('p1');
            const r1 = service.buildSMetricEntity(metric, setting);
            const r2 = service.buildSMetricEntity(metric, setting);
            expect(r1).not.toBe(r2);
        });
    });

    describe('assertMetricLimit', () => {
        it('should not throw when length equals the max limit (5)', () => {
            expect(() => service.assertMetricLimit(buildProfile(), 5)).not.toThrow();
            expect(mockPSettingsService.errorHandler.forbidden).not.toHaveBeenCalled();
        });

        it('should not throw when length is below the max limit', () => {
            expect(() => service.assertMetricLimit(buildProfile(), 3)).not.toThrow();
        });

        it('should throw when length exceeds the max limit (6)', () => {
            const profile = buildProfile('p1');
            expect(() => service.assertMetricLimit(profile, 6)).toThrow(
                'A profile cannot have more than 5 metrics.',
            );
            expect(mockPSettingsService.errorHandler.forbidden).toHaveBeenCalledWith(
                `[MetricLimitExceeded] Profile p1 attempted update with 6 metrics (max: 5)`,
                'A profile cannot have more than 5 metrics.',
            );
        });

        it('should include profile id and length in the internal error message', () => {
            const profile = buildProfile('special-id');
            try {
                service.assertMetricLimit(profile, 10);
            } catch {}
            expect(mockPSettingsService.errorHandler.forbidden).toHaveBeenCalledWith(
                expect.stringContaining('special-id'),
                expect.any(String),
            );
            expect(mockPSettingsService.errorHandler.forbidden).toHaveBeenCalledWith(
                expect.stringContaining('10'),
                expect.any(String),
            );
        });
    });

    describe('getExistingMetrics', () => {
        it('should call find with correct where and relations', async () => {
            mockPSettingsService.sMetricRepository.find.mockResolvedValue([]);

            await service.getExistingMetrics('profile-1');

            expect(mockPSettingsService.sMetricRepository.find).toHaveBeenCalledWith({
                where: { setting: { id: 'profile-1' }, deleted: false },
                relations: ['metric'],
            });
        });

        it('should return the array from the repository', async () => {
            const metrics = [buildSMetric('m1'), buildSMetric('m2')];
            mockPSettingsService.sMetricRepository.find.mockResolvedValue(metrics);

            const result = await service.getExistingMetrics('profile-1');

            expect(result).toEqual(metrics);
        });

        it('should return empty array when no metrics exist', async () => {
            mockPSettingsService.sMetricRepository.find.mockResolvedValue([]);

            const result = await service.getExistingMetrics('profile-1');

            expect(result).toEqual([]);
        });
    });

    describe('createSMetrics', () => {
        it('should call createMany with correctly built SMetricEntities', async () => {
            const profile = buildProfile('p1');
            const metrics = [buildMetric('m1'), buildMetric('m2')];
            const created = [buildSMetric('m1'), buildSMetric('m2')];
            mockPSettingsService.sMetricRepository.createMany.mockResolvedValue(created);

            const result = await service.createSMetrics(profile, metrics);

            const callArg = mockPSettingsService.sMetricRepository.createMany.mock.calls[0][0];
            expect(callArg).toHaveLength(2);
            expect(callArg[0]).toBeInstanceOf(SMetricEntity);
            expect(callArg[0].metric).toBe(metrics[0]);
            expect(callArg[0].setting).toBe(profile);
            expect(callArg[1].metric).toBe(metrics[1]);
            expect(callArg[1].setting).toBe(profile);
            expect(result).toEqual(created);
        });

        it('should return empty array when metrics list is empty', async () => {
            mockPSettingsService.sMetricRepository.createMany.mockResolvedValue([]);

            const result = await service.createSMetrics(buildProfile(), []);

            expect(mockPSettingsService.sMetricRepository.createMany).toHaveBeenCalledWith([]);
            expect(result).toEqual([]);
        });
    });

    describe('computeMetricDiffForUpdate', () => {
        it('should return toAdd with new metrics and empty toRemove when no existing', async () => {
            const profile = buildProfile('p1');
            const incoming = [buildMetric('m1'), buildMetric('m2')];
            mockPSettingsService.sMetricRepository.find.mockResolvedValue([]);

            const result = await service.computeMetricDiffForUpdate(profile, incoming);

            expect(result.toAdd).toEqual(incoming);
            expect(result.toRemove).toEqual([]);
        });

        it('should return empty toAdd and toRemove when existing and incoming are identical', async () => {
            const profile = buildProfile('p1');
            const existing = [buildSMetric('m1'), buildSMetric('m2')];
            const incoming = [buildMetric('m1'), buildMetric('m2')];
            mockPSettingsService.sMetricRepository.find.mockResolvedValue(existing);

            const result = await service.computeMetricDiffForUpdate(profile, incoming);

            expect(result.toAdd).toEqual([]);
            expect(result.toRemove).toEqual([]);
        });

        it('should return toRemove with metrics no longer in incoming list', async () => {
            const profile = buildProfile('p1');
            const existing = [buildSMetric('m1'), buildSMetric('m2')];
            const incoming = [buildMetric('m1')];
            mockPSettingsService.sMetricRepository.find.mockResolvedValue(existing);

            const result = await service.computeMetricDiffForUpdate(profile, incoming);

            expect(result.toAdd).toEqual([]);
            expect(result.toRemove).toEqual([existing[1]]);
        });

        it('should deduplicate incoming metrics by id', async () => {
            const profile = buildProfile('p1');
            const m1 = buildMetric('m1');
            const incoming = [m1, m1, buildMetric('m1')];
            mockPSettingsService.sMetricRepository.find.mockResolvedValue([]);

            const result = await service.computeMetricDiffForUpdate(profile, incoming);

            expect(result.toAdd).toHaveLength(1);
            expect(result.toAdd[0].id).toBe('m1');
        });

        it('should throw when deduplicated incoming exceeds limit of 5', async () => {
            const profile = buildProfile('p1');
            const incoming = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'].map(buildMetric);
            mockPSettingsService.sMetricRepository.find.mockResolvedValue([]);

            await expect(service.computeMetricDiffForUpdate(profile, incoming)).rejects.toThrow(
                'A profile cannot have more than 5 metrics.',
            );
        });

        it('should not throw when deduplicated incoming is exactly 5', async () => {
            const profile = buildProfile('p1');
            const incoming = ['m1', 'm2', 'm3', 'm4', 'm5'].map(buildMetric);
            mockPSettingsService.sMetricRepository.find.mockResolvedValue([]);

            await expect(
                service.computeMetricDiffForUpdate(profile, incoming),
            ).resolves.not.toThrow();
        });

        it('should correctly separate toAdd and toRemove in a mixed scenario', async () => {
            const profile = buildProfile('p1');
            const existing = [buildSMetric('m1'), buildSMetric('m2')];
            const incoming = [buildMetric('m2'), buildMetric('m3')];
            mockPSettingsService.sMetricRepository.find.mockResolvedValue(existing);

            const result = await service.computeMetricDiffForUpdate(profile, incoming);

            expect(result.toAdd).toHaveLength(1);
            expect(result.toAdd[0].id).toBe('m3');
            expect(result.toRemove).toHaveLength(1);
            expect(result.toRemove[0].metric.id).toBe('m1');
        });
    });

    describe('syncProfileMetrics', () => {
        it('should delete toRemove and create toAdd', async () => {
            const profile = buildProfile('p1');
            const existing = [buildSMetric('m1'), buildSMetric('m2')];
            const incoming = [buildMetric('m2'), buildMetric('m3')];
            const created = [buildSMetric('m3')];

            mockPSettingsService.sMetricRepository.find.mockResolvedValue(existing);
            mockPSettingsService.sMetricRepository.delete.mockResolvedValue(undefined);
            mockPSettingsService.sMetricRepository.createMany.mockResolvedValue(created);

            const result = await service.syncProfileMetrics(profile, incoming);

            expect(mockPSettingsService.sMetricRepository.delete).toHaveBeenCalledWith({
                id: In([existing[0].id]),
            });
            expect(mockPSettingsService.sMetricRepository.createMany).toHaveBeenCalled();
            expect(result).toEqual(created);
        });

        it('should not call delete when toRemove is empty', async () => {
            const profile = buildProfile('p1');
            const incoming = [buildMetric('m1')];

            mockPSettingsService.sMetricRepository.find.mockResolvedValue([]);
            mockPSettingsService.sMetricRepository.createMany.mockResolvedValue([
                buildSMetric('m1'),
            ]);

            await service.syncProfileMetrics(profile, incoming);

            expect(mockPSettingsService.sMetricRepository.delete).not.toHaveBeenCalled();
        });

        it('should not call createMany when toAdd is empty', async () => {
            const profile = buildProfile('p1');
            const existing = [buildSMetric('m1')];
            const incoming = [];

            mockPSettingsService.sMetricRepository.find.mockResolvedValue(existing);
            mockPSettingsService.sMetricRepository.delete.mockResolvedValue(undefined);

            await service.syncProfileMetrics(profile, incoming);

            expect(mockPSettingsService.sMetricRepository.createMany).not.toHaveBeenCalled();
        });

        it('should return empty array when nothing to add', async () => {
            const profile = buildProfile('p1');
            const existing = [buildSMetric('m1')];

            mockPSettingsService.sMetricRepository.find.mockResolvedValue(existing);
            mockPSettingsService.sMetricRepository.delete.mockResolvedValue(undefined);

            const result = await service.syncProfileMetrics(profile, []);

            expect(result).toEqual([]);
        });

        it('should delete all existing and create all incoming when completely different', async () => {
            const profile = buildProfile('p1');
            const existing = [buildSMetric('m1'), buildSMetric('m2')];
            const incoming = [buildMetric('m3'), buildMetric('m4')];
            const created = [buildSMetric('m3'), buildSMetric('m4')];

            mockPSettingsService.sMetricRepository.find.mockResolvedValue(existing);
            mockPSettingsService.sMetricRepository.delete.mockResolvedValue(undefined);
            mockPSettingsService.sMetricRepository.createMany.mockResolvedValue(created);

            const result = await service.syncProfileMetrics(profile, incoming);

            expect(mockPSettingsService.sMetricRepository.delete).toHaveBeenCalledWith({
                id: In([existing[0].id, existing[1].id]),
            });
            expect(result).toEqual(created);
        });

        it('should not call delete or createMany when existing and incoming are identical', async () => {
            const profile = buildProfile('p1');
            const existing = [buildSMetric('m1')];
            const incoming = [buildMetric('m1')];

            mockPSettingsService.sMetricRepository.find.mockResolvedValue(existing);

            const result = await service.syncProfileMetrics(profile, incoming);

            expect(mockPSettingsService.sMetricRepository.delete).not.toHaveBeenCalled();
            expect(mockPSettingsService.sMetricRepository.createMany).not.toHaveBeenCalled();
            expect(result).toEqual([]);
        });
    });
});
