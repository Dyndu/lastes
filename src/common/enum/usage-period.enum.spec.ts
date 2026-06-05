import { UsagePeriod } from './usage-period.enum';

describe('UsagePeriod Enum', () => {
    const expectedEntries = Object.entries(UsagePeriod) as [keyof typeof UsagePeriod, string][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(UsagePeriod[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(UsagePeriod)).toEqual(expectedEntries.map(([key]) => key));
    });

    it('should contain all expected values', () => {
        expect(Object.values(UsagePeriod)).toEqual(expectedEntries.map(([, value]) => value));
    });
});
