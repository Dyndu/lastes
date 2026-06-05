import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { AnalysisEntity } from '../../analysis/entities';
import { ABuilderEntity, PDetailsEntity } from '../../a-builder/entities';
import { CreatePDetailsDto, HDurationDto } from '../../a-builder/dto';
import { WholesaleService } from './wholesale.service';
import { WholesaleEntity } from '../entities/wholesale.entity';

@Injectable()
export class PreWholesaleService {
    /**
     * Service responsible for handling pre operations for wholesale module
     */

    constructor(
        @Inject(forwardRef(() => WholesaleService))
        private readonly wholesaleService: WholesaleService,
    ) {}

    /**
     * Constructs a new WholesaleEntity by assigning the required analysis relationship.
     * Creates an empty entities instance and populates it with the provided analysis association.
     * Returns the constructed rental analysis entities ready for persistence or further manipulation.
     */
    buildWholesaleEntity(required: { analysis: AnalysisEntity }): WholesaleEntity {
        const result = new WholesaleEntity();
        Object.assign(result, required);
        return result;
    }

    /**
     * Creates and persists a new WholesaleEntity by associating it with the provided AnalysisEntity.
     * Uses buildRentalAnalyzerEntity to construct the rental analysis with the required analysis relationship,
     * then saves it to the repository and returns the created entities.
     */
    async createWholesale(analysis: AnalysisEntity): Promise<WholesaleEntity> {
        return this.wholesaleService.wholesaleRepo.create(this.buildWholesaleEntity({ analysis }));
    }

    async getOrCreateIStrategyBuilder(wholesale: WholesaleEntity, relations?: string[]) {
        try {
            const builder =
                await this.wholesaleService.rAnalyzerService.aBuilderService.aBuilderRepository.findOne(
                    {
                        where: { wholesale: { id: wholesale.id } },
                        relations,
                    },
                );
            if (builder) return builder;
            return await this.wholesaleService.rAnalyzerService.aBuilderService.createABuilder(
                undefined,
                undefined,
                undefined,
                wholesale,
            );
        } catch (error) {
            await this.wholesaleService.wholesaleRepo.delete({ id: wholesale.id });
            this.wholesaleService.errorHandler.badRequest(
                `Error while creating this wholesale analysis: ${error.message}`,
                `Error while creating this wholesale analysis: ${error.message}`,
            );
        }
    }

    /**
     * Creates property details for an analysis builder linked to a wholesale entities.
     * Attempts to create the property details; if failed, deletes the analysis builder and wholesale entities,
     * then throws a bad request error.
     */
    async createPropertyDetailsForAnalysisBuilderForWholesale(
        wholesale: WholesaleEntity,
        aBuilder: ABuilderEntity,
        dto: CreatePDetailsDto,
    ) {
        try {
            return await this.wholesaleService.rAnalyzerService.raABuilderService.createPropertyDetailsForABuilder(
                aBuilder,
                dto,
            );
        } catch (error) {
            await this.wholesaleService.rAnalyzerService.aBuilderService.aBuilderRepository.delete({
                id: aBuilder.id,
            });
            await this.wholesaleService.wholesaleRepo.delete({ id: wholesale.id });
            this.wholesaleService.errorHandler.badRequest(
                `Error while creating this analyses property details: ${error.message}`,
                `Error while creating this analyses property details: ${error.message}`,
            );
        }
    }

    /**
     * Creates units for property details linked to a wholesale analysis builder.
     * Attempts to create the units; if failed, deletes the property details, analysis builder, and wholesale entities,
     * then throws a bad request error.
     */
    async createUnitsForPDFWholesale(
        wholesale: WholesaleEntity,
        aBuilder: ABuilderEntity,
        pDetails: PDetailsEntity,
        dto: CreatePDetailsDto,
    ) {
        try {
            await this.wholesaleService.rAnalyzerService.aBuilderService.unitsService.createPDetailsUnits(
                pDetails,
                dto.units,
            );
        } catch (error) {
            await this.wholesaleService.rAnalyzerService.aBuilderService.pDetailsRepository.delete({
                id: pDetails.id,
            });
            await this.wholesaleService.rAnalyzerService.aBuilderService.aBuilderRepository.delete({
                id: aBuilder.id,
            });
            await this.wholesaleService.wholesaleRepo.delete({ id: wholesale.id });
            this.wholesaleService.errorHandler.badRequest(
                `Error while creating property details units for fix & flip module: ${error.message}`,
                `Error while creating property details units for fix & flip module: ${error.message}`,
            );
        }
    }

    /**
     * Creates property details for a wholesale entities, including the analysis builder, property details, and units.
     * Orchestrates the creation of the analysis builder, property details, and associated units in sequence.
     */
    async createWholesalePropertyDetails(
        wholesale: WholesaleEntity,
        aBuilder: ABuilderEntity,
        dto: CreatePDetailsDto,
    ) {
        const pDetails = await this.createPropertyDetailsForAnalysisBuilderForWholesale(
            wholesale,
            aBuilder,
            dto,
        );
        await this.createUnitsForPDFWholesale(wholesale, aBuilder, pDetails, dto);
    }

    /**
     * Updates or inserts property details for a wholesale entities.
     * If no analysis builder exists, creates property details from scratch.
     * If property details already exist, updates them; otherwise, creates new property details for the analysis builder.
     */
    async upsertWholesalePD(
        wholesale: WholesaleEntity,
        aBuilder: ABuilderEntity,
        dto: CreatePDetailsDto,
    ): Promise<void> {
        if (aBuilder.propertyDetails) {
            await this.wholesaleService.rAnalyzerService.raABuilderService.updateRentalAnalyzerPropertyDetails(
                aBuilder.propertyDetails.id,
                dto,
            );
            return;
        }

        await this.createWholesalePropertyDetails(wholesale, aBuilder, dto);
    }

    /**
     * Upserts holding duration data for a wholesale analysis builder.
     * Determines whether a holding duration already exists, updates it when present,
     * or creates a new holding duration entity when absent by delegating to the appropriate service methods.
     */
    async upsertWholesaleHDuration(aBuilder: ABuilderEntity, dto: HDurationDto): Promise<void> {
        const hDuration = aBuilder.hDuration;
        if (hDuration)
            await this.wholesaleService.rAnalyzerService.aBuilderService.hDurationService.handleHDurationUpdate(
                hDuration,
                dto,
            );
        else
            await this.wholesaleService.rAnalyzerService.aBuilderService.hDurationService.createHDuration(
                aBuilder,
                dto,
            );
    }
}
