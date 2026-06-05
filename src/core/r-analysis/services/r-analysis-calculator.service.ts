import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { RAnalysisService } from './r-analysis.service';

export interface AdditionalLineItem {
    label: string;
    amount: number;
}

export interface RentalAnalysisInput {
    purchasePrice: number;
    ltv: number;
    sellerConcessions: number;
    rentCredits: number;
    acquisitionCost: number;

    pmi?: number;
    taxes?: number;
    insurance?: number;
    utilities?: number;

    loanInterest: number;
    loanLength: number;

    projectedMonthlyRent: number;
    otherMonthlyIncome: number;
    occupancyRate: number;

    fixedExpensesTotal: number;

    managementFeePercent: number;
    maintenanceEscrowPercent: number;

    additionalPurchaseCosts: AdditionalLineItem[];
    additionalFixedExpenses: AdditionalLineItem[];
    additionalIncome: AdditionalLineItem[];
}

export interface RentalAnalysisSummaryResult {
    purchaseCosts: {
        purchasePrice: number;
        closingCosts: number;
        totalPurchaseCost: number;
        estimatedCashToClose: number;
        additionalItems: AdditionalLineItem[];
    };

    financingDetails: {
        ltv: number;
        ltvAmount: number;
        downPayment: number;
        sellerConcessions: number;
        rentCredits: number;
    };

    income: {
        projectedMonthlyRent: number;
        occupancyRate: number;
        otherMonthlyIncome: number;
        yearlyIncome: number;
        additionalItems: AdditionalLineItem[];
    };

    fixedExpenses: {
        yearsInLoan: number;
        interestRate: number;
        pi: number;
        pmi: number;
        taxes: number;
        insurance: number;
        utilities: number;
        total: number;
        additionalItems: AdditionalLineItem[];
    };

    variableExpenses: {
        managementFeePercent: number;
        managementFees: number;
        maintenanceEscrowPercent: number;
        maintenanceEscrow: number;
    };

    results: {
        monthlyCashFlow: number;
        yearlyCashFlow: number;
    };
}

@Injectable()
export class RentalAnalysisCalculatorService {
    /**
     * Service responsible for rental analysis financial calculations
     */

    constructor(
        @Inject(forwardRef(() => RAnalysisService))
        private readonly service: RAnalysisService,
    ) {}

    /** Computes the loan amount as purchase price multiplied by the LTV percentage */
    computeLtvAmount = (purchasePrice: number, ltv: number): number => purchasePrice * (ltv / 100);

    /** Computes the down payment as purchase price multiplied by the inverse of the LTV percentage */
    computeDownPayment = (purchasePrice: number, ltv: number): number =>
        purchasePrice * (1 - ltv / 100);

    /**
     * Computes the estimated cash to close.
     * Formula: total purchase cost - LTV amount - seller concessions - rent credits
     */
    computeEstimatedCashToClose = (
        purchasePrice: number,
        acquisitionCost: number,
        ltvAmount: number,
        sellerConcessions: number,
        rentCredits: number,
    ): number => purchasePrice + acquisitionCost - ltvAmount - sellerConcessions - rentCredits;

    /** Computes the monthly principal and interest payment using the standard amortization formula */
    computePI = (loanAmount: number, annualRate: number, termMonths: number): number => {
        if (annualRate === 0) return loanAmount / termMonths;
        const r = annualRate / 100 / 12;
        return (loanAmount * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
    };

    /**
     * Computes the yearly income.
     * Formula: (projected monthly rent x occupancy rate + other monthly income) x 12
     */
    computeYearlyIncome = (
        projectedMonthlyRent: number,
        occupancyRate: number,
        otherMonthlyIncome: number,
    ): number => (projectedMonthlyRent * (occupancyRate / 100) + otherMonthlyIncome) * 12;

    /** Computes yearly management fees as a percentage of yearly rent */
    computeYearlyManagementFees = (yearlyRent: number, managementFeePercent: number): number =>
        yearlyRent * (managementFeePercent / 100);

    /** Computes yearly maintenance escrow as a percentage of yearly rent */
    computeYearlyMaintenanceEscrow = (
        yearlyRent: number,
        maintenanceEscrowPercent: number,
    ): number => yearlyRent * (maintenanceEscrowPercent / 100);

    /**
     * Computes yearly cash flow.
     * Formula: yearly income - yearly fixed expenses - management fees - maintenance escrow
     */
    computeYearlyCashFlow = (
        yearlyIncome: number,
        yearlyFixedExpenses: number,
        managementFees: number,
        maintenanceEscrow: number,
    ): number => yearlyIncome - yearlyFixedExpenses - managementFees - maintenanceEscrow;

    /** Computes monthly cash flow by dividing yearly cash flow by 12 */
    computeMonthlyCashFlow = (yearlyCashFlow: number): number => yearlyCashFlow / 12;

    /** Orchestrates all rental analysis calculations and returns the full structured summary */
    computeRentalAnalysisSummary = (input: RentalAnalysisInput): RentalAnalysisSummaryResult => {
        const extraPurchaseCosts = (input.additionalPurchaseCosts ?? []).reduce(
            (sum, i) => sum + i.amount,
            0,
        );
        const extraFixedExpenses = (input.additionalFixedExpenses ?? []).reduce(
            (sum, i) => sum + i.amount,
            0,
        );
        const extraMonthlyIncome = (input.additionalIncome ?? []).reduce(
            (sum, i) => sum + i.amount,
            0,
        );

        const totalPurchaseCost = input.purchasePrice + input.acquisitionCost + extraPurchaseCosts;
        const ltvAmount = this.computeLtvAmount(input.purchasePrice, input.ltv);
        const downPayment = this.computeDownPayment(input.purchasePrice, input.ltv);
        const estimatedCashToClose = this.computeEstimatedCashToClose(
            input.purchasePrice,
            input.acquisitionCost + extraPurchaseCosts,
            ltvAmount,
            input.sellerConcessions,
            input.rentCredits,
        );

        const pi = this.computePI(ltvAmount, input.loanInterest, input.loanLength);

        const yearlyRent = input.projectedMonthlyRent * 12;
        const yearlyIncome = this.computeYearlyIncome(
            input.projectedMonthlyRent,
            input.occupancyRate,
            input.otherMonthlyIncome + extraMonthlyIncome,
        );

        const managementFees = this.computeYearlyManagementFees(
            yearlyRent,
            input.managementFeePercent,
        );
        const maintenanceEscrow = this.computeYearlyMaintenanceEscrow(
            yearlyRent,
            input.maintenanceEscrowPercent,
        );

        const yearlyFixedExpenses = (input.fixedExpensesTotal + extraFixedExpenses) * 12;

        const yearlyCashFlow = this.computeYearlyCashFlow(
            yearlyIncome,
            yearlyFixedExpenses,
            managementFees,
            maintenanceEscrow,
        );
        const monthlyCashFlow = this.computeMonthlyCashFlow(yearlyCashFlow);

        const r = this.service.otherUtils.r2.bind(this.service.otherUtils);

        return {
            purchaseCosts: {
                purchasePrice: r(input.purchasePrice),
                closingCosts: r(input.acquisitionCost),
                totalPurchaseCost: r(totalPurchaseCost),
                estimatedCashToClose: r(estimatedCashToClose),
                additionalItems: input.additionalPurchaseCosts ?? [],
            },
            financingDetails: {
                ltv: input.ltv,
                ltvAmount: r(ltvAmount),
                downPayment: r(downPayment),
                sellerConcessions: r(input.sellerConcessions),
                rentCredits: r(input.rentCredits),
            },
            income: {
                projectedMonthlyRent: r(input.projectedMonthlyRent),
                occupancyRate: input.occupancyRate,
                otherMonthlyIncome: r(input.otherMonthlyIncome),
                yearlyIncome: r(yearlyIncome),
                additionalItems: input.additionalIncome ?? [],
            },
            fixedExpenses: {
                yearsInLoan: input.loanLength,
                interestRate: input.loanInterest,
                pi: r(pi),
                pmi: r(input.pmi ?? 0),
                taxes: r(input.taxes ?? 0),
                insurance: r(input.insurance ?? 0),
                utilities: r(input.utilities ?? 0),
                total: r(input.fixedExpensesTotal + extraFixedExpenses),
                additionalItems: input.additionalFixedExpenses ?? [],
            },
            variableExpenses: {
                managementFeePercent: input.managementFeePercent,
                managementFees: r(managementFees),
                maintenanceEscrowPercent: input.maintenanceEscrowPercent,
                maintenanceEscrow: r(maintenanceEscrow),
            },
            results: {
                monthlyCashFlow: r(monthlyCashFlow),
                yearlyCashFlow: r(yearlyCashFlow),
            },
        };
    };
}
