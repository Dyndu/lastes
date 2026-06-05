import * as indexExports from './index';
import { SAdminConRepository, SConRepository, SMessagesRepository } from './index';

describe('Index barrel exports', () => {
    const expectedExports = [
        ['SAdminConRepository', SAdminConRepository],
        ['SConRepository', SConRepository],
        ['SMessagesRepository', SMessagesRepository],
    ] as const;

    it.each(expectedExports)(
        'should re-export support repositories %s correctly',
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
