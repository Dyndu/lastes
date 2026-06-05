import { CFinancingPurchaseSectionResultInterface } from './c-financing-purchase-section-result.interface';

describe('CFinancingPurchaseSectionResultInterface', () => {
    const validPurchaseSection: CFinancingPurchaseSectionResultInterface = {
        label: 'Purchase Option A',
        purchasePrice: 250000,
        downPayment: 50000,
        interestRate: 0.065,
        loanLengthYears: 30,
        closingCosts: 5000,
        rehabCosts: 10000,
        monthlyIncome: 2500,
        monthlyFixedExpenses: 800,
        loanAmount: 200000,
        mortgagePaymentPI: 1264.14,
        cashToClose: 65000,
        totalMonthlyCashFlow: 435.86,
        yearlyCashFlow: 5230.32,
    };

    it('should have a string label', () => {
        expect(typeof validPurchaseSection.label).toBe('string');
    });

    it('should have a numeric purchasePrice', () => {
        expect(typeof validPurchaseSection.purchasePrice).toBe('number');
    });

    it('should have a numeric downPayment', () => {
        expect(typeof validPurchaseSection.downPayment).toBe('number');
    });

    it('should have a numeric interestRate', () => {
        expect(typeof validPurchaseSection.interestRate).toBe('number');
    });

    it('should have a numeric loanLengthYears', () => {
        expect(typeof validPurchaseSection.loanLengthYears).toBe('number');
    });

    it('should have a numeric closingCosts', () => {
        expect(typeof validPurchaseSection.closingCosts).toBe('number');
    });

    it('should have a numeric rehabCosts', () => {
        expect(typeof validPurchaseSection.rehabCosts).toBe('number');
    });

    it('should have a numeric monthlyIncome', () => {
        expect(typeof validPurchaseSection.monthlyIncome).toBe('number');
    });

    it('should have a numeric monthlyFixedExpenses', () => {
        expect(typeof validPurchaseSection.monthlyFixedExpenses).toBe('number');
    });

    it('should have a numeric loanAmount', () => {
        expect(typeof validPurchaseSection.loanAmount).toBe('number');
    });

    it('should have a numeric mortgagePaymentPI', () => {
        expect(typeof validPurchaseSection.mortgagePaymentPI).toBe('number');
    });

    it('should have a numeric cashToClose', () => {
        expect(typeof validPurchaseSection.cashToClose).toBe('number');
    });

    it('should have a numeric totalMonthlyCashFlow', () => {
        expect(typeof validPurchaseSection.totalMonthlyCashFlow).toBe('number');
    });

    it('should have a numeric yearlyCashFlow', () => {
        expect(typeof validPurchaseSection.yearlyCashFlow).toBe('number');
    });

    it('should accept zero values for numeric fields', () => {
        const zeroSection: CFinancingPurchaseSectionResultInterface = {
            ...validPurchaseSection,
            rehabCosts: 0,
            closingCosts: 0,
            totalMonthlyCashFlow: 0,
            yearlyCashFlow: 0,
        };
        expect(zeroSection.rehabCosts).toBe(0);
        expect(zeroSection.closingCosts).toBe(0);
        expect(zeroSection.totalMonthlyCashFlow).toBe(0);
        expect(zeroSection.yearlyCashFlow).toBe(0);
    });

    it('should accept negative cash flow values', () => {
        const negativeCashFlow: CFinancingPurchaseSectionResultInterface = {
            ...validPurchaseSection,
            totalMonthlyCashFlow: -200,
            yearlyCashFlow: -2400,
        };
        expect(negativeCashFlow.totalMonthlyCashFlow).toBeLessThan(0);
        expect(negativeCashFlow.yearlyCashFlow).toBeLessThan(0);
    });

    it('should contain all 14 required fields', () => {
        const keys = Object.keys(validPurchaseSection);
        expect(keys).toHaveLength(14);
        expect(keys).toEqual(
            expect.arrayContaining([
                'label',
                'purchasePrice',
                'downPayment',
                'interestRate',
                'loanLengthYears',
                'closingCosts',
                'rehabCosts',
                'monthlyIncome',
                'monthlyFixedExpenses',
                'loanAmount',
                'mortgagePaymentPI',
                'cashToClose',
                'totalMonthlyCashFlow',
                'yearlyCashFlow',
            ]),
        );
    });
});
