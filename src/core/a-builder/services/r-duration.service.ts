import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ABuilderEntity, RDurationEntity } from '../entities';
import { ABuilderService } from './a-builder.service';
import { RDurationDto } from '../dto';

@Injectable()
export class RDurationService {
    /**
     * Service responsible for handling acquisition details operations
     */

    constructor(
        @Inject(forwardRef(() => ABuilderService))
        private readonly aBuilderService: ABuilderService,
    ) {}

    /**
     * Converts a duration in years to months.
     * Multiplies the input value by 12 and rounds the result to the nearest integer.
     */
    convertYearsToMonths = (years: number): number => Math.round(years * 12);

    /**
     * Validates rehab duration input against itemization and holding cost constraints.
     * Ensures itemized data is provided when required, enforces required holding cost when items are absent,
     * validates mutual exclusivity between itemized data and holding cost, and triggers a validation exception when constraints are violated.
     */
    validateRDurationDetails(items: RDurationDto) {
        const errors: Record<string, string> = {};

        if (items.hasItems && !items.item)
            errors['item'] = 'Itemized details are required for rehab details';

        if (!items.hasItems && items.holdingCoast == null)
            errors['holdingCoast'] = 'Holding cost is required when items are not provided';

        if (items.hasItems && items.holdingCoast != null)
            errors['holdingCoast'] =
                'Holding cost must not be provided when items are used — it is calculated automatically';

        this.aBuilderService.errorHandler.validation(errors);
    }

    /**
     * Builds a rehab duration entity from required and optional input data.
     * Instantiates a new entity, assigns rehab duration and cost-related fields along with optional relationships,
     * and returns the constructed rehab duration instance.
     */
    buildRDurationEntity(
        required: {
            rehabDuration: number;
            duration: number;
            rContingency: number;
            holdingCoast: number;
            rContingencyAmount: number;
        },
        optional: {
            analysisBuilder?: ABuilderEntity;
        },
    ): RDurationEntity {
        const result = new RDurationEntity();
        Object.assign(result, required, optional);
        return result;
    }

    /**
     * Resolves the rehab duration value from the provided input data.
     * Validates rehab duration constraints, computes the total from itemized data when present,
     * otherwise falls back to the provided holding cost or a default value.
     */
    resolveRehabDurationValue(dto: RDurationDto): number {
        this.validateRDurationDetails(dto);
        return dto.item
            ? this.aBuilderService.adItemizedService.calculateItemizedAcquisitionCost(dto.item)
            : (dto.holdingCoast ?? 0);
    }

    /**
     * Handles creation of itemized rehab duration data for the given entity.
     * Checks for the presence of itemized input and delegates persistence to the acquisition itemized service
     * to create and associate itemized records when applicable.
     */
    async handleRDurationItemizedCreation(
        dto: RDurationDto,
        rDuration: RDurationEntity,
    ): Promise<void> {
        if (dto.item)
            await this.aBuilderService.adItemizedService.createAdItemizedEntity(
                dto.item,
                undefined,
                undefined,
                rDuration,
            );
    }

    /**
     * Creates a rehab duration entity for the given analysis builder and input data.
     * Resolves the holding cost value, converts rehab duration into months, builds the entity with computed and provided fields,
     * persists it, triggers optional itemized creation handling, and returns the created entity.
     */
    async createRDuration(aBuilder: ABuilderEntity, dto: RDurationDto): Promise<RDurationEntity> {
        const holdingCoastValue = this.resolveRehabDurationValue(dto);

        const rDuration = await this.aBuilderService.rDurationRepository.create(
            this.buildRDurationEntity(
                {
                    ...dto,
                    duration: this.aBuilderService.hCoastService.convertWeeksToMonths(
                        dto.rehabDuration,
                    ),
                    rContingencyAmount: this.aBuilderService.refinanceService.determineNewAmount(
                        dto.rContingency,
                        holdingCoastValue,
                    ),
                    holdingCoast: holdingCoastValue,
                },
                { analysisBuilder: aBuilder },
            ),
        );

        await this.handleRDurationItemizedCreation(dto, rDuration);
        return rDuration;
    }

    /**
     * Updates a rehab duration entity with the provided partial data.
     * Validates input presence, extracts supported fields, builds an update payload from defined values,
     * and persists the changes for the targeted rehab duration record.
     */
    async updateRDuration(
        aDetails: RDurationEntity,
        pUpdates?: Partial<{
            rehabDuration: number;
            duration: number;
            rContingency: number;
            holdingCoast: number;
            rContingencyAmount: number;
        }>,
    ) {
        if (!pUpdates || Object.keys(pUpdates).length === 0)
            return {
                message: 'No updates provided for acquisition details',
            };

        const otherFields = [
            'rehabDuration',
            'duration',
            'rContingency',
            'holdingCoast',
            'rContingencyAmount',
        ] as const;

        const updatePayload: Partial<RDurationEntity> = {};

        otherFields.forEach((field) => {
            if (pUpdates[field] !== undefined) updatePayload[field] = pUpdates[field] as any;
        });

        return await this.aBuilderService.rDurationRepository.update(
            { id: aDetails.id },
            updatePayload,
        );
    }

    /**
     * Handles update operations for a rehab duration entity.
     * Removes existing itemized records when present, resolves the updated holding cost value,
     * recalculates duration when needed, applies updates to the entity, triggers optional itemized creation,
     * and returns the updated rehab duration entity reference.
     */
    async handleRDurationUpdate(
        rDuration: RDurationEntity,
        dto: RDurationDto,
    ): Promise<RDurationEntity> {
        if (rDuration.itemized)
            await this.aBuilderService.adItemizedRepo.delete({ rDuration: { id: rDuration.id } });

        const holdingCoastValue = this.resolveRehabDurationValue(dto);

        await this.updateRDuration(rDuration, {
            ...dto,
            duration: dto.rehabDuration
                ? this.convertYearsToMonths(dto.rehabDuration)
                : rDuration.duration,
            rContingencyAmount: dto.rContingency
                ? this.aBuilderService.refinanceService.determineNewAmount(
                      dto.rContingency,
                      holdingCoastValue,
                  )
                : rDuration.rContingencyAmount,
            holdingCoast: holdingCoastValue,
        });

        await this.handleRDurationItemizedCreation(dto, rDuration);
        return rDuration;
    }
}
