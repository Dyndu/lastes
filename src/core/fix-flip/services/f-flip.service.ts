import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ErrorHandlerService } from '../../../common/response';
import { FFlipRepository } from '../f-flip.repository';
import { RAnalysisService } from '../../r-analysis/services';
import { OtherUtils } from '../../../utils/services/tools';
import { CurrentUserInterface } from '../../../interface';
import { PreFFlipService } from './pre-f-flip.service';
import { TransformFFlipService } from './transform-f-flip.service';
import { ModuleLabelEnum } from '../../../common/enum';
import { FFlipSummaryService } from './f-flip-summary.service';
import { CreateFFlipBuilderDto } from '../dto/create-f-flip-builder.dto';
import { FFlipEntity } from '../entity/f-flip.entity';
import { ABuilderEntity } from '../../a-builder/entities';

@Injectable()
export class FFlipService {
    /**
     * Service responsible for handling fix and flip module operation
     */

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        @Inject(forwardRef(() => PreFFlipService))
        readonly preFFlipService: PreFFlipService,
        @Inject(forwardRef(() => FFlipSummaryService))
        readonly fFlipSummaryService: FFlipSummaryService,
        @Inject(forwardRef(() => TransformFFlipService))
        readonly transformFFlipService: TransformFFlipService,
        readonly errorHandler: ErrorHandlerService,
        readonly otherUtils: OtherUtils,
        readonly rAnalyzerService: RAnalysisService,
        readonly fFlipRepo: FFlipRepository,
    ) {}

    /**
     * Retrieves the F flip analysis builder for a given analysis context.
     * Loads the base analysis with required validation relations, then resolves the associated builder using the F flip identifier.
     * Returns the fully loaded analysis builder entity with the specified relational graph.
     */
    async getFFlipBuilder(user: CurrentUserInterface, id: string, relations: string[]) {
        const analysis = await this.rAnalyzerService.getAnalysis(
            user,
            id,
            ModuleLabelEnum.FIX_FLIP_ANALYZER,
            this.transformFFlipService.analysisCheckEntities(),
        );

        return await this.rAnalyzerService.aBuilderService.aBuilderRepository.findOne({
            where: { fFlip: { id: analysis.fFlip?.id } },
            relations,
        });
    }

    /**
     * Retrieves the Fix & Flip analysis builder details for a given analysis.
     * Fetches the analysis with required relations, then transforms the builder data
     * into a structured response including property, acquisition, repairs, and sale details.
     */
    async getFFlipAnalysisBuilder(user: CurrentUserInterface, id: string) {
        this.logger.info(`Get fix and flip analysis builder details`);
        const aBuilder = await this.getFFlipBuilder(
            user,
            id,
            this.transformFFlipService.fFlipABuilderRelations(),
        );

        if (!aBuilder) return null;
        return this.transformFFlipService.transformFFlipABuilder(id, aBuilder);
    }

    /**
     * Upserts all sections of a fix-and-flip builder entity.
     * Updates or creates property details for the fix-and-flip entity,
     * concurrently upserts acquisition details and repairs on the analysis builder,
     * then sequentially upserts holding coast and sale information.
     */
    async upsertFFlipBuilderSections(
        fFlip: FFlipEntity,
        aBuilder: ABuilderEntity,
        dto: CreateFFlipBuilderDto,
    ) {
        await this.preFFlipService.upsertFFlipPD(fFlip, aBuilder, dto.propertyDetails);

        await this.rAnalyzerService.preRAnalysisService.upsertAcquisitionDetails(
            aBuilder,
            dto.acquisitionDetails,
        );

        await this.rAnalyzerService.preRAnalysisService.upsertRepairs(aBuilder, dto.repairs);

        await this.preFFlipService.upsertFFLipHoldingCoast(aBuilder, dto.hCoast);
        await this.preFFlipService.upsertFFlipSale(aBuilder, dto.sale);
    }

    /**
     * Resolves and upserts a complete fix-and-flip builder for an analysis.
     * Logs the request, retrieves the analysis with validation for FIX_FLIP_ANALYZER module,
     * creates a fix-and-flip entity if not exists, retrieves or creates an analysis builder
     * with required relations, upserts all builder sections, fetches the updated builder
     * with its relations, and returns the transformed result.
     */
    async resolveFFlipBuilder(user: CurrentUserInterface, id: string, dto: CreateFFlipBuilderDto) {
        this.logger.info(`Resolve full fix and flip builder for analysis[${id}]`);

        const analysis = await this.rAnalyzerService.getAnalysis(
            user,
            id,
            ModuleLabelEnum.FIX_FLIP_ANALYZER,
            this.transformFFlipService.analysisCheckEntities(),
        );

        const fFlip = analysis.fFlip ?? (await this.preFFlipService.createFFlip(analysis));
        const aBuilder = await this.preFFlipService.getOrCreateFlipBuilder(
            fFlip,
            this.transformFFlipService.fFlipABuilderRelations(),
        );

        await this.upsertFFlipBuilderSections(fFlip, aBuilder, dto);

        const updated = await this.rAnalyzerService.aBuilderService.retrieveABuilderByCriteria(
            { id: aBuilder.id },
            this.transformFFlipService.fFlipABuilderRelations(),
        );

        return this.transformFFlipService.transformFFlipABuilder(id, updated);
    }

    /**
     * Retrieves the full summary breakdown for a fix and flip analysis.
     * Loads the builder with required relations, validates completeness of all sections,
     * and delegates transformation to generate the final summary response.
     */
    async getFFlipSummary(user: CurrentUserInterface, id: string) {
        this.logger.info(
            `Retrieve the full summary breakdown of this builder of the module fix and flip`,
        );
        const aBuilder = await this.getFFlipBuilder(
            user,
            id,
            this.transformFFlipService.fFlipABuilderRelations(),
        );

        if (!aBuilder)
            this.rAnalyzerService.errorOnBuilderNotFound(ModuleLabelEnum.FIX_FLIP_ANALYZER);

        if (
            !aBuilder.propertyDetails ||
            !aBuilder.acquisitionDetails ||
            !aBuilder.repairs ||
            !aBuilder.hCoast ||
            !aBuilder.sale
        )
            this.errorHandler.badRequest(
                `getFFlipSummary failed for FFlip[${id}] user[${user.id}]: Either property details, acquisitions details, repairs, holding coast or sale are missing, cannot proceed to the summary breakdown`,
                `All builder section must be completed before breaking down the summary.`,
            );

        return this.transformFFlipService.transformFFlipSummaryBreakdown(id, aBuilder);
    }
}
