import 'reflect-metadata';
import * as indexExports from './index';
import { PaginationDto, FieldDto, UuidsArrayDto, EmailDto } from './index';

describe('Index barrel exports', () => {
    const expectedExports = [
        ['PaginationDto', PaginationDto],
        ['FieldDto', FieldDto],
        ['UuidsArrayDto', UuidsArrayDto],
        ['EmailDto', EmailDto],
    ] as const;

    it.each(expectedExports)('should re-export default dto %s correctly', (name, originalEnum) => {
        expect(indexExports[name]).toBe(originalEnum);
    });

    it('should export all expected modules', () => {
        const exportNames = expectedExports.map(([name]) => name);
        exportNames.forEach((name) => {
            expect(indexExports).toHaveProperty(name);
        });
    });
});
