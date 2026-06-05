import { AdsFormatEnum } from './ads-format.enum';

describe('AdsFormatEnum Enum', () => {
    const expectedEntries = Object.entries(AdsFormatEnum) as [keyof typeof AdsFormatEnum, string][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(AdsFormatEnum[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(AdsFormatEnum)).toEqual(expectedEntries.map(([key]) => key));
    });

    it('should contain all expected values', () => {
        expect(Object.values(AdsFormatEnum)).toEqual(expectedEntries.map(([, value]) => value));
    });
});
