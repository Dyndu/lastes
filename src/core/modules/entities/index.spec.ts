import 'reflect-metadata';
import * as indexExports from './index';
import {
    ModuleEntity,
    MFeatureEntity,
    MUseEntity,
    MHeaderEntity,
    MUsersEntity,
    MExportEntity,
} from './index';

describe('Index barrel exports', () => {
    const expectedExports = [
        ['ModuleEntity', ModuleEntity],
        ['MFeatureEntity', MFeatureEntity],
        ['MUseEntity', MUseEntity],
        ['MHeaderEntity', MHeaderEntity],
        ['MUsersEntity', MUsersEntity],
        ['MExportEntity', MExportEntity],
    ] as const;

    it.each(expectedExports)(
        'should re-export modules entities %s correctly',
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
