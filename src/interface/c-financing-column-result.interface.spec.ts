import { CFinancingColumnResultInterface } from './c-financing-column-result.interface';
import { CFinancingPurchaseSectionResultInterface } from './c-financing-purchase-section-result.interface';
import { CFinancingRefiSectionResultInterface } from './c-financing-refi-section-result.interface';
import { CFinancingLoanMetricsResultInterface } from './c-financing-loan-metrics-result.interface';
import { CFinancingFiveYearSnapshotResultInterface } from './c-financing-five-year-snapshot-result.interface';

const mockPurchase: CFinancingPurchaseSectionResultInterface = {
    label: 'Conventional 30yr',
    purchasePrice: 300000,
    downPayment: 60000,
    interestRate: 0.07,
    loanLengthYears: 30,
    closingCosts: 6000,
    rehabCosts: 0,
    monthlyIncome: 2800,
    monthlyFixedExpenses: 900,
    loanAmount: 240000,
    mortgagePaymentPI: 1597.0,
    cashToClose: 66000,
    totalMonthlyCashFlow: 303,
    yearlyCashFlow: 3636,
};

const mockRefi: CFinancingRefiSectionResultInterface = {
    principalPaidDown: null,
    newLoanAmount: null,
    refiInterestRate: null,
    refiLoanLengthYears: null,
    refiClosingCosts: null,
    newMortgagePaymentPI: null,
    totalCashReceivedPostRefi: null,
    totalCashInvested: 66000,
    depreciableAmount: 272727,
    annualTaxDeduction: 9917,
    estTaxCashSavings: 2479.25,
    annualizedCashOnCashReturn: 0.0551,
    paybackPeriodCashOnly: 18.15,
    afterTaxPaybackPeriod: 14.6,
};

const mockLoanMetrics: CFinancingLoanMetricsResultInterface = {
    totalInterestPaidOverLifeOfLoan: 334920,
    totalAcquisitionCost: 340920,
    timeToPayoffLoanYears: 30,
};

const mockFiveYearSnapshot: CFinancingFiveYearSnapshotResultInterface = {
    cumulativeNetCashFlow: 18180,
    totalPrincipalReduction: 12450,
    appreciationGain: 63826,
    estTaxBenefits: 12396.25,
    totalCumulativeWealth: 106852.25,
    annualizedROI: 0.2374,
    cumulativeWealthWithInitialInvestment: 172852.25,
};

describe('CFinancingColumnResultInterface', () => {
    const validColumn: CFinancingColumnResultInterface = {
        label: 'Option 1 - Conventional',
        purchase: mockPurchase,
        refi: mockRefi,
        loanMetrics: mockLoanMetrics,
        fiveYearSnapshot: mockFiveYearSnapshot,
    };

    it('should have a string label', () => {
        expect(typeof validColumn.label).toBe('string');
    });

    it('should have a purchase section', () => {
        expect(validColumn.purchase).toBeDefined();
        expect(typeof validColumn.purchase).toBe('object');
    });

    it('should have a refi section', () => {
        expect(validColumn.refi).toBeDefined();
        expect(typeof validColumn.refi).toBe('object');
    });

    it('should have a loanMetrics section', () => {
        expect(validColumn.loanMetrics).toBeDefined();
        expect(typeof validColumn.loanMetrics).toBe('object');
    });

    it('should have a fiveYearSnapshot section', () => {
        expect(validColumn.fiveYearSnapshot).toBeDefined();
        expect(typeof validColumn.fiveYearSnapshot).toBe('object');
    });

    it('should expose purchase section fields', () => {
        expect(validColumn.purchase.purchasePrice).toBe(300000);
        expect(validColumn.purchase.loanAmount).toBe(240000);
        expect(validColumn.purchase.label).toBe('Conventional 30yr');
    });

    it('should expose refi section with nullable fields', () => {
        expect(validColumn.refi.principalPaidDown).toBeNull();
        expect(validColumn.refi.totalCashInvested).toBe(66000);
    });

    it('should expose loanMetrics fields', () => {
        expect(validColumn.loanMetrics.timeToPayoffLoanYears).toBe(30);
        expect(validColumn.loanMetrics.totalAcquisitionCost).toBe(340920);
    });

    it('should expose fiveYearSnapshot fields', () => {
        expect(validColumn.fiveYearSnapshot.annualizedROI).toBeCloseTo(0.2374);
        expect(validColumn.fiveYearSnapshot.totalCumulativeWealth).toBe(106852.25);
    });

    it('should accept an empty string label', () => {
        const columnWithEmptyLabel: CFinancingColumnResultInterface = {
            ...validColumn,
            label: '',
        };
        expect(columnWithEmptyLabel.label).toBe('');
    });

    it('should contain all 5 required top-level fields', () => {
        const keys = Object.keys(validColumn);
        expect(keys).toHaveLength(5);
        expect(keys).toEqual(
            expect.arrayContaining([
                'label',
                'purchase',
                'refi',
                'loanMetrics',
                'fiveYearSnapshot',
            ]),
        );
    });
});
