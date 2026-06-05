import { CFinancingLoanMetricsResultInterface } from './c-financing-loan-metrics-result.interface';

describe('CFinancingLoanMetricsResultInterface', () => {
    const validLoanMetrics: CFinancingLoanMetricsResultInterface = {
        totalInterestPaidOverLifeOfLoan: 255109.6,
        totalAcquisitionCost: 270109.6,
        timeToPayoffLoanYears: 30,
    };

    it('should have a numeric totalInterestPaidOverLifeOfLoan', () => {
        expect(typeof validLoanMetrics.totalInterestPaidOverLifeOfLoan).toBe('number');
    });

    it('should have a numeric totalAcquisitionCost', () => {
        expect(typeof validLoanMetrics.totalAcquisitionCost).toBe('number');
    });

    it('should have a numeric timeToPayoffLoanYears', () => {
        expect(typeof validLoanMetrics.timeToPayoffLoanYears).toBe('number');
    });

    it('should accept decimal values for interest and cost fields', () => {
        const decimalMetrics: CFinancingLoanMetricsResultInterface = {
            totalInterestPaidOverLifeOfLoan: 123456.78,
            totalAcquisitionCost: 133456.78,
            timeToPayoffLoanYears: 15.5,
        };
        expect(decimalMetrics.totalInterestPaidOverLifeOfLoan).toBeCloseTo(123456.78);
        expect(decimalMetrics.totalAcquisitionCost).toBeCloseTo(133456.78);
        expect(decimalMetrics.timeToPayoffLoanYears).toBeCloseTo(15.5);
    });

    it('should accept zero for totalInterestPaidOverLifeOfLoan (cash purchase equivalent)', () => {
        const noInterestMetrics: CFinancingLoanMetricsResultInterface = {
            ...validLoanMetrics,
            totalInterestPaidOverLifeOfLoan: 0,
        };
        expect(noInterestMetrics.totalInterestPaidOverLifeOfLoan).toBe(0);
    });

    it('should contain all 3 required fields', () => {
        const keys = Object.keys(validLoanMetrics);
        expect(keys).toHaveLength(3);
        expect(keys).toEqual(
            expect.arrayContaining([
                'totalInterestPaidOverLifeOfLoan',
                'totalAcquisitionCost',
                'timeToPayoffLoanYears',
            ]),
        );
    });
});
