import * as indexExports from './index';
import { SmtpMailerService, MailerService, SendGridMailerService } from './index';

describe('Index barrel exports', () => {
    const expectedExports = [
        ['SmtpMailerService', SmtpMailerService],
        ['MailerService', MailerService],
        ['SendGridMailerService', SendGridMailerService],
    ] as const;

    it.each(expectedExports)(
        'should re-export mail services %s correctly',
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
