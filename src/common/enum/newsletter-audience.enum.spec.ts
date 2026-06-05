import { NewsletterAudienceEnum } from './newsletter-audience.enum';

describe('NewsletterAudienceEnum Enum', () => {
    const expectedEntries = Object.entries(NewsletterAudienceEnum) as [
        keyof typeof NewsletterAudienceEnum,
        string,
    ][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(NewsletterAudienceEnum[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(NewsletterAudienceEnum)).toEqual(expectedEntries.map(([key]) => key));
    });

    it('should contain all expected values', () => {
        expect(Object.values(NewsletterAudienceEnum)).toEqual(
            expectedEntries.map(([, value]) => value),
        );
    });
});
