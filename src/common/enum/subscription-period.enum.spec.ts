import { SubscriptionPeriodEnum } from './subscription-period.enum';

describe('SubscriptionPeriodEnum Enum', () => {
    const expectedEntries = Object.entries(SubscriptionPeriodEnum) as [
        keyof typeof SubscriptionPeriodEnum,
        string,
    ][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(SubscriptionPeriodEnum[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(SubscriptionPeriodEnum)).toEqual(expectedEntries.map(([key]) => key));
    });

    it('should contain all expected values', () => {
        expect(Object.values(SubscriptionPeriodEnum)).toEqual(
            expectedEntries.map(([, value]) => value),
        );
    });
});
