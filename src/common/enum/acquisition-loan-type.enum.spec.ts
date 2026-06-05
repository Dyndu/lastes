import { AcquisitionLoanTypeEnum } from './acquisition-loan-type.enum';

describe('AcquisitionLoanTypeEnum Enum', () => {
    const expectedEntries = Object.entries(AcquisitionLoanTypeEnum) as [
        keyof typeof AcquisitionLoanTypeEnum,
        string,
    ][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(AcquisitionLoanTypeEnum[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(AcquisitionLoanTypeEnum)).toEqual(expectedEntries.map(([key]) => key));
    });

    it('should contain all expected values', () => {
        expect(Object.values(AcquisitionLoanTypeEnum)).toEqual(
            expectedEntries.map(([, value]) => value),
        );
    });
});
