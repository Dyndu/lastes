import { BAnalysisTypeEnum } from './b-analysis-type.enum';

describe('BAnalysisTypeEnum Enum', () => {
    const expectedEntries = Object.entries(BAnalysisTypeEnum) as [
        keyof typeof BAnalysisTypeEnum,
        string,
    ][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(BAnalysisTypeEnum[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(BAnalysisTypeEnum)).toEqual(expectedEntries.map(([key]) => key));
    });

    it('should contain all expected values', () => {
        expect(Object.values(BAnalysisTypeEnum)).toEqual(expectedEntries.map(([, value]) => value));
    });
});
