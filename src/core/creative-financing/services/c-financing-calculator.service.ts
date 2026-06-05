import { Injectable } from '@nestjs/common';
import { CFinancingCalculatorDto, CFinancingColumnInputDto } from '../dto';
import {
    CFinancingCalculatorResultInterface,
    CFinancingColumnResultInterface,
    CFinancingFiveYearSnapshotResultInterface,
    CFinancingLoanMetricsResultInterface,
    CFinancingPurchaseSectionResultInterface,
    CFinancingRefiSectionResultInterface,
} from '../../../interface';

@Injectable()
export class CFinancingCalculatorService {
    /**
     * Service responsible for handling creative financing operations
     */

    /**
     * Determines whether a financing column includes a refinancing scenario.
     * Evaluates the presence of a refinancing loan length and ensures the original loan term is below a threshold.
     */
    columnHasRefi = (col: CFinancingColumnInputDto): boolean =>
        (col.refiLoanLengthYears ?? 0) > 0 && col.loanLengthYears < 30;

    /**
     * Calculates the periodic payment amount for a loan.
     * Handles edge cases for non-positive principal or periods and zero interest rate,
     * otherwise applies the standard amortization formula using annual rate, number of periods, and present value.
     */
    pmt(annualRatePct: number, nper: number, pv: number): number {
        if (pv <= 0 || nper <= 0) return 0;
        if (annualRatePct === 0) return pv / nper;

        const r = annualRatePct / 100 / 12;
        return (pv * r * Math.pow(1 + r, nper)) / (Math.pow(1 + r, nper) - 1);
    }

    /**
     * Computes the principal paid down over a given holding period.
     * Handles edge cases for non-positive inputs and zero interest rate,
     * otherwise derives the remaining balance using amortization logic
     * and returns the difference between initial principal and remaining balance.
     */
    computePrincipalPaidDown(annualRatePct: number, holdYears: number, principal: number): number {
        if (principal <= 0 || holdYears <= 0) return 0;
        if (annualRatePct === 0) return principal;

        const [r, totalMonths] = [annualRatePct / 100 / 12, holdYears * 12];
        const compoundFactor = Math.pow(1 + r, totalMonths);

        return (
            principal -
            Math.max(
                0,
                principal * compoundFactor -
                    (this.pmt(annualRatePct, totalMonths, principal) * (compoundFactor - 1)) / r,
            )
        );
    }

    /**
     * Computes a full financing column result based on input data and global parameters.
     * Derives purchase and refinance sections, then aggregates loan metrics and
     * five-year performance indicators into a structured result object.
     */
    computeColumn(
        col: CFinancingColumnInputDto,
        global: {
            annualAppreciationRate: number;
            depreciationPercentage: number;
            investorTaxBracket: number;
        },
    ): CFinancingColumnResultInterface {
        const purchase = this.computePurchaseSection(col);
        const refi = this.computeRefiSection(col, purchase, global);

        return {
            label: col.label,
            purchase,
            refi,
            loanMetrics: this.computeLoanMetrics(col, purchase, refi),
            fiveYearSnapshot: this.computeFiveYearSnapshot(col, purchase, refi, global),
        };
    }

    /**
     * Computes the purchase section metrics for a financing column.
     * Derives loan amount, cash to close, and cash flow values,
     * then calculates mortgage payment and annualized cash flow,
     * returning a structured purchase breakdown.
     */
    computePurchaseSection(
        col: CFinancingColumnInputDto,
    ): CFinancingPurchaseSectionResultInterface {
        const [loanAmount, cashToClose, totalMonthlyCashFlow] = [
            col.purchasePrice - col.downPayment,
            col.downPayment + col.closingCosts + col.rehabCosts,
            col.monthlyIncome - col.monthlyFixedExpenses,
        ];

        return {
            label: col.label,
            purchasePrice: col.purchasePrice,
            downPayment: col.downPayment,
            interestRate: col.interestRate,
            loanLengthYears: col.loanLengthYears,
            closingCosts: col.closingCosts,
            rehabCosts: col.rehabCosts,
            monthlyIncome: col.monthlyIncome,
            monthlyFixedExpenses: col.monthlyFixedExpenses,
            loanAmount,
            mortgagePaymentPI: this.pmt(col.interestRate, col.loanLengthYears * 12, loanAmount),
            cashToClose,
            totalMonthlyCashFlow,
            yearlyCashFlow: totalMonthlyCashFlow * 12,
        };
    }

    /**
     * Computes the refinancing section metrics for a financing column.
     * Determines if refinancing applies, conditionally derives refinance-related values,
     * and calculates investment, tax, and return metrics based on purchase and global inputs.
     * Returns a structured refinancing breakdown including cash flow, tax impact, and performance indicators.
     */
    computeRefiSection(
        col: CFinancingColumnInputDto,
        purchase: CFinancingPurchaseSectionResultInterface,
        global: { depreciationPercentage: number; investorTaxBracket: number },
    ): CFinancingRefiSectionResultInterface {
        const hasRefi = this.columnHasRefi(col);

        let principalPaidDown: number | null = null;
        let newLoanAmount: number | null = null;
        let refiInterestRate: number | null = null;
        let refiLoanLengthYears: number | null = null;
        let refiClosingCosts: number | null = null;
        let newMortgagePaymentPI: number | null = null;
        let totalCashReceivedPostRefi: number | null = null;

        if (hasRefi) {
            principalPaidDown = this.computePrincipalPaidDown(
                col.interestRate,
                col.loanLengthYears,
                purchase.loanAmount,
            );
            newLoanAmount = purchase.loanAmount - principalPaidDown;
            refiInterestRate = col.refiInterestRate ?? 0;
            refiLoanLengthYears = col.refiLoanLengthYears ?? 0;
            refiClosingCosts = col.refiClosingCosts ?? 0;
            newMortgagePaymentPI = this.pmt(
                refiInterestRate,
                refiLoanLengthYears * 12,
                newLoanAmount,
            );

            totalCashReceivedPostRefi = newLoanAmount - refiClosingCosts;
        }

        const refiCC = refiClosingCosts ?? 0;

        const activeMortgagePmt =
            hasRefi && newMortgagePaymentPI !== null
                ? newMortgagePaymentPI
                : purchase.mortgagePaymentPI;

        const totalCashInvested = purchase.cashToClose + refiCC;
        const netYearlyCashFlow = purchase.yearlyCashFlow - activeMortgagePmt * 12;

        const depreciableAmount = purchase.purchasePrice * (global.depreciationPercentage / 100);
        const annualTaxDeduction = depreciableAmount / 27.5;
        const estTaxCashSavings = annualTaxDeduction * (global.investorTaxBracket / 100);

        const annualizedCashOnCashReturn =
            totalCashInvested === 0 ? 0 : (netYearlyCashFlow / totalCashInvested) * 100;

        const paybackPeriodCashOnly =
            netYearlyCashFlow === 0 ? 0 : totalCashInvested / netYearlyCashFlow;

        const afterTaxPaybackPeriod =
            netYearlyCashFlow + estTaxCashSavings === 0
                ? 0
                : totalCashInvested / (netYearlyCashFlow + estTaxCashSavings);

        return {
            principalPaidDown,
            newLoanAmount,
            refiInterestRate,
            refiLoanLengthYears,
            refiClosingCosts,
            newMortgagePaymentPI,
            totalCashReceivedPostRefi,
            totalCashInvested,
            depreciableAmount,
            annualTaxDeduction,
            estTaxCashSavings,
            annualizedCashOnCashReturn,
            paybackPeriodCashOnly,
            afterTaxPaybackPeriod,
        };
    }

    /**
     * Computes loan-related metrics for a financing column.
     * Evaluates scenarios with or without refinancing to derive total interest paid,
     * total acquisition cost, and loan payoff duration.
     * Ensures computed values are normalized and returns a structured loan metrics summary.
     */
    computeLoanMetrics(
        col: CFinancingColumnInputDto,
        purchase: CFinancingPurchaseSectionResultInterface,
        refi: CFinancingRefiSectionResultInterface,
    ): CFinancingLoanMetricsResultInterface {
        const hasRefi = this.columnHasRefi(col);

        let totalInterestPaidOverLifeOfLoan: number;
        let totalAcquisitionCost: number;
        let timeToPayoffLoanYears: number;

        if (hasRefi && refi.newLoanAmount !== null && refi.newMortgagePaymentPI !== null) {
            const initialLoanMonths = col.loanLengthYears * 12;
            const totalPaidInitial = purchase.mortgagePaymentPI * initialLoanMonths;
            const interestInitialLoan = totalPaidInitial - purchase.loanAmount;

            const refiMonths = (col.refiLoanLengthYears ?? 0) * 12;
            const totalPaidRefi = refi.newMortgagePaymentPI * refiMonths;
            const interestRefiLoan = totalPaidRefi - refi.newLoanAmount;

            totalInterestPaidOverLifeOfLoan = interestInitialLoan + interestRefiLoan;

            totalAcquisitionCost =
                purchase.loanAmount +
                totalInterestPaidOverLifeOfLoan +
                col.closingCosts +
                col.rehabCosts +
                (col.refiClosingCosts ?? 0);

            timeToPayoffLoanYears = col.loanLengthYears + (col.refiLoanLengthYears ?? 0);
        } else {
            const totalMonths = col.loanLengthYears * 12;
            const totalPaid = purchase.mortgagePaymentPI * totalMonths;

            totalInterestPaidOverLifeOfLoan = totalPaid - purchase.loanAmount;

            totalAcquisitionCost =
                purchase.loanAmount +
                totalInterestPaidOverLifeOfLoan +
                col.closingCosts +
                col.rehabCosts;

            timeToPayoffLoanYears = col.loanLengthYears;
        }

        totalInterestPaidOverLifeOfLoan = Math.max(0, totalInterestPaidOverLifeOfLoan);

        return {
            totalInterestPaidOverLifeOfLoan,
            totalAcquisitionCost,
            timeToPayoffLoanYears,
        };
    }

    /**
     * Computes a five-year financial performance snapshot for a financing column.
     * Derives cash flow, principal reduction, appreciation, and tax benefits,
     * then aggregates these values to calculate cumulative wealth and annualized ROI.
     * Returns a structured summary of five-year investment performance indicators.
     */
    computeFiveYearSnapshot(
        col: CFinancingColumnInputDto,
        purchase: CFinancingPurchaseSectionResultInterface,
        refi: CFinancingRefiSectionResultInterface,
        global: { annualAppreciationRate: number },
    ): CFinancingFiveYearSnapshotResultInterface {
        const hasRefi = this.columnHasRefi(col);
        const activeMortgagePmt =
            hasRefi && refi.newMortgagePaymentPI !== null
                ? refi.newMortgagePaymentPI
                : purchase.mortgagePaymentPI;

        const netYearlyCashFlow = purchase.yearlyCashFlow - activeMortgagePmt * 12;
        const cumulativeNetCashFlow = netYearlyCashFlow * 5;

        const yearsForPrincipal = Math.min(col.loanLengthYears, 5);
        const totalPrincipalReduction = this.computePrincipalPaidDown(
            col.interestRate,
            yearsForPrincipal,
            purchase.loanAmount,
        );

        const appreciationGain =
            purchase.purchasePrice * Math.pow(1 + global.annualAppreciationRate / 100, 5) -
            purchase.purchasePrice;

        const estTaxBenefits = refi.estTaxCashSavings * 5;

        const totalCumulativeWealth =
            cumulativeNetCashFlow + totalPrincipalReduction + appreciationGain + estTaxBenefits;

        const annualizedROI =
            purchase.cashToClose > 0
                ? (Math.pow(totalCumulativeWealth / purchase.cashToClose, 1 / 5) - 1) * 100
                : 0;

        const nonDownPaymentCosts = purchase.cashToClose - purchase.downPayment;
        const cumulativeWealthWithInitialInvestment = totalCumulativeWealth - nonDownPaymentCosts;

        return {
            cumulativeNetCashFlow,
            totalPrincipalReduction,
            appreciationGain,
            estTaxBenefits,
            totalCumulativeWealth,
            annualizedROI,
            cumulativeWealthWithInitialInvestment,
        };
    }

    /**
     * Entry point.
     * Accepts the global params + an array of column inputs and returns the
     * fully computed result ready to be serialized and sent to the frontend.
     */
    compute(dto: CFinancingCalculatorDto): CFinancingCalculatorResultInterface {
        const globalParams = {
            annualAppreciationRate: dto.globalParams?.annualAppreciationRate ?? 3,
            depreciationPercentage: dto.globalParams?.depreciationPercentage ?? 80,
            investorTaxBracket: dto.globalParams?.investorTaxBracket ?? 0,
        };

        const columns: CFinancingColumnResultInterface[] = dto.columns.map((col) =>
            this.computeColumn(col, globalParams),
        );

        return { globalParams, columns };
    }
}
