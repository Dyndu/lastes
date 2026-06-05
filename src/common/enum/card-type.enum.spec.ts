import { CardTypeEnum } from './card-type.enum';

describe('CardTypeEnum Enum', () => {
    const expectedEntries = Object.entries(CardTypeEnum) as [keyof typeof CardTypeEnum, string][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(CardTypeEnum[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(CardTypeEnum)).toEqual(expectedEntries.map(([key]) => key));
    });

    it('should contain all expected values', () => {
        expect(Object.values(CardTypeEnum)).toEqual(expectedEntries.map(([, value]) => value));
    });
});
