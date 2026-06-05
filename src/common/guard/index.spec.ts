import * as indexExports from './index';
import {
    JwtAuthGuard,
    GoogleOAuthGuard,
    GoogleStrategy,
    GuardModule,
    JwtStrategy,
    PermissionsGuard,
    SubscriptionGuard,
} from './index';

describe('Index barrel exports', () => {
    const expectedExports = [
        ['JwtAuthGuard', JwtAuthGuard],
        ['GoogleOAuthGuard', GoogleOAuthGuard],
        ['GoogleStrategy', GoogleStrategy],
        ['GuardModule', GuardModule],
        ['JwtStrategy', JwtStrategy],
        ['PermissionsGuard', PermissionsGuard],
        ['SubscriptionGuard', SubscriptionGuard],
    ] as const;

    it.each(expectedExports)('should re-export guards %s correctly', (name, originalEnum) => {
        expect(indexExports[name]).toBe(originalEnum);
    });

    it('should export all expected modules', () => {
        const exportNames = expectedExports.map(([name]) => name);
        exportNames.forEach((name) => {
            expect(indexExports).toHaveProperty(name);
        });
    });
});
