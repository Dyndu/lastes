import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { FFlipService } from './f-flip.service';
import { AcquisitionMethodEnum } from '../../../common/enum';
import { ABuilderEntity } from '../../a-builder/entities';

@Injectable()
export class FFlipSummaryService {
    /**
     * Service responsible for handling fix and flip module operations
     */

    constructor(
        @Inject(forwardRef(() => FFlipService))
        private readonly service: FFlipService,
    ) {}

    /**
     * Calculates the total acquisition cost based on the analysis builder data.
     * Applies different calculation strategies depending on the acquisition method, incorporating purchase price or financing components.
     * Accounts for deductions such as seller concessions and credits, and returns zero when acquisition details are not available.
     */
    calculateAcquisitionCost(aBuilder: ABuilderEntity): number {
        const aDetails = aBuilder.acquisitionDetails;
        if (!aDetails) return 0;

        const {
            sellerConcessions = 0,
            credits = 0,
            downPayment = 0,
            purchasePrice = 0,
            method,
        } = aDetails;
        const deductions = sellerConcessions + credits;

        if (method === AcquisitionMethodEnum.CASH) return purchasePrice - deductions;

        if (method === AcquisitionMethodEnum.FINANCED) {
            const loanPointsCost =
                this.service.rAnalyzerService.aBuilderService.aDetailsService.calculateLoanPointsCost(
                    aDetails,
                );
            return (
                downPayment + (aBuilder.sale?.saleClosingCoast ?? 0) + loanPointsCost - deductions
            );
        }

        return 0;
    }

    /**
     * Calculates the total holding cost based on fixed expenses and holding duration.
     * Aggregates recurring expense components and multiplies them by the holding period duration.
     * Returns zero when required data is missing.
     */
    calculateHoldingCost(aBuilder: ABuilderEntity): number {
        const { hCoast } = aBuilder;
        if (!hCoast) return 0;

        const { propertyTaxes = 0, insurance = 0, totalUtilities = 0 } = hCoast.itemized ?? {};
        return (propertyTaxes + insurance + totalUtilities) * hCoast.duration;
    }

    /**
     * Calculates the agent commission cost based on the purchase price and commission rate.
     * Applies the commission percentage to the acquisition purchase price when sale data is available.
     * Returns zero when required data is missing.
     */
    calculateAgentCommissionCost(aBuilder: ABuilderEntity): number {
        const { acquisitionDetails: aDetails, sale } = aBuilder;
        if (!sale) return 0;
        return ((aDetails?.purchasePrice ?? 0) * (sale.agentCommission ?? 0)) / 100;
    }

    /**
     * Calculates the total sale cost based on sale-related expenses.
     * Aggregates closing costs and agent commission derived from the acquisition data.
     * Returns zero when sale data is not available.
     */
    calculateSaleCost(aBuilder: ABuilderEntity): number {
        const { sale } = aBuilder;
        if (!sale) return 0;
        return (sale.saleClosingCoast ?? 0) + this.calculateAgentCommissionCost(aBuilder);
    }

    /**
     * Calculates the total investment for a fix and flip analysis.
     * Aggregates purchase price, holding costs, and total repairs, returning zero if any required data is missing.
     */
    calculateTotalInvestment(aBuilder: ABuilderEntity): number {
        const { acquisitionDetails: aDetails, hCoast, repairs } = aBuilder;
        if (!aDetails || !hCoast || !repairs) return 0;

        return (aDetails.purchasePrice ?? 0) + (hCoast.holdingCoast ?? 0) + (repairs.total ?? 0);
    }

    /**
     * Calculates the net profit for a fix and flip analysis.
     * Derives profit by subtracting total investment and sale costs from the after-repair value,
     * returning zero if any required data is missing.
     */
    calculateNetProfit(aBuilder: ABuilderEntity): number {
        const { sale } = aBuilder;
        if (!sale) return 0;

        return (
            (sale.afterRepairValue ?? 0) -
            this.calculateSaleCost(aBuilder) -
            this.calculateTotalInvestment(aBuilder)
        );
    }

    /**
     * Calculates the return on investment (ROI) for a fix and flip analysis.
     * Computes ROI based on net profit over total investment, normalized as a percentage ratio.
     * Returns zero when total investment is zero to avoid division by zero.
     */
    calculateRoi(aBuilder: ABuilderEntity): number {
        const totalInvestment = this.calculateTotalInvestment(aBuilder);
        if (totalInvestment === 0) return 0;
        return this.calculateNetProfit(aBuilder) / totalInvestment / 100;
    }

    /**
     * Calculates the maximum offer price based on projected profit and total costs.
     * Aggregates all required cost components including repairs, holding cost, sale cost, and acquisition cost.
     * Subtracts total costs from the expected gross profit and returns zero when required data is incomplete.
     */
    calculateMaxOffer(aBuilder: ABuilderEntity): number {
        const { acquisitionDetails: aDetails, sale, fExpenses, repairs, hCoast } = aBuilder;
        if (!aDetails || !sale || !fExpenses || !repairs || !hCoast) return 0;

        return (
            sale.afterRepairValue -
            sale.targetProfit -
            repairs.total -
            this.calculateHoldingCost(aBuilder) -
            this.calculateSaleCost(aBuilder) -
            this.calculateAcquisitionCost(aBuilder)
        );
    }

    /**
     * Returns the project timeline for a fix and flip analysis.
     * Derives rehabilitation deadline and sales target from holding duration,
     * returning zero if holding cost data is unavailable.
     */
    getProjectTimeline(aBuilder: ABuilderEntity) {
        const hCoast = aBuilder.hCoast;
        if (!hCoast) return 0;
        const days = hCoast.duration * 30;
        return { rehabDeadline: days - 30, salesTarget: days };
    }

    /**
     * Returns the investment summary for a fix and flip analysis.
     * Aggregates total investment, net profit, and ROI into a consolidated result.
     */
    getInvestmentSummary(aBuilder: ABuilderEntity) {
        return {
            totalInvestment: this.calculateTotalInvestment(aBuilder),
            netProfit: this.calculateNetProfit(aBuilder),
            roi: this.calculateRoi(aBuilder),
        };
    }

    /**
     * Returns the first row of the project profit breakdown for a fix and flip analysis.
     * Computes duration, holding costs, derived days, projected price, and ROI based on available data.
     */
    getProjectProfitRow1(aBuilder: ABuilderEntity) {
        const duration = aBuilder.hCoast?.duration ?? 0;
        const holdingCoast = aBuilder.hCoast?.holdingCoast ?? 0;
        const days = duration * 30;
        const price =
            (aBuilder.sale?.afterRepairValue ?? 0) -
            (aBuilder.sale?.saleClosingCoast ?? 0) -
            this.calculateTotalInvestment(aBuilder);
        const roi = this.calculateRoi(aBuilder);

        return { duration, holdingCoast, days, price, roi };
    }

    /**
     * Returns the second row of the project profit breakdown for a fix and flip analysis.
     * Extends the first row by adjusting timeline, recalculating price based on profit distribution,
     * and deriving ROI from normalized holding cost increments.
     */
    getProjectProfitRow2(aBuilder: ABuilderEntity) {
        const { duration, holdingCoast, days, price } = this.getProjectProfitRow1(aBuilder);
        const monthlyHolding = holdingCoast / (duration || 1);

        return {
            duration,
            holdingCoast,
            days: days + 30,
            price: this.calculateNetProfit(aBuilder) - monthlyHolding,
            roi: price / (monthlyHolding * 2 * 100),
        };
    }

    /**
     * Returns the third row of the project profit breakdown for a fix and flip analysis.
     * Further extends the timeline and adjusts profit by applying cumulative holding cost impact,
     * with ROI derived from the updated price and normalized cost basis.
     */
    getProjectProfitRow3(aBuilder: ABuilderEntity) {
        const { duration, holdingCoast, days, price } = this.getProjectProfitRow2(aBuilder);
        const monthlyHolding = holdingCoast / (duration || 1);

        return {
            days: days + 30,
            price: this.calculateNetProfit(aBuilder) - monthlyHolding * 2,
            roi: price / (monthlyHolding * 2 * 100),
        };
    }

    /**
     * Returns the project profit breakdown for a fix and flip analysis.
     * Aggregates multiple profit projection rows and exposes normalized days, price, and ROI for each scenario.
     */
    getProjectProfits(aBuilder: ABuilderEntity) {
        const [row1, row2, row3] = [
            this.getProjectProfitRow1(aBuilder),
            this.getProjectProfitRow2(aBuilder),
            this.getProjectProfitRow3(aBuilder),
        ];

        const pick = ({ days, price, roi }: { days: number; price: number; roi: number }) => ({
            days,
            price,
            roi,
        });

        return { row1: pick(row1), row2: pick(row2), row3: pick(row3) };
    }
}
