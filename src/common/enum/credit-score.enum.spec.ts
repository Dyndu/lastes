import { CreditScoreEnum } from './credit-score.enum';

describe('CreditScoreEnum Enum', () => {
    const expectedEntries = Object.entries(CreditScoreEnum) as [
        keyof typeof CreditScoreEnum,
        string,
    ][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(CreditScoreEnum[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(CreditScoreEnum)).toEqual(expectedEntries.map(([key]) => key));
    });

    it('should contain all expected values', () => {
        expect(Object.values(CreditScoreEnum)).toEqual(expectedEntries.map(([, value]) => value));
    });
});
