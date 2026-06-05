import { ExistenceCheckModeEnum } from './existence-check-mode.enum';

describe('ExistenceCheckModeEnum Enum', () => {
    const expectedEntries = Object.entries(ExistenceCheckModeEnum) as [
        keyof typeof ExistenceCheckModeEnum,
        string,
    ][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(ExistenceCheckModeEnum[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(ExistenceCheckModeEnum)).toEqual(expectedEntries.map(([key]) => key));
    });

    it('should contain all expected values', () => {
        expect(Object.values(ExistenceCheckModeEnum)).toEqual(
            expectedEntries.map(([, value]) => value),
        );
    });
});
