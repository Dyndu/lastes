import { NewsletterSendModeEnum } from './newsletter-send-mode.enum';

describe('NewsletterSendModeEnum Enum', () => {
    const expectedEntries = Object.entries(NewsletterSendModeEnum) as [
        keyof typeof NewsletterSendModeEnum,
        string,
    ][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(NewsletterSendModeEnum[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(NewsletterSendModeEnum)).toEqual(expectedEntries.map(([key]) => key));
    });

    it('should contain all expected values', () => {
        expect(Object.values(NewsletterSendModeEnum)).toEqual(
            expectedEntries.map(([, value]) => value),
        );
    });
});
