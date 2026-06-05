import { AdsStatusEnum } from './ads-status.enum';

describe('AdsStatusEnum Enum', () => {
    const expectedEntries = Object.entries(AdsStatusEnum) as [keyof typeof AdsStatusEnum, string][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(AdsStatusEnum[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(AdsStatusEnum)).toEqual(expectedEntries.map(([key]) => key));
    });

    it('should contain all expected values', () => {
        expect(Object.values(AdsStatusEnum)).toEqual(expectedEntries.map(([, value]) => value));
    });
});
