import { ModuleTypeEnum } from './module-type.enum';

describe('ModuleTypeEnum Enum', () => {
    const expectedEntries = Object.entries(ModuleTypeEnum) as [
        keyof typeof ModuleTypeEnum,
        string,
    ][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(ModuleTypeEnum[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(ModuleTypeEnum)).toEqual(expectedEntries.map(([key]) => key));
    });

    it('should contain all expected values', () => {
        expect(Object.values(ModuleTypeEnum)).toEqual(expectedEntries.map(([, value]) => value));
    });
});
