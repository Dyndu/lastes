import { CalculationMethodEnum } from './calculation-method.enum';

describe('CalculationMethodEnum Enum', () => {
    const expectedEntries = Object.entries(CalculationMethodEnum) as [
        keyof typeof CalculationMethodEnum,
        string,
    ][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(CalculationMethodEnum[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(CalculationMethodEnum)).toEqual(expectedEntries.map(([key]) => key));
    });

    it('should contain all expected values', () => {
        expect(Object.values(CalculationMethodEnum)).toEqual(
            expectedEntries.map(([, value]) => value),
        );
    });
});
