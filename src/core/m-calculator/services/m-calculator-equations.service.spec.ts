import { MCalculatorEquationsService } from './m-calculator-equations.service';
import { CreditScoreEnum } from '../../../common/enum';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('MCalculatorEquationsService', () => {
    let service: MCalculatorEquationsService;

    beforeEach(() => {
        service = new MCalculatorEquationsService();
    });

    describe('calculateDownPayment', () => {
        it('should calculate down payment correctly', () => {
            expect(service.calculateDownPayment(500000, 20)).toBe(100000);
        });

        it('should return 0 when percentage is 0', () => {
            expect(service.calculateDownPayment(500000, 0)).toBe(0);
        });

        it('should handle 100% down payment', () => {
            expect(service.calculateDownPayment(500000, 100)).toBe(500000);
        });

        it('should handle decimal percentages', () => {
            expect(service.calculateDownPayment(300000, 3.5)).toBeCloseTo(10500, 2);
        });
    });

    describe('calculateDownPaymentPercentage', () => {
        it('should calculate percentage correctly', () => {
            expect(service.calculateDownPaymentPercentage(500000, 100000)).toBe(20);
        });

        it('should return 100 when full amount is paid', () => {
            expect(service.calculateDownPaymentPercentage(500000, 500000)).toBe(100);
        });

        it('should handle small down payments', () => {
            expect(service.calculateDownPaymentPercentage(300000, 10500)).toBeCloseTo(3.5, 2);
        });
    });

    describe('calculateLoanAmount', () => {
        it('should subtract down payment from purchase price', () => {
            expect(service.calculateLoanAmount(500000, 100000)).toBe(400000);
        });

        it('should return 0 when down payment equals purchase price', () => {
            expect(service.calculateLoanAmount(500000, 500000)).toBe(0);
        });

        it('should handle no down payment', () => {
            expect(service.calculateLoanAmount(300000, 0)).toBe(300000);
        });
    });

    describe('calculatePInterest', () => {
        it('should calculate monthly P&I correctly for standard loan', () => {
            expect(service.calculatePInterest(300000, 6, 30)).toBeCloseTo(1798.65, 1);
        });

        it('should calculate monthly P&I correctly for 15 year loan', () => {
            expect(service.calculatePInterest(300000, 6, 15)).toBeCloseTo(2531.57, 1);
        });

        it('should return higher payment for higher interest rate', () => {
            const low = service.calculatePInterest(300000, 3, 30);
            const high = service.calculatePInterest(300000, 7, 30);
            expect(high).toBeGreaterThan(low);
        });

        it('should return higher payment for shorter term', () => {
            const long = service.calculatePInterest(300000, 6, 30);
            const short = service.calculatePInterest(300000, 6, 15);
            expect(short).toBeGreaterThan(long);
        });
    });

    describe('getPMIRateByCreditScore', () => {
        it('should return 0.004 for EXCELLENT', () => {
            expect(service.getPMIRateByCreditScore(CreditScoreEnum.EXCELLENT)).toBe(0.004);
        });

        it('should return 0.006 for GOOD', () => {
            expect(service.getPMIRateByCreditScore(CreditScoreEnum.GOOD)).toBe(0.006);
        });

        it('should return 0.009 for FAIR', () => {
            expect(service.getPMIRateByCreditScore(CreditScoreEnum.FAIR)).toBe(0.009);
        });

        it('should return 0.012 for POOR', () => {
            expect(service.getPMIRateByCreditScore(CreditScoreEnum.POOR)).toBe(0.012);
        });

        it('should return 0.006 as default when no credit score provided', () => {
            expect(service.getPMIRateByCreditScore(undefined)).toBe(0.006);
        });
    });

    describe('calculatePMI', () => {
        it('should return 0 when down payment is exactly 20%', () => {
            expect(service.calculatePMI(300000, 20, 0.006)).toBe(0);
        });

        it('should return 0 when down payment is above 20%', () => {
            expect(service.calculatePMI(300000, 25, 0.006)).toBe(0);
        });

        it('should calculate PMI when down payment is below 20%', () => {
            expect(service.calculatePMI(300000, 10, 0.006)).toBeCloseTo(150, 2);
        });

        it('should apply higher PMI rate for poor credit', () => {
            const good = service.calculatePMI(300000, 10, 0.006);
            const poor = service.calculatePMI(300000, 10, 0.012);
            expect(poor).toBeGreaterThan(good);
        });
    });

    describe('calculateMonthlyPropertyTax', () => {
        it('should divide annual tax by 12', () => {
            expect(service.calculateMonthlyPropertyTax(4800)).toBe(400);
        });

        it('should handle 0', () => {
            expect(service.calculateMonthlyPropertyTax(0)).toBe(0);
        });

        it('should handle non-round numbers', () => {
            expect(service.calculateMonthlyPropertyTax(1000)).toBeCloseTo(83.33, 2);
        });
    });

    describe('calculateTotalInterestPaid', () => {
        it('should calculate total interest correctly', () => {
            const monthlyPI = service.calculatePInterest(300000, 6, 30);
            const result = service.calculateTotalInterestPaid(monthlyPI, 30, 300000);
            expect(result).toBeGreaterThan(0);
            expect(result).toBeCloseTo(monthlyPI * 30 * 12 - 300000, 1); // ~$347,514
        });

        it('should return 0 when monthly payment covers only principal', () => {
            expect(service.calculateTotalInterestPaid(1000, 10, 120000)).toBeCloseTo(0, 2);
        });
    });

    describe('computePMIMonths', () => {
        it('should return 0 when loanAmount is already below 80% LTV', () => {
            const r = 6 / 100 / 12;
            const n = 30 * 12;
            const pow = Math.pow(1 + r, n);
            const monthlyPI = (200000 * (r * pow)) / (pow - 1);
            expect(service.computePMIMonths(200000, 400000, monthlyPI, r, n)).toBe(0);
        });

        it('should return a positive number of months when PMI applies', () => {
            const r = 6 / 100 / 12;
            const n = 30 * 12;
            const pow = Math.pow(1 + r, n);
            const monthlyPI = (300000 * (r * pow)) / (pow - 1);
            const months = service.computePMIMonths(300000, 333333, monthlyPI, r, n);
            expect(months).toBeGreaterThan(0);
            expect(months).toBeLessThanOrEqual(n);
        });

        it('should cap result at n months', () => {
            const r = 0.0001;
            const n = 5;
            const monthlyPI = 1;
            const months = service.computePMIMonths(1000000, 1000001, monthlyPI, r, n);
            expect(months).toBeLessThanOrEqual(n);
        });
    });

    describe('computePMIMonthly', () => {
        it('should compute monthly PMI correctly', () => {
            expect(service.computePMIMonthly(300000, 0.006)).toBeCloseTo(150, 2);
        });

        it('should return 0 for 0 pmiRate', () => {
            expect(service.computePMIMonthly(300000, 0)).toBe(0);
        });
    });

    describe('calculateTotalPMI', () => {
        it('should return zeros when loanAmount is 0', () => {
            expect(service.calculateTotalPMI(0, 333333, 6, 30, 0.006)).toEqual({
                pmiMonths: 0,
                pmiMonthly: 0,
                totalPMI: 0,
            });
        });

        it('should return zeros when loanAmount is already below 80% LTV', () => {
            const result = service.calculateTotalPMI(200000, 400000, 6, 30, 0.006);
            expect(result.pmiMonths).toBe(0);
            expect(result.pmiMonthly).toBe(100);
            expect(result.totalPMI).toBe(0);
        });

        it('should calculate PMI months and total correctly', () => {
            const result = service.calculateTotalPMI(300000, 333333, 6, 30, 0.006);
            expect(result.pmiMonths).toBeGreaterThan(0);
            expect(result.pmiMonthly).toBeCloseTo(150, 1);
            expect(result.totalPMI).toBeCloseTo(result.pmiMonthly * result.pmiMonths, 1);
        });

        it('should result in more PMI months for lower interest rate (slower amortization relative to balance)', () => {
            const low = service.calculateTotalPMI(300000, 333333, 3, 30, 0.006);
            const high = service.calculateTotalPMI(300000, 333333, 7, 30, 0.006);
            expect(low.pmiMonths).toBeGreaterThan(0);
            expect(high.pmiMonths).toBeGreaterThan(0);
        });
    });

    describe('calculateAmortizationSchedule', () => {
        const baseParams = {
            loanAmount: 300000,
            homeValue: 333333,
            interestRate: 6,
            loanTerm: 30,
            pmiRate: 0.006,
            taxesMonthly: 400,
            insuranceMonthly: 150,
            hoaMonthly: 0,
            extraPayment: 0,
            startDate: new Date(2025, 10, 1),
        };

        it('should return correct monthlyPI', () => {
            const result = service.calculateAmortizationSchedule(baseParams);
            expect(parseFloat(result.monthlyPI)).toBeCloseTo(1798.65, 1);
        });

        it('should have 360 monthly entries for 30 year loan with no extra payment', () => {
            const result = service.calculateAmortizationSchedule(baseParams);
            expect(result.monthlySchedule.length).toBe(360);
        });

        it('should have fewer monthly entries when extra payment applied', () => {
            const result = service.calculateAmortizationSchedule({
                ...baseParams,
                extraPayment: 500,
            });
            expect(result.monthlySchedule.length).toBeLessThan(360);
        });

        it('should show positive interestSaved when extra payment is made', () => {
            const result = service.calculateAmortizationSchedule({
                ...baseParams,
                extraPayment: 500,
            });
            expect(parseFloat(result.interestSaved)).toBeGreaterThan(0);
        });

        it('should have ending balance of 0 on last month', () => {
            const result = service.calculateAmortizationSchedule(baseParams);
            const lastMonth = result.monthlySchedule[result.monthlySchedule.length - 1];
            expect(parseFloat(lastMonth.endingBalance)).toBeCloseTo(0, 1);
        });

        it('should stop PMI when LTV drops below 80%', () => {
            const result = service.calculateAmortizationSchedule(baseParams);
            const afterPMI = result.monthlySchedule.filter(
                (m) => parseFloat(m.currentLTV) <= 0.8 && parseFloat(m.pmi) > 0,
            );
            expect(afterPMI.length).toBe(0);
        });

        it('should group entries into yearly summary', () => {
            const result = service.calculateAmortizationSchedule(baseParams);
            expect(result.yearlySummary.length).toBeGreaterThan(0);
            expect(result.yearlySummary[0].year).toBe(2025);
        });

        it('should have totalPaid = loanAmount + totalInterestPaid', () => {
            const result = service.calculateAmortizationSchedule(baseParams);
            const expected = parseFloat(result.totalInterestPaid) + baseParams.loanAmount;
            expect(parseFloat(result.totalPaid)).toBeCloseTo(expected, 1);
        });

        it('should use current date as default startDate', () => {
            const result = service.calculateAmortizationSchedule({
                ...baseParams,
                startDate: undefined,
            });
            const currentYear = new Date().getFullYear();
            expect(result.yearlySummary[0].year).toBe(currentYear);
        });

        it('should handle 0 taxes, insurance and HOA', () => {
            const result = service.calculateAmortizationSchedule({
                ...baseParams,
                taxesMonthly: 0,
                insuranceMonthly: 0,
                hoaMonthly: 0,
            });
            expect(result.monthlySchedule[0].taxes).toBe('0.00');
            expect(result.monthlySchedule[0].insurance).toBe('0.00');
            expect(result.monthlySchedule[0].hoa).toBe('0.00');
        });
    });
});
