import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { AnalysisEntity } from '../../analysis/entities';
import { CFinancingEntity } from '../entities/c-financing.entity';
import { CFinancingService } from './c-financing.service';
import { ABuilderEntity, PDetailsEntity } from '../../a-builder/entities';
import { CreatePDetailsDto } from '../../a-builder/dto';

@Injectable()
export class PreCFinancingService {
    /**
     * Service responsible for handling pre operations for creative financing module
     */

    constructor(
        @Inject(forwardRef(() => CFinancingService))
        private readonly cFinancingService: CFinancingService,
    ) {}

    /**
     * Constructs a new CFinancingEntity (Creative Financing) by assigning the required analysis relationship.
     * Creates an empty entities instance and populates it with the provided analysis association.
     * Returns the constructed rental analysis entities ready for persistence or further manipulation.
     */
    buildCFinancingEntity(required: { analysis: AnalysisEntity }): CFinancingEntity {
        const result = new CFinancingEntity();
        Object.assign(result, required);
        return result;
    }

    /**
     * Creates and persists a new CFinancingEntity by associating it with the provided AnalysisEntity.
     * Uses buildRentalAnalyzerEntity to construct the rental analysis with the required analysis relationship,
     * then saves it to the repository and returns the created entities.
     */
    async createCFinancing(analysis: AnalysisEntity): Promise<CFinancingEntity> {
        return this.cFinancingService.cFinancingRepository.create(
            this.buildCFinancingEntity({ analysis }),
        );
    }

    async getOrCreateCFinancingBuilder(cFinancing: CFinancingEntity, relations?: string[]) {
        try {
            const builder =
                await this.cFinancingService.rAnalyzerService.aBuilderService.aBuilderRepository.findOne(
                    {
                        where: { cFinancing: { id: cFinancing.id } },
                        relations,
                    },
                );
            if (builder) return builder;
            return await this.cFinancingService.rAnalyzerService.aBuilderService.createABuilder(
                undefined,
                undefined,
                cFinancing,
            );
        } catch (error) {
            await this.cFinancingService.cFinancingRepository.delete({ id: cFinancing.id });
            this.cFinancingService.errorHandler.badRequest(
                `Error while creating this creative financing analysis: ${error.message}`,
                `Error while creating this creative financing analysis: ${error.message}`,
            );
        }
    }

    /**
     * Creates property details for an analysis builder linked to a creative financing entities.
     * Attempts to create the property details; if failed, deletes the analysis builder and creative financing entities,
     * then throws a bad request error.
     */
    async createPropertyDetailsForAnalysisBuilderForCFinancing(
        cFinancing: CFinancingEntity,
        aBuilder: ABuilderEntity,
        dto: CreatePDetailsDto,
    ) {
        try {
            return await this.cFinancingService.rAnalyzerService.raABuilderService.createPropertyDetailsForABuilder(
                aBuilder,
                dto,
            );
        } catch (error) {
            await this.cFinancingService.rAnalyzerService.aBuilderService.aBuilderRepository.delete(
                {
                    id: aBuilder.id,
                },
            );
            await this.cFinancingService.cFinancingRepository.delete({ id: cFinancing.id });
            this.cFinancingService.errorHandler.badRequest(
                `Error while creating this analyses property details: ${error.message}`,
                `Error while creating this analyses property details: ${error.message}`,
            );
        }
    }

    /**
     * Creates units for property details linked to a creative financing analysis builder.
     * Attempts to create the units; if failed, deletes the property details, analysis builder, and creative financing entities,
     * then throws a bad request error.
     */
    async createUnitsForPDFCFinancing(
        cFinancing: CFinancingEntity,
        aBuilder: ABuilderEntity,
        pDetails: PDetailsEntity,
        dto: CreatePDetailsDto,
    ) {
        try {
            await this.cFinancingService.rAnalyzerService.aBuilderService.unitsService.createPDetailsUnits(
                pDetails,
                dto.units,
            );
        } catch (error) {
            await this.cFinancingService.rAnalyzerService.aBuilderService.pDetailsRepository.delete(
                {
                    id: pDetails.id,
                },
            );
            await this.cFinancingService.rAnalyzerService.aBuilderService.aBuilderRepository.delete(
                {
                    id: aBuilder.id,
                },
            );
            await this.cFinancingService.cFinancingRepository.delete({ id: cFinancing.id });
            this.cFinancingService.errorHandler.badRequest(
                `Error while creating property details units for fix & flip module: ${error.message}`,
                `Error while creating property details units for fix & flip module: ${error.message}`,
            );
        }
    }

    /**
     * Creates property details for a creative financing entities, including the analysis builder, property details, and units.
     * Orchestrates the creation of the analysis builder, property details, and associated units in sequence.
     */
    async createCFinancingPropertyDetails(
        cFinancing: CFinancingEntity,
        aBuilder: ABuilderEntity,
        dto: CreatePDetailsDto,
    ) {
        const pDetails = await this.createPropertyDetailsForAnalysisBuilderForCFinancing(
            cFinancing,
            aBuilder,
            dto,
        );
        await this.createUnitsForPDFCFinancing(cFinancing, aBuilder, pDetails, dto);
    }

    /**
     * Updates or inserts property details for a creative financing entities.
     * If no analysis builder exists, creates property details from scratch.
     * If property details already exist, updates them; otherwise, creates new property details for the analysis builder.
     */
    async upsertCFinancingPD(
        cFinancing: CFinancingEntity,
        aBuilder: ABuilderEntity,
        dto: CreatePDetailsDto,
    ): Promise<void> {
        if (aBuilder.propertyDetails) {
            await this.cFinancingService.rAnalyzerService.raABuilderService.updateRentalAnalyzerPropertyDetails(
                aBuilder.propertyDetails.id,
                dto,
            );
            return;
        }

        await this.createCFinancingPropertyDetails(cFinancing, aBuilder, dto);
    }
}
