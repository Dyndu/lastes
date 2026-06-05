import { CFinancingCalculatorResultInterface } from './c-financing-calculator-result.interface';
import { CFinancingColumnResultInterface } from './c-financing-column-result.interface';

const mockColumn = (label: string): CFinancingColumnResultInterface => ({
    label,
    purchase: {
        label,
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
    },
    refi: {
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
    },
    loanMetrics: {
        totalInterestPaidOverLifeOfLoan: 334920,
        totalAcquisitionCost: 340920,
        timeToPayoffLoanYears: 30,
    },
    fiveYearSnapshot: {
        cumulativeNetCashFlow: 18180,
        totalPrincipalReduction: 12450,
        appreciationGain: 63826,
        estTaxBenefits: 12396.25,
        totalCumulativeWealth: 106852.25,
        annualizedROI: 0.2374,
        cumulativeWealthWithInitialInvestment: 172852.25,
    },
});

describe('CFinancingCalculatorResultInterface', () => {
    const validResult: CFinancingCalculatorResultInterface = {
        globalParams: {
            annualAppreciationRate: 0.04,
            depreciationPercentage: 0.2727,
            investorTaxBracket: 0.25,
        },
        columns: [mockColumn('Option 1'), mockColumn('Option 2'), mockColumn('Option 3')],
    };

    describe('globalParams', () => {
        it('should have a globalParams object', () => {
            expect(validResult.globalParams).toBeDefined();
            expect(typeof validResult.globalParams).toBe('object');
        });

        it('should have a numeric annualAppreciationRate', () => {
            expect(typeof validResult.globalParams.annualAppreciationRate).toBe('number');
        });

        it('should have a numeric depreciationPercentage', () => {
            expect(typeof validResult.globalParams.depreciationPercentage).toBe('number');
        });

        it('should have a numeric investorTaxBracket', () => {
            expect(typeof validResult.globalParams.investorTaxBracket).toBe('number');
        });

        it('should contain exactly 3 globalParams fields', () => {
            const keys = Object.keys(validResult.globalParams);
            expect(keys).toHaveLength(3);
            expect(keys).toEqual(
                expect.arrayContaining([
                    'annualAppreciationRate',
                    'depreciationPercentage',
                    'investorTaxBracket',
                ]),
            );
        });

        it('should accept decimal values for all global params', () => {
            const decimalParams: CFinancingCalculatorResultInterface = {
                ...validResult,
                globalParams: {
                    annualAppreciationRate: 0.035,
                    depreciationPercentage: 0.2727,
                    investorTaxBracket: 0.32,
                },
            };
            expect(decimalParams.globalParams.annualAppreciationRate).toBeCloseTo(0.035);
            expect(decimalParams.globalParams.investorTaxBracket).toBeCloseTo(0.32);
        });

        it('should accept zero annualAppreciationRate (flat market)', () => {
            const flatMarket: CFinancingCalculatorResultInterface = {
                ...validResult,
                globalParams: { ...validResult.globalParams, annualAppreciationRate: 0 },
            };
            expect(flatMarket.globalParams.annualAppreciationRate).toBe(0);
        });
    });

    describe('columns', () => {
        it('should have a columns array', () => {
            expect(Array.isArray(validResult.columns)).toBe(true);
        });

        it('should support multiple columns', () => {
            expect(validResult.columns).toHaveLength(3);
        });

        it('should support a single column', () => {
            const singleColumn: CFinancingCalculatorResultInterface = {
                ...validResult,
                columns: [mockColumn('Only Option')],
            };
            expect(singleColumn.columns).toHaveLength(1);
        });

        it('should support an empty columns array', () => {
            const noColumns: CFinancingCalculatorResultInterface = {
                ...validResult,
                columns: [],
            };
            expect(noColumns.columns).toHaveLength(0);
        });

        it('each column should have the correct shape', () => {
            validResult.columns.forEach((col) => {
                expect(col).toHaveProperty('label');
                expect(col).toHaveProperty('purchase');
                expect(col).toHaveProperty('refi');
                expect(col).toHaveProperty('loanMetrics');
                expect(col).toHaveProperty('fiveYearSnapshot');
            });
        });

        it('columns should be independently labelled', () => {
            const labels = validResult.columns.map((c) => c.label);
            expect(labels).toEqual(['Option 1', 'Option 2', 'Option 3']);
        });
    });

    it('should contain all 2 top-level fields', () => {
        const keys = Object.keys(validResult);
        expect(keys).toHaveLength(2);
        expect(keys).toEqual(expect.arrayContaining(['globalParams', 'columns']));
    });
});
