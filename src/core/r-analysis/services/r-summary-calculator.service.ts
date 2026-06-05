import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { RAnalysisService } from './r-analysis.service';

export interface RentalSummaryInput {
    numberOfUnits: number;
    purchasePrice: number;
    acquisitionCost: number;
    loanInterest: number;
    loanLength: number;

    estimatedCashToClose: number;
    yearlyCashFlow: number;
    fixedExpensesTotal: number;
    projectedMonthlyRent: number;

    depreciationPercent: number;
    yearsToExit: number;
    annualAppreciationRate: number;
    additionalEquity: number;

    incomeTaxRate: number;

    pi: number;
    ltvAmount: number;
}

export interface CumulativeProjection {
    years: number;
    cashFlow: number;
    debtPaydown: number;
    totalReturn: number;
}

export interface RentalSummaryResult {
    costPerUnit: {
        amount: number;
        basedOnUnits: number;
    };

    incomeStatement: {
        yearly: {
            goi: number;
            operatingExpenses: number;
            noi: number;
        };
        monthly: {
            goi: number;
            operatingExpenses: number;
            noi: number;
        };
        cashFlowPercent: number;
    };

    estimatedTaxDeductions: {
        depreciationAmount: number;
        incomeTaxRate: number;
        taxDeductionROI: number;
        propertyDepreciationTaxDeduction: number;
        taxCredit: number;
        totalTaxCreditOverLifeOfLoan: number;
        taxDeductionROIPercent: number;
    };

    propertyAppreciation: {
        initialEquityPurchase: number;
        equityLeverage: number;
        propertyAppreciation: number;
        totalPrincipalPaydown: number;
        totalEquityOwned: number;
        fullTermROI: number;
        annualizedROI: number;
    };

    breakEvenRatio: number;

    combinedAnnualizedROI: {
        cashOnCashROI: number;
        taxDeductionROI: number;
        annualizedROI: number;
        totalROIFromAllSources: number;
    };

    cumulativeProjections: {
        fiveYears: CumulativeProjection;
        tenYears: CumulativeProjection;
        fifteenYears: CumulativeProjection;
    };
}

@Injectable()
export class RentalSummaryCalculatorService {
    /**
     * Service responsible for rental analysis summary page calculations
     */

    constructor(
        @Inject(forwardRef(() => RAnalysisService))
        private readonly service: RAnalysisService,
    ) {}

    /** Computes cost per unit as total purchase cost divided by number of units */
    computeCostPerUnit = (totalPurchaseCost: number, numberOfUnits: number): number =>
        numberOfUnits === 0 ? 0 : totalPurchaseCost / numberOfUnits;

    /** Computes the income statement with yearly and monthly breakdowns */
    computeIncomeStatement = (
        projectedMonthlyRent: number,
        fixedExpensesTotal: number,
        yearlyCashFlow: number,
        estimatedCashToClose: number,
    ) => {
        const yearlyGoi = projectedMonthlyRent * 12;
        const monthlyGoi = projectedMonthlyRent;
        const yearlyOpEx = fixedExpensesTotal * 12;
        const monthlyOpEx = fixedExpensesTotal;
        const r = this.service.otherUtils.r2.bind(this.service.otherUtils);

        return {
            yearly: {
                goi: r(yearlyGoi),
                operatingExpenses: r(yearlyOpEx),
                noi: r(yearlyGoi - yearlyOpEx),
            },
            monthly: {
                goi: r(monthlyGoi),
                operatingExpenses: r(monthlyOpEx),
                noi: r(monthlyGoi - monthlyOpEx),
            },
            cashFlowPercent: r(
                estimatedCashToClose === 0 ? 0 : (yearlyCashFlow / estimatedCashToClose) * 100,
            ),
        };
    };

    /** Computes the depreciation dollar amount as purchase price multiplied by depreciation percentage */
    computeDepreciationAmount = (purchasePrice: number, depreciationPercent: number): number =>
        purchasePrice * (depreciationPercent / 100);

    /** Computes the annual property depreciation tax deduction by dividing the depreciation amount by 27.5 */
    computePropertyDepreciationTaxDeduction = (depreciationAmount: number): number =>
        depreciationAmount / 27.5;

    /** Computes the annual tax credit as depreciation tax deduction multiplied by income tax rate */
    computeTaxCredit = (propertyDepreciationTaxDeduction: number, incomeTaxRate: number): number =>
        propertyDepreciationTaxDeduction * (incomeTaxRate / 100);

    /** Computes the total tax credit over the life of the loan by multiplying the annual tax credit by 30 */
    computeTotalTaxCreditOverLifeOfLoan = (taxCredit: number): number => taxCredit * 30;

    /**
     * Computes the tax deduction ROI.
     * Formula: (depreciation dollar amount x income tax rate) / total cash invested
     */
    computeTaxDeductionROI = (
        depreciationAmount: number,
        incomeTaxRate: number,
        totalCashInvested: number,
    ): number =>
        totalCashInvested === 0
            ? 0
            : (depreciationAmount * (incomeTaxRate / 100)) / totalCashInvested;

    /**
     * Computes the tax deduction ROI percentage.
     * Formula: (total tax credit over life of loan / cash to close) x 100
     */
    computeTaxDeductionROIPercent = (
        totalTaxCreditOverLifeOfLoan: number,
        cashToClose: number,
    ): number => (cashToClose === 0 ? 0 : (totalTaxCreditOverLifeOfLoan / cashToClose) * 100);

    computeEstimatedTaxDeductions = (
        purchasePrice: number,
        depreciationPercent: number,
        incomeTaxRate: number,
        estimatedCashToClose: number,
    ) => {
        const depreciationAmount = this.computeDepreciationAmount(
            purchasePrice,
            depreciationPercent,
        );
        const propertyDepreciationTaxDeduction =
            this.computePropertyDepreciationTaxDeduction(depreciationAmount);
        const taxCredit = this.computeTaxCredit(propertyDepreciationTaxDeduction, incomeTaxRate);
        const totalTaxCreditOverLifeOfLoan = this.computeTotalTaxCreditOverLifeOfLoan(taxCredit);
        const taxDeductionROI = this.computeTaxDeductionROI(
            depreciationAmount,
            incomeTaxRate,
            estimatedCashToClose,
        );
        const taxDeductionROIPercent = this.computeTaxDeductionROIPercent(
            totalTaxCreditOverLifeOfLoan,
            estimatedCashToClose,
        );
        const r = this.service.otherUtils.r2.bind(this.service.otherUtils);

        return {
            depreciationAmount: r(depreciationAmount),
            incomeTaxRate: r(incomeTaxRate),
            taxDeductionROI: r(taxDeductionROI),
            propertyDepreciationTaxDeduction: r(propertyDepreciationTaxDeduction),
            taxCredit: r(taxCredit),
            totalTaxCreditOverLifeOfLoan: r(totalTaxCreditOverLifeOfLoan),
            taxDeductionROIPercent: r(taxDeductionROIPercent),
        };
    };

    /**
     * Computes property appreciation using compound growth.
     * Formula: (equityLeverage * (1 + rate)^(yearsToExit - 1)) - equityLeverage
     */
    computePropertyAppreciation = (
        equityLeverage: number,
        annualAppreciationRate: number,
        yearsToExit: number,
    ): number =>
        equityLeverage * Math.pow(1 + annualAppreciationRate / 100, yearsToExit - 1) -
        equityLeverage;

    /**
     * Computes cumulative principal paydown using the CUMPRINC formula.
     * Equivalent to Excel: =CUMPRINC(rate/12, term*12, pv, 1, periods, 0) * -1
     */
    computeCumPrinc = (
        annualRate: number,
        loanTermMonths: number,
        loanAmount: number,
        periodsInMonths: number,
    ): number => {
        if (annualRate === 0 || loanAmount === 0) {
            return (loanAmount / loanTermMonths) * periodsInMonths;
        }

        const r = annualRate / 100 / 12;
        const monthlyPayment =
            (loanAmount * r * Math.pow(1 + r, loanTermMonths)) /
            (Math.pow(1 + r, loanTermMonths) - 1);

        let balance = loanAmount;
        let totalPrincipal = 0;

        const months = Math.min(periodsInMonths, loanTermMonths);
        for (let i = 0; i < months; i++) {
            const interestPayment = balance * r;
            const principalPayment = monthlyPayment - interestPayment;
            totalPrincipal += principalPayment;
            balance -= principalPayment;
        }

        return totalPrincipal;
    };

    /** Computes total equity owned: initial equity + additional equity + appreciation + principal paydown */
    computeTotalEquityOwned = (
        initialEquityPurchase: number,
        additionalEquity: number,
        propertyAppreciation: number,
        totalPrincipalPaydown: number,
    ): number =>
        initialEquityPurchase + additionalEquity + propertyAppreciation + totalPrincipalPaydown;

    /**
     * Computes full term ROI.
     * Formula: (total equity owned - initial equity purchase + total cumulative cash flow) / initial equity purchase
     */
    computeFullTermROI = (
        totalEquityOwned: number,
        initialEquityPurchase: number,
        totalCumulativeCashFlow: number,
    ): number =>
        initialEquityPurchase === 0
            ? 0
            : (totalEquityOwned - initialEquityPurchase + totalCumulativeCashFlow) /
              initialEquityPurchase;

    /**
     * Computes annualized ROI.
     * Formula: ((1 + fullTermROI)^(1/yearsToExit)) - 1
     */
    computeAnnualizedROI = (fullTermROI: number, yearsToExit: number): number => {
        if (yearsToExit === 0) return 0;
        const base = 1 + fullTermROI;
        if (base <= 0) return -1;
        return Math.pow(base, 1 / yearsToExit) - 1;
    };

    computePropertyAppreciationBlock = (
        purchasePrice: number,
        additionalEquity: number,
        annualAppreciationRate: number,
        yearsToExit: number,
        estimatedCashToClose: number,
        loanInterest: number,
        loanLength: number,
        ltvAmount: number,
        yearlyCashFlow: number,
    ) => {
        const initialEquityPurchase = estimatedCashToClose;
        const equityLeverage = purchasePrice + additionalEquity;
        const propertyAppreciation = this.computePropertyAppreciation(
            equityLeverage,
            annualAppreciationRate,
            yearsToExit,
        );
        const totalPrincipalPaydown = this.computeCumPrinc(
            loanInterest,
            loanLength,
            ltvAmount,
            yearsToExit * 12,
        );
        const totalEquityOwned = this.computeTotalEquityOwned(
            initialEquityPurchase,
            additionalEquity,
            propertyAppreciation,
            totalPrincipalPaydown,
        );
        const totalCumulativeCashFlow = yearlyCashFlow * yearsToExit;
        const fullTermROI = this.computeFullTermROI(
            totalEquityOwned,
            initialEquityPurchase,
            totalCumulativeCashFlow,
        );
        const annualizedROI = this.computeAnnualizedROI(fullTermROI, yearsToExit);
        const r = this.service.otherUtils.r2.bind(this.service.otherUtils);

        return {
            initialEquityPurchase: r(initialEquityPurchase),
            equityLeverage: r(equityLeverage),
            propertyAppreciation: r(propertyAppreciation),
            totalPrincipalPaydown: r(totalPrincipalPaydown),
            totalEquityOwned: r(totalEquityOwned),
            fullTermROI: r(fullTermROI),
            annualizedROI: r(annualizedROI),
        };
    };

    /**
     * Computes the break-even ratio (occupancy needed to break even).
     * Formula: ((total fixed expenses + P/I) x 12) / (total monthly income x 12) / 100
     */
    computeBreakEvenRatio = (
        fixedExpensesTotal: number,
        pi: number,
        projectedMonthlyRent: number,
    ): number =>
        projectedMonthlyRent === 0
            ? 0
            : ((fixedExpensesTotal + pi) * 12) / (projectedMonthlyRent * 12) / 100;

    /** Computes cash on cash ROI as yearly cash flow divided by estimated cash to close */
    computeCashOnCashROI = (yearlyCashFlow: number, estimatedCashToClose: number): number =>
        estimatedCashToClose === 0 ? 0 : yearlyCashFlow / estimatedCashToClose;

    computeCombinedAnnualizedROI = (
        yearlyCashFlow: number,
        estimatedCashToClose: number,
        taxDeductionROI: number,
        annualizedROI: number,
    ) => {
        const cashOnCashROI = this.computeCashOnCashROI(yearlyCashFlow, estimatedCashToClose);
        const totalROIFromAllSources = cashOnCashROI + taxDeductionROI + annualizedROI;
        const r = this.service.otherUtils.r2.bind(this.service.otherUtils);

        return {
            cashOnCashROI: r(cashOnCashROI),
            taxDeductionROI: r(taxDeductionROI),
            annualizedROI: r(annualizedROI),
            totalROIFromAllSources: r(totalROIFromAllSources),
        };
    };

    /**
     * Computes cumulative ROI projection for a given number of years.
     * Cash flow: (yearly cash flow x years) / estimated cash to close
     * Debt paydown: CUMPRINC over the period
     * Total return: cash flow + debt paydown
     */
    computeCumulativeProjection = (
        years: number,
        yearlyCashFlow: number,
        estimatedCashToClose: number,
        loanInterest: number,
        loanTermMonths: number,
        loanAmount: number,
    ): CumulativeProjection => {
        const cashFlow =
            estimatedCashToClose === 0 ? 0 : (yearlyCashFlow * years) / estimatedCashToClose;

        const debtPaydown = this.computeCumPrinc(
            loanInterest,
            loanTermMonths,
            loanAmount,
            years * 12,
        );

        return {
            years,
            cashFlow: this.service.otherUtils.r2(cashFlow),
            debtPaydown: this.service.otherUtils.r2(debtPaydown),
            totalReturn: this.service.otherUtils.r2(cashFlow + debtPaydown),
        };
    };

    computeCumulativeProjections = (
        yearlyCashFlow: number,
        estimatedCashToClose: number,
        loanInterest: number,
        loanLength: number,
        ltvAmount: number,
    ) => {
        const args = [
            yearlyCashFlow,
            estimatedCashToClose,
            loanInterest,
            loanLength,
            ltvAmount,
        ] as const;

        return {
            fiveYears: this.computeCumulativeProjection(5, ...args),
            tenYears: this.computeCumulativeProjection(10, ...args),
            fifteenYears: this.computeCumulativeProjection(15, ...args),
        };
    };

    computeRentalSummary = (input: RentalSummaryInput): RentalSummaryResult => {
        const estimatedTaxDeductions = this.computeEstimatedTaxDeductions(
            input.purchasePrice,
            input.depreciationPercent,
            input.incomeTaxRate,
            input.estimatedCashToClose,
        );
        const propertyAppreciationBlock = this.computePropertyAppreciationBlock(
            input.purchasePrice,
            input.additionalEquity,
            input.annualAppreciationRate,
            input.yearsToExit,
            input.estimatedCashToClose,
            input.loanInterest,
            input.loanLength,
            input.ltvAmount,
            input.yearlyCashFlow,
        );

        return {
            costPerUnit: {
                amount: this.service.otherUtils.r2(
                    this.computeCostPerUnit(
                        input.purchasePrice + input.acquisitionCost,
                        input.numberOfUnits,
                    ),
                ),
                basedOnUnits: input.numberOfUnits,
            },
            incomeStatement: this.computeIncomeStatement(
                input.projectedMonthlyRent,
                input.fixedExpensesTotal,
                input.yearlyCashFlow,
                input.estimatedCashToClose,
            ),
            estimatedTaxDeductions,
            propertyAppreciation: propertyAppreciationBlock,
            breakEvenRatio: this.service.otherUtils.r2(
                this.computeBreakEvenRatio(
                    input.fixedExpensesTotal,
                    input.pi,
                    input.projectedMonthlyRent,
                ),
            ),
            combinedAnnualizedROI: this.computeCombinedAnnualizedROI(
                input.yearlyCashFlow,
                input.estimatedCashToClose,
                estimatedTaxDeductions.taxDeductionROI,
                propertyAppreciationBlock.annualizedROI,
            ),
            cumulativeProjections: this.computeCumulativeProjections(
                input.yearlyCashFlow,
                input.estimatedCashToClose,
                input.loanInterest,
                input.loanLength,
                input.ltvAmount,
            ),
        };
    };
}
