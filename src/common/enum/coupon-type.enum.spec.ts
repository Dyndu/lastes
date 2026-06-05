import { CouponTypeEnum } from './coupon-type.enum';

describe('CouponTypeEnum Enum', () => {
    const expectedEntries = Object.entries(CouponTypeEnum) as [
        keyof typeof CouponTypeEnum,
        string,
    ][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(CouponTypeEnum[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(CouponTypeEnum)).toEqual(expectedEntries.map(([key]) => key));
    });

    it('should contain all expected values', () => {
        expect(Object.values(CouponTypeEnum)).toEqual(expectedEntries.map(([, value]) => value));
    });
});
