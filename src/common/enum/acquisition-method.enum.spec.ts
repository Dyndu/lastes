import { AcquisitionMethodEnum } from './acquisition-method.enum';

describe('AcquisitionMethodEnum Enum', () => {
    const expectedEntries = Object.entries(AcquisitionMethodEnum) as [
        keyof typeof AcquisitionMethodEnum,
        string,
    ][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(AcquisitionMethodEnum[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(AcquisitionMethodEnum)).toEqual(expectedEntries.map(([key]) => key));
    });

    it('should contain all expected values', () => {
        expect(Object.values(AcquisitionMethodEnum)).toEqual(
            expectedEntries.map(([, value]) => value),
        );
    });
});
