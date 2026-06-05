import { DtiOtherDebtsLabelsEnum } from './dti-other-debts-labels.enum';

describe('DtiOtherDebtsLabelsEnum Enum', () => {
    const expectedEntries = Object.entries(DtiOtherDebtsLabelsEnum) as [
        keyof typeof DtiOtherDebtsLabelsEnum,
        string,
    ][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(DtiOtherDebtsLabelsEnum[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(DtiOtherDebtsLabelsEnum)).toEqual(expectedEntries.map(([key]) => key));
    });

    it('should contain all expected values', () => {
        expect(Object.values(DtiOtherDebtsLabelsEnum)).toEqual(
            expectedEntries.map(([, value]) => value),
        );
    });
});
