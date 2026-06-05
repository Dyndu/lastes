import { FileTypeEnum } from './file-type.enum';

describe('FileTypeEnum Enum', () => {
    const expectedEntries = Object.entries(FileTypeEnum) as [keyof typeof FileTypeEnum, string][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(FileTypeEnum[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(FileTypeEnum)).toEqual(expectedEntries.map(([key]) => key));
    });

    it('should contain all expected values', () => {
        expect(Object.values(FileTypeEnum)).toEqual(expectedEntries.map(([, value]) => value));
    });
});
