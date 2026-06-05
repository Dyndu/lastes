import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { RAnalysisService } from './r-analysis.service';
import { RAnalysisEntity } from '../entities/r-analysis.entity';
import {
    ADetailsDto,
    ADetailsUpdateDto,
    AdItemizedDto,
    CreatePDetailsDto,
    FExpenseDto,
    UpdateFExpenseDto,
    UpdatePDetailsDto,
    UpdateRepairsDto,
    CreateRepairsDto,
} from '../../a-builder/dto';
import {
    ABuilderEntity,
    ADetailsEntity,
    FExpensesEntity,
    PDetailsEntity,
    RepairsEntity,
} from '../../a-builder/entities';

@Injectable()
export class RaABuilderService {
    /**
     * Service responsible for handling pre rental analysis module operations
     */

    constructor(
        @Inject(forwardRef(() => RAnalysisService))
        private readonly service: RAnalysisService,
    ) {}

    async getOrCreateRAnalyzerBuilder(rAnalysis: RAnalysisEntity, relations?: string[]) {
        try {
            const builder = await this.service.aBuilderService.aBuilderRepository.findOne({
                where: { rAnalysis: { id: rAnalysis.id } },
                relations,
            });
            if (builder) return builder;
            return await this.service.aBuilderService.createABuilder(rAnalysis);
        } catch (error) {
            await this.service.rAnalysisRepo.delete({ id: rAnalysis.id });
            this.service.errorHandler.badRequest(
                `Error while creating this rental analysis: ${error.message}`,
                `Error while creating this rental analysis: ${error.message}`,
            );
        }
    }

    /**
     * Creates property details for an analysis builder using the provided DTO.
     * Calculates the total income from unit rents and additional monthly income,
     * then builds and saves the property details entities linked to the analysis builder.
     */
    async createPropertyDetailsForABuilder(aBuilder: ABuilderEntity, dto: CreatePDetailsDto) {
        const totalIncome = this.service.aBuilderService.pDetailsService.calculateTotalIncome(
            dto.units.map((u) => u.monthlyRent),
            dto.monthlyIncome,
        );

        return await this.service.aBuilderService.pDetailsRepository.create(
            this.service.aBuilderService.pDetailsService.buildPDetailsEntity(
                { totalIncome, status: dto.status },
                {
                    monthlyIncome: dto.monthlyIncome,
                    analysisBuilder: aBuilder,
                },
            ),
        );
    }

    /**
     * Creates property details for an analysis builder linked to a rental analyzer.
     * Attempts to create the property details; if failed, deletes the analysis builder and rental analyzer,
     * then throws a bad request error.
     */
    async createPropertyDetailsForAnalysisBuilderForRAnalyzer(
        rAnalyzer: RAnalysisEntity,
        aBuilder: ABuilderEntity,
        dto: CreatePDetailsDto,
    ) {
        try {
            return await this.createPropertyDetailsForABuilder(aBuilder, dto);
        } catch (error) {
            await this.service.aBuilderService.aBuilderRepository.delete({
                id: aBuilder.id,
            });
            await this.service.rAnalysisRepo.delete({ id: rAnalyzer.id });
            this.service.errorHandler.badRequest(
                `Error while creating this analyses property details: ${error.message}`,
                `Error while creating this analyses property details: ${error.message}`,
            );
        }
    }

    /**
     * Creates units for the given property details using the provided DTO data. If unit creation fails,
     * performs cascading cleanup by deleting the property details, its associated analysis builder,
     * and the parent rental analyzer to maintain data consistency, then throws a formatted bad request error.
     */
    async createUnitsForPropertyDetails(
        rAnalyzer: RAnalysisEntity,
        aBuilder: ABuilderEntity,
        pDetails: PDetailsEntity,
        dto: CreatePDetailsDto,
    ) {
        try {
            await this.service.aBuilderService.unitsService.createPDetailsUnits(
                pDetails,
                dto.units,
            );
        } catch (error) {
            await this.service.aBuilderService.pDetailsRepository.delete({
                id: pDetails.id,
            });
            await this.service.aBuilderService.aBuilderRepository.delete({
                id: aBuilder.id,
            });
            await this.service.rAnalysisRepo.delete({ id: rAnalyzer.id });
            this.service.errorHandler.badRequest(
                `Error while creating this analyses property details: ${error.message}`,
                `Error while creating this analyses property details: ${error.message}`,
            );
        }
    }

    /**
     * Orchestrates the creation of a complete property details structure for a rental analyzer.
     * Creates an analysis builder associated with the rental analyzer, then creates property details
     * for that builder, and finally creates the units for the property details using the provided DTO.
     */
    async createRentalAnalyzerPropertyDetails(
        rAnalyzer: RAnalysisEntity,
        aBuilder: ABuilderEntity,
        dto: CreatePDetailsDto,
    ) {
        const pDetails = await this.createPropertyDetailsForAnalysisBuilderForRAnalyzer(
            rAnalyzer,
            aBuilder,
            dto,
        );
        await this.createUnitsForPropertyDetails(rAnalyzer, aBuilder, pDetails, dto);
    }

    /**
     * Updates existing property details by delegating to the pDetailsService's updatePDInformation method.
     * Takes a property details ID and update DTO, passing through to the service layer for persistence.
     */
    async updateRentalAnalyzerPropertyDetails(propertyDetailsId: string, dto: UpdatePDetailsDto) {
        await this.service.aBuilderService.pDetailsService.updatePDInformation(
            propertyDetailsId,
            dto,
        );
    }

    /**
     * Calculates the acquisition cost from a DTO by checking if itemized costs are present.
     * If the DTO has items enabled and provides itemized data, delegates to the adItemizedService
     * to calculate the total itemized acquisition cost; otherwise returns 0 as the default value.
     */
    resolveAcquisitionCostFromDto(dto: ADetailsDto): number {
        if (dto.hasItems && dto.item)
            return this.service.aBuilderService.adItemizedService.calculateItemizedAcquisitionCost(
                dto.item,
            );

        return dto.acquisitionCoast ?? 0;
    }

    /**
     * Persists acquisition details for an analysis builder by first resolving the acquisition cost from the DTO,
     * then building and saving a new ADetailsEntity. If creation fails, throws a formatted bad request error
     * with the original error message. Returns the newly created acquisition details entities on success.
     */
    async persistAcquisitionDetails(
        aBuilder: ABuilderEntity,
        dto: ADetailsDto,
    ): Promise<ADetailsEntity> {
        try {
            return await this.service.aBuilderService.aDetailsRepository.create(
                this.service.aBuilderService.aDetailsService.buildADetailsEntity(
                    {
                        acquisitionCoast: this.resolveAcquisitionCostFromDto(dto),
                        ...dto,
                    },
                    {
                        analysisBuilder: aBuilder,
                        ...dto,
                    },
                ),
            );
        } catch (error) {
            this.service.errorHandler.badRequest(
                `Error while creating acquisition details: ${error.message}`,
                `Error while creating acquisition details: ${error.message}`,
            );
        }
    }

    /**
     * Persists itemized acquisition costs for acquisition details by delegating to the adItemizedService.
     * If itemized cost creation fails, performs cleanup by deleting the parent acquisition details
     * to maintain data consistency, then throws a formatted bad request error.
     */
    async persistItemizedAcquisitionCosts(
        dto: AdItemizedDto,
        aDetails: ADetailsEntity,
    ): Promise<void> {
        try {
            await this.service.aBuilderService.adItemizedService.createAdItemizedEntity(
                dto,
                aDetails,
            );
        } catch (error) {
            await this.service.aBuilderService.aDetailsRepository.delete({
                id: aDetails.id,
            });
            this.service.errorHandler.badRequest(
                `Error while creating acquisition detail itemized: ${error.message}`,
                `Error while creating acquisition detail itemized: ${error.message}`,
            );
        }
    }

    /**
     * Creates acquisition details for a rental analyzer by first validating the DTO, then persisting
     * the main acquisition details entities. If the DTO indicates itemized costs are present,
     * additionally persists the itemized acquisition costs and associates them with the created details.
     * Ensures both the main details and any itemized data are properly saved in the correct sequence.
     */
    async createRentalAnalyzerAcquisitionDetails(
        aBuilder: ABuilderEntity,
        dto: ADetailsDto,
    ): Promise<void> {
        this.service.aBuilderService.aDetailsService.validateAcquisitionDetails(dto);

        const aDetails = await this.persistAcquisitionDetails(aBuilder, dto);
        if (dto.hasItems && dto.item)
            await this.persistItemizedAcquisitionCosts(dto.item, aDetails);
    }

    /**
     * Reconciles itemized acquisition costs before applying an update.
     * If the existing aDetails has itemized data but the incoming DTO no longer
     * provides items, deletes the orphaned itemized entity and recalculates
     * the acquisition cost from the DTO (manual value).
     * Returns the resolved acquisition cost to use for the update.
     */
    async reconcileAcquisitionDetailsBeforeUpdate(
        aDetails: ADetailsEntity,
        dto: ADetailsUpdateDto,
    ): Promise<number> {
        const itemizedShouldBeRemoved = aDetails.itemized && (!dto.hasItems || !dto.item);

        if (itemizedShouldBeRemoved)
            await this.service.aBuilderService.adItemizedService.deleteAdItemized(
                aDetails.itemized,
            );

        if (dto.hasItems && dto.item)
            return this.service.aBuilderService.adItemizedService.calculateItemizedAcquisitionCost(
                dto.item,
            );

        return dto.acquisitionCoast ?? aDetails.acquisitionCoast;
    }

    /**
     * Updates acquisition details for a rental analyzer with comprehensive handling of itemized costs.
     * Reconciles itemized data (deletes if removed, creates if new, updates if existing),
     * then persists the recalculated acquisition cost alongside the rest of the DTO.
     */
    async updateRentalAnalyzerAcquisitionDetails(aDetails: ADetailsEntity, dto: ADetailsUpdateDto) {
        const acquisitionCoast = await this.reconcileAcquisitionDetailsBeforeUpdate(aDetails, dto);

        await this.service.aBuilderService.aDetailsService.updateADetails(aDetails, {
            acquisitionCoast,
            ...dto,
        });

        if (dto.hasItems && dto.item) {
            if (aDetails.itemized)
                await this.service.aBuilderService.adItemizedService.updateADItemizedInfo(
                    aDetails.itemized.id,
                    aDetails,
                    dto.item,
                );
            else await this.persistItemizedAcquisitionCosts(dto.item, aDetails);
        }
    }

    /**
     * Creates repairs for a rental analyzer by delegating to the repairsService's createRepairs method.
     * Associates the new repairs with the provided analysis builder and uses the DTO containing
     * interior, exterior, and other repair specifications.
     */
    async createRentalAnalyzerRepairs(aBuilder: ABuilderEntity, dto: CreateRepairsDto) {
        await this.service.aBuilderService.repairsService.createRepairs(dto, aBuilder);
    }

    /**
     * Updates an existing repairs entities for a rental analyzer by delegating to the repairsService's updateRepairs method.
     * Passes through the repair entities and update DTO containing modifications for interior, exterior, and other repairs.
     */
    async updateRentalAnalyzerRepairs(repair: RepairsEntity, dto: UpdateRepairsDto) {
        await this.service.aBuilderService.repairsService.updateRepairs(repair, dto);
    }

    /**
     * Creates fixed expenses for a rental analyzer by delegating to the fExpensesService's createFExpense method.
     * Associates the new financial expenses with the provided analysis builder and uses the DTO containing
     * all expense categories (utilities, fees, taxes, insurance, reserves, etc.).
     */
    async createRentalAnalyzerFixedExpenses(aBuilder: ABuilderEntity, dto: FExpenseDto) {
        await this.service.aBuilderService.fExpensesService.createFExpense(
            dto,
            aBuilder.propertyDetails?.totalIncome!,
            aBuilder,
        );
    }

    /**
     * Updates an existing fixed expenses entities for a rental analyzer by delegating to the fExpensesService's updateFExpense method.
     * Passes through the expense entities and update DTO containing modifications for any financial expense categories.
     */
    async updateRentalAnalyzerFixedExpenses(
        aBuilder: ABuilderEntity,
        fExpense: FExpensesEntity,
        dto: UpdateFExpenseDto,
    ) {
        await this.service.aBuilderService.fExpensesService.updateFExpense(
            fExpense,
            aBuilder.propertyDetails?.totalIncome!,
            dto,
        );
    }
}
