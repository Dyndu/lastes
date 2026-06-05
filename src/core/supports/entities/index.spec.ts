import * as indexExports from './index';
import { SAdminConEntity, SConEntity, SMessagesEntity } from './index';

describe('Index barrel exports', () => {
    const expectedExports = [
        ['SAdminConEntity', SAdminConEntity],
        ['SConEntity', SConEntity],
        ['SMessagesEntity', SMessagesEntity],
    ] as const;

    it.each(expectedExports)(
        'should re-export support entities %s correctly',
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
