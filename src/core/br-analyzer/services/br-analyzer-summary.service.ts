import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BrAnalyzerService } from './br-analyzer.service';
import { ABuilderEntity } from '../../a-builder/entities';

@Injectable()
export class BrAnalyzerSummaryService {
    /**
     * Service responsible for all summary calculation operations of the BRRR analyzer module.
     * Provides financial metrics such as cash flow, ROI, cap rate, DSCR, and more,
     * based on a given {@link ABuilderEntity} analysis builder instance.
     */

    constructor(
        @Inject(forwardRef(() => BrAnalyzerService))
        private readonly brAnalyzerService: BrAnalyzerService,
    ) {}

    /**
     * Calculates the total cash required to close a deal for the given builder entity.
     * Delegates the computation to the acquisition details service using closing costs and down payment values.
     */
    cashNeedToClose = (builder: ABuilderEntity) =>
        this.brAnalyzerService.rAnalyzerService.aBuilderService.aDetailsService.calculateCashNeededToClose(
            builder.acquisitionDetails?.closingCostFees ?? 0,
            builder.acquisitionDetails?.downPayment ?? 0,
        );

    /**
     * Calculates the cash-out amount from a refinancing for the given builder entity.
     * Delegates the computation to the refinancing service using after-repair value, LTV, and existing loan balance.
     */
    calculateCashOutRefi = (builder: ABuilderEntity) =>
        this.brAnalyzerService.rAnalyzerService.aBuilderService.refinanceService.calculateRefiCash(
            builder.refinance?.afterRepairValue ?? 0,
            builder.refinance?.refiLTV ?? 0,
            builder.refinance?.oldLoanAmount ?? 0,
        );

    /**
     * Calculates the net carrying cost for the given builder entity.
     * Delegates the computation to the cost service using the full builder context.
     */
    calculateCCoast = (builder: ABuilderEntity) =>
        this.brAnalyzerService.rAnalyzerService.aBuilderService.cCoastService.calculateNetCarryingCoast(
            builder,
        );

    /**
     * Calculates the net cash invested for a builder entity.
     * Computes refinance cash and subtracts total investment costs including closing costs,
     * down payment, rehab duration costs, and net carrying costs.
     */
    calculateNetCashInvested = (builder: ABuilderEntity) =>
        this.calculateCashOutRefi(builder) -
        (this.cashNeedToClose(builder) +
            (builder.rDuration?.totalRCoast ?? 0) +
            this.calculateCCoast(builder));

    /**
     * Calculates the total rental income for a builder entity.
     * Computes expected rent by multiplying total income by vacancy rate,
     * defaulting missing values to 0 for safe calculation.
     */
    calculateTotalRent = (builder: ABuilderEntity) =>
        (builder.propertyDetails?.totalIncome ?? 0) * (builder.refinance?.vacancy ?? 0);

    /**
     * Calculates the monthly cash flow for a builder entity.
     * Computes total rent and subtracts mortgage interest and fixed expenses,
     * defaulting missing values to 0 for safe calculation.
     */
    calculateMonthlyCashFlow = (builder: ABuilderEntity) =>
        this.calculateTotalRent(builder) -
        (builder.refinance?.pInterest ?? 0) -
        (builder.fExpenses?.total ?? 0);

    /**
     * Calculates the Year 1 yearly cash flow for a builder entity.
     * Adjusts cash flow based on remaining duration within the first year,
     * and subtracts fixed expenses over the same period.
     */
    calculateYearlyCashFlowYearOne(builder: ABuilderEntity) {
        const duration = 12 - (builder.rDuration?.duration ?? 0);
        return (
            this.calculateMonthlyCashFlow(builder) * duration -
            (builder.fExpenses?.total ?? 0) * duration
        );
    }

    /**
     * Calculates the annualized cash flow based on monthly cash flow.
     * Multiplies the monthly cash flow by 12 to project yearly performance.
     */
    calculateMonthCFlow = (builder: ABuilderEntity) => this.calculateMonthlyCashFlow(builder) * 12;

    /**
     * Calculates the Year 2 yearly cash flow for a builder entity.
     * Starts from annualized cash flow and subtracts yearly fixed expenses,
     * defaulting missing values to 0 for safe calculation.
     */
    calculateYearlyCashFlowYearTwo = (builder: ABuilderEntity) =>
        this.calculateMonthCFlow(builder) - (builder.fExpenses?.total ?? 0) * 12;

    /**
     * Calculates the payback period for a builder entity.
     * Determines how many years are required to recover the net cash invested
     * based on the annualized cash flow.
     */
    calculatePaybackPeriod = (builder: ABuilderEntity) =>
        this.calculateNetCashInvested(builder) / this.calculateMonthCFlow(builder);

    /**
     * Calculates the cash-on-cash return for a builder entity.
     * Computes the ratio of annual cash flow to net cash invested,
     * defaulting to a direct division of both calculated values.
     */
    calculateCashOnCshReturn = (builder: ABuilderEntity) =>
        this.calculateMonthCFlow(builder) / this.calculateNetCashInvested(builder);

    /**
     * Calculates the trapped equity for a builder entity.
     * Computes the difference between after repair value and the new loan amount,
     * defaulting missing values to 0 for safe calculation.
     */
    calculateTrappedEquity = (builder: ABuilderEntity) =>
        (builder.refinance?.afterRepairValue ?? 0) - (builder.refinance?.newLoanAmount ?? 0);

    /**
     * Calculates the ROI based on equity growth for a builder entity.
     * Returns "INF" if net cash invested is negative, otherwise computes the ratio
     * of total equity gain (refinance cash + trapped equity) over net cash invested.
     */
    calculateRoiEquityGrowth(builder: ABuilderEntity) {
        const netCastInvested = this.calculateNetCashInvested(builder);
        if (netCastInvested < 0) return 'INF';
        else
            return (
                (this.calculateCashOutRefi(builder) + this.calculateTrappedEquity(builder)) /
                netCastInvested
            );
    }

    /**
     * Calculates the annual debt for a builder entity.
     * Computes yearly interest expense by multiplying monthly interest in 12,
     * defaulting missing values to 0 for safe calculation.
     */
    calculateAnnualDebt = (builder: ABuilderEntity) => (builder.refinance?.pInterest ?? 0) * 12;

    /**
     * Calculates the operating income for a builder entity.
     * Aggregates total income sources and subtracts operating expenses including
     * taxes, insurance, utilities, management fees, and maintenance escrow costs.
     */
    calculateOperatingIncome(builder: ABuilderEntity) {
        const income =
            (builder.propertyDetails?.totalIncome ?? 0) +
            (builder.acquisitionDetails?.monthlyIncome ?? 0);
        const data = builder.propertyDetails?.totalIncome ?? 0;
        return (
            income -
            ((builder.fExpenses?.propertyTaxes ?? 0) +
                (builder.fExpenses?.hazardInsurance ?? 0) +
                (builder.fExpenses?.totalUtilities ?? 0) +
                (data * (builder.fExpenses?.managementFees ?? 0)) / 100 +
                (data * (builder.fExpenses?.maintenanceEscrow ?? 0)) / 100)
        );
    }

    /**
     * Calculates the Net Operating Income (NOI) for a builder entity.
     * Combines total income sources and subtracts total expenses and annual debt
     * to determine the net operating profitability.
     */
    calculateNoi = (builder: ABuilderEntity) =>
        (builder.propertyDetails?.totalIncome ?? 0) +
        (builder.acquisitionDetails?.monthlyIncome ?? 0) -
        (builder.fExpenses?.total ?? 0) -
        this.calculateAnnualDebt(builder);

    /**
     * Calculates the capitalization rate (Cap Rate) for a builder entity.
     * Divides net operating income by the purchase price and converts the result into a percentage.
     */
    calculateCapRate = (builder: ABuilderEntity) =>
        (this.calculateNoi(builder) / (builder.acquisitionDetails?.purchasePrice ?? 0)) * 100;

    /**
     * Calculates the debt yield percentage for a builder entity.
     * Divides net operating income by total loan amount (old + new) and converts the result into a percentage.
     */
    calculateDebtYieldPercent = (builder: ABuilderEntity) =>
        (this.calculateNoi(builder) /
            ((builder.refinance?.oldLoanAmount ?? 0) + (builder.refinance?.newLoanAmount ?? 0))) *
        100;

    /**
     * Calculates the Gross Rent Multiplier (GRM) for a builder entity.
     * Divides purchase price by total annual gross rental income.
     */
    calculateGRM = (builder: ABuilderEntity) =>
        (builder.acquisitionDetails?.purchasePrice ?? 0) /
        ((builder.propertyDetails?.totalIncome ?? 0) +
            (builder.acquisitionDetails?.monthlyIncome ?? 0) * 12);

    /**
     * Calculates the Debt Service Coverage Ratio (DSCR) for a builder entity.
     * Divides net operating income by annual debt service and adjusts the result by subtracting PMI cost.
     */
    calculateDSCR = (builder: ABuilderEntity) =>
        this.calculateNoi(builder) / this.calculateAnnualDebt(builder) -
        (builder.refinance?.pmi ?? 0) * 12;

    /**
     * Calculates the operating expense ratio for a builder entity.
     * Divides operating income by total gross income and converts the result into a percentage.
     */
    calculateOperatingExpenseRatio = (builder: ABuilderEntity) =>
        (this.calculateOperatingIncome(builder) /
            (builder.propertyDetails?.totalGrossIncome ?? 0)) *
        100;

    /**
     * Builds the summary dataset for the given builder entity.
     * Aggregates investment, cash flow, profitability, and property performance metrics into a structured result.
     */
    summaryData = (builder: ABuilderEntity) => ({
        netCashInvested: this.calculateNetCashInvested(builder),
        yearlyCashFlow1: this.calculateYearlyCashFlowYearOne(builder),
        yearlyCashFlow2: this.calculateYearlyCashFlowYearTwo(builder),
        paybackPeriod: this.calculatePaybackPeriod(builder),
        roiEquityGrowth: this.calculateRoiEquityGrowth(builder),
        cCashOnReturn: this.calculateCashOnCshReturn(builder),
        trappedEquity: this.calculateTrappedEquity(builder),
        cashNeedToClose: this.cashNeedToClose(builder),
        cashOutRefi: this.calculateCashOutRefi(builder),
        netCarryingCoast: this.calculateCCoast(builder),
        monthlyCashFlow: this.calculateMonthlyCashFlow(builder),
        propertyP: {
            capRate: this.calculateCapRate(builder),
            grm: this.calculateGRM(builder),
            dsrc: this.calculateDSCR(builder),
            oer: this.calculateOperatingExpenseRatio(builder),
            debtYield: this.calculateDebtYieldPercent(builder),
            noi: this.calculateNoi(builder),
        },
    });
}
