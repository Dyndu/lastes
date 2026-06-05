import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { AnalysisEntity } from '../../analysis/entities';
import { ABuilderEntity, PDetailsEntity } from '../../a-builder/entities';
import { BrRefiDto, CCoastDto, CreatePDetailsDto } from '../../a-builder/dto';
import { BrAnalyzerService } from './br-analyzer.service';
import { BrAnalyzerEntity } from '../entities/br-analyzer.entity';

@Injectable()
export class PreBrAnalyzerService {
    /**
     * Service responsible for handling pre operations for brrr analyzer module
     */

    constructor(
        @Inject(forwardRef(() => BrAnalyzerService))
        private readonly brAnalyzerService: BrAnalyzerService,
    ) {}

    /**
     * Builds a BRRR analyzer entity using the provided analysis context.
     * Creates and populates a BRRR analyzer entity instance with the required analysis reference.
     */
    buildBrAnalyzerEntity(required: { analysis: AnalysisEntity }): BrAnalyzerEntity {
        const result = new BrAnalyzerEntity();
        Object.assign(result, required);
        return result;
    }

    /**
     * Creates a BR analyzer entity linked to the provided analysis.
     * Builds the BR analyzer entity and persists it in the repository.
     */
    async createBrAnalyzer(analysis: AnalysisEntity): Promise<BrAnalyzerEntity> {
        return this.brAnalyzerService.brAnalyzerRepo.create(
            this.buildBrAnalyzerEntity({ analysis }),
        );
    }

    /**
     * Retrieves an existing BRRRR analyzer builder or creates a new one if not found.
     * Attempts to find an analysis builder linked to the provided BRRRR analyzer entity with optional relations,
     * returns the builder if found, otherwise creates a new builder associated with the BRRRR analyzer.
     * If creation fails due to any error, deletes the associated BRRRR analyzer entity and throws a bad request error with the original error message.
     */
    async getOrCreateBrAnalyzerBuilder(brAnalyzer: BrAnalyzerEntity, relations?: string[]) {
        try {
            const builder =
                await this.brAnalyzerService.rAnalyzerService.aBuilderService.aBuilderRepository.findOne(
                    {
                        where: { brAnalyzer: { id: brAnalyzer.id } },
                        relations,
                    },
                );
            if (builder) return builder;
            return await this.brAnalyzerService.rAnalyzerService.aBuilderService.createABuilder(
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                brAnalyzer,
            );
        } catch (error) {
            await this.brAnalyzerService.brAnalyzerRepo.delete({ id: brAnalyzer.id });
            this.brAnalyzerService.errorHandler.badRequest(
                `Error while creating this brrr analyzer analysis: ${error.message}`,
                `Error while creating this brrr analyzer analysis: ${error.message}`,
            );
        }
    }

    /**
     * Creates property details for an analysis builder linked to a brAnalyzer entities.
     * Attempts to create the property details; if failed, deletes the analysis builder and brAnalyzer entities,
     * then throws a bad request error.
     */
    async createPropertyDetailsForAnalysisBuilderForBrAnalyzer(
        brAnalyzer: BrAnalyzerEntity,
        aBuilder: ABuilderEntity,
        dto: CreatePDetailsDto,
    ) {
        try {
            return await this.brAnalyzerService.rAnalyzerService.raABuilderService.createPropertyDetailsForABuilder(
                aBuilder,
                dto,
            );
        } catch (error) {
            await this.brAnalyzerService.rAnalyzerService.aBuilderService.aBuilderRepository.delete(
                {
                    id: aBuilder.id,
                },
            );
            await this.brAnalyzerService.brAnalyzerRepo.delete({ id: brAnalyzer.id });
            this.brAnalyzerService.errorHandler.badRequest(
                `Error while creating this analyses property details: ${error.message}`,
                `Error while creating this analyses property details: ${error.message}`,
            );
        }
    }

    /**
     * Creates units for property details linked to a brAnalyzer analysis builder.
     * Attempts to create the units; if failed, deletes the property details, analysis builder, and brAnalyzer entities,
     * then throws a bad request error.
     */
    async createUnitsForPDFBrAnalyzer(
        brAnalyzer: BrAnalyzerEntity,
        aBuilder: ABuilderEntity,
        pDetails: PDetailsEntity,
        dto: CreatePDetailsDto,
    ) {
        try {
            await this.brAnalyzerService.rAnalyzerService.aBuilderService.unitsService.createPDetailsUnits(
                pDetails,
                dto.units,
            );
        } catch (error) {
            await this.brAnalyzerService.rAnalyzerService.aBuilderService.pDetailsRepository.delete(
                {
                    id: pDetails.id,
                },
            );
            await this.brAnalyzerService.rAnalyzerService.aBuilderService.aBuilderRepository.delete(
                {
                    id: aBuilder.id,
                },
            );
            await this.brAnalyzerService.brAnalyzerRepo.delete({ id: brAnalyzer.id });
            this.brAnalyzerService.errorHandler.badRequest(
                `Error while creating property details units for fix & flip module: ${error.message}`,
                `Error while creating property details units for fix & flip module: ${error.message}`,
            );
        }
    }

    /**
     * Creates property details for a brAnalyzer entities, including the analysis builder, property details, and units.
     * Orchestrates the creation of the analysis builder, property details, and associated units in sequence.
     */
    async createBrAnalyzerPropertyDetails(
        brAnalyzer: BrAnalyzerEntity,
        aBuilder: ABuilderEntity,
        dto: CreatePDetailsDto,
    ) {
        const pDetails = await this.createPropertyDetailsForAnalysisBuilderForBrAnalyzer(
            brAnalyzer,
            aBuilder,
            dto,
        );
        await this.createUnitsForPDFBrAnalyzer(brAnalyzer, aBuilder, pDetails, dto);
    }

    /**
     * Updates or inserts property details for a brAnalyzer entities.
     * If no analysis builder exists, creates property details from scratch.
     * If property details already exist, updates them; otherwise, creates new property details for the analysis builder.
     */
    async upsertBrAnalyzerPD(
        brAnalyzer: BrAnalyzerEntity,
        aBuilder: ABuilderEntity,
        dto: CreatePDetailsDto,
    ): Promise<void> {
        if (aBuilder.propertyDetails) {
            await this.brAnalyzerService.rAnalyzerService.raABuilderService.updateRentalAnalyzerPropertyDetails(
                aBuilder.propertyDetails.id,
                dto,
            );
            return;
        }

        await this.createBrAnalyzerPropertyDetails(brAnalyzer, aBuilder, dto);
    }

    async upsertBrAnalyzerCCoast(aBuilder: ABuilderEntity, dto: CCoastDto): Promise<void> {
        const data = aBuilder.cCoast;
        if (data)
            await this.brAnalyzerService.rAnalyzerService.aBuilderService.cCoastService.updateCCoast(
                data,
                dto,
            );
        else
            await this.brAnalyzerService.rAnalyzerService.aBuilderService.cCoastService.createCCoast(
                aBuilder,
                dto,
            );
    }

    /**
     * Updates an existing BrRefi if it exists on the provided ABuilder,
     * otherwise creates a new BrRefi for the ABuilder using the given DTO.
     */
    async upsertBrAnalyzerRefi(aBuilder: ABuilderEntity, dto: BrRefiDto) {
        const data = aBuilder.brRefi;

        if (data)
            await this.brAnalyzerService.rAnalyzerService.aBuilderService.brRefinanceService.handleBrRefiUpdate(
                data,
                dto,
            );
        else
            await this.brAnalyzerService.rAnalyzerService.aBuilderService.brRefinanceService.createBrRefinance(
                aBuilder,
                dto,
            );
    }
}
