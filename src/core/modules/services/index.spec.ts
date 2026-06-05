import 'reflect-metadata';
import * as indexExports from './index';
import {
    ModulesService,
    MUseService,
    MFeatureService,
    MHeaderService,
    PreModuleService,
    MUsersService,
    MTransformService,
    MExportService,
} from './index';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('Index barrel exports', () => {
    const expectedExports = [
        ['ModulesService', ModulesService],
        ['MUseService', MUseService],
        ['MFeatureService', MFeatureService],
        ['MHeaderService', MHeaderService],
        ['PreModuleService', PreModuleService],
        ['MUsersService', MUsersService],
        ['MTransformService', MTransformService],
        ['MExportService', MExportService],
    ] as const;

    it.each(expectedExports)(
        'should re-export modules services %s correctly',
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
