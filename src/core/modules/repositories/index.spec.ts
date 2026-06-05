import 'reflect-metadata';
import * as indexExports from './index';
import {
    ModulesRepository,
    MUsersRepository,
    MFeatureRepository,
    MUseRepository,
    MHeaderRepository,
    MExportRepository,
} from './index';

describe('Index barrel exports', () => {
    const expectedExports = [
        ['ModulesRepository', ModulesRepository],
        ['MUsersRepository', MUsersRepository],
        ['MFeatureRepository', MFeatureRepository],
        ['MUseRepository', MUseRepository],
        ['MHeaderRepository', MHeaderRepository],
        ['MExportRepository', MExportRepository],
    ] as const;

    it.each(expectedExports)(
        'should re-export modules repositories %s correctly',
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
