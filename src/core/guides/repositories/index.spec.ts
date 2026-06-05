import 'reflect-metadata';
import * as indexExports from './index';
import { GuidesRepository, GuidesStatsRepository, UserGuideLikeRepository } from './index';

describe('Index barrel exports', () => {
    const expectedExports = [
        ['GuidesRepository', GuidesRepository],
        ['GuidesStatsRepository', GuidesStatsRepository],
        ['UserGuideLikeRepository', UserGuideLikeRepository],
    ] as const;

    it.each(expectedExports)(
        'should re-export guide repositories %s correctly',
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
