import * as indexExports from './index';
import { CreateAdsDto, UpdateAdsDto, ReuseAdsDto, CalendarAdsDto } from './index';

describe('Index barrel exports', () => {
    const expectedExports = [
        ['CreateAdsDto', CreateAdsDto],
        ['UpdateAdsDto', UpdateAdsDto],
        ['ReuseAdsDto', ReuseAdsDto],
        ['CalendarAdsDto', CalendarAdsDto],
    ] as const;

    it.each(expectedExports)('should re-export ads dto %s correctly', (name, originalEnum) => {
        expect(indexExports[name]).toBe(originalEnum);
    });

    it('should export all expected modules', () => {
        const exportNames = expectedExports.map(([name]) => name);
        exportNames.forEach((name) => {
            expect(indexExports).toHaveProperty(name);
        });
    });
});
