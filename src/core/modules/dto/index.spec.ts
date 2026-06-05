import 'reflect-metadata';
import * as indexExports from './index';
import {
    MRelationDto,
    ModuleUpdateDto,
    UpdateAllDto,
    PinStateDto,
    CreateMExportDto,
    UpdateMExportDto,
} from './index';

describe('Index barrel exports', () => {
    const expectedExports = [
        ['MRelationDto', MRelationDto],
        ['ModuleUpdateDto', ModuleUpdateDto],
        ['UpdateAllDto', UpdateAllDto],
        ['PinStateDto', PinStateDto],
        ['CreateMExportDto', CreateMExportDto],
        ['UpdateMExportDto', UpdateMExportDto],
    ] as const;

    it.each(expectedExports)('should re-export modules dto %s correctly', (name, originalEnum) => {
        expect(indexExports[name]).toBe(originalEnum);
    });

    it('should export all expected modules', () => {
        const exportNames = expectedExports.map(([name]) => name);
        exportNames.forEach((name) => {
            expect(indexExports).toHaveProperty(name);
        });
    });
});
