import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { RAnalysisEntity } from '../entities/r-analysis.entity';
import { RAnalysisService } from './r-analysis.service';
import { AnalysisEntity } from '../../analysis/entities';
import { ExistenceCheckModeEnum, ModuleLabelEnum } from '../../../common/enum';
import { ADetailsDto, CreatePDetailsDto, FExpenseDto, CreateRepairsDto } from '../../a-builder/dto';
import { UserEntity } from '../../users/entities/user.entity';
import { ABuilderEntity } from '../../a-builder/entities';
import { CurrentUserInterface } from '../../../interface';
import { AdditionalLineItem, RentalAnalysisInput } from './r-analysis-calculator.service';
import { PSettingEntity } from '../../p-settings/entities';

@Injectable()
export class PreRAnalysisService {
    /**
     * Service responsible for handling pre rental analyzer operations
     */

    constructor(
        @Inject(forwardRef(() => RAnalysisService))
        private readonly service: RAnalysisService,
    ) {}

    /**
     * Validates that a given analysis entities belongs to the expected Rental Analyzer module by comparing its module label.
     * Throws a forbidden error if the analysis is associated with a different module, providing detailed context
     * about the analysis ID and the mismatched module labels for debugging purposes.
     */
    assertAnalysisBelongsToRentalAnalyzerModule(analysis: AnalysisEntity, label: ModuleLabelEnum) {
        if (analysis.module.label !== label)
            this.service.errorHandler.forbidden(
                `Rental analysis access denied. Expected module "Rental Analyzer" but received "${analysis.module.label}". Analysis ID: ${analysis.id}`,
                `This analysis is not compatible with the Rental Analyzer module.`,
            );
    }

    /**
     * Asserts that the authenticated user is the owner of the specified analysis by comparing their IDs.
     * Utilizes the utility service's assertState method with MUST_EXIST mode to verify ownership,
     * throwing an appropriate error if the user does not own the analysis or if either entities is invalid.
     */
    assertUserOwnsAnalysis(createdBy: UserEntity, analysis: AnalysisEntity) {
        this.service.otherUtils.assertState(
            createdBy.id,
            analysis.createdBy.id,
            ExistenceCheckModeEnum.MUST_EXIST,
            { label: 'User', entityName: 'Analysis' },
        );
    }

    /**
     * Constructs a new RAnalysisEntity (Rental Analysis) by assigning the required analysis relationship.
     * Creates an empty entities instance and populates it with the provided analysis association.
     * Returns the constructed rental analysis entities ready for persistence or further manipulation.
     */
    buildRentalAnalyzerEntity(required: { analysis: AnalysisEntity }): RAnalysisEntity {
        const result = new RAnalysisEntity();
        Object.assign(result, required);
        return result;
    }

    /**
     * Creates and persists a new RAnalysisEntity by associating it with the provided AnalysisEntity.
     * Uses buildRentalAnalyzerEntity to construct the rental analysis with the required analysis relationship,
     * then saves it to the repository and returns the created entities.
     */
    async createRAnalyzer(analysis: AnalysisEntity) {
        return this.service.rAnalysisRepo.create(this.buildRentalAnalyzerEntity({ analysis }));
    }

    /**
     * Retrieves an analysis entities by its ID with the specified relations loaded.
     * Delegates to the preAnalysisService's retrieveAnalyseByCriteria method, using the ID as the search criterion
     * and passing through the requested relations for eager loading. Returns the found analysis with all
     * specified associations populated.
     */
    async retrieveAnalysisWithRelations(id: string, relations: string[]) {
        return await this.service.analysisService.preAnalysisService.retrieveAnalyseByCriteria(
            { id },
            relations,
        );
    }

    /**
     * Fetches both a user and an analysis concurrently, then validates that the user owns the analysis
     * and that the analysis belongs to the Rental Analyzer module. Performs parallel database queries
     * for efficiency, followed by ownership and module validation checks. Returns the fully validated
     * analysis entities with its specified relations loaded, or throws appropriate errors if validations fail.
     */
    async fetchUserAndAnalysis(
        user: CurrentUserInterface,
        id: string,
        label: ModuleLabelEnum,
        relations: string[],
    ): Promise<AnalysisEntity> {
        const [createdBy, analysis] = await Promise.all([
            this.service.analysisService.getUser(user.id),
            this.retrieveAnalysisWithRelations(id, relations),
        ]);

        this.assertUserOwnsAnalysis(createdBy, analysis);
        this.assertAnalysisBelongsToRentalAnalyzerModule(analysis, label);
        return analysis;
    }

    /**
     * Creates or updates property details for a rental analysis based on the current state of its analysis builder.
     * Handles three distinct scenarios: if no builder exists, creates a new builder with property details;
     * if builder exists with property details, updates them; if builder exists without property details,
     * creates new property details and associates them with the existing builder. Provides a comprehensive
     * upsert operation that ensures property details are properly linked to the rental analysis regardless
     * of the current data state.
     */
    async upsertPropertyDetails(rAnalyzer: RAnalysisEntity, dto: CreatePDetailsDto): Promise<void> {
        const aBuilder = await this.service.raABuilderService.getOrCreateRAnalyzerBuilder(
            rAnalyzer,
            this.service.analysisService.transformAEntityService.builderPDetailsEntities(),
        );

        if (aBuilder.propertyDetails) {
            await this.service.raABuilderService.updateRentalAnalyzerPropertyDetails(
                aBuilder.propertyDetails.id,
                dto,
            );
            return;
        }

        await this.service.raABuilderService.createRentalAnalyzerPropertyDetails(
            rAnalyzer,
            aBuilder,
            dto,
        );
    }

    /**
     * Creates or updates acquisition details for an analysis builder entities. If acquisition details already exist,
     * they are updated with the provided DTO data. If no acquisition details exist, new ones are created and
     * associated with the builder. Provides a simple upsert operation that maintains data integrity by either
     * updating existing records or creating new ones as needed.
     */
    async upsertAcquisitionDetails(aBuilder: ABuilderEntity, dto: ADetailsDto): Promise<void> {
        if (aBuilder.acquisitionDetails)
            await this.service.raABuilderService.updateRentalAnalyzerAcquisitionDetails(
                aBuilder.acquisitionDetails,
                dto,
            );
        else
            await this.service.raABuilderService.createRentalAnalyzerAcquisitionDetails(
                aBuilder,
                dto,
            );
    }

    /**
     * Creates or updates repairs for an analysis builder entities. If repairs already exist on the builder,
     * they are updated with the provided DTO data which includes interior, exterior, and other repairs.
     * If no repairs exist, new repairs are created and associated with the builder. Handles the complete
     * repairs structure in a single upsert operation to maintain data consistency.
     */
    async upsertRepairs(aBuilder: ABuilderEntity, dto: CreateRepairsDto): Promise<void> {
        if (aBuilder.repairs)
            await this.service.raABuilderService.updateRentalAnalyzerRepairs(aBuilder.repairs, dto);
        else await this.service.raABuilderService.createRentalAnalyzerRepairs(aBuilder, dto);
    }

    /**
     * Creates or updates fixed expenses for an analysis builder entities. If fixed expenses already exist,
     * they are updated with the provided DTO data containing all expense categories (utilities, fees,
     * taxes, insurance, reserves, etc.). If no fixed expenses exist, new ones are created and associated
     * with the builder. Provides a comprehensive upsert operation for managing all financial expense data
     * in a single method call.
     */
    async upsertFExpenses(aBuilder: ABuilderEntity, dto: FExpenseDto): Promise<void> {
        if (aBuilder.fExpenses)
            await this.service.raABuilderService.updateRentalAnalyzerFixedExpenses(
                aBuilder,
                aBuilder.fExpenses,
                dto,
            );
        else await this.service.raABuilderService.createRentalAnalyzerFixedExpenses(aBuilder, dto);
    }

    /** Builds the base rental analysis calculator input from an analysis builder and resolved settings */
    buildBaseCalculatorInput(
        aBuilder: ABuilderEntity,
        ltv: number,
        settings: PSettingEntity | null,
        overrides: {
            occupancyRate: number;
            managementFeePercent: number;
            maintenanceEscrowPercent: number;
            pmi?: number;
            additionalPurchaseCosts?: AdditionalLineItem[];
            additionalFixedExpenses?: AdditionalLineItem[];
            additionalIncome?: AdditionalLineItem[];
        },
    ): RentalAnalysisInput {
        const acq = aBuilder.acquisitionDetails;
        const pd = aBuilder.propertyDetails;
        const fe = aBuilder.fExpenses;

        const flatExpenses =
            (fe?.sewer ?? 0) +
            (fe?.water ?? 0) +
            (fe?.trash ?? 0) +
            (fe?.gas ?? 0) +
            (fe?.electric ?? 0) +
            (fe?.internet ?? 0) +
            (fe?.other ?? 0) +
            (fe?.hoaFees ?? 0) +
            (fe?.propertyTaxes ?? 0) +
            (fe?.hazardInsurance ?? 0) +
            (fe?.additionalFees ?? 0);

        return {
            purchasePrice: acq?.purchasePrice ?? 0,
            ltv,
            sellerConcessions: acq?.sellerConcessions ?? 0,
            rentCredits: acq?.credits ?? 0,
            acquisitionCost: acq?.acquisitionCoast ?? 0,
            loanInterest: acq?.loanInterest ?? 0,
            loanLength: acq?.loanLength ?? 0,
            projectedMonthlyRent: pd?.totalIncome ?? 0,
            otherMonthlyIncome: acq?.monthlyIncome ?? 0,

            pmi: overrides.pmi ?? 0,
            taxes: fe?.propertyTaxes ?? 0,
            insurance: fe?.hazardInsurance ?? 0,
            utilities: fe?.totalUtilities ?? 0,

            fixedExpensesTotal: flatExpenses,

            occupancyRate: overrides.occupancyRate ?? settings?.occupancyRate,
            managementFeePercent: overrides.managementFeePercent,
            maintenanceEscrowPercent: overrides.maintenanceEscrowPercent,

            additionalPurchaseCosts: overrides.additionalPurchaseCosts ?? [],
            additionalFixedExpenses: overrides.additionalFixedExpenses ?? [],
            additionalIncome: overrides.additionalIncome ?? [],
        };
    }
}
