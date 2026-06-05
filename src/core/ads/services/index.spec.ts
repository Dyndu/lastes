import * as indexExports from './index';
import { PreAdsService, AdsService, AdsStatsService } from './index';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('Index barrel exports', () => {
    const expectedExports = [
        ['PreAdsService', PreAdsService],
        ['AdsService', AdsService],
        ['AdsStatsService', AdsStatsService],
    ] as const;

    it.each(expectedExports)(
        'should re-export ads service dto %s correctly',
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
