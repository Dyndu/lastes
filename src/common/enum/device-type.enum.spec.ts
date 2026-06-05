import { DeviceTypeEnum } from './device-type.enum';

describe('DeviceTypeEnum Enum', () => {
    const expectedEntries = Object.entries(DeviceTypeEnum) as [
        keyof typeof DeviceTypeEnum,
        string,
    ][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(DeviceTypeEnum[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(DeviceTypeEnum)).toEqual(expectedEntries.map(([key]) => key));
    });

    it('should contain all expected values', () => {
        expect(Object.values(DeviceTypeEnum)).toEqual(expectedEntries.map(([, value]) => value));
    });
});
