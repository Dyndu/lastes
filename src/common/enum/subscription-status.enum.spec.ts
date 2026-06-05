import { SubscriptionStatusEnum } from './subscription-status.enum';

describe('SubscriptionStatusEnum Enum', () => {
    const expectedEntries = Object.entries(SubscriptionStatusEnum) as [
        keyof typeof SubscriptionStatusEnum,
        string,
    ][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(SubscriptionStatusEnum[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(SubscriptionStatusEnum)).toEqual(expectedEntries.map(([key]) => key));
    });

    it('should contain all expected values', () => {
        expect(Object.values(SubscriptionStatusEnum)).toEqual(
            expectedEntries.map(([, value]) => value),
        );
    });
});
