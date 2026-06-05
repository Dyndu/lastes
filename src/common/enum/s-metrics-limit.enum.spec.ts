import { SMetricsLimitEnum } from './s-metrics-limit.enum';

describe('SConStatusEnum Enum', () => {
    const expectedEntries = Object.entries(SMetricsLimitEnum) as [
        keyof typeof SMetricsLimitEnum,
        string,
    ][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(SMetricsLimitEnum[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(SMetricsLimitEnum)).toEqual(expectedEntries.map(([key]) => key));
    });

    it('should contain all expected values', () => {
        expect(Object.values(SMetricsLimitEnum)).toEqual(expectedEntries.map(([, value]) => value));
    });
});
