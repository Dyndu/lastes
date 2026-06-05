import * as indexExports from './index';
import { PreNotificationsService, NotificationsService, NUsersService } from './index';

describe('Index barrel exports', () => {
    const expectedExports = [
        ['PreNotificationsService', PreNotificationsService],
        ['NotificationsService', NotificationsService],
        ['NUsersService', NUsersService],
    ] as const;

    it.each(expectedExports)(
        'should re-export notification services %s correctly',
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
