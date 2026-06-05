import { ModuleMethodEnum } from './module-method.enum';

describe('ModuleMethodEnum Enum', () => {
    const expectedEntries = Object.entries(ModuleMethodEnum) as [
        keyof typeof ModuleMethodEnum,
        string,
    ][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(ModuleMethodEnum[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(ModuleMethodEnum)).toEqual(expectedEntries.map(([key]) => key));
    });

    it('should contain all expected values', () => {
        expect(Object.values(ModuleMethodEnum)).toEqual(expectedEntries.map(([, value]) => value));
    });
});
