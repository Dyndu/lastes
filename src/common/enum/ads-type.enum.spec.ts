import { AdsTypeEnum } from './ads-type.enum';

describe('AdsTypeEnum Enum', () => {
    const expectedEntries = Object.entries(AdsTypeEnum) as [keyof typeof AdsTypeEnum, string][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(AdsTypeEnum[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(AdsTypeEnum)).toEqual(expectedEntries.map(([key]) => key));
    });

    it('should contain all expected values', () => {
        expect(Object.values(AdsTypeEnum)).toEqual(expectedEntries.map(([, value]) => value));
    });
});
