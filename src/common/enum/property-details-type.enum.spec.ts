import { PropertyDetailsTypeEnum } from './property-details-type.enum';

describe('PropertyDetailsTypeEnum Enum', () => {
    const expectedEntries = Object.entries(PropertyDetailsTypeEnum) as [
        keyof typeof PropertyDetailsTypeEnum,
        string,
    ][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(PropertyDetailsTypeEnum[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(PropertyDetailsTypeEnum)).toEqual(expectedEntries.map(([key]) => key));
    });

    it('should contain all expected values', () => {
        expect(Object.values(PropertyDetailsTypeEnum)).toEqual(
            expectedEntries.map(([, value]) => value),
        );
    });
});
