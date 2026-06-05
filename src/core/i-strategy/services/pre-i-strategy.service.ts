import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { AnalysisEntity } from '../../analysis/entities';
import { ABuilderEntity, PDetailsEntity } from '../../a-builder/entities';
import { CreatePDetailsDto, RDurationDto, RefiCreateDto } from '../../a-builder/dto';
import { IStrategyService } from './i-strategy.service';
import { IStrategyEntity } from '../entities/i-strategy.entity';

@Injectable()
export class PreIStrategyService {
    /**
     * Service responsible for handling pre operations for investment strategy module
     */

    constructor(
        @Inject(forwardRef(() => IStrategyService))
        private readonly iStrategyService: IStrategyService,
    ) {}

    /**
     * Builds and returns an IStrategy entity instance.
     * Assigns the required analysis data to the entity before returning the populated instance.
     */
    buildIStrategyEntity(required: { analysis: AnalysisEntity }): IStrategyEntity {
        const result = new IStrategyEntity();
        Object.assign(result, required);
        return result;
    }

    /**
     * Creates a new IStrategy entity for the provided analysis.
     * Builds the entity structure and persists it through the IStrategy repository.
     */
    async createIStrategy(analysis: AnalysisEntity): Promise<IStrategyEntity> {
        return this.iStrategyService.iStrategyRepo.create(this.buildIStrategyEntity({ analysis }));
    }

    async getOrCreateIStrategyBuilder(iStrategy: IStrategyEntity, relations?: string[]) {
        try {
            const builder =
                await this.iStrategyService.rAnalyzerService.aBuilderService.aBuilderRepository.findOne(
                    {
                        where: { iStrategy: { id: iStrategy.id } },
                        relations,
                    },
                );
            if (builder) return builder;
            return await this.iStrategyService.rAnalyzerService.aBuilderService.createABuilder(
                undefined,
                undefined,
                undefined,
                undefined,
                iStrategy,
            );
        } catch (error) {
            await this.iStrategyService.iStrategyRepo.delete({ id: iStrategy.id });
            this.iStrategyService.errorHandler.badRequest(
                `Error while creating this investment strategy analysis: ${error.message}`,
                `Error while creating this investment strategy analysis: ${error.message}`,
            );
        }
    }

    /**
     * Creates property details for an analysis builder linked to a iStrategy entities.
     * Attempts to create the property details; if failed, deletes the analysis builder and iStrategy entities,
     * then throws a bad request error.
     */
    async createPropertyDetailsForAnalysisBuilderForIStrategy(
        iStrategy: IStrategyEntity,
        aBuilder: ABuilderEntity,
        dto: CreatePDetailsDto,
    ) {
        try {
            return await this.iStrategyService.rAnalyzerService.raABuilderService.createPropertyDetailsForABuilder(
                aBuilder,
                dto,
            );
        } catch (error) {
            await this.iStrategyService.rAnalyzerService.aBuilderService.aBuilderRepository.delete({
                id: aBuilder.id,
            });
            await this.iStrategyService.iStrategyRepo.delete({ id: iStrategy.id });
            this.iStrategyService.errorHandler.badRequest(
                `Error while creating this analyses property details: ${error.message}`,
                `Error while creating this analyses property details: ${error.message}`,
            );
        }
    }

    /**
     * Creates units for property details linked to a iStrategy analysis builder.
     * Attempts to create the units; if failed, deletes the property details, analysis builder, and iStrategy entities,
     * then throws a bad request error.
     */
    async createUnitsForPDFIStrategy(
        iStrategy: IStrategyEntity,
        aBuilder: ABuilderEntity,
        pDetails: PDetailsEntity,
        dto: CreatePDetailsDto,
    ) {
        try {
            await this.iStrategyService.rAnalyzerService.aBuilderService.unitsService.createPDetailsUnits(
                pDetails,
                dto.units,
            );
        } catch (error) {
            await this.iStrategyService.rAnalyzerService.aBuilderService.pDetailsRepository.delete({
                id: pDetails.id,
            });
            await this.iStrategyService.rAnalyzerService.aBuilderService.aBuilderRepository.delete({
                id: aBuilder.id,
            });
            await this.iStrategyService.iStrategyRepo.delete({ id: iStrategy.id });
            this.iStrategyService.errorHandler.badRequest(
                `Error while creating property details units for fix & flip module: ${error.message}`,
                `Error while creating property details units for fix & flip module: ${error.message}`,
            );
        }
    }

    /**
     * Creates property details for a iStrategy entities, including the analysis builder, property details, and units.
     * Orchestrates the creation of the analysis builder, property details, and associated units in sequence.
     */
    async createIStrategyPropertyDetails(
        iStrategy: IStrategyEntity,
        aBuilder: ABuilderEntity,
        dto: CreatePDetailsDto,
    ) {
        const pDetails = await this.createPropertyDetailsForAnalysisBuilderForIStrategy(
            iStrategy,
            aBuilder,
            dto,
        );
        await this.createUnitsForPDFIStrategy(iStrategy, aBuilder, pDetails, dto);
    }

    /**
     * Updates or inserts property details for a iStrategy entities.
     * If no analysis builder exists, creates property details from scratch.
     * If property details already exist, updates them; otherwise, creates new property details for the analysis builder.
     */
    async upsertIStrategyPD(
        iStrategy: IStrategyEntity,
        aBuilder: ABuilderEntity,
        dto: CreatePDetailsDto,
    ): Promise<void> {
        if (aBuilder.propertyDetails) {
            await this.iStrategyService.rAnalyzerService.raABuilderService.updateRentalAnalyzerPropertyDetails(
                aBuilder.propertyDetails.id,
                dto,
            );
            return;
        }

        await this.createIStrategyPropertyDetails(iStrategy, aBuilder, dto);
    }

    /**
     * Creates or updates RDuration data for an IStrategy builder entity.
     * Updates the existing RDuration entity if present, otherwise creates a new one
     * associated with the provided builder.
     */
    async upsertIStrategyRDuration(aBuilder: ABuilderEntity, dto: RDurationDto): Promise<void> {
        const data = aBuilder.rDuration;
        if (data)
            await this.iStrategyService.rAnalyzerService.aBuilderService.rDurationService.handleRDurationUpdate(
                data,
                dto,
            );
        else
            await this.iStrategyService.rAnalyzerService.aBuilderService.rDurationService.createRDuration(
                aBuilder,
                dto,
            );
    }

    /**
     * Creates or updates refinance data for an IStrategy builder entity.
     * Updates the existing refinancing entity if present, otherwise creates a new refinancing
     * entry associated with the provided builder.
     */
    async upsertIStrategyRefinance(aBuilder: ABuilderEntity, dto: RefiCreateDto): Promise<void> {
        const refi = aBuilder.refinance;
        if (refi)
            await this.iStrategyService.rAnalyzerService.aBuilderService.refinanceService.handleRefiUpdate(
                refi,
                dto,
            );
        else
            await this.iStrategyService.rAnalyzerService.aBuilderService.refinanceService.createRefinance(
                aBuilder,
                dto,
            );
    }
}
