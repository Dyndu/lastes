import { NewsletterStatusEnum } from './newsletter-status.enum';

describe('NewsletterStatusEnum Enum', () => {
    const expectedEntries = Object.entries(NewsletterStatusEnum) as [
        keyof typeof NewsletterStatusEnum,
        string,
    ][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(NewsletterStatusEnum[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(NewsletterStatusEnum)).toEqual(expectedEntries.map(([key]) => key));
    });

    it('should contain all expected values', () => {
        expect(Object.values(NewsletterStatusEnum)).toEqual(
            expectedEntries.map(([, value]) => value),
        );
    });
});
