import { IncomeCategoryEnum } from './income-category.enum';

describe('IncomeCategoryEnum Enum', () => {
    const expectedEntries = Object.entries(IncomeCategoryEnum) as [
        keyof typeof IncomeCategoryEnum,
        string,
    ][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(IncomeCategoryEnum[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(IncomeCategoryEnum)).toEqual(expectedEntries.map(([key]) => key));
    });

    it('should contain all expected values', () => {
        expect(Object.values(IncomeCategoryEnum)).toEqual(
            expectedEntries.map(([, value]) => value),
        );
    });
});
