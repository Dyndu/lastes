import { ExtraPaymentFrequencyEnum } from './extra-payment-frequency.enum';

describe('ExtraPaymentFrequencyEnum Enum', () => {
    const expectedEntries = Object.entries(ExtraPaymentFrequencyEnum) as [
        keyof typeof ExtraPaymentFrequencyEnum,
        string,
    ][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(ExtraPaymentFrequencyEnum[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(ExtraPaymentFrequencyEnum)).toEqual(expectedEntries.map(([key]) => key));
    });

    it('should contain all expected values', () => {
        expect(Object.values(ExtraPaymentFrequencyEnum)).toEqual(
            expectedEntries.map(([, value]) => value),
        );
    });
});
