import { CFinancingRefiSectionResultInterface } from './c-financing-refi-section-result.interface';

describe('CFinancingRefiSectionResultInterface', () => {
    const validRefiWithRefi: CFinancingRefiSectionResultInterface = {
        principalPaidDown: 15000,
        newLoanAmount: 185000,
        refiInterestRate: 0.055,
        refiLoanLengthYears: 30,
        refiClosingCosts: 4000,
        newMortgagePaymentPI: 1050.5,
        totalCashReceivedPostRefi: 20000,
        totalCashInvested: 45000,
        depreciableAmount: 227272,
        annualTaxDeduction: 8263,
        estTaxCashSavings: 2065.75,
        annualizedCashOnCashReturn: 0.1389,
        paybackPeriodCashOnly: 7.2,
        afterTaxPaybackPeriod: 6.1,
    };

    const validRefiWithoutRefi: CFinancingRefiSectionResultInterface = {
        principalPaidDown: null,
        newLoanAmount: null,
        refiInterestRate: null,
        refiLoanLengthYears: null,
        refiClosingCosts: null,
        newMortgagePaymentPI: null,
        totalCashReceivedPostRefi: null,
        totalCashInvested: 65000,
        depreciableAmount: 227272,
        annualTaxDeduction: 8263,
        estTaxCashSavings: 2065.75,
        annualizedCashOnCashReturn: 0.0804,
        paybackPeriodCashOnly: 12.4,
        afterTaxPaybackPeriod: 10.8,
    };

    describe('nullable refi fields', () => {
        it('should accept null for principalPaidDown', () => {
            expect(validRefiWithoutRefi.principalPaidDown).toBeNull();
        });

        it('should accept null for newLoanAmount', () => {
            expect(validRefiWithoutRefi.newLoanAmount).toBeNull();
        });

        it('should accept null for refiInterestRate', () => {
            expect(validRefiWithoutRefi.refiInterestRate).toBeNull();
        });

        it('should accept null for refiLoanLengthYears', () => {
            expect(validRefiWithoutRefi.refiLoanLengthYears).toBeNull();
        });

        it('should accept null for refiClosingCosts', () => {
            expect(validRefiWithoutRefi.refiClosingCosts).toBeNull();
        });

        it('should accept null for newMortgagePaymentPI', () => {
            expect(validRefiWithoutRefi.newMortgagePaymentPI).toBeNull();
        });

        it('should accept null for totalCashReceivedPostRefi', () => {
            expect(validRefiWithoutRefi.totalCashReceivedPostRefi).toBeNull();
        });
    });

    describe('non-nullable numeric fields', () => {
        it('should have a numeric totalCashInvested', () => {
            expect(typeof validRefiWithRefi.totalCashInvested).toBe('number');
        });

        it('should have a numeric depreciableAmount', () => {
            expect(typeof validRefiWithRefi.depreciableAmount).toBe('number');
        });

        it('should have a numeric annualTaxDeduction', () => {
            expect(typeof validRefiWithRefi.annualTaxDeduction).toBe('number');
        });

        it('should have a numeric estTaxCashSavings', () => {
            expect(typeof validRefiWithRefi.estTaxCashSavings).toBe('number');
        });

        it('should have a numeric annualizedCashOnCashReturn', () => {
            expect(typeof validRefiWithRefi.annualizedCashOnCashReturn).toBe('number');
        });

        it('should have a numeric paybackPeriodCashOnly', () => {
            expect(typeof validRefiWithRefi.paybackPeriodCashOnly).toBe('number');
        });

        it('should have a numeric afterTaxPaybackPeriod', () => {
            expect(typeof validRefiWithRefi.afterTaxPaybackPeriod).toBe('number');
        });
    });

    describe('refi fields with numeric values', () => {
        it('should accept numeric principalPaidDown', () => {
            expect(typeof validRefiWithRefi.principalPaidDown).toBe('number');
        });

        it('should accept numeric newLoanAmount', () => {
            expect(typeof validRefiWithRefi.newLoanAmount).toBe('number');
        });

        it('should accept numeric refiInterestRate', () => {
            expect(typeof validRefiWithRefi.refiInterestRate).toBe('number');
        });

        it('should accept numeric refiLoanLengthYears', () => {
            expect(typeof validRefiWithRefi.refiLoanLengthYears).toBe('number');
        });

        it('should accept numeric refiClosingCosts', () => {
            expect(typeof validRefiWithRefi.refiClosingCosts).toBe('number');
        });

        it('should accept numeric newMortgagePaymentPI', () => {
            expect(typeof validRefiWithRefi.newMortgagePaymentPI).toBe('number');
        });

        it('should accept numeric totalCashReceivedPostRefi', () => {
            expect(typeof validRefiWithRefi.totalCashReceivedPostRefi).toBe('number');
        });
    });

    it('should contain all 14 required fields', () => {
        const keys = Object.keys(validRefiWithRefi);
        expect(keys).toHaveLength(14);
        expect(keys).toEqual(
            expect.arrayContaining([
                'principalPaidDown',
                'newLoanAmount',
                'refiInterestRate',
                'refiLoanLengthYears',
                'refiClosingCosts',
                'newMortgagePaymentPI',
                'totalCashReceivedPostRefi',
                'totalCashInvested',
                'depreciableAmount',
                'annualTaxDeduction',
                'estTaxCashSavings',
                'annualizedCashOnCashReturn',
                'paybackPeriodCashOnly',
                'afterTaxPaybackPeriod',
            ]),
        );
    });
});
