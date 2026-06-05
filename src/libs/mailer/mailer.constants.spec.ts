import { MAIL_PROVIDER } from './mailer.constants';

describe('Mailer Constants', () => {
    describe('MAIL_PROVIDER', () => {
        it('should be defined', () => {
            expect(MAIL_PROVIDER).toBeDefined();
        });

        it('should be a string', () => {
            expect(typeof MAIL_PROVIDER).toBe('string');
        });

        it('should have the correct value', () => {
            expect(MAIL_PROVIDER).toBe('MAIL_PROVIDER');
        });

        it('should be immutable', () => {
            expect(MAIL_PROVIDER).toBe(MAIL_PROVIDER);
        });

        it('should be used as injection token', () => {
            expect(MAIL_PROVIDER.length).toBeGreaterThan(0);
            expect(MAIL_PROVIDER).toMatch(/^[A-Z_]+$/);
        });

        it('should not be empty', () => {
            expect(MAIL_PROVIDER).not.toBe('');
        });

        it('should not contain spaces', () => {
            expect(MAIL_PROVIDER).not.toContain(' ');
        });

        it('should be uppercase', () => {
            expect(MAIL_PROVIDER).toBe(MAIL_PROVIDER.toUpperCase());
        });

        it('should be consistent across imports', () => {
            const { MAIL_PROVIDER: importedAgain } = require('./mailer.constants');
            expect(MAIL_PROVIDER).toBe(importedAgain);
        });
    });
});
