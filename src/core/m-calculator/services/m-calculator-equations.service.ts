import { Injectable } from '@nestjs/common';
import { CreditScoreEnum } from '../../../common/enum';

@Injectable()
export class MCalculatorEquationsService {
    /**
     * Service grouping all the equations function for the mortgage calculator
     */

    /**
     * Calculates the down payment amount based on purchase price and percentage.
     * Applies a percentage-based computation and returns the resulting value.
     */
    calculateDownPayment = (purchasePrice: number, downPaymentPercentage: number): number =>
        (purchasePrice * downPaymentPercentage) / 100;

    /**
     * Calculates the down payment percentage based on purchase price and amount.
     * Applies a ratio-based computation and returns the resulting percentage value.
     */
    calculateDownPaymentPercentage = (purchasePrice: number, downPaymentAmount: number): number =>
        (downPaymentAmount / purchasePrice) * 100;

    /**
     * Calculates the loan amount based on purchase price and down payment.
     * Subtracts the down payment amount from the purchase price and returns the result.
     */
    calculateLoanAmount = (purchasePrice: number, downPaymentAmount: number): number =>
        purchasePrice - downPaymentAmount;

    /**
     * Calculates the monthly principal and interest payment for a loan.
     * Uses the standard amortization formula based on loan amount, interest rate,
     * and loan term converted into monthly periods.
     */
    calculatePInterest = (loanAmount: number, interestRate: number, loanTerm: number): number => {
        const r = interestRate / 100 / 12;
        const n = loanTerm * 12;
        return (loanAmount * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
    };

    /**
     * Resolves the PMI (Private Mortgage Insurance) rate based on the user's credit score.
     * Maps credit score categories to predefined risk-based PMI rates,
     * and returns a default rate when no score is provided.
     */
    getPMIRateByCreditScore = (creditScore?: CreditScoreEnum): number => {
        switch (creditScore) {
            case CreditScoreEnum.EXCELLENT:
                return 0.004;
            case CreditScoreEnum.GOOD:
                return 0.006;
            case CreditScoreEnum.FAIR:
                return 0.009;
            case CreditScoreEnum.POOR:
                return 0.012;
            default:
                return 0.006;
        }
    };

    /**
     * Calculates the monthly PMI (Private Mortgage Insurance) payment.
     * Applies PMI only when the down payment percentage is below 20%,
     * otherwise returns 0. Uses loan amount and PMI rate for computation.
     */
    calculatePMI = (loanAmount: number, downPaymentPercentage: number, pmiRate: number): number => {
        if (downPaymentPercentage >= 20) return 0;
        return (loanAmount * pmiRate) / 12;
    };

    /**
     * Calculates the monthly property tax amount.
     * Converts an annual property tax value into a monthly equivalent by dividing by 12.
     */
    calculateMonthlyPropertyTax = (annualPropertyTaxes: number): number => annualPropertyTaxes / 12;

    /**
     * Calculates the total interest paid over the life of a loan.
     * Derives total repayment from monthly payment and loan term,
     * then subtracts the principal loan amount to isolate interest paid.
     */
    calculateTotalInterestPaid = (
        monthlyPayment: number,
        loanTerm: number,
        loanAmount: number,
    ): number => monthlyPayment * (loanTerm * 12) - loanAmount;

    /**
     * Computes the number of months until the loan balance reaches 80% LTV,
     * using closed-form logarithmic formula with iterative amortization as fallback.
     */
    computePMIMonths(
        loanAmount: number,
        homeValue: number,
        monthlyPI: number,
        r: number,
        n: number,
    ): number {
        const Btarget = 0.8 * homeValue;

        if (loanAmount <= Btarget) return 0;

        const MrOverR = monthlyPI / r;
        const [numerator, denominator] = [Btarget - MrOverR, loanAmount - MrOverR];

        let k: number | null = null;

        if (denominator !== 0 && numerator / denominator > 0) {
            k = Math.ceil(Math.log(numerator / denominator) / Math.log(1 + r));
            if (!Number.isFinite(k) || k < 0) k = null;
        }

        if (k === null) {
            let balance = loanAmount;
            let month = 0;
            while (balance > Btarget && month < n) {
                const interest = balance * r;
                const principal = monthlyPI - interest;
                if (principal <= 0) {
                    month = n;
                    break;
                }
                balance -= principal;
                month++;
            }
            k = month;
        }

        return Math.min(k, n);
    }

    /**
     * Computes the monthly PMI charge based on the original loan amount and annual PMI rate.
     */
    computePMIMonthly = (loanAmount: number, pmiRate: number): number =>
        (loanAmount * pmiRate) / 12;

    /**
     * Determines the total PMI cost over the loan lifetime by calculating how many months
     * PMI applies before the loan reaches 80% LTV, then multiplying by the monthly PMI charge.
     */
    calculateTotalPMI = (
        loanAmount: number,
        homeValue: number,
        interestRate: number,
        loanTerm: number,
        pmiRate: number,
    ): { pmiMonths: number; pmiMonthly: number; totalPMI: number } => {
        if (loanAmount <= 0) return { pmiMonths: 0, pmiMonthly: 0, totalPMI: 0 };

        const r = interestRate / 100 / 12;
        const n = loanTerm * 12;
        const pow = Math.pow(1 + r, n);
        const monthlyPI = (loanAmount * (r * pow)) / (pow - 1);

        const pmiMonths = this.computePMIMonths(loanAmount, homeValue, monthlyPI, r, n);
        const pmiMonthly = this.computePMIMonthly(loanAmount, pmiRate);
        const totalPMI = pmiMonthly * pmiMonths;

        return {
            pmiMonths,
            pmiMonthly: Number(pmiMonthly.toFixed(2)),
            totalPMI: Number(totalPMI.toFixed(2)),
        };
    };

    /**
     * Builds a single monthly amortization entry including principal, interest, PMI,
     * taxes, insurance, HOA, cumulative interest, LTV, and payment date.
     */
    buildMonthlyEntry(params: {
        month: number;
        balance: number;
        principal: number;
        interest: number;
        extraPayment: number;
        pmiMonthly: number;
        taxesMonthly: number;
        insuranceMonthly: number;
        hoaMonthly: number;
        totalInterest: number;
        homeValue: number;
        startDate: Date;
        partialFinalMonth: boolean;
    }): ReturnType<typeof this.calculateAmortizationSchedule>['monthlySchedule'][number] {
        const {
            month,
            balance,
            principal,
            interest,
            extraPayment,
            pmiMonthly,
            taxesMonthly,
            insuranceMonthly,
            hoaMonthly,
            totalInterest,
            homeValue,
            startDate,
            partialFinalMonth,
        } = params;

        const totalPayment =
            principal + interest + pmiMonthly + taxesMonthly + insuranceMonthly + hoaMonthly;
        const paymentDate = new Date(
            startDate.getFullYear(),
            startDate.getMonth() + month,
            startDate.getDate(),
        );

        return {
            month: month + 1,
            paymentDate: paymentDate.toISOString().split('T')[0],
            beginningBalance: balance.toFixed(2),
            principalPaid: principal.toFixed(2),
            interestPaid: interest.toFixed(2),
            extraPayment: extraPayment.toFixed(2),
            pmi: pmiMonthly.toFixed(2),
            taxes: taxesMonthly.toFixed(2),
            insurance: insuranceMonthly.toFixed(2),
            hoa: hoaMonthly.toFixed(2),
            totalPayment: totalPayment.toFixed(2),
            endingBalance: (balance - principal).toFixed(2),
            cumulativeInterest: (totalInterest + interest).toFixed(2),
            currentLTV: (balance / homeValue).toFixed(4),
            partialFinalMonth,
        };
    }

    /**
     * Accumulates monthly payment values into the corresponding yearly summary entry,
     * creating a new yearly entry if one does not yet exist for the given payment date's year.
     */
    accumulateYearlyEntry(
        yearlySummary: ReturnType<typeof this.calculateAmortizationSchedule>['yearlySummary'],
        paymentDate: Date,
        values: {
            principal: number;
            interest: number;
            extraPayment: number;
            pmiMonthly: number;
            taxesMonthly: number;
            insuranceMonthly: number;
            hoaMonthly: number;
            totalPayment: number;
            endingBalance: number;
        },
    ): void {
        const year = paymentDate.getFullYear();
        let yearEntry = yearlySummary.find((y) => y.year === year);

        if (!yearEntry) {
            yearEntry = {
                year,
                principalPaid: 0 as any,
                interestPaid: 0 as any,
                extraPayment: 0 as any,
                pmi: 0 as any,
                taxes: 0 as any,
                insurance: 0 as any,
                hoa: 0 as any,
                totalPayment: 0 as any,
                endingBalance: 0 as any,
            };
            yearlySummary.push(yearEntry);
        }

        (yearEntry.principalPaid as any) += values.principal;
        (yearEntry.interestPaid as any) += values.interest;
        (yearEntry.extraPayment as any) += values.extraPayment;
        (yearEntry.pmi as any) += values.pmiMonthly;
        (yearEntry.taxes as any) += values.taxesMonthly;
        (yearEntry.insurance as any) += values.insuranceMonthly;
        (yearEntry.hoa as any) += values.hoaMonthly;
        (yearEntry.totalPayment as any) += values.totalPayment;
        (yearEntry.endingBalance as any) = values.endingBalance;
    }

    /**
     * Formats all numeric fields in the yearly summary entries to two decimal places,
     * preserving the year field as an integer.
     */
    formatYearlySummary(
        yearlySummary: ReturnType<typeof this.calculateAmortizationSchedule>['yearlySummary'],
    ): void {
        yearlySummary.forEach((y) => {
            Object.keys(y).forEach((k) => {
                if (k !== 'year') (y as any)[k] = Number((y as any)[k]).toFixed(2);
            });
        });
    }

    /**
     * Generates a full amortization schedule including monthly and yearly breakdowns,
     * accounting for extra payments, PMI cancellation at 80% LTV, taxes, insurance, and HOA.
     * Returns summary figures such as total interest paid, total paid, and interest saved
     * compared to a standard schedule without extra payments.
     */
    calculateAmortizationSchedule = (params: {
        loanAmount: number;
        homeValue: number;
        interestRate: number;
        loanTerm: number;
        pmiRate: number;
        taxesMonthly?: number;
        insuranceMonthly?: number;
        hoaMonthly?: number;
        extraPayment?: number;
        startDate?: Date;
    }): {
        monthlyPI: string;
        monthsToPayoff: number;
        yearsToPayoff: string;
        totalInterestPaid: string;
        totalPaid: string;
        interestSaved: string;
        monthlySchedule: {
            month: number;
            paymentDate: string;
            beginningBalance: string;
            principalPaid: string;
            interestPaid: string;
            extraPayment: string;
            pmi: string;
            taxes: string;
            insurance: string;
            hoa: string;
            totalPayment: string;
            endingBalance: string;
            cumulativeInterest: string;
            currentLTV: string;
            partialFinalMonth: boolean;
        }[];
        yearlySummary: {
            year: number;
            principalPaid: string;
            interestPaid: string;
            extraPayment: string;
            pmi: string;
            taxes: string;
            insurance: string;
            hoa: string;
            totalPayment: string;
            endingBalance: string;
        }[];
    } => {
        const {
            loanAmount,
            homeValue,
            interestRate,
            loanTerm,
            pmiRate,
            taxesMonthly = 0,
            insuranceMonthly = 0,
            hoaMonthly = 0,
            extraPayment = 0,
            startDate = new Date(),
        } = params;

        const r = interestRate / 100 / 12;
        const n = loanTerm * 12;
        const pow = Math.pow(1 + r, n);
        const monthlyPI = (loanAmount * (r * pow)) / (pow - 1);

        let balance = loanAmount;
        let totalInterest = 0;
        let month = 0;

        const monthlySchedule: ReturnType<
            typeof this.calculateAmortizationSchedule
        >['monthlySchedule'] = [];
        const yearlySummary: ReturnType<
            typeof this.calculateAmortizationSchedule
        >['yearlySummary'] = [];

        while (balance > 0) {
            const interest = balance * r;
            let principal = monthlyPI - interest + extraPayment;
            let partialFinalMonth = false;

            if (principal > balance) {
                partialFinalMonth = true;
                principal = balance;
            }

            const currentLTV = balance / homeValue;
            const pmiMonthly = currentLTV > 0.8 ? (loanAmount * pmiRate) / 12 : 0;
            const totalPayment =
                principal + interest + pmiMonthly + taxesMonthly + insuranceMonthly + hoaMonthly;
            const paymentDate = new Date(
                startDate.getFullYear(),
                startDate.getMonth() + month,
                startDate.getDate(),
            );

            monthlySchedule.push(
                this.buildMonthlyEntry({
                    month,
                    balance,
                    principal,
                    interest,
                    extraPayment,
                    pmiMonthly,
                    taxesMonthly,
                    insuranceMonthly,
                    hoaMonthly,
                    totalInterest,
                    homeValue,
                    startDate,
                    partialFinalMonth,
                }),
            );

            this.accumulateYearlyEntry(yearlySummary, paymentDate, {
                principal,
                interest,
                extraPayment,
                pmiMonthly,
                taxesMonthly,
                insuranceMonthly,
                hoaMonthly,
                totalPayment,
                endingBalance: balance - principal,
            });

            balance -= principal;
            totalInterest += interest;
            month++;
        }

        this.formatYearlySummary(yearlySummary);

        const totalInterestWithoutExtra = monthlyPI * n - loanAmount;

        return {
            monthlyPI: monthlyPI.toFixed(2),
            monthsToPayoff: month,
            yearsToPayoff: (month / 12).toFixed(2),
            totalInterestPaid: totalInterest.toFixed(2),
            totalPaid: (loanAmount + totalInterest).toFixed(2),
            interestSaved: (totalInterestWithoutExtra - totalInterest).toFixed(2),
            monthlySchedule,
            yearlySummary,
        };
    };
}
