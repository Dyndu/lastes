import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ErrorHandlerService } from '../../../common/response';
import { OtherUtils } from '../../../utils/services/tools';
import { RAnalysisService } from '../../r-analysis/services';
import { CurrentUserInterface } from '../../../interface';
import { ModuleLabelEnum } from '../../../common/enum';
import { PreWholesaleService } from './pre-wholesale.service';
import { TransformWholesaleEntityService } from './transform-wholesale-entity.service';
import { WholesaleRepository } from '../wholesale.repository';
import { WholesaleEntity } from '../entities/wholesale.entity';
import { CreateWholesaleBuilderDto } from '../dto/create-wholesale-builder.dto';
import { ABuilderEntity } from '../../a-builder/entities';
import { WholesaleCalculatorService } from './wholesale-calculator.service';

@Injectable()
export class WholesaleService {
    /**
     * Service responsible for handling wholesale operations
     */

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        @Inject(forwardRef(() => PreWholesaleService))
        readonly preWholesaleService: PreWholesaleService,
        @Inject(forwardRef(() => WholesaleCalculatorService))
        readonly wholesaleCalculatorService: WholesaleCalculatorService,
        @Inject(forwardRef(() => TransformWholesaleEntityService))
        readonly transformWholesaleEntityService: TransformWholesaleEntityService,
        readonly rAnalyzerService: RAnalysisService,
        readonly wholesaleRepo: WholesaleRepository,
        readonly errorHandler: ErrorHandlerService,
        readonly otherUtils: OtherUtils,
    ) {}

    /**
     * Retrieves the wholesale analysis builder for a given analysis context.
     * Loads the analysis for the specified user and ID, resolves the associated wholesale entity,
     * and fetches the corresponding analysis builder using the resolved wholesale identifier and requested relations.
     */
    async getWholesaleBuilder(user: CurrentUserInterface, id: string, relations: string[]) {
        const analysis = await this.rAnalyzerService.getAnalysis(
            user,
            id,
            ModuleLabelEnum.WHOLESALE_ANALYZER,
            this.transformWholesaleEntityService.wholesaleBuilderCheckEntities(),
        );

        const resultId = analysis.wholesale?.id;
        if (!resultId) return null;

        return await this.rAnalyzerService.aBuilderService.aBuilderRepository.findOne({
            where: { wholesale: { id: resultId } },
            relations,
        });
    }

    /**
     * Retrieves and transforms wholesale analysis builder details for the given user and analysis ID.
     * Logs the operation, fetches the associated analysis builder with required relations,
     * and applies transformation logic to return a structured wholesale builder response.
     */
    async getWholesaleAnalysisBuilder(user: CurrentUserInterface, id: string) {
        this.logger.info(`Get wholesale analysis builder details`);
        const aBuilder = await this.getWholesaleBuilder(
            user,
            id,
            this.transformWholesaleEntityService.wholesaleBuilderEntities(),
        );

        return aBuilder
            ? this.transformWholesaleEntityService.transformWholesaleABuilder(id, aBuilder)
            : null;
    }

    /**
     * Persists all sections of the wholesale analysis builder in sequence.
     * Handles property details, acquisition details, repairs, fixed expenses,
     * and holding duration using their respective upsert strategies.
     */
    async upsertWholesaleBuilderSections(
        wholesale: WholesaleEntity,
        aBuilder: ABuilderEntity,
        dto: CreateWholesaleBuilderDto,
    ) {
        await this.preWholesaleService.upsertWholesalePD(wholesale, aBuilder, dto.propertyDetails);

        await this.rAnalyzerService.preRAnalysisService.upsertAcquisitionDetails(
            aBuilder,
            dto.acquisitionDetails,
        );
        await this.rAnalyzerService.preRAnalysisService.upsertRepairs(aBuilder, dto.repairs);
        await this.rAnalyzerService.preRAnalysisService.upsertFExpenses(
            aBuilder,
            dto.fixedExpenses,
        );
        await this.preWholesaleService.upsertWholesaleHDuration(aBuilder, dto.hDuration);
    }

    /**
     * Creates or updates the full wholesale analysis builder for a given analysis.
     * Resolves or creates the wholesale entity, ensures the analysis builder exists,
     * persists all builder sections from the DTO, then returns the refreshed and
     * transformed builder response.
     */
    async resolveWholesaleBuilder(
        user: CurrentUserInterface,
        id: string,
        dto: CreateWholesaleBuilderDto,
    ) {
        this.logger.info(`Resolve full wholesale builder for analysis[${id}]`);

        const analysis = await this.rAnalyzerService.getAnalysis(
            user,
            id,
            ModuleLabelEnum.WHOLESALE_ANALYZER,
            this.transformWholesaleEntityService.wholesaleBuilderCheckEntities(),
        );

        const wholesale =
            analysis.wholesale ?? (await this.preWholesaleService.createWholesale(analysis));
        const aBuilder = await this.preWholesaleService.getOrCreateIStrategyBuilder(
            wholesale,
            this.transformWholesaleEntityService.wholesaleBuilderEntities(),
        );
        await this.upsertWholesaleBuilderSections(wholesale, aBuilder, dto);

        const updated = await this.rAnalyzerService.aBuilderService.retrieveABuilderByCriteria(
            { id: aBuilder.id },
            this.transformWholesaleEntityService.wholesaleBuilderEntities(),
        );

        return this.transformWholesaleEntityService.transformWholesaleABuilder(id, updated);
    }

    /**
     * Computes the full wholesale financial summary for a given analysis.
     * Fetches the analysis builder, maps entity data to calculator inputs,
     * and delegates all computations to the WholesaleCalculatorService.
     */
    async getWholesaleSummary(user: CurrentUserInterface, id: string) {
        this.logger.info(`Compute wholesale summary for analysis[${id}]`);

        const aBuilder = await this.getWholesaleBuilder(
            user,
            id,
            this.transformWholesaleEntityService.wholesaleBuilderEntities(),
        );

        if (!aBuilder) return null;

        const acq = aBuilder.acquisitionDetails;
        const hd = aBuilder.hDuration;
        const pd = aBuilder.propertyDetails;
        const fe = aBuilder.fExpenses;
        const rep = aBuilder.repairs;

        return this.wholesaleCalculatorService.computeWholesaleSummary({
            investorPrice: acq?.purchasePrice ?? 0,
            targetProfit: hd?.targetProfit ?? 0,
            holdingCostPerMonth: hd?.holdingCoast ?? 0,
            duration: hd?.duration ?? 0,
            transactionFee: hd?.transactionFee ?? 0,
            otherFee: hd?.otherFee ?? 0,
            downPaymentPercent: acq?.downPayment ?? 0,
            loanInterest: acq?.loanInterest ?? 0,
            loanLength: acq?.loanLength ?? 0,
            closingCostFees: acq?.closingCostFees ?? 0,
            sellerConcessions: acq?.sellerConcessions ?? 0,
            credits: acq?.credits ?? 0,
            monthlyIncome: pd?.monthlyIncome ?? 0,
            fixedExpensesTotal: fe?.total ?? 0,
            estRepairs: rep?.total ?? 0,
        });
    }
}
