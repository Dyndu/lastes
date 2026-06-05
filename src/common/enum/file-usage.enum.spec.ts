import { FileUsageEnum } from './file-usage.enum';

describe('FileUsageEnum Enum', () => {
    const expectedEntries = Object.entries(FileUsageEnum) as [keyof typeof FileUsageEnum, string][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(FileUsageEnum[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(FileUsageEnum)).toEqual(expectedEntries.map(([key]) => key));
    });

    it('should contain all expected values', () => {
        expect(Object.values(FileUsageEnum)).toEqual(expectedEntries.map(([, value]) => value));
    });
});
