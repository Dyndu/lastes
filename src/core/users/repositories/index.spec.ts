import * as indexExports from './index';
import { ResetPasswordRequestRepository, UsersCodeRepository, UsersRepository } from './index';

describe('Index barrel exports', () => {
    const expectedExports = [
        ['ResetPasswordRequestRepository', ResetPasswordRequestRepository],
        ['UsersCodeRepository', UsersCodeRepository],
        ['UsersRepository', UsersRepository],
    ] as const;

    it.each(expectedExports)(
        'should re-export user repositories %s correctly',
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
