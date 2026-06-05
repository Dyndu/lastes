import { GuideStatusEnum } from './guide-status.enum';

describe('GuideStatusEnum Enum', () => {
    const expectedEntries = Object.entries(GuideStatusEnum) as [
        keyof typeof GuideStatusEnum,
        string,
    ][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(GuideStatusEnum[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(GuideStatusEnum)).toEqual(expectedEntries.map(([key]) => key));
    });

    it('should contain all expected values', () => {
        expect(Object.values(GuideStatusEnum)).toEqual(expectedEntries.map(([, value]) => value));
    });
});
