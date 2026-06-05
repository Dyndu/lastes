import { UserStatusEnum } from './user-status.enum';

describe('UserStatusEnum Enum', () => {
    const expectedEntries = Object.entries(UserStatusEnum) as [
        keyof typeof UserStatusEnum,
        string,
    ][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(UserStatusEnum[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(UserStatusEnum)).toEqual(expectedEntries.map(([key]) => key));
    });

    it('should contain all expected values', () => {
        expect(Object.values(UserStatusEnum)).toEqual(expectedEntries.map(([, value]) => value));
    });
});
