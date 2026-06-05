import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { FFlipService } from './f-flip.service';
import { AnalysisEntity } from '../../analysis/entities';
import { FFlipEntity } from '../entity/f-flip.entity';
import { CreatePDetailsDto, CreateSaleDto, HCoastDto } from '../../a-builder/dto';
import { ABuilderEntity, PDetailsEntity } from '../../a-builder/entities';

@Injectable()
export class PreFFlipService {
    /**
     * Service responsible for handling pre fix and flip module operation
     */

    constructor(
        @Inject(forwardRef(() => FFlipService))
        private readonly service: FFlipService,
    ) {}

    /**
     * Constructs a new FFlipEntity (Fix and Flip) by assigning the required analysis relationship.
     * Creates an empty entities instance and populates it with the provided analysis association.
     * Returns the constructed rental analysis entities ready for persistence or further manipulation.
     */
    buildFFlipEntity(required: { analysis: AnalysisEntity }): FFlipEntity {
        const result = new FFlipEntity();
        Object.assign(result, required);
        return result;
    }

    /**
     * Creates and persists a new FFlipEntity by associating it with the provided AnalysisEntity.
     * Uses buildRentalAnalyzerEntity to construct the rental analysis with the required analysis relationship,
     * then saves it to the repository and returns the created entities.
     */
    async createFFlip(analysis: AnalysisEntity) {
        return this.service.fFlipRepo.create(this.buildFFlipEntity({ analysis }));
    }

    /**
     * Creates an analysis builder for a fix and flip entities.
     * Attempts to create the builder; if failed, deletes the fix and flip entities and throws a bad request error.
     */
    async getOrCreateFlipBuilder(fFlip: FFlipEntity, relations?: string[]) {
        try {
            const builder =
                await this.service.rAnalyzerService.aBuilderService.aBuilderRepository.findOne({
                    where: { fFlip: { id: fFlip.id } },
                    relations,
                });
            if (builder) return builder;
            return await this.service.rAnalyzerService.aBuilderService.createABuilder(
                undefined,
                fFlip,
            );
        } catch (error) {
            await this.service.fFlipRepo.delete({ id: fFlip.id });
            this.service.errorHandler.badRequest(
                `Error while creating this fix and flip analysis: ${error.message}`,
                `Error while creating this fix and flip analysis: ${error.message}`,
            );
        }
    }

    /**
     * Creates property details for an analysis builder linked to a fix and flip entities.
     * Attempts to create the property details; if failed, deletes the analysis builder and fix and flip entities,
     * then throws a bad request error.
     */
    async createPropertyDetailsForAnalysisBuilderForFFlip(
        fFlip: FFlipEntity,
        aBuilder: ABuilderEntity,
        dto: CreatePDetailsDto,
    ) {
        try {
            return await this.service.rAnalyzerService.raABuilderService.createPropertyDetailsForABuilder(
                aBuilder,
                dto,
            );
        } catch (error) {
            await this.service.rAnalyzerService.aBuilderService.aBuilderRepository.delete({
                id: aBuilder.id,
            });
            await this.service.fFlipRepo.delete({ id: fFlip.id });
            this.service.errorHandler.badRequest(
                `Error while creating this analyses property details: ${error.message}`,
                `Error while creating this analyses property details: ${error.message}`,
            );
        }
    }

    /**
     * Creates units for property details linked to a fix and flip analysis builder.
     * Attempts to create the units; if failed, deletes the property details, analysis builder, and fix and flip entities,
     * then throws a bad request error.
     */
    async createUnitsForPDFFFlip(
        fFlip: FFlipEntity,
        aBuilder: ABuilderEntity,
        pDetails: PDetailsEntity,
        dto: CreatePDetailsDto,
    ) {
        try {
            await this.service.rAnalyzerService.aBuilderService.unitsService.createPDetailsUnits(
                pDetails,
                dto.units,
            );
        } catch (error) {
            await this.service.rAnalyzerService.aBuilderService.pDetailsRepository.delete({
                id: pDetails.id,
            });
            await this.service.rAnalyzerService.aBuilderService.aBuilderRepository.delete({
                id: aBuilder.id,
            });
            await this.service.fFlipRepo.delete({ id: fFlip.id });
            this.service.errorHandler.badRequest(
                `Error while creating property details units for fix & flip module: ${error.message}`,
                `Error while creating property details units for fix & flip module: ${error.message}`,
            );
        }
    }

    /**
     * Creates property details for a fix and flip entities, including the analysis builder, property details, and units.
     * Orchestrates the creation of the analysis builder, property details, and associated units in sequence.
     */
    async createFFlipPropertyDetails(
        fFlip: FFlipEntity,
        aBuilder: ABuilderEntity,
        dto: CreatePDetailsDto,
    ) {
        const pDetails = await this.createPropertyDetailsForAnalysisBuilderForFFlip(
            fFlip,
            aBuilder,
            dto,
        );
        await this.createUnitsForPDFFFlip(fFlip, aBuilder, pDetails, dto);
    }

    /**
     * Updates or inserts property details for a fix and flip entities.
     * If no analysis builder exists, creates property details from scratch.
     * If property details already exist, updates them; otherwise, creates new property details for the analysis builder.
     */
    async upsertFFlipPD(
        fFlix: FFlipEntity,
        aBuilder: ABuilderEntity,
        dto: CreatePDetailsDto,
    ): Promise<void> {
        if (aBuilder.propertyDetails) {
            await this.service.rAnalyzerService.raABuilderService.updateRentalAnalyzerPropertyDetails(
                aBuilder.propertyDetails.id,
                dto,
            );
            return;
        }

        await this.createFFlipPropertyDetails(fFlix, aBuilder, dto);
    }

    /**
     * Creates or updates the FFlip sale data for a given analysis builder.
     * Updates existing sale data including recalculating itemized costs and persisting changes,
     * or creates a new sale entity when none exists.
     */
    async upsertFFlipSale(aBuilder: ABuilderEntity, dto: CreateSaleDto): Promise<void> {
        const { afterRepairValue, targetProfit, item } = dto;
        const sale = aBuilder.sale;
        if (sale) {
            let data = sale.saleClosingCoast;
            if (item && sale.itemized) {
                data =
                    this.service.rAnalyzerService.aBuilderService.adItemizedService.calculateItemizedAcquisitionCost(
                        item,
                    );
                await this.service.rAnalyzerService.aBuilderService.adItemizedService.updateADItemized(
                    sale.itemized,
                    item,
                );
            }
            await this.service.rAnalyzerService.aBuilderService.saleService.updateSaleEntity(sale, {
                saleClosingCoast: data,
                afterRepairValue,
                targetProfit,
            });
        } else
            await this.service.rAnalyzerService.aBuilderService.saleService.createSale(
                dto,
                aBuilder,
            );
    }

    /**
     * Creates or updates F flip holding cost data for a given analysis builder.
     * Checks whether a holding cost already exists and updates it when present; otherwise creates a new record.
     * Delegates persistence logic to the holding cost service and returns the resulting entity or update response.
     */
    async upsertFFLipHoldingCoast(aBuilder: ABuilderEntity, dto: HCoastDto) {
        const hCoast = aBuilder.hCoast;
        if (hCoast)
            return await this.service.rAnalyzerService.aBuilderService.hCoastService.handleHCoastUpdate(
                hCoast,
                dto,
            );
        else
            return await this.service.rAnalyzerService.aBuilderService.hCoastService.createHCoast(
                aBuilder,
                dto,
            );
    }
}
