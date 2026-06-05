import * as indexExports from './index';
import { SMetricEntity, PSettingEntity, MetricsEntity } from './index';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('Index barrel exports', () => {
    const expectedExports = [
        ['SMetricEntity', SMetricEntity],
        ['PSettingEntity', PSettingEntity],
        ['MetricsEntity', MetricsEntity],
    ] as const;

    it.each(expectedExports)(
        'should re-export settings entities %s correctly',
        (name, originalEnum) => {
            expect(indexExports[name]).toBe(originalEnum);
        },
    );

    it('should export all expected modules', () => {
        const exportNames = expectedExports.map(([name]) => name);
        exportNames.forEach((name) => {
            expect(indexExports).toHaveProperty(name);
        });
    });
});
