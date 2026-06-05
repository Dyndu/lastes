import { WholesaleCalculatorService, WholesaleInput } from './wholesale-calculator.service';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('WholesaleCalculatorService', () => {
    let service: WholesaleCalculatorService;

    beforeEach(() => {
        service = new WholesaleCalculatorService();
    });

    describe('computeHoldingCost', () => {
        it('multiplies holding cost per month by duration', () => {
            expect(service.computeHoldingCost(1000, 6)).toBe(6000);
        });

        it('returns 0 when either value is 0', () => {
            expect(service.computeHoldingCost(0, 6)).toBe(0);
            expect(service.computeHoldingCost(1000, 0)).toBe(0);
        });
    });

    describe('computeTotalAcquisitionCost', () => {
        it('sums holding cost, transaction fee, and other fee', () => {
            expect(service.computeTotalAcquisitionCost(6000, 500, 200)).toBe(6700);
        });

        it('returns 0 when all inputs are 0', () => {
            expect(service.computeTotalAcquisitionCost(0, 0, 0)).toBe(0);
        });
    });

    describe('computeMaxOffer', () => {
        it('subtracts profit and acquisition cost from investor price', () => {
            expect(service.computeMaxOffer(100000, 10000, 6700)).toBe(83300);
        });

        it('can return a negative value when costs exceed price', () => {
            expect(service.computeMaxOffer(5000, 3000, 5000)).toBe(-3000);
        });
    });

    describe('computeInvestorROI', () => {
        it('computes ROI as percentage of monthly cash flow over total cash needed', () => {
            expect(service.computeInvestorROI(500, 10000)).toBeCloseTo(5);
        });

        it('returns 0 when total cash needed is 0', () => {
            expect(service.computeInvestorROI(500, 0)).toBe(0);
        });
    });

    describe('computePayback', () => {
        it('divides total cash needed by cash to close', () => {
            expect(service.computePayback(40000, 20000)).toBe(2);
        });

        it('returns 0 when cash to close is 0', () => {
            expect(service.computePayback(40000, 0)).toBe(0);
        });
    });

    describe('computeDownPaymentAmount', () => {
        it('computes down payment from price and percentage', () => {
            expect(service.computeDownPaymentAmount(200000, 20)).toBe(40000);
        });

        it('returns 0 when percentage is 0', () => {
            expect(service.computeDownPaymentAmount(200000, 0)).toBe(0);
        });
    });

    describe('computeLoanAmount', () => {
        it('subtracts down payment from investor price', () => {
            expect(service.computeLoanAmount(200000, 40000)).toBe(160000);
        });

        it('returns full price when down payment is 0', () => {
            expect(service.computeLoanAmount(200000, 0)).toBe(200000);
        });
    });

    describe('computePI', () => {
        it('computes monthly amortization payment correctly', () => {
            const result = service.computePI(160000, 6, 360);
            expect(result).toBeCloseTo(959.28, 1);
        });

        it('divides loan evenly when rate is 0', () => {
            expect(service.computePI(12000, 0, 12)).toBeCloseTo(1000);
        });
    });

    describe('computeCashToClose', () => {
        it('computes cash to close correctly', () => {
            // 40000 + 3000 - 2000 + 1000 = 42000
            expect(service.computeCashToClose(40000, 3000, 2000, 1000)).toBe(42000);
        });

        it('handles zero seller concessions and credits', () => {
            expect(service.computeCashToClose(40000, 3000, 0, 0)).toBe(43000);
        });
    });

    describe('computeNOI', () => {
        it('subtracts fixed expenses from monthly income', () => {
            expect(service.computeNOI(3000, 1200)).toBe(1800);
        });

        it('can return negative NOI', () => {
            expect(service.computeNOI(500, 1200)).toBe(-700);
        });
    });

    describe('computeCapRate', () => {
        it('computes cap rate as percentage', () => {
            expect(service.computeCapRate(1800, 200000)).toBeCloseTo(0.9);
        });

        it('returns 0 when investor price is 0', () => {
            expect(service.computeCapRate(1800, 0)).toBe(0);
        });
    });

    describe('computeMonthlyCashFlow', () => {
        it('subtracts PI from NOI', () => {
            expect(service.computeMonthlyCashFlow(1800, 959.28)).toBeCloseTo(840.72);
        });

        it('can return negative cash flow', () => {
            expect(service.computeMonthlyCashFlow(500, 1000)).toBe(-500);
        });
    });

    describe('computeCredits', () => {
        it('sums seller concessions and rent credits', () => {
            expect(service.computeCredits(2000, 500)).toBe(2500);
        });

        it('returns 0 when both are 0', () => {
            expect(service.computeCredits(0, 0)).toBe(0);
        });
    });

    describe('computeTotalCashNeeded', () => {
        it('sums all project costs and subtracts credits', () => {
            // 10000 + 6000 + 3000 + 40000 - 2500 = 56500
            expect(service.computeTotalCashNeeded(10000, 6000, 3000, 40000, 2500)).toBe(56500);
        });

        it('returns full sum when credits are 0', () => {
            expect(service.computeTotalCashNeeded(10000, 6000, 3000, 40000, 0)).toBe(59000);
        });
    });

    describe('computeWholesaleSummary', () => {
        const baseInput: WholesaleInput = {
            investorPrice: 200000,
            targetProfit: 20000,
            holdingCostPerMonth: 1000,
            duration: 6,
            transactionFee: 500,
            otherFee: 200,
            downPaymentPercent: 20,
            loanInterest: 6,
            loanLength: 360,
            closingCostFees: 3000,
            sellerConcessions: 2000,
            credits: 1000,
            monthlyIncome: 3000,
            fixedExpensesTotal: 1200,
            estRepairs: 10000,
        };

        it('returns a fully structured summary', () => {
            const result = service.computeWholesaleSummary(baseInput);

            expect(result).toHaveProperty('dealSummary');
            expect(result).toHaveProperty('acquisitionCosts');
            expect(result).toHaveProperty('purchaseInformation');
            expect(result).toHaveProperty('performanceSummary');
            expect(result).toHaveProperty('projectCosts');
        });

        it('computes dealSummary correctly', () => {
            const result = service.computeWholesaleSummary(baseInput);
            expect(result.dealSummary.price).toBe(200000);
            expect(result.dealSummary.profit).toBe(20000);
            // maxOffer = 200000 - 20000 - (6000 + 500 + 200) = 173300
            expect(result.dealSummary.maxOffer).toBe(173300);
        });

        it('computes acquisitionCosts correctly', () => {
            const result = service.computeWholesaleSummary(baseInput);
            expect(result.acquisitionCosts.holdingCost).toBe(6000);
            expect(result.acquisitionCosts.transactionFee).toBe(500);
            expect(result.acquisitionCosts.other).toBe(200);
            expect(result.acquisitionCosts.totalExpenses).toBe(6700);
        });

        it('computes purchaseInformation correctly', () => {
            const result = service.computeWholesaleSummary(baseInput);
            expect(result.purchaseInformation.purchasePrice).toBe(200000);
            expect(result.purchaseInformation.downPaymentAmount).toBe(40000);
            expect(result.purchaseInformation.loanAmount).toBe(160000);
            expect(result.purchaseInformation.interestRate).toBe(6);
            expect(result.purchaseInformation.closingCosts).toBe(3000);
            // cashToClose = 40000 + 3000 - 2000 + 1000 = 42000
            expect(result.purchaseInformation.cashToClose).toBe(42000);
        });

        it('computes performanceSummary correctly', () => {
            const result = service.computeWholesaleSummary(baseInput);
            expect(result.performanceSummary.monthlyIncome).toBe(3000);
            // noi = 3000 - 1200 = 1800
            expect(result.performanceSummary.noi).toBe(1800);
            expect(result.performanceSummary.monthlyExpenses).toBe(1200);
            expect(result.performanceSummary.capRate).toBeCloseTo(0.9);
        });

        it('computes projectCosts correctly', () => {
            const result = service.computeWholesaleSummary(baseInput);
            expect(result.projectCosts.estRepairs).toBe(10000);
            expect(result.projectCosts.totalHoldingCost).toBe(6000);
            expect(result.projectCosts.closing).toBe(3000);
            expect(result.projectCosts.downPayment).toBe(40000);
            // credits = sellerConcessions(2000) + rentCredits(0) = 2000
            expect(result.projectCosts.credits).toBe(2000);
            // totalCashNeeded = 10000 + 6000 + 3000 + 40000 - 2000 = 57000
            expect(result.projectCosts.totalCashNeeded).toBe(57000);
        });

        it('uses provided rentCredits in credits computation', () => {
            const result = service.computeWholesaleSummary(baseInput, 1000);
            // credits = 2000 + 1000 = 3000
            expect(result.projectCosts.credits).toBe(3000);
        });

        it('defaults rentCredits to 0 when not provided', () => {
            const result = service.computeWholesaleSummary(baseInput);
            expect(result.projectCosts.credits).toBe(2000);
        });

        it('handles all-zero input without throwing', () => {
            const zeroInput: WholesaleInput = {
                investorPrice: 0,
                targetProfit: 0,
                holdingCostPerMonth: 0,
                duration: 0,
                transactionFee: 0,
                otherFee: 0,
                downPaymentPercent: 0,
                loanInterest: 0,
                loanLength: 1,
                closingCostFees: 0,
                sellerConcessions: 0,
                credits: 0,
                monthlyIncome: 0,
                fixedExpensesTotal: 0,
                estRepairs: 0,
            };
            const result = service.computeWholesaleSummary(zeroInput);
            expect(result.dealSummary.investorROI).toBe(0);
            expect(result.dealSummary.payback).toBe(0);
            expect(result.dealSummary.maxOffer).toBe(0);
        });
    });
});
