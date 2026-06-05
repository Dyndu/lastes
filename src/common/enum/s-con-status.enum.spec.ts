import { SConStatusEnum } from './s-con-status.enum';

describe('SConStatusEnum Enum', () => {
    const expectedEntries = Object.entries(SConStatusEnum) as [
        keyof typeof SConStatusEnum,
        string,
    ][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(SConStatusEnum[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(SConStatusEnum)).toEqual(expectedEntries.map(([key]) => key));
    });

    it('should contain all expected values', () => {
        expect(Object.values(SConStatusEnum)).toEqual(expectedEntries.map(([, value]) => value));
    });
});
