import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ErrorHandlerService } from '../../../common/response';
import { OtherUtils } from '../../../utils/services/tools';
import { RAnalysisService } from '../../r-analysis/services';
import { CurrentUserInterface } from '../../../interface';
import { ModuleLabelEnum } from '../../../common/enum';
import { BrAnalyzerRepository } from '../br-analyzer.repository';
import { PreBrAnalyzerService } from './pre-br-analyzer.service';
import { TransformBrAnalyzerService } from './transform-br-analyzer.service';
import { BrAnalyzerSummaryService } from './br-analyzer-summary.service';
import { CreateBrBuilderDto } from '../dto/create-br-builder.dto';
import { BrAnalyzerEntity } from '../entities/br-analyzer.entity';

@Injectable()
export class BrAnalyzerService {
    /**
     * Service responsible for handling brrr analyzer operations
     */

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        @Inject(forwardRef(() => PreBrAnalyzerService))
        readonly preBrAnalyzerService: PreBrAnalyzerService,
        @Inject(forwardRef(() => BrAnalyzerSummaryService))
        private readonly brAnalyzerSummaryService: BrAnalyzerSummaryService,
        @Inject(forwardRef(() => TransformBrAnalyzerService))
        private readonly transformBrAnalyzerService: TransformBrAnalyzerService,
        readonly rAnalyzerService: RAnalysisService,
        readonly brAnalyzerRepo: BrAnalyzerRepository,
        readonly errorHandler: ErrorHandlerService,
        readonly otherUtils: OtherUtils,
    ) {}

    /**
     * Retrieves the brrr analyzer analysis builder for a given analysis context.
     * Loads the analysis for the specified user and ID, resolves the associated brrr analyzer entity,
     * and fetches the corresponding analysis builder using the resolved brrr analyzer identifier and requested relations.
     */
    async getBrAnalyzerBuilder(user: CurrentUserInterface, id: string, relations: string[]) {
        const analysis = await this.rAnalyzerService.getAnalysis(
            user,
            id,
            ModuleLabelEnum.BRRRR_ANALYZER,
            this.transformBrAnalyzerService.brAnalyzerBuilderCheckEntities(),
        );

        const resultId = analysis.brAnalyzer?.id;
        if (!resultId) return null;

        return await this.rAnalyzerService.aBuilderService.aBuilderRepository.findOne({
            where: { brAnalyzer: { id: resultId } },
            relations,
        });
    }

    /**
     * Retrieves and transforms brrr analyzer analysis builder details for the given user and analysis ID.
     * Logs the operation, fetches the associated analysis builder with required relations,
     * and applies transformation logic to return a structured brrr analyzer builder response.
     */
    async getBrAnalyzerAnalysisBuilder(user: CurrentUserInterface, id: string) {
        this.logger.info(`Get brrr analyzer analysis builder details`);
        const aBuilder = await this.getBrAnalyzerBuilder(
            user,
            id,
            this.transformBrAnalyzerService.brAnalyzerBuilderEntities(),
        );

        return aBuilder
            ? this.transformBrAnalyzerService.transformBrAnalyzerServiceABuilder(id, aBuilder)
            : null;
    }

    /**
     * Upserts all sections of a BRRRR (Buy, Rehab, Rent, Refinance, Repeat) analysis builder.
     * Retrieves or creates an analysis builder with required relations,
     * then sequentially upserts property details, acquisition details, repairs, closing costs, fixed expenses, and refinance information.
     */
    async upsertBRRRRAnalyzerBuilderSections(
        brAnalyzer: BrAnalyzerEntity,
        dto: CreateBrBuilderDto,
    ) {
        const aBuilder = await this.preBrAnalyzerService.getOrCreateBrAnalyzerBuilder(
            brAnalyzer,
            this.transformBrAnalyzerService.brAnalyzerBuilderEntities(),
        );

        await this.preBrAnalyzerService.upsertBrAnalyzerPD(
            brAnalyzer,
            aBuilder,
            dto.propertyDetails,
        );

        await this.rAnalyzerService.preRAnalysisService.upsertAcquisitionDetails(
            aBuilder,
            dto.acquisitionDetails,
        );
        await this.rAnalyzerService.preRAnalysisService.upsertRepairs(aBuilder, dto.repairs);
        await this.preBrAnalyzerService.upsertBrAnalyzerCCoast(aBuilder, dto.cCoast);
        await this.rAnalyzerService.preRAnalysisService.upsertFExpenses(
            aBuilder,
            dto.fixedExpenses,
        );

        await this.preBrAnalyzerService.upsertBrAnalyzerRefi(aBuilder, dto.refi);
    }

    /**
     * Resolves and upserts a complete BRRRR (Buy, Rehab, Rent, Refinance, Repeat) analyzer builder for an analysis.
     * Logs the request, retrieves the analysis with validation for BRRRR_ANALYZER module, creates a BRRRR analyzer entity if not exists,
     * upserts all builder sections (property details, acquisition, repairs, closing costs, fixed expenses, refinance),
     * retrieves the updated analysis builder with its relations, and returns the transformed result.
     */
    async resolveBrAnalyzerBuilder(
        user: CurrentUserInterface,
        id: string,
        dto: CreateBrBuilderDto,
    ) {
        this.logger.info(`Resolve full brrr analyzer builder for analysis[${id}]`);

        const analysis = await this.rAnalyzerService.getAnalysis(
            user,
            id,
            ModuleLabelEnum.BRRRR_ANALYZER,
            this.transformBrAnalyzerService.brAnalyzerBuilderCheckEntities(),
        );

        const brAnalyzer =
            analysis.brAnalyzer ?? (await this.preBrAnalyzerService.createBrAnalyzer(analysis));
        await this.upsertBRRRRAnalyzerBuilderSections(brAnalyzer, dto);

        const updated = await this.rAnalyzerService.aBuilderService.retrieveABuilderByCriteria(
            { brAnalyzer: { id: brAnalyzer.id } },
            this.transformBrAnalyzerService.brAnalyzerBuilderEntities(),
        );

        return this.transformBrAnalyzerService.transformBrAnalyzerServiceABuilder(id, updated);
    }

    /**
     * Retrieves the full breakdown of a BRRR analyzer for the given user and identifier.
     * Loads the builder with required relations, validates completeness of all required sections,
     * and returns a merged result combining transformed builder data with computed summary metrics.
     */
    async getBrAnalyzerFullBreakdown(user: CurrentUserInterface, id: string) {
        this.logger.info(`Retrieve the full breakdown of the brrr analyzer with id: ${id}`);
        const aBuilder = await this.getBrAnalyzerBuilder(
            user,
            id,
            this.transformBrAnalyzerService.brAnalyzerBuilderEntities(),
        );

        if (
            !aBuilder?.propertyDetails ||
            !aBuilder.propertyDetails ||
            !aBuilder.repairs ||
            !aBuilder.cCoast ||
            !aBuilder.fExpenses ||
            !aBuilder.brRefi
        )
            this.errorHandler.badRequest(
                `Brrr analyzer builder must be completed before trying to get full summary breakdown`,
                `Please finish your builder set up first.`,
            );

        return {
            ...this.transformBrAnalyzerService.transformBrAnalyzerServiceABuilder(id, aBuilder),
            ...this.brAnalyzerSummaryService.summaryData(aBuilder),
        };
    }
}
