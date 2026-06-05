import { RoomDefaultSectionEnum } from './room-default-section.enum';

describe('RoomDefaultSectionEnum Enum', () => {
    const expectedEntries = Object.entries(RoomDefaultSectionEnum) as [
        keyof typeof RoomDefaultSectionEnum,
        string,
    ][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(RoomDefaultSectionEnum[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(RoomDefaultSectionEnum)).toEqual(expectedEntries.map(([key]) => key));
    });

    it('should contain all expected values', () => {
        expect(Object.values(RoomDefaultSectionEnum)).toEqual(
            expectedEntries.map(([, value]) => value),
        );
    });
});
