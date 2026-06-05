import { DtiOtherIncomeLabelsEnum } from './dti-other-income-labels.enum';

describe('DtiOtherIncomeLabelsEnum Enum', () => {
    const expectedEntries = Object.entries(DtiOtherIncomeLabelsEnum) as [
        keyof typeof DtiOtherIncomeLabelsEnum,
        string,
    ][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(DtiOtherIncomeLabelsEnum[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(DtiOtherIncomeLabelsEnum)).toEqual(expectedEntries.map(([key]) => key));
    });

    it('should contain all expected values', () => {
        expect(Object.values(DtiOtherIncomeLabelsEnum)).toEqual(
            expectedEntries.map(([, value]) => value),
        );
    });
});
