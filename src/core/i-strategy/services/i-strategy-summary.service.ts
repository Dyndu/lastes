import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { IStrategyService } from './i-strategy.service';
import { AnalysisEntity } from '../../analysis/entities';
import { ABuilderEntity } from '../../a-builder/entities';
import { RAnalysisEntity } from '../../r-analysis/entities';
import { CurrentUserInterface } from '../../../interface';
import { ModuleLabelEnum } from '../../../common/enum';

export interface IStrategySummaryColumn {
    available: boolean;
    warning?: string;
    data?: {
        purchasePrice: number | null;
        rehabRepairCosts: number | null;
        holdingCosts: number | null;
        cashToClose: number | null;
        sellingCosts: number | null;
        salePriceArv: number | null;
        monthlyCashFlow: number | null;
        noiAnnual: number | null;
        cashOnCashReturn: number | null;
        totalProfit: number | null;
        roiImmediate: number | null;
        roiAnnualized: number | null;
        timeToExit: number | null;
    };
}

export interface IStrategySummaryResult {
    wholesale: IStrategySummaryColumn;
    fixAndFlip: IStrategySummaryColumn;
    longTerm: IStrategySummaryColumn;
    riskAlerts: {
        wholesale: { risks: string; taxes: string; insight: string };
        fixAndFlip: { risks: string; taxes: string; insight: string };
        longTerm: { risks: string; taxes: string; insight: string };
    };
}

export const RISK_ALERTS = {
    wholesale: {
        risks: 'Deal fallout, compliance issues, and limited buyer pool.',
        taxes: 'Profits taxed as ordinary income; no long-term benefits.',
        insight: 'Best for quick cash or low-capital investors — minimal risk if exit buyers are strong.',
    },
    fixAndFlip: {
        risks: 'Market shifts, rehab overruns, and holding costs.',
        taxes: 'Treated as ordinary income; no depreciation.',
        insight: 'High short-term reward potential but sensitive to timing and cost control.',
    },
    longTerm: {
        risks: 'Vacancy and management challenges.',
        taxes: 'Benefits from depreciation and capital gains treatment.',
        insight: 'Builds long-term wealth and equity; slower cash recovery but stronger tax advantages.',
    },
};

@Injectable()
export class IStrategySummaryService {
    constructor(
        @Inject(forwardRef(() => IStrategyService))
        private readonly service: IStrategyService,
    ) {}

    resolveWarning(
        result: PromiseSettledResult<AnalysisEntity>,
        module: string,
    ): string | null {
        if (result.status === 'rejected')
            return `No ${module} analysis found for this property. Please complete the ${module} builder first.`;
        return null;
    }

    private async loadBuilder(
        analysisResult: PromiseSettledResult<AnalysisEntity>,
        whereKey: string,
        moduleEntityKey: string,
        relations: string[],
    ): Promise<ABuilderEntity | null> {
        if (analysisResult.status === 'rejected') return null;
        const analysis = analysisResult.value;
        const moduleEntity = (analysis as any)[moduleEntityKey];
        if (!moduleEntity) return null;

        return this.service.rAnalyzerService.aBuilderService.aBuilderRepository.findOne({
            where: { [whereKey]: { id: moduleEntity.id } },
            relations,
        });
    }

    computeWholesaleColumn(aBuilder: ABuilderEntity): IStrategySummaryColumn['data'] {
        const acq = aBuilder.acquisitionDetails;
        const hd  = aBuilder.hDuration;
        const pd  = aBuilder.propertyDetails;
        const fe  = aBuilder.fExpenses;
        const rep = aBuilder.repairs;

        const summary = this.service.rAnalyzerService.analysisService.wholesaleService
            .wholesaleCalculatorService.computeWholesaleSummary({
                investorPrice:       acq?.purchasePrice    ?? 0,
                targetProfit:        hd?.targetProfit      ?? 0,
                holdingCostPerMonth: hd?.holdingCoast      ?? 0,
                duration:            hd?.duration          ?? 0,
                transactionFee:      hd?.transactionFee    ?? 0,
                otherFee:            hd?.otherFee          ?? 0,
                downPaymentPercent:  acq?.downPayment      ?? 0,
                loanInterest:        acq?.loanInterest     ?? 0,
                loanLength:          acq?.loanLength       ?? 0,
                closingCostFees:     acq?.closingCostFees  ?? 0,
                sellerConcessions:   acq?.sellerConcessions ?? 0,
                credits:             acq?.credits          ?? 0,
                monthlyIncome:       pd?.monthlyIncome     ?? 0,
                fixedExpensesTotal:  fe?.total             ?? 0,
                estRepairs:          rep?.total            ?? 0,
            });

        return {
            purchasePrice:    acq?.purchasePrice ?? 0,
            rehabRepairCosts: null,
            holdingCosts:     null,
            cashToClose:      null,
            sellingCosts:     null,
            salePriceArv:     acq?.purchasePrice ?? 0,
            monthlyCashFlow:  null,
            noiAnnual:        null,
            cashOnCashReturn: null,
            totalProfit:      summary.dealSummary.profit,
            roiImmediate:     summary.dealSummary.investorROI,
            roiAnnualized:    null,
            timeToExit:       1,
        };
    }

    computeFixFlipColumn(aBuilder: ABuilderEntity): IStrategySummaryColumn['data'] {
        const acq  = aBuilder.acquisitionDetails;
        const ff   = this.service.rAnalyzerService.analysisService.fFlipService;
        const summary = ff.fFlipSummaryService;

        return {
            purchasePrice:    acq?.purchasePrice                     ?? 0,
            rehabRepairCosts: aBuilder.repairs?.total                ?? null,
            holdingCosts:     aBuilder.hCoast?.holdingCoast          ?? null,
            cashToClose:      summary.calculateAcquisitionCost(aBuilder),
            sellingCosts:     aBuilder.sale?.saleClosingCoast        ?? null,
            salePriceArv:     (aBuilder.sale?.afterRepairValue ?? 0) - (aBuilder.repairs?.total ?? 0),
            monthlyCashFlow:  null,
            noiAnnual:        null,
            cashOnCashReturn: null,
            totalProfit:      summary.calculateNetProfit(aBuilder),
            roiImmediate:     summary.calculateRoi(aBuilder),
            roiAnnualized:    null,
            timeToExit:       aBuilder.hCoast?.duration ?? null,
        };
    }

    computeLongTermColumn(
        aBuilder: ABuilderEntity,
        rentalAnalysis: RAnalysisEntity,
    ): IStrategySummaryColumn['data'] {
        const acq     = aBuilder.acquisitionDetails;
        const params  = rentalAnalysis.params;
        const settings = null;
        const baseInput = this.service.rAnalyzerService.preRAnalysisService.buildBaseCalculatorInput(
            aBuilder,
            params?.ltv ?? 80,
            settings,
            {
                occupancyRate:            params?.occupancyRate            ?? 95,
                managementFeePercent:     params?.managementFeePercent     ?? 10,
                maintenanceEscrowPercent: params?.maintenanceEscrowPercent ?? 10,
                pmi:                      params?.pmi                      ?? 0,
            },
        );

        const summary = this.service.rAnalyzerService.rentalCalculatorService
            .computeRentalAnalysisSummary(baseInput);

        const metrics = this.service.rAnalyzerService.rentalMetricsCalculatorService
            .computeRentalMetrics({
                purchasePrice:        acq?.purchasePrice      ?? 0,
                sellerConcessions:    acq?.sellerConcessions  ?? 0,
                rentCredits:          acq?.credits            ?? 0,
                numberOfUnits:        aBuilder.propertyDetails?.units?.length ?? 1,
                loanAmount:           summary.financingDetails.ltvAmount,
                loanInterest:         acq?.loanInterest       ?? 0,
                loanLength:           acq?.loanLength         ?? 0,
                projectedYearlyRent:  (aBuilder.propertyDetails?.totalIncome ?? 0) * 12,
                occupancyRate:        params?.occupancyRate   ?? 95,
                otherMonthlyIncome:   acq?.monthlyIncome      ?? 0,
                fixedExpensesTotal:   baseInput.fixedExpensesTotal,
                propertyTaxes:        aBuilder.fExpenses?.propertyTaxes   ?? 0,
                hazardInsurance:      aBuilder.fExpenses?.hazardInsurance  ?? 0,
                totalUtilities:       aBuilder.fExpenses?.totalUtilities   ?? 0,
                maintenanceEscrow:    aBuilder.fExpenses?.maintenanceEscrow ?? 0,
                managementFees:       aBuilder.fExpenses?.managementFees   ?? 0,
                repairs:              aBuilder.repairs?.total              ?? 0,
                pi:                   summary.fixedExpenses.pi,
                pmi:                  params?.pmi ?? 0,
                estimatedCashToClose: summary.purchaseCosts.estimatedCashToClose,
            });

        return {
            purchasePrice:    acq?.purchasePrice                        ?? 0,
            rehabRepairCosts: aBuilder.repairs?.total                   ?? null,
            holdingCosts:     aBuilder.rDuration?.holdingCoast          ?? null,
            cashToClose:      summary.purchaseCosts.estimatedCashToClose,
            sellingCosts:     null,
            salePriceArv:     null,
            monthlyCashFlow:  summary.results.monthlyCashFlow,
            noiAnnual:        metrics.incomeStatement.noi,
            cashOnCashReturn: metrics.coc.value,
            totalProfit:      null,
            roiImmediate:     null,
            roiAnnualized:    null,
            timeToExit:       null,
        };
    }

    async getIStrategySummary(
        user: CurrentUserInterface,
        id: string,
    ): Promise<IStrategySummaryResult> {
        const iStrategyAnalysis = await this.service.rAnalyzerService.getAnalysis(
            user,
            id,
            ModuleLabelEnum.INVESTMENT_STRATEGY_ANALYZER,
            ['property', 'module', 'createdBy'],
        );

        const propertyId = iStrategyAnalysis.property.id;
        const userId     = user.id;

        const wholesaleRelations = this.service.rAnalyzerService.analysisService
            .wholesaleService.transformWholesaleEntityService.wholesaleBuilderEntities();
        const fixFlipRelations = this.service.rAnalyzerService.analysisService
            .fFlipService.transformFFlipService.fFlipABuilderRelations();
        const rentalRelations = this.service.transformIStrategy.iStrategyBuilderEntities();

        const [wholesaleResult, fixFlipResult, rentalResult] = await Promise.allSettled([
            this.service.rAnalyzerService.analysisService.preAnalysisService
                .retrieveAnalyseByCriteria(
                    { property: { id: propertyId }, createdBy: { id: userId }, module: { label: ModuleLabelEnum.WHOLESALE_ANALYZER } },
                    ['wholesale', 'createdBy'],
                ),
            this.service.rAnalyzerService.analysisService.preAnalysisService
                .retrieveAnalyseByCriteria(
                    { property: { id: propertyId }, createdBy: { id: userId }, module: { label: ModuleLabelEnum.FIX_FLIP_ANALYZER } },
                    ['fFlip', 'createdBy'],
                ),
            this.service.rAnalyzerService.analysisService.preAnalysisService
                .retrieveAnalyseByCriteria(
                    { property: { id: propertyId }, createdBy: { id: userId }, module: { label: ModuleLabelEnum.RENTAL_ANALYZER } },
                    ['rentalAnalysis', 'rentalAnalysis.params', 'createdBy'],
                ),
        ]);

        const [wholesaleBuilder, fixFlipBuilder, rentalBuilder] = await Promise.all([
            this.loadBuilder(wholesaleResult, 'wholesale', 'wholesale', wholesaleRelations),
            this.loadBuilder(fixFlipResult,  'fFlip',     'fFlip',     fixFlipRelations),
            this.loadBuilder(rentalResult,   'rAnalysis', 'rentalAnalysis', rentalRelations),
        ]);

        const wholesaleWarning  = this.resolveWarning(wholesaleResult, 'Wholesale');
        const fixFlipWarning    = this.resolveWarning(fixFlipResult,   'Fix and Flip');
        const longTermWarning   = this.resolveWarning(rentalResult,    'Long Term Rental');

        const rentalAnalysis = rentalResult.status === 'fulfilled'
            ? rentalResult.value.rentalAnalysis
            : null;

        return {
            wholesale: wholesaleWarning || !wholesaleBuilder
                ? { available: false, warning: wholesaleWarning ?? 'Wholesale builder not initiated.' }
                : { available: true, data: this.computeWholesaleColumn(wholesaleBuilder) },

            fixAndFlip: fixFlipWarning || !fixFlipBuilder
                ? { available: false, warning: fixFlipWarning ?? 'Fix and Flip builder not initiated.' }
                : { available: true, data: this.computeFixFlipColumn(fixFlipBuilder) },

            longTerm: longTermWarning || !rentalBuilder || !rentalAnalysis
                ? { available: false, warning: longTermWarning ?? 'Long Term Rental builder not initiated.' }
                : { available: true, data: this.computeLongTermColumn(rentalBuilder, rentalAnalysis) },

            riskAlerts: RISK_ALERTS,
        };
    }
}