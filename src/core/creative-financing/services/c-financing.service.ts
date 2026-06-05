import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ErrorHandlerService } from '../../../common/response';
import { OtherUtils } from '../../../utils/services/tools';
import { CFinancingRepository } from '../c-financing.repository';
import { RAnalysisService } from '../../r-analysis/services';
import { PreCFinancingService } from './pre-c-financing.service';
import { CurrentUserInterface } from '../../../interface';
import { ModuleLabelEnum } from '../../../common/enum';
import { CFinancingCalculatorDto } from '../dto';
import { CFinancingCalculatorService } from './c-financing-calculator.service';
import { CreateRaBuilderDto } from '../../r-analysis/dto';
import { CFinancingEntity } from '../entities/c-financing.entity';

@Injectable()
export class CFinancingService {
    /**
     * Service responsible for handling creative financing operations
     */

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        @Inject(forwardRef(() => PreCFinancingService))
        readonly preCFinancingService: PreCFinancingService,
        @Inject(forwardRef(() => CFinancingCalculatorService))
        readonly cFinancingCalculatorService: CFinancingCalculatorService,
        readonly rAnalyzerService: RAnalysisService,
        readonly cFinancingRepository: CFinancingRepository,
        readonly errorHandler: ErrorHandlerService,
        readonly otherUtils: OtherUtils,
    ) {}

    cFinancingBuilderCheckEntities = () => ['module', 'createdBy', 'cFinancing'];

    /**
     * Retrieves the C financing analysis builder for a given analysis context.
     * Loads the base analysis with required validation relations, then resolves the associated builder using the C financing identifier.
     * Returns the fully loaded analysis builder entity with the specified relational graph.
     */
    async getCFinancingBuilder(user: CurrentUserInterface, id: string, relations: string[]) {
        const analysis = await this.rAnalyzerService.getAnalysis(
            user,
            id,
            ModuleLabelEnum.CREATIVE_FINANCING_ANALYZER,
            this.cFinancingBuilderCheckEntities(),
        );

        const resultId = analysis.cFinancing?.id;
        if (!resultId) return null;

        return await this.rAnalyzerService.aBuilderService.aBuilderRepository.findOne({
            where: { cFinancing: { id: resultId } },
            relations,
        });
    }

    /**
     * Retrieves C financing analysis builder details.
     * Loads the analysis builder with required relations, then transforms and returns the consolidated builder DTO.
     */
    async getCFinancingAnalysisBuilder(user: CurrentUserInterface, id: string) {
        this.logger.info(`Get creative financing analysis builder details`);
        const aBuilder = await this.getCFinancingBuilder(
            user,
            id,
            this.rAnalyzerService.transformRaService.rAnalyzerBuilderEntities(),
        );

        return aBuilder
            ? this.rAnalyzerService.transformRaService.transformRaABuilder(id, aBuilder)
            : null;
    }

    async upsertCFinancingBuilderSections(cFinancing: CFinancingEntity, dto: CreateRaBuilderDto) {
        const aBuilder = await this.preCFinancingService.getOrCreateCFinancingBuilder(
            cFinancing,
            this.rAnalyzerService.transformRaService.rAnalyzerBuilderEntities(),
        );

        await this.preCFinancingService.upsertCFinancingPD(
            cFinancing,
            aBuilder,
            dto.propertyDetails,
        );

        await this.rAnalyzerService.preRAnalysisService.upsertAcquisitionDetails(
            aBuilder,
            dto.acquisitionDetails,
        );
        await this.rAnalyzerService.preRAnalysisService.upsertRepairs(aBuilder, dto.repairs);
        await this.rAnalyzerService.preRAnalysisService.upsertFExpenses(
            aBuilder,
            dto.fixedExpenses,
        );
    }

    async resolveCFinancingBuilder(
        user: CurrentUserInterface,
        id: string,
        dto: CreateRaBuilderDto,
    ) {
        this.logger.info(`Resolve full creative financing builder for analysis[${id}]`);

        const analysis = await this.rAnalyzerService.getAnalysis(
            user,
            id,
            ModuleLabelEnum.CREATIVE_FINANCING_ANALYZER,
            this.rAnalyzerService.transformRaService.rAnalyzerAnalysisCheck(),
        );

        const cFinancing =
            analysis.cFinancing ?? (await this.preCFinancingService.createCFinancing(analysis));
        await this.upsertCFinancingBuilderSections(cFinancing, dto);

        const updated = await this.rAnalyzerService.aBuilderService.retrieveABuilderByCriteria(
            { cFinancing: { id: cFinancing.id } },
            this.rAnalyzerService.transformRaService.rAnalyzerBuilderEntities(),
        );

        return this.rAnalyzerService.transformRaService.transformRaABuilder(id, updated);
    }

    /**
     * Generates a financing calculation summary based on the provided data.
     * Delegates the computation to the financing calculator service and returns the result.
     */
    generateResume(dto: CFinancingCalculatorDto) {
        return this.cFinancingCalculatorService.compute(dto);
    }
}
