import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { RAnalysisService } from './r-analysis.service';

export interface TaxDeductionYear {
    year: number;
    depreciation: number;
    totalInterestPaid: number;
    totalDeduction: number;
}

export interface TaxDeductionSummaryResult {
    years: TaxDeductionYear[];
    total5YearDeductions: number;
    totalSavingsOver5Years: number;
    averagePerYear: number;
    totalROIOnTaxSavings: number;
}

export interface FullBreakdownInput {
    depreciationAmount: number;
    estimatedCashToClose: number;
    incomeTaxRate: number;

    loanAmount: number;
    loanInterest: number;
    loanLength: number;
    pi: number;

    purchasePrice: number;
    annualAppreciationRate: number;

    projectionYears?: number[];
    appreciationRateOverride?: number;
    incomeIncreasePerYear?: number;
    expenseIncreasePerYear?: number;
    sellingCosts?: number;

    grossRent: number;
    vacancy: number;
    otherMonthlyIncome: number;
    propertyTaxes: number;
    insurance: number;
    propertyManagement: number;
    maintenance: number;
    capitalReserves: number;
    annualDebtService: number;
    yearlyFixedExpenses: number;
}

export interface PaydownYear {
    year: number;
    totalDebtPaidDown: number;
    totalROIFromPaydown: number;
}

export interface PaydownSummaryResult {
    years: PaydownYear[];
    total5YearDebtPaidDown: number;
    averageAnnualROIFromPaydown: number;
}

export interface AppreciationYear {
    year: number;
    estimatedValue: number;
    annualGain: number;
    gainPercent: number;
}

export interface AppreciationSummaryResult {
    appreciationRate: number;
    years: AppreciationYear[];
    totalReturn: {
        years: number[];
        cashFlow: number;
        debtPaydown: number;
        taxSavings: number;
        appreciation: number;
        totalROI: number;
        totalReturn: number;
    };
}

export interface BuyHoldYear {
    year: number;
    grossRent: number;
    vacancy: number;
    otherIncome: number;
    operatingIncome: number;
    propertyTaxes: number;
    insurance: number;
    propertyManagement: number;
    maintenance: number;
    capitalReserves: number;
    totalOperatingExpenses: number;
    netOperatingIncome: number;
    loanPayment: number;
    cashFlow: number;
    operatingExpenses: number;
    mortgageInterest: number;
    depreciation: number;
    totalDeductions: number;
    propertyValue: number;
    loanBalance: number;
    ltv: number;
    totalEquity: number;
    equity: number;
    annualCashFlow: number;
    nonProceedsROI: number;
    cumulativeCashFlow: number;
    totalDebt: number;
    totalProfit: number;
}

export interface BuyHoldProjectionsResult {
    projectionParameters: {
        appreciation: number;
        incomeIncrease: number;
        expenseIncrease: number;
        sellingCosts: number;
    };
    years: BuyHoldYear[];
}

@Injectable()
export class RentalFullBreakdownCalculatorService {
    /**
     * Service responsible for the full breakdown page calculations across all 4 tabs
     */

    constructor(
        @Inject(forwardRef(() => RAnalysisService))
        private readonly service: RAnalysisService,
    ) {}

    /**
     * Computes total interest paid in a given year using amortization schedule.
     * Iterates month by month over the year and sums the interest portion.
     */
    computeYearlyInterestPaid = (
        loanAmount: number,
        annualRate: number,
        loanTermMonths: number,
        year: number,
    ): number => {
        if (annualRate === 0 || loanAmount === 0) return 0;

        const r = annualRate / 100 / 12;
        const monthlyPayment =
            (loanAmount * r * Math.pow(1 + r, loanTermMonths)) /
            (Math.pow(1 + r, loanTermMonths) - 1);

        let balance = loanAmount;
        let totalInterest = 0;

        const startMonth = (year - 1) * 12;
        const endMonth = year * 12;

        for (let i = 0; i < endMonth; i++) {
            const interest = balance * r;
            const principal = monthlyPayment - interest;
            if (i >= startMonth) totalInterest += interest;
            balance -= principal;
        }

        return totalInterest;
    };

    /** Computes remaining loan balance after a given number of months */
    computeLoanBalance = (
        loanAmount: number,
        annualRate: number,
        loanTermMonths: number,
        monthsElapsed: number,
    ): number => {
        if (annualRate === 0 || loanAmount === 0) {
            return Math.max(0, loanAmount - (loanAmount / loanTermMonths) * monthsElapsed);
        }

        const r = annualRate / 100 / 12;
        const monthlyPayment =
            (loanAmount * r * Math.pow(1 + r, loanTermMonths)) /
            (Math.pow(1 + r, loanTermMonths) - 1);

        let balance = loanAmount;
        const months = Math.min(monthsElapsed, loanTermMonths);
        for (let i = 0; i < months; i++) {
            const interest = balance * r;
            const principal = monthlyPayment - interest;
            balance -= principal;
        }

        return Math.max(0, balance);
    };

    /** Computes tax deduction data for a single year */
    computeTaxDeductionYear = (
        year: number,
        depreciationAmount: number,
        loanAmount: number,
        annualRate: number,
        loanTermMonths: number,
    ): TaxDeductionYear => {
        const totalInterestPaid = this.computeYearlyInterestPaid(
            loanAmount,
            annualRate,
            loanTermMonths,
            year,
        );
        const totalDeduction = depreciationAmount + totalInterestPaid;

        return {
            year,
            depreciation: this.service.otherUtils.r2(depreciationAmount),
            totalInterestPaid: this.service.otherUtils.r2(totalInterestPaid),
            totalDeduction: this.service.otherUtils.r2(totalDeduction),
        };
    };

    /** Orchestrates the 5-year tax deduction summary */
    computeTaxDeductionSummary = (
        depreciationAmount: number,
        loanAmount: number,
        annualRate: number,
        loanTermMonths: number,
        incomeTaxRate: number,
        estimatedCashToClose: number,
    ): TaxDeductionSummaryResult => {
        const years = [1, 2, 3, 4, 5].map((y) =>
            this.computeTaxDeductionYear(
                y,
                depreciationAmount,
                loanAmount,
                annualRate,
                loanTermMonths,
            ),
        );

        const total5YearDeductions = years.reduce((s, y) => s + y.totalDeduction, 0);
        const totalSavingsOver5Years = total5YearDeductions * (incomeTaxRate / 100);
        const averagePerYear = total5YearDeductions / 5;
        const annualROIOnTaxSavings =
            estimatedCashToClose === 0 ? 0 : (totalSavingsOver5Years / estimatedCashToClose) * 100;

        return {
            years,
            total5YearDeductions: this.service.otherUtils.r2(total5YearDeductions),
            totalSavingsOver5Years: this.service.otherUtils.r2(totalSavingsOver5Years),
            averagePerYear: this.service.otherUtils.r2(averagePerYear),
            totalROIOnTaxSavings: this.service.otherUtils.r2(annualROIOnTaxSavings),
        };
    };

    /** Computes debt paydown data for a single year */
    computePaydownYear = (
        year: number,
        pi: number,
        loanAmount: number,
        annualRate: number,
        loanTermMonths: number,
        estimatedCashToClose: number,
    ): PaydownYear => {
        const totalInterestPaid = this.computeYearlyInterestPaid(
            loanAmount,
            annualRate,
            loanTermMonths,
            year,
        );
        const totalDebtPaidDown = pi * 12 - totalInterestPaid;
        const totalROIFromPaydown =
            estimatedCashToClose === 0 ? 0 : (totalDebtPaidDown / estimatedCashToClose) * 100;

        return {
            year,
            totalDebtPaidDown: this.service.otherUtils.r2(totalDebtPaidDown),
            totalROIFromPaydown: this.service.otherUtils.r2(totalROIFromPaydown),
        };
    };

    /** Orchestrates the 5-year paydown summary */
    computePaydownSummary = (
        pi: number,
        loanAmount: number,
        annualRate: number,
        loanTermMonths: number,
        estimatedCashToClose: number,
    ): PaydownSummaryResult => {
        const years = [1, 2, 3, 4, 5].map((y) =>
            this.computePaydownYear(
                y,
                pi,
                loanAmount,
                annualRate,
                loanTermMonths,
                estimatedCashToClose,
            ),
        );

        const total5YearDebtPaidDown = years.reduce((s, y) => s + y.totalDebtPaidDown, 0);
        const averageAnnualROIFromPaydown =
            years.reduce((s, y) => s + y.totalROIFromPaydown, 0) / 5;

        return {
            years,
            total5YearDebtPaidDown: this.service.otherUtils.r2(total5YearDebtPaidDown),
            averageAnnualROIFromPaydown: this.service.otherUtils.r2(averageAnnualROIFromPaydown),
        };
    };

    /** Computes estimated property value at end of a given year */
    computeEstimatedValue = (
        purchasePrice: number,
        annualAppreciationRate: number,
        year: number,
    ): number => purchasePrice * Math.pow(1 + annualAppreciationRate / 100, year);

    /** Orchestrates the 5-year appreciation summary */
    computeAppreciationSummary = (
        purchasePrice: number,
        annualAppreciationRate: number,
        cashFlow: number,
        debtPaydown: number,
        taxSavingsPercent: number,
    ): AppreciationSummaryResult => {
        let previousValue = purchasePrice;

        const years: AppreciationYear[] = [1, 2, 3, 4, 5].map((y) => {
            const estimatedValue = this.computeEstimatedValue(
                purchasePrice,
                annualAppreciationRate,
                y,
            );
            const annualGain = estimatedValue - previousValue;
            const gainPercent = purchasePrice === 0 ? 0 : (annualGain / purchasePrice) * 100;
            previousValue = estimatedValue;

            return {
                year: y,
                estimatedValue: this.service.otherUtils.r2(estimatedValue),
                annualGain: this.service.otherUtils.r2(annualGain),
                gainPercent: this.service.otherUtils.r2(gainPercent),
            };
        });

        const appreciationPercent = annualAppreciationRate;
        const totalROI = cashFlow + debtPaydown + taxSavingsPercent + appreciationPercent;
        const totalReturn = this.computeEstimatedValue(purchasePrice, annualAppreciationRate, 5);

        return {
            appreciationRate: annualAppreciationRate,
            years,
            totalReturn: {
                years: [1, 2, 3, 4, 5],
                cashFlow: this.service.otherUtils.r2(cashFlow),
                debtPaydown: this.service.otherUtils.r2(debtPaydown),
                taxSavings: this.service.otherUtils.r2(taxSavingsPercent),
                appreciation: this.service.otherUtils.r2(appreciationPercent),
                totalROI: this.service.otherUtils.r2(totalROI),
                totalReturn: this.service.otherUtils.r2(totalReturn),
            },
        };
    };

    /** Computes buy & hold projection for a single year with compounded growth */
    computeBuyHoldYear = (
        year: number,
        input: FullBreakdownInput,
        incomeMultiplier: number,
        expenseMultiplier: number,
    ): BuyHoldYear => {
        const appreciationRate = input.appreciationRateOverride ?? input.annualAppreciationRate;
        const vacancyRate = input.vacancy ?? 5;
        const sellingCosts = input.sellingCosts ?? 6;

        const grossRent = input.grossRent * incomeMultiplier * 12;
        const vacancyAmt = grossRent * (vacancyRate / 100);
        const otherIncome = input.otherMonthlyIncome * incomeMultiplier * 12;
        const operatingIncome = grossRent - vacancyAmt + otherIncome;

        const propertyTaxes = input.propertyTaxes * expenseMultiplier * 12;
        const insurance = input.insurance * expenseMultiplier * 12;
        const propertyManagement = operatingIncome * (input.propertyManagement / 100);
        const maintenance = input.maintenance * expenseMultiplier * 12;
        const capitalReserves = input.capitalReserves * expenseMultiplier * 12;
        const totalOperatingExpenses =
            propertyTaxes + insurance + propertyManagement + maintenance + capitalReserves;

        const netOperatingIncome = operatingIncome - totalOperatingExpenses;
        const loanPayment = input.annualDebtService;
        const cashFlow = netOperatingIncome - loanPayment;

        const mortgageInterest = this.computeYearlyInterestPaid(
            input.loanAmount,
            input.loanInterest,
            input.loanLength,
            year,
        );
        const depreciation = input.depreciationAmount;
        const operatingExpenses = totalOperatingExpenses;
        const totalDeductions = operatingExpenses + mortgageInterest + depreciation;

        const propertyValue = input.purchasePrice * Math.pow(1 + appreciationRate / 100, year);
        const loanBalance = this.computeLoanBalance(
            input.loanAmount,
            input.loanInterest,
            input.loanLength,
            year * 12,
        );
        const ltv = propertyValue === 0 ? 0 : (loanBalance / propertyValue) * 100;
        const totalEquity = propertyValue - loanBalance;

        const equity = totalEquity;
        const annualCashFlowVal = cashFlow;
        const nonProceedsROI =
            input.estimatedCashToClose === 0
                ? 0
                : (annualCashFlowVal / input.estimatedCashToClose) * 100;
        const cumulativeCashFlow = cashFlow * year;
        const totalDebt = loanBalance;
        const totalProfit =
            propertyValue * (1 - sellingCosts / 100) - loanBalance + cumulativeCashFlow;

        return {
            year,
            grossRent: this.service.otherUtils.r2(grossRent),
            vacancy: this.service.otherUtils.r2(vacancyAmt),
            otherIncome: this.service.otherUtils.r2(otherIncome),
            operatingIncome: this.service.otherUtils.r2(operatingIncome),
            propertyTaxes: this.service.otherUtils.r2(propertyTaxes),
            insurance: this.service.otherUtils.r2(insurance),
            propertyManagement: this.service.otherUtils.r2(propertyManagement),
            maintenance: this.service.otherUtils.r2(maintenance),
            capitalReserves: this.service.otherUtils.r2(capitalReserves),
            totalOperatingExpenses: this.service.otherUtils.r2(totalOperatingExpenses),
            netOperatingIncome: this.service.otherUtils.r2(netOperatingIncome),
            loanPayment: this.service.otherUtils.r2(loanPayment),
            cashFlow: this.service.otherUtils.r2(cashFlow),
            operatingExpenses: this.service.otherUtils.r2(operatingExpenses),
            mortgageInterest: this.service.otherUtils.r2(mortgageInterest),
            depreciation: this.service.otherUtils.r2(depreciation),
            totalDeductions: this.service.otherUtils.r2(totalDeductions),
            propertyValue: this.service.otherUtils.r2(propertyValue),
            loanBalance: this.service.otherUtils.r2(loanBalance),
            ltv: this.service.otherUtils.r2(ltv),
            totalEquity: this.service.otherUtils.r2(totalEquity),
            equity: this.service.otherUtils.r2(equity),
            annualCashFlow: this.service.otherUtils.r2(annualCashFlowVal),
            nonProceedsROI: this.service.otherUtils.r2(nonProceedsROI),
            cumulativeCashFlow: this.service.otherUtils.r2(cumulativeCashFlow),
            totalDebt: this.service.otherUtils.r2(totalDebt),
            totalProfit: this.service.otherUtils.r2(totalProfit),
        };
    };

    /** Orchestrates buy & hold projections for all requested years */
    computeBuyHoldProjections = (input: FullBreakdownInput): BuyHoldProjectionsResult => {
        const years = input.projectionYears ?? [1, 2, 3, 5, 10, 30];
        const incomeIncrease = input.incomeIncreasePerYear ?? 0;
        const expenseIncrease = input.expenseIncreasePerYear ?? 0;

        const projectedYears = years.map((y) => {
            const incomeMultiplier = Math.pow(1 + incomeIncrease / 100, y - 1);
            const expenseMultiplier = Math.pow(1 + expenseIncrease / 100, y - 1);
            return this.computeBuyHoldYear(y, input, incomeMultiplier, expenseMultiplier);
        });

        return {
            projectionParameters: {
                appreciation: input.appreciationRateOverride ?? input.annualAppreciationRate,
                incomeIncrease: incomeIncrease,
                expenseIncrease: expenseIncrease,
                sellingCosts: input.sellingCosts ?? 6,
            },
            years: projectedYears,
        };
    };
}
