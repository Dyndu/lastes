import { ModuleLabelEnum } from './module-label.enum';

describe('ModuleLabelEnum Enum', () => {
    const expectedEntries = Object.entries(ModuleLabelEnum) as [
        keyof typeof ModuleLabelEnum,
        string,
    ][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(ModuleLabelEnum[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(ModuleLabelEnum)).toEqual(expectedEntries.map(([key]) => key));
    });

    it('should contain all expected values', () => {
        expect(Object.values(ModuleLabelEnum)).toEqual(expectedEntries.map(([, value]) => value));
    });
});
