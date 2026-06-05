import * as indexExports from './index';
import {
    SMetricService,
    PreSettingsService,
    PSettingsService,
    TransformPSettingService,
    MetricsService,
} from './index';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('Index barrel exports', () => {
    const expectedExports = [
        ['SMetricService', SMetricService],
        ['PSettingsService', PSettingsService],
        ['PreSettingsService', PreSettingsService],
        ['TransformPSettingService', TransformPSettingService],
        ['MetricsService', MetricsService],
    ] as const;

    it.each(expectedExports)(
        'should re-export settings services %s correctly',
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
