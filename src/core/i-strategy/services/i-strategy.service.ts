import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ErrorHandlerService } from '../../../common/response';
import { OtherUtils } from '../../../utils/services/tools';
import { RAnalysisService } from '../../r-analysis/services';
import { CurrentUserInterface } from '../../../interface';
import { ADetailsDto, RefiCreateDto } from '../../a-builder/dto';
import { ModuleLabelEnum } from '../../../common/enum';
import { IStrategyRepository } from '../i-strategy.repository';
import { TransformIStrategyEntityService } from './transform-i-strategy-entity.service';
import { PreIStrategyService } from './pre-i-strategy.service';
import { CreateIStrategyBuilderDto } from '../dto/create-i-strategy-builder.dto';
import { IStrategyEntity } from '../entities/i-strategy.entity';
import { ABuilderEntity } from '../../a-builder/entities';
import { IStrategySummaryService } from './i-strategy-summary.service';

@Injectable()
export class IStrategyService {
    /**
     * Service responsible for handling investment strategy operations
     */

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        @Inject(forwardRef(() => PreIStrategyService))
        readonly preIStrategyService: PreIStrategyService,
        @Inject(forwardRef(() => TransformIStrategyEntityService))
        readonly transformIStrategy: TransformIStrategyEntityService,
        @Inject(forwardRef(() => IStrategySummaryService))
        readonly iStrategySummaryService: IStrategySummaryService,
        readonly rAnalyzerService: RAnalysisService,
        readonly iStrategyRepo: IStrategyRepository,
        readonly errorHandler: ErrorHandlerService,
        readonly otherUtils: OtherUtils,
    ) {}

    /**
     * Calculates the cash needed to close for acquisition details.
     * Delegates the computation using closing cost fees and down payment values.
     */
    calculateCashNeedToClose = (dto: ADetailsDto) =>
        this.rAnalyzerService.aBuilderService.aDetailsService.calculateCashNeededToClose(
            dto.closingCostFees ?? 0,
            dto.downPayment ?? 0,
        );

    /**
     * Calculates the cash-out available from refinancing.
     * Delegates refinance cash computation using after repair value, refinance LTV,
     * and existing loan amount.
     */
    cashOutForRefi = (dto: RefiCreateDto) =>
        this.rAnalyzerService.aBuilderService.refinanceService.calculateRefiCash(
            dto.afterRepairValue,
            dto.refiLTV,
            dto.oldLoanAmount,
        );

    /**
     * Retrieves the investment strategy analysis builder for a given analysis context.
     * Loads the analysis for the specified user and ID, resolves the associated investment strategy entity,
     * and fetches the corresponding analysis builder using the resolved investment strategy identifier and requested relations.
     */
    async getIStrategyBuilder(user: CurrentUserInterface, id: string, relations: string[]) {
        const analysis = await this.rAnalyzerService.getAnalysis(
            user,
            id,
            ModuleLabelEnum.INVESTMENT_STRATEGY_ANALYZER,
            this.transformIStrategy.iStrategyBuilderCheckEntities(),
        );

        const iStrategyId = analysis.iStrategy?.id;
        if (!iStrategyId) return null;

        return await this.rAnalyzerService.aBuilderService.aBuilderRepository.findOne({
            where: { iStrategy: { id: iStrategyId } },
            relations,
        });
    }

    /**
     * Retrieves and transforms investment strategy analysis builder details for the given user and analysis ID.
     * Logs the operation, fetches the associated analysis builder with required relations,
     * and applies transformation logic to return a structured investment strategy builder response.
     */
    async getIStrategyAnalysisBuilder(user: CurrentUserInterface, id: string) {
        this.logger.info(`Get investment strategy analysis builder details`);
        const aBuilder = await this.getIStrategyBuilder(
            user,
            id,
            this.transformIStrategy.iStrategyBuilderEntities(),
        );

        return aBuilder ? this.transformIStrategy.transformIStrategyABuilder(id, aBuilder) : null;
    }

    async upsertIStrategyBuilderSections(
        strategy: IStrategyEntity,
        aBuilder: ABuilderEntity,
        dto: CreateIStrategyBuilderDto,
    ) {
        await this.preIStrategyService.upsertIStrategyPD(strategy, aBuilder, dto.propertyDetails);

        await this.rAnalyzerService.preRAnalysisService.upsertAcquisitionDetails(
            aBuilder,
            dto.acquisitionDetails,
        );
        await this.rAnalyzerService.preRAnalysisService.upsertRepairs(aBuilder, dto.repairs);
        await this.preIStrategyService.upsertIStrategyRDuration(aBuilder, dto.rDuration);
        await this.rAnalyzerService.preRAnalysisService.upsertFExpenses(
            aBuilder,
            dto.fixedExpenses,
        );
        await this.preIStrategyService.upsertIStrategyRefinance(aBuilder, dto.refinance);
    }

    async resolveIStrategyBuilder(
        user: CurrentUserInterface,
        id: string,
        dto: CreateIStrategyBuilderDto,
    ) {
        this.logger.info(`Resolve full investment strategy builder for analysis[${id}]`);

        const analysis = await this.rAnalyzerService.getAnalysis(
            user,
            id,
            ModuleLabelEnum.INVESTMENT_STRATEGY_ANALYZER,
            this.transformIStrategy.iStrategyBuilderCheckEntities(),
        );

        const iStrategy =
            analysis.iStrategy ?? (await this.preIStrategyService.createIStrategy(analysis));
        const aBuilder = await this.preIStrategyService.getOrCreateIStrategyBuilder(
            iStrategy,
            this.transformIStrategy.iStrategyBuilderEntities(),
        );

        await this.upsertIStrategyBuilderSections(iStrategy, aBuilder, dto);

        const updated = await this.rAnalyzerService.aBuilderService.retrieveABuilderByCriteria(
            { id: aBuilder.id },
            this.transformIStrategy.iStrategyBuilderEntities(),
        );

        return this.transformIStrategy.transformIStrategyABuilder(id, updated);
    }
}
