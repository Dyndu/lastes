import * as indexExports from './index';
import {
    PasswordChangeDto,
    PasswordResetDto,
    UserRegisterDto,
    VerifyUserCodeDto,
    UserLoginDto,
    AdminRegisterDto,
    UserUpdateDto,
    AdminUserUpdateBySDto,
} from './index';

describe('Index barrel exports', () => {
    const expectedExports = [
        ['PasswordChangeDto', PasswordChangeDto],
        ['PasswordResetDto', PasswordResetDto],
        ['UserRegisterDto', UserRegisterDto],
        ['VerifyUserCodeDto', VerifyUserCodeDto],
        ['UserLoginDto', UserLoginDto],
        ['AdminRegisterDto', AdminRegisterDto],
        ['UserUpdateDto', UserUpdateDto],
        ['AdminUserUpdateBySDto', AdminUserUpdateBySDto],
    ] as const;

    it.each(expectedExports)('should re-export user dto %s correctly', (name, originalEnum) => {
        expect(indexExports[name]).toBe(originalEnum);
    });

    it('should export all expected modules', () => {
        const exportNames = expectedExports.map(([name]) => name);
        exportNames.forEach((name) => {
            expect(indexExports).toHaveProperty(name);
        });
    });
});
