import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ABuilderEntity, HDurationEntity } from '../entities';
import { ABuilderService } from './a-builder.service';
import { HDurationDto } from '../dto';

@Injectable()
export class HDurationService {
    /**
     * Service responsible for handling holding duration operations
     */

    constructor(
        @Inject(forwardRef(() => ABuilderService))
        private readonly aBuilderService: ABuilderService,
    ) {}

    /**
     * Validates holding duration input against itemization rules and cost constraints.
     * Ensures itemized data is provided when required, enforces mutual exclusivity between items and holding cost,
     * aggregates validation errors, and triggers a validation exception when constraints are violated.
     */
    validateHoldingDurationDetails(hDuration: HDurationDto): void {
        const errors: Record<string, string> = {};

        if (hDuration.hasItems && !hDuration.item)
            errors['item'] = 'Itemized details are required for holding duration';

        if (!hDuration.hasItems && hDuration.holdingCoast == null)
            errors['holdingCoast'] = 'Holding cost is required when items are not provided';

        if (hDuration.hasItems && hDuration.holdingCoast != null)
            errors['holdingCoast'] =
                'Holding cost must not be provided when items are used — it is calculated automatically';

        this.aBuilderService.errorHandler.validation(errors);
    }

    /**
     * Builds a holding duration entity from required and optional input data.
     * Instantiates a new entity, assigns financial and duration-related fields along with optional relationships,
     * and returns the constructed holding duration instance.
     */
    buildHDurationEntity(
        required: {
            holdingCoast: number;
            duration: number;
            transactionFee: number;
            otherFee: number;
            targetProfit: number;
        },
        optional: { analysisBuilder?: ABuilderEntity },
    ): HDurationEntity {
        const result = new HDurationEntity();
        Object.assign(result, required, optional);
        return result;
    }

    /**
     * Resolves the holding duration value from the provided input data.
     * Validates holding duration constraints, computes the total from itemized data when present,
     * otherwise falls back to the provided holding cost or a default value.
     */
    resolveHoldingDurationValue(dto: HDurationDto): number {
        this.validateHoldingDurationDetails(dto);
        return dto.item
            ? this.aBuilderService.iRepairsService.calculateItemizedIRepairsCoast(dto.item)
            : (dto.holdingCoast ?? 0);
    }

    /**
     * Handles creation of itemized holding duration repair entries for the given entity.
     * Checks for the presence of itemized data and delegates creation to the repairs service
     * to persist associated repair records when applicable.
     */
    async handleHDurationItemizedCreation(
        dto: HDurationDto,
        hDuration: HDurationEntity,
    ): Promise<void> {
        if (dto.item)
            await this.aBuilderService.iRepairsService.createIRepair(
                dto.item,
                undefined,
                hDuration,
            );
    }

    /**
     * Creates a holding duration entity for the given analysis builder and input data.
     * Resolves the holding cost value, builds the holding duration entity with computed and provided fields,
     * persists it, triggers optional itemized creation handling, and returns the created entity.
     */
    async createHDuration(aBuilder: ABuilderEntity, dto: HDurationDto): Promise<HDurationEntity> {
        const holdingCoastValue = this.resolveHoldingDurationValue(dto);

        const hDuration = await this.aBuilderService.hDurationRepository.create(
            this.buildHDurationEntity(
                {
                    ...dto,
                    holdingCoast: holdingCoastValue,
                },
                { analysisBuilder: aBuilder },
            ),
        );

        await this.handleHDurationItemizedCreation(dto, hDuration);
        return hDuration;
    }

    /**
     * Updates a holding duration entity with the provided partial data.
     * Validates input presence, extracts supported numeric fields, builds an update payload from defined values,
     * and persists the changes for the targeted holding duration record.
     */
    async updateHDuration(
        hDuration: HDurationEntity,
        itemized?: Partial<{
            holdingCoast: number;
            duration: number;
            transactionFee: number;
            otherFee: number;
            targetProfit: number;
        }>,
    ) {
        if (!itemized || Object.keys(itemized).length === 0)
            return { message: 'No updates provided for holding duration' };

        const otherFields = [
            'holdingCoast',
            'duration',
            'transactionFee',
            'otherFee',
            'targetProfit',
        ] as const;
        const updatePayload: Partial<HDurationEntity> = {};

        otherFields.forEach((field) => {
            if (itemized[field] !== undefined) updatePayload[field] = itemized[field] as any;
        });

        return await this.aBuilderService.hDurationRepository.update(
            { id: hDuration.id },
            updatePayload,
        );
    }

    /**
     * Handles update operations for a holding duration entity.
     * Removes existing itemized records when applicable, resolves the updated holding cost value,
     * applies updates to the entity, triggers optional itemized creation, and returns the updated entity reference.
     */
    async handleHDurationUpdate(
        hDuration: HDurationEntity,
        dto: HDurationDto,
    ): Promise<HDurationEntity> {
        if (hDuration.itemized)
            await this.aBuilderService.iRepairsRepository.delete({
                hDuration: { id: hDuration.id },
            });

        const holdingCoastValue = this.resolveHoldingDurationValue(dto);

        await this.updateHDuration(hDuration, {
            ...dto,
            holdingCoast: holdingCoastValue,
        });

        await this.handleHDurationItemizedCreation(dto, hDuration);
        return hDuration;
    }
}
