import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ErrorHandlerService } from '../../../common/response';
import { OtherUtils } from '../../../utils/services/tools';
import { RAnalysisRepository, RAnalysisParamsRepository } from '../repositories';
import { ABuilderService } from '../../a-builder/services';
import { AnalysisService } from '../../analysis/services';
import { CurrentUserInterface } from '../../../interface';
import { CreatePDetailsDto, FExpenseDto } from '../../a-builder/dto';
import { PreRAnalysisService } from './pre-r-analysis.service';
import { RaABuilderService } from './ra-a-builder.service';
import { TransformRaService } from './transform-ra.service';
import { ModuleLabelEnum } from '../../../common/enum';
import {
    AppreciationDto,
    BuyHoldDto,
    CreateRaBuilderDto,
    DealGradeDto,
    RAnalysisDto,
    RentalSummaryDto,
    TaxDeductionDto,
    BaseRentalAnalysisDto, DealComparisonDto,
} from '../dto';
import { RAnalysisEntity } from '../entities';
import { RentalAnalysisCalculatorService, RentalAnalysisSummaryResult } from './r-analysis-calculator.service';
import { PSettingEntity } from '../../p-settings/entities';
import { PSettingsService } from '../../p-settings/services';
import { RentalSummaryCalculatorService } from './r-summary-calculator.service';
import { RentalMetricsCalculatorService, RentalMetricsResult } from './r-metrics-calculator.service';
import { RentalFullBreakdownCalculatorService } from './r-full-breakdown-calculator.service';
import { DealGradeCalculatorService } from './deal-grade-calculator.service';
import { ABuilderEntity } from '../../a-builder/entities';
import { RAnalysisParamsService } from './r-analysis-params.service';

export interface DealComparisonItem {
    analysisId: string;
    analysis: {
        id: string;
        address?: string;
    };
    params: {
        ltv: number;
        occupancyRate: number;
        managementFeePercent: number;
        maintenanceEscrowPercent: number;
        pmi: number;
    };
    summary: RentalAnalysisSummaryResult;
    metrics: RentalMetricsResult;
}

export interface DealComparisonResult {
    items: DealComparisonItem[];
}

@Injectable()
export class RAnalysisService {
    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        @Inject(forwardRef(() => PreRAnalysisService))
        readonly preRAnalysisService: PreRAnalysisService,
        @Inject(forwardRef(() => RAnalysisParamsService))
        readonly rAnalysisParamsService: RAnalysisParamsService,
        @Inject(forwardRef(() => RaABuilderService))
        readonly raABuilderService: RaABuilderService,
        @Inject(forwardRef(() => RentalAnalysisCalculatorService))
        readonly rentalCalculatorService: RentalAnalysisCalculatorService,
        @Inject(forwardRef(() => RentalSummaryCalculatorService))
        readonly rentalSummaryCalculatorService: RentalSummaryCalculatorService,
        @Inject(forwardRef(() => RentalMetricsCalculatorService))
        readonly rentalMetricsCalculatorService: RentalMetricsCalculatorService,
        @Inject(forwardRef(() => DealGradeCalculatorService))
        readonly dealGradeCalculatorService: DealGradeCalculatorService,
        @Inject(forwardRef(() => RentalFullBreakdownCalculatorService))
        readonly rentalFullBreakdownCalculatorService: RentalFullBreakdownCalculatorService,
        @Inject(forwardRef(() => AnalysisService))
        readonly analysisService: AnalysisService,
        readonly transformRaService: TransformRaService,
        readonly errorHandler: ErrorHandlerService,
        readonly otherUtils: OtherUtils,
        readonly settingService: PSettingsService,
        readonly aBuilderService: ABuilderService,
        readonly rAnalysisRepo: RAnalysisRepository,
        readonly rAnalysisParamsRepository: RAnalysisParamsRepository,
    ) {}

    errorOnBuilderNotFound(module: ModuleLabelEnum): never {
        this.errorHandler.notFound(
            `${module} builder not initiated, has to run the first route of the builder to initiate builder`,
            `Builder not found. Please set property details on the builder first`,
        );
    }

    calculatePDetailsGIncome = (dto: CreatePDetailsDto) =>
        this.otherUtils.r2(
            this.aBuilderService.pDetailsService.calculateTotalIncome(
                dto.units.map((u) => u.monthlyRent),
                dto.monthlyIncome,
            ) * 12,
        );

    resolveSettings(userId: string, settingId?: string): Promise<PSettingEntity | null> {
        return settingId
            ? this.settingService.preSettingService.retrieveSettingByCriteria({ id: settingId }, [])
            : this.settingService.preSettingService.getDefaultUserProfile(userId);
    }

    async getAnalysis(
        user: CurrentUserInterface,
        id: string,
        label: ModuleLabelEnum,
        relations: string[],
    ) {
        return await this.preRAnalysisService.fetchUserAndAnalysis(user, id, label, relations);
    }

    async getRABuilder(user: CurrentUserInterface, id: string, relations: string[]) {
        const analysis = await this.getAnalysis(
            user,
            id,
            ModuleLabelEnum.RENTAL_ANALYZER,
            this.transformRaService.rAnalyzerAnalysisCheck(),
        );

        const resultId = analysis.rentalAnalysis?.id;
        if (!resultId) return null;

        const builder = await this.aBuilderService.aBuilderRepository.findOne({
            where: { rAnalysis: { id: resultId } },
            relations,
        });

        return { analysis, builder };
    }

    async getUpdatedBuilder(id: string, relations: string[]) {
        return await this.aBuilderService.retrieveABuilderByCriteria({ id }, relations);
    }

    async getRaAnalysisBuilder(user: CurrentUserInterface, id: string) {
        this.logger.info(`Get analysis property details of rental analyzer`);
        const data = await this.getRABuilder(
            user,
            id,
            this.transformRaService.rAnalyzerBuilderEntities(),
        );
        if (!data?.builder) return null;
        return this.transformRaService.transformRaABuilder(id, data.builder);
    }

    async getMonthlyExpenseBreakdown(user: CurrentUserInterface, id: string, dto: FExpenseDto) {
        this.logger.info(`Calculate the fixed expenses monthly breakdown based on analysis property details total income`);
        const data = await this.getRABuilder(user, id, this.transformRaService.getMonthlyExpenseBreakdown());
        return this.aBuilderService.fExpensesService.calcMonthlyExpenseBreakdown(
            data?.builder?.propertyDetails?.totalIncome!,
            dto,
        );
    }

    async getFExpenseTotal(user: CurrentUserInterface, id: string, dto: FExpenseDto) {
        this.logger.info(`Calculate the total amount of fixed expenses based on analysis property details total income`);
        const data = await this.getRABuilder(user, id, this.transformRaService.getMonthlyExpenseBreakdown());
        return this.aBuilderService.fExpensesService.resolveFETotal(
            dto,
            data?.builder?.propertyDetails?.totalIncome!,
        );
    }

    async upsertRaBuilderSections(
        rAnalyzer: RAnalysisEntity,
        aBuilder: ABuilderEntity,
        dto: CreateRaBuilderDto,
    ) {
        await this.preRAnalysisService.upsertPropertyDetails(rAnalyzer, dto.propertyDetails);
        await this.preRAnalysisService.upsertAcquisitionDetails(aBuilder, dto.acquisitionDetails);
        await this.preRAnalysisService.upsertRepairs(aBuilder, dto.repairs);
        await this.preRAnalysisService.upsertFExpenses(aBuilder, dto.fixedExpenses);
    }

    async resolveRaBuilder(user: CurrentUserInterface, id: string, dto: CreateRaBuilderDto) {
        this.logger.info(`Resolve full rental analysis builder for analysis[${id}]`);

        const analysis = await this.getAnalysis(
            user,
            id,
            ModuleLabelEnum.RENTAL_ANALYZER,
            this.transformRaService.rAnalyzerAnalysisCheck(),
        );

        const rAnalyzer =
            analysis.rentalAnalysis ?? (await this.preRAnalysisService.createRAnalyzer(analysis));
        const aBuilder = await this.raABuilderService.getOrCreateRAnalyzerBuilder(
            rAnalyzer,
            this.transformRaService.rAnalyzerBuilderEntities(),
        );
        await this.upsertRaBuilderSections(rAnalyzer, aBuilder, dto);

        const updated = await this.getUpdatedBuilder(
            aBuilder.id,
            this.transformRaService.rAnalyzerBuilderEntities(),
        );

        return this.transformRaService.transformRaABuilder(id, updated);
    }

    async resolveBuilderCtx(user: CurrentUserInterface, id: string) {
        const data = await this.getRABuilder(
            user,
            id,
            this.transformRaService.rAnalyzerBuilderEntities(),
        );
        if (!data?.builder) return null;
        return { analysis: data.analysis, builder: data.builder };
    }

    async resolveBaseContext(
        user: CurrentUserInterface,
        id: string,
        dto: BaseRentalAnalysisDto,
        pmi?: number,
    ) {
        const builderCtx = await this.resolveBuilderCtx(user, id);
        if (!builderCtx) return null;

        const { analysis, builder: aBuilder } = builderCtx;

        await this.rAnalysisParamsService.upsertRParam(
            analysis.rentalAnalysis!,
            {
                ltv: dto.ltv,
                occupancyRate: dto.occupancyRate,
                managementFeePercent: dto.managementFeePercent,
                maintenanceEscrowPercent: dto.maintenanceEscrowPercent,
            },
            { pmi: pmi },
        );

        const settings = await this.resolveSettings(user.id, dto.settingId);
        const baseInput = this.preRAnalysisService.buildBaseCalculatorInput(
            aBuilder,
            dto.ltv,
            settings,
            {
                occupancyRate: dto.occupancyRate,
                managementFeePercent: dto.managementFeePercent,
                maintenanceEscrowPercent: dto.maintenanceEscrowPercent,
                additionalPurchaseCosts: dto.additionalPurchaseCosts,
                additionalFixedExpenses: dto.additionalFixedExpenses,
                additionalIncome: dto.additionalIncome,
            },
        );
        const base = this.rentalCalculatorService.computeRentalAnalysisSummary(baseInput);

        return { aBuilder, settings, baseInput, base };
    }

    async getRentalAnalysisSummary(user: CurrentUserInterface, id: string, dto: RAnalysisDto) {
        const ctx = await this.resolveBaseContext(user, id, dto, dto.pmi);
        if (!ctx) return null;

        return ctx.base;
    }

    async getRentalSummary(user: CurrentUserInterface, id: string, dto: RentalSummaryDto) {
        const ctx = await this.resolveBaseContext(user, id, dto);
        if (!ctx) return null;

        const { aBuilder, baseInput, base } = ctx;
        const acq = aBuilder.acquisitionDetails;
        const pd = aBuilder.propertyDetails;

        return this.rentalSummaryCalculatorService.computeRentalSummary({
            purchasePrice: acq?.purchasePrice ?? 0,
            numberOfUnits: pd?.units?.length ?? 1,
            acquisitionCost: acq?.acquisitionCoast ?? 0,
            loanInterest: acq?.loanInterest ?? 0,
            loanLength: acq?.loanLength ?? 0,
            estimatedCashToClose: base.purchaseCosts.estimatedCashToClose,
            yearlyCashFlow: base.results.yearlyCashFlow,
            fixedExpensesTotal: baseInput.fixedExpensesTotal,
            projectedMonthlyRent: pd?.totalIncome ?? 0,
            depreciationPercent: dto.depreciationPercent,
            yearsToExit: dto.appreciation?.yearsToExit ?? 30,
            annualAppreciationRate: dto.appreciation?.annualAppreciationRate ?? 3,
            additionalEquity: dto.appreciation?.additionalEquity ?? 0,
            incomeTaxRate: dto.incomeTaxRateOverride ?? ctx.settings?.taxRate ?? 0,
            pi: base.fixedExpenses.pi,
            ltvAmount: base.financingDetails.ltvAmount,
        });
    }

    async getTaxDeductionSummary(user: CurrentUserInterface, id: string, dto: TaxDeductionDto) {
        const ctx = await this.resolveBaseContext(user, id, dto);
        if (!ctx) return null;

        const { aBuilder, base } = ctx;
        const acq = aBuilder.acquisitionDetails;
        const depreciationAmount = (acq?.purchasePrice ?? 0) * (dto.depreciationPercent / 100);

        return this.rentalFullBreakdownCalculatorService.computeTaxDeductionSummary(
            depreciationAmount,
            base.financingDetails.ltvAmount,
            acq?.loanInterest ?? 0,
            acq?.loanLength ?? 0,
            dto.incomeTaxRateOverride ?? ctx.settings?.taxRate ?? 0,
            base.purchaseCosts.estimatedCashToClose,
        );
    }

    async getPaydownSummary(user: CurrentUserInterface, id: string, dto: TaxDeductionDto) {
        const ctx = await this.resolveBaseContext(user, id, dto);
        if (!ctx) return null;

        const { aBuilder, base } = ctx;
        const acq = aBuilder.acquisitionDetails;

        return this.rentalFullBreakdownCalculatorService.computePaydownSummary(
            base.fixedExpenses.pi,
            base.financingDetails.ltvAmount,
            acq?.loanInterest ?? 0,
            acq?.loanLength ?? 0,
            base.purchaseCosts.estimatedCashToClose,
        );
    }

    async getAppreciationSummary(user: CurrentUserInterface, id: string, dto: AppreciationDto) {
        const ctx = await this.resolveBaseContext(user, id, dto);
        if (!ctx) return null;

        const { aBuilder, base } = ctx;
        const acq = aBuilder.acquisitionDetails;
        const depreciationAmount = (acq?.purchasePrice ?? 0) * (dto.depreciationPercent / 100);

        const taxDeduction = this.rentalFullBreakdownCalculatorService.computeTaxDeductionSummary(
            depreciationAmount,
            base.financingDetails.ltvAmount,
            acq?.loanInterest ?? 0,
            acq?.loanLength ?? 0,
            dto.incomeTaxRateOverride ?? ctx.settings?.taxRate ?? 0,
            base.purchaseCosts.estimatedCashToClose,
        );

        const paydown = this.rentalFullBreakdownCalculatorService.computePaydownSummary(
            base.fixedExpenses.pi,
            base.financingDetails.ltvAmount,
            acq?.loanInterest ?? 0,
            acq?.loanLength ?? 0,
            base.purchaseCosts.estimatedCashToClose,
        );

        return this.rentalFullBreakdownCalculatorService.computeAppreciationSummary(
            acq?.purchasePrice ?? 0,
            dto.annualAppreciationRate ?? 3,
            paydown.averageAnnualROIFromPaydown,
            taxDeduction.totalROIOnTaxSavings,
            dto.annualAppreciationRate ?? 3,
        );
    }

    async getBuyHoldProjections(user: CurrentUserInterface, id: string, dto: BuyHoldDto) {
        const ctx = await this.resolveBaseContext(user, id, dto);
        if (!ctx) return null;

        const { aBuilder, baseInput, base } = ctx;
        const acq = aBuilder.acquisitionDetails;
        const fe = aBuilder.fExpenses;
        const depreciationAmount = (acq?.purchasePrice ?? 0) * (dto.depreciationPercent / 100);

        return this.rentalFullBreakdownCalculatorService.computeBuyHoldProjections({
            depreciationAmount,
            estimatedCashToClose: base.purchaseCosts.estimatedCashToClose,
            incomeTaxRate: dto.incomeTaxRateOverride ?? ctx.settings?.taxRate ?? 0,
            loanAmount: base.financingDetails.ltvAmount,
            loanInterest: acq?.loanInterest ?? 0,
            loanLength: acq?.loanLength ?? 0,
            pi: base.fixedExpenses.pi,
            purchasePrice: acq?.purchasePrice ?? 0,
            annualAppreciationRate: dto.annualAppreciationRate ?? 3,
            grossRent: baseInput.projectedMonthlyRent,
            vacancy: dto.vacancy ?? 5,
            otherMonthlyIncome: baseInput.otherMonthlyIncome,
            propertyTaxes: fe?.propertyTaxes ?? 0,
            insurance: fe?.hazardInsurance ?? 0,
            propertyManagement: dto.managementFeePercent,
            maintenance: dto.maintenanceEscrowPercent,
            capitalReserves: fe?.cashReserves ?? 0,
            annualDebtService: base.fixedExpenses.pi * 12,
            yearlyFixedExpenses: baseInput.fixedExpensesTotal * 12,
            projectionYears: [1, 2, 3, 5, 10, 30],
            incomeIncreasePerYear: dto.incomeIncreasePerYear ?? 0,
            expenseIncreasePerYear: dto.expenseIncreasePerYear ?? 0,
            sellingCosts: dto.sellingCosts ?? 6,
        });
    }

    async getRentalDealGrade(user: CurrentUserInterface, id: string, dto: DealGradeDto) {
        const ctx = await this.resolveBaseContext(user, id, dto);
        if (!ctx) return null;

        const { aBuilder, base } = ctx;
        const acq = aBuilder.acquisitionDetails;
        const pd = aBuilder.propertyDetails;
        const fe = aBuilder.fExpenses;

        return this.dealGradeCalculatorService.computeDealGrade({
            purchasePrice: acq?.purchasePrice ?? 0,
            loanAmount: base.financingDetails.ltvAmount,
            loanInterest: acq?.loanInterest ?? 0,
            loanLength: acq?.loanLength ?? 0,
            pi: base.fixedExpenses.pi,
            pmi: 0,
            grossMonthlyRent: pd?.totalIncome ?? 0,
            vacancyRate: 1 - dto.occupancyRate / 100,
            propertyTaxes: fe?.propertyTaxes ?? 0,
            insurance: fe?.hazardInsurance ?? 0,
            utilities: fe?.totalUtilities ?? 0,
            managementPct: dto.managementFeePercent / 100,
            maintenancePct: dto.maintenanceEscrowPercent / 100,
            sellerConcessions: acq?.sellerConcessions ?? 0,
            rentCredits: acq?.credits ?? 0,
            acquisitionCost: acq?.acquisitionCoast ?? 0,
            estimatedCashToClose: base.purchaseCosts.estimatedCashToClose,
            zipCapAvg: dto.zipCapAvg / 100,
            minCashflowTarget: dto.minCashflowTarget ?? 200,
            debtRiskFlag: dto.debtRiskFlag ?? 0,
            capitalExtracted: dto.capitalExtracted ?? 0,
        });
    }

    async getRentalMetrics(user: CurrentUserInterface, id: string, dto: RAnalysisDto) {
        const ctx = await this.resolveBaseContext(user, id, dto, dto.pmi);
        if (!ctx) return null;

        const { aBuilder, baseInput, base } = ctx;
        const acq = aBuilder.acquisitionDetails;
        const pd = aBuilder.propertyDetails;
        const fe = aBuilder.fExpenses;
        const rep = aBuilder.repairs;

        return this.rentalMetricsCalculatorService.computeRentalMetrics({
            purchasePrice: acq?.purchasePrice ?? 0,
            sellerConcessions: acq?.sellerConcessions ?? 0,
            rentCredits: acq?.credits ?? 0,
            numberOfUnits: pd?.units?.length ?? 1,
            loanAmount: base.financingDetails.ltvAmount,
            loanInterest: acq?.loanInterest ?? 0,
            loanLength: acq?.loanLength ?? 0,
            projectedYearlyRent: (pd?.totalIncome ?? 0) * 12,
            occupancyRate: dto.occupancyRate,
            otherMonthlyIncome: acq?.monthlyIncome ?? 0,
            fixedExpensesTotal: baseInput.fixedExpensesTotal,
            propertyTaxes: fe?.propertyTaxes ?? 0,
            hazardInsurance: fe?.hazardInsurance ?? 0,
            totalUtilities: fe?.totalUtilities ?? 0,
            maintenanceEscrow: fe?.maintenanceEscrow ?? 0,
            managementFees: fe?.managementFees ?? 0,
            repairs: rep?.total ?? 0,
            pi: base.fixedExpenses.pi,
            pmi: dto.pmi ?? 0,
            estimatedCashToClose: base.purchaseCosts.estimatedCashToClose,
        });
    }

    async resolveSingleComparisonItem(
        user: CurrentUserInterface,
        id: string,
    ): Promise<DealComparisonItem | null> {
        const analysis = await this.getAnalysis(
            user,
            id,
            ModuleLabelEnum.RENTAL_ANALYZER,
            this.transformRaService.rAnalyzerComparison(),
        );

        const rAnalyzer = analysis.rentalAnalysis;
        if (!rAnalyzer?.analysisBuilder) return null;

        const aBuilder  = rAnalyzer.analysisBuilder;
        const params    = rAnalyzer.params;
        const settings  = await this.resolveSettings(user.id);

        const resolvedParams = {
            ltv:                      params?.ltv ?? 80,
            occupancyRate:            params?.occupancyRate            ?? settings?.occupancyRate    ?? 95,
            managementFeePercent:     params?.managementFeePercent     ?? 10,
            maintenanceEscrowPercent: params?.maintenanceEscrowPercent ?? settings?.maintenanceEscrow ?? 10,
            pmi:                      params?.pmi                      ?? 0,
        };

        const baseInput = this.preRAnalysisService.buildBaseCalculatorInput(
            aBuilder,
            resolvedParams.ltv,
            settings,
            {
                occupancyRate:            resolvedParams.occupancyRate,
                managementFeePercent:     resolvedParams.managementFeePercent,
                maintenanceEscrowPercent: resolvedParams.maintenanceEscrowPercent,
                pmi:                      resolvedParams.pmi,
            },
        );

        const summary = this.rentalCalculatorService.computeRentalAnalysisSummary(baseInput);

        const acq = aBuilder.acquisitionDetails;
        const pd  = aBuilder.propertyDetails;
        const fe  = aBuilder.fExpenses;
        const rep = aBuilder.repairs;

        const metrics = this.rentalMetricsCalculatorService.computeRentalMetrics({
            purchasePrice:        acq?.purchasePrice      ?? 0,
            sellerConcessions:    acq?.sellerConcessions  ?? 0,
            rentCredits:          acq?.credits            ?? 0,
            numberOfUnits:        pd?.units?.length       ?? 1,
            loanAmount:           summary.financingDetails.ltvAmount,
            loanInterest:         acq?.loanInterest       ?? 0,
            loanLength:           acq?.loanLength         ?? 0,
            projectedYearlyRent:  (pd?.totalIncome        ?? 0) * 12,
            occupancyRate:        resolvedParams.occupancyRate,
            otherMonthlyIncome:   acq?.monthlyIncome      ?? 0,
            fixedExpensesTotal:   baseInput.fixedExpensesTotal,
            propertyTaxes:        fe?.propertyTaxes       ?? 0,
            hazardInsurance:      fe?.hazardInsurance     ?? 0,
            totalUtilities:       fe?.totalUtilities      ?? 0,
            maintenanceEscrow:    fe?.maintenanceEscrow   ?? 0,
            managementFees:       fe?.managementFees      ?? 0,
            repairs:              rep?.total              ?? 0,
            pi:                   summary.fixedExpenses.pi,
            pmi:                  resolvedParams.pmi,
            estimatedCashToClose: summary.purchaseCosts.estimatedCashToClose,
        });

        return {
            analysisId: id,
            analysis: {
                id:      analysis.id,
                address: analysis.property.formattedAddress ?? undefined,
            },
            params:   resolvedParams,
            summary,
            metrics,
        };
    }

    async getDealComparison(
        user: CurrentUserInterface,
        dto: DealComparisonDto,
    ): Promise<DealComparisonResult> {
        this.logger.info(`Deal comparison for analyses [${dto.analysisIds.join(', ')}]`);

        const items = await Promise.all(
            dto.analysisIds.map(id => this.resolveSingleComparisonItem(user, id)),
        );

        return { items: items.filter((item): item is DealComparisonItem => item !== null) };
    }
}
