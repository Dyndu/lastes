import { MCalculatorTypeEnum } from './m-calculator-type.enum';

describe('MCalculatorTypeEnum Enum', () => {
    const expectedEntries = Object.entries(MCalculatorTypeEnum) as [
        keyof typeof MCalculatorTypeEnum,
        string,
    ][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(MCalculatorTypeEnum[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(MCalculatorTypeEnum)).toEqual(expectedEntries.map(([key]) => key));
    });

    it('should contain all expected values', () => {
        expect(Object.values(MCalculatorTypeEnum)).toEqual(
            expectedEntries.map(([, value]) => value),
        );
    });
});
