import { NewsletterChannelEnum } from './newsletter-channel.enum';

describe('NewsletterChannelEnum Enum', () => {
    const expectedEntries = Object.entries(NewsletterChannelEnum) as [
        keyof typeof NewsletterChannelEnum,
        string,
    ][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(NewsletterChannelEnum[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(NewsletterChannelEnum)).toEqual(expectedEntries.map(([key]) => key));
    });

    it('should contain all expected values', () => {
        expect(Object.values(NewsletterChannelEnum)).toEqual(
            expectedEntries.map(([, value]) => value),
        );
    });
});
