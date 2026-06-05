import 'reflect-metadata';
import * as indexExports from './index';
import { GuideEntity, GuidesStatsEntity, UserGuideLikeEntity } from './index';

describe('Index barrel exports', () => {
    const expectedExports = [
        ['GuideEntity', GuideEntity],
        ['GuidesStatsEntity', GuidesStatsEntity],
        ['UserGuideLikeEntity', UserGuideLikeEntity],
    ] as const;

    it.each(expectedExports)(
        'should re-export guide entities %s correctly',
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
