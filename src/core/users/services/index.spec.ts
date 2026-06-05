import * as indexExports from './index';
import {
    PreUserService,
    UserCodeService,
    ResetPasswordRequestService,
    UsersService,
    UsersEntityTransformService,
    UsersRelationsService,
    UserEmailSendingService,
} from './index';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('Index barrel exports', () => {
    const expectedExports = [
        ['PreUserService', PreUserService],
        ['UserCodeService', UserCodeService],
        ['ResetPasswordRequestService', ResetPasswordRequestService],
        ['UsersService', UsersService],
        ['UsersEntityTransformService', UsersEntityTransformService],
        ['UsersRelationsService', UsersRelationsService],
        ['UserEmailSendingService', UserEmailSendingService],
    ] as const;

    it.each(expectedExports)(
        'should re-export user services %s correctly',
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
