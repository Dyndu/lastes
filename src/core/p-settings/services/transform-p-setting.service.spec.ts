import { MetricsEntity, PSettingEntity } from '../entities';
import { TransformPSettingService } from './transform-p-setting.service';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('TransformPSettingService', () => {
    let service: TransformPSettingService;

    beforeEach(() => {
        service = new TransformPSettingService();
    });

    describe('createdBy', () => {
        it('should return the createdBy relation', () => {
            expect(service.createdBy()).toEqual(['createdBy']);
        });
    });

    describe('profileEntities', () => {
        it('should return the metrics eager-load relations', () => {
            expect(service.profileEntities()).toEqual(['metrics', 'metrics.metric']);
        });
    });

    describe('updateSettingEntities', () => {
        it('should return the update relations including createdBy and metrics', () => {
            expect(service.updateSettingEntities()).toEqual([
                'createdBy',
                'metrics',
                'metrics.metric',
            ]);
        });
    });

    describe('transformMetric', () => {
        it('should transform a MetricsEntity into a simplified object', () => {
            const metric = {
                id: '1',
                label: 'Cap Rate',
                icon: 'chart-bar',
                description: 'Capitalization rate',
            } as MetricsEntity;

            expect(service.transformMetric(metric)).toEqual({
                id: '1',
                label: 'Cap Rate',
                icon: 'chart-bar',
                description: 'Capitalization rate',
            });
        });

        it('should only expose id, label, icon, and description (no extra fields)', () => {
            const metric = {
                id: '2',
                label: 'NOI',
                icon: 'dollar',
                description: 'Net Operating Income',
                someExtraField: 'should not appear',
            } as unknown as MetricsEntity;

            const result = service.transformMetric(metric);
            expect(Object.keys(result)).toEqual(['id', 'label', 'icon', 'description']);
        });
    });

    describe('transformMetrics', () => {
        it('should transform an array of MetricsEntity objects', () => {
            const metrics = [
                { id: '1', label: 'A', icon: 'icon-a', description: 'Desc A' },
                { id: '2', label: 'B', icon: 'icon-b', description: 'Desc B' },
            ] as MetricsEntity[];

            expect(service.transformMetrics(metrics)).toEqual([
                { id: '1', label: 'A', icon: 'icon-a', description: 'Desc A' },
                { id: '2', label: 'B', icon: 'icon-b', description: 'Desc B' },
            ]);
        });

        it('should return an empty array when given an empty array', () => {
            expect(service.transformMetrics([])).toEqual([]);
        });
    });

    describe('transformProfile', () => {
        const buildProfile = (overrides: Partial<PSettingEntity> = {}): PSettingEntity =>
            ({
                id: 'p1',
                label: 'Default Profile',
                isDefault: true,
                taxRate: 1.5,
                occupancyRate: 95,
                managementFees: 10,
                maintenanceEscrow: 5,
                cashReserves: 3,
                capRate: 8,
                goi: 12000,
                noi: 10000,
                ber: 0.5,
                oer: 0.4,
                dscr: 1.2,
                grm: 120,
                agm: 200,
                coc: 0.08,
                cashFlow: 500,
                fTermRoi: 0.15,
                yearlyIncome: 6000,
                roi: 0.12,
                payBackPeriod: 8,
                onePercent: true,
                twoPercent: false,
                fiftyPercent: true,
                cashFlowAtLeast: 100,
                cashNeeded: 20000,
                metrics: [],
                ...overrides,
            }) as unknown as PSettingEntity;

        it('should transform a profile with no metrics', () => {
            const profile = buildProfile({ metrics: [] });
            const result = service.transformProfile(profile);

            expect(result.id).toBe('p1');
            expect(result.label).toBe('Default Profile');
            expect(result.isDefault).toBe(true);
            expect(result.taxRate).toBe(1.5);
            expect(result.capRate).toBe(8);
            expect(result.gmr).toBe(120);
            expect(result.metrics).toEqual([]);
        });

        it('should transform a profile with metrics', () => {
            const metricEntity = {
                id: 'm1',
                label: 'Cap Rate',
                icon: 'chart',
                description: 'Cap rate desc',
            } as MetricsEntity;

            const profile = buildProfile({
                metrics: [{ metric: metricEntity }] as any,
            });

            const result = service.transformProfile(profile);
            expect(result.metrics).toEqual([
                {
                    id: 'm1',
                    label: 'Cap Rate',
                    icon: 'chart',
                    description: 'Cap rate desc',
                },
            ]);
        });

        it('should return empty metrics array when metrics is undefined', () => {
            const profile = buildProfile({ metrics: undefined as any });
            const result = service.transformProfile(profile);
            expect(result.metrics).toEqual([]);
        });

        it('should map all financial fields correctly, including grm → gmr rename', () => {
            const profile = buildProfile();
            const result = service.transformProfile(profile);

            expect(result).toMatchObject({
                id: 'p1',
                label: 'Default Profile',
                isDefault: true,
                taxRate: 1.5,
                occupancyRate: 95,
                managementFees: 10,
                maintenanceEscrow: 5,
                cashReserves: 3,
                capRate: 8,
                goi: 12000,
                noi: 10000,
                ber: 0.5,
                oer: 0.4,
                dscr: 1.2,
                gmr: 120,
                agm: 200,
                coc: 0.08,
                cashFlow: 500,
                fTermRoi: 0.15,
                yearlyIncome: 6000,
                roi: 0.12,
                payBackPeriod: 8,
                onePercent: true,
                twoPercent: false,
                fiftyPercent: true,
                cashFlowAtLeast: 100,
                cashNeeded: 20000,
            });
        });

        it('should not expose a grm key in the result (renamed to gmr)', () => {
            const profile = buildProfile();
            const result = service.transformProfile(profile);
            expect(result).not.toHaveProperty('grm');
        });
    });

    describe('transformPSettingAll', () => {
        it('should return only id, label, and isDefault', () => {
            const profile = {
                id: 'p1',
                label: 'My Profile',
                isDefault: false,
                taxRate: 25,
                capRate: 8,
            } as unknown as PSettingEntity;

            const result = service.transformPSettingAll(profile);

            expect(result).toEqual({
                id: 'p1',
                label: 'My Profile',
                isDefault: false,
            });
            expect(Object.keys(result)).toEqual(['id', 'label', 'isDefault']);
        });
    });

    describe('transformProfiles', () => {
        it('should transform an array of profiles using transformPSettingAll', () => {
            const profiles = [
                { id: 'p1', label: 'Profile 1', isDefault: true, taxRate: 10 },
                { id: 'p2', label: 'Profile 2', isDefault: false, taxRate: 20 },
            ] as unknown as PSettingEntity[];

            const results = service.transformProfiles(profiles);

            expect(results).toHaveLength(2);
            expect(results[0]).toEqual({
                id: 'p1',
                label: 'Profile 1',
                isDefault: true,
            });
            expect(results[1]).toEqual({
                id: 'p2',
                label: 'Profile 2',
                isDefault: false,
            });
            expect(results[0]).not.toHaveProperty('taxRate');
        });

        it('should return an empty array when given an empty array', () => {
            expect(service.transformProfiles([])).toEqual([]);
        });
    });
});
