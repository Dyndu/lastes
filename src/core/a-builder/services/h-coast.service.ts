import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ABuilderEntity, HCoastEntity } from '../entities';
import { ABuilderService } from './a-builder.service';
import { HCoastDto } from '../dto';

@Injectable()
export class HCoastService {
    /**
     * Service responsible for handling holding coast operations
     */

    constructor(
        @Inject(forwardRef(() => ABuilderService))
        private readonly aBuilderService: ABuilderService,
    ) {}

    /**
     * Validates holding cost details based on itemization and total value constraints.
     * Ensures itemized data is provided when required and prevents conflicting inputs between itemized and aggregated values.
     * Triggers validation errors through the error handler when constraints are not satisfied.
     */
    validateHoldingCoastDetails(hCoast: HCoastDto) {
        const errors: Record<string, string> = {};

        if (hCoast.hasItems && !hCoast.item)
            errors['item'] = 'Itemized details are required for holding coast';

        if (!hCoast.hasItems && hCoast.holdingCoast == null)
            errors['holdingCoast'] = 'Holding cost is required when items are not provided';

        if (hCoast.hasItems && hCoast.holdingCoast != null)
            errors['holdingCoast'] =
                'Holding cost must not be provided when items are used — it is calculated automatically';

        this.aBuilderService.errorHandler.validation(errors);
    }

    /**
     * Converts a duration in weeks to months, always rounding up.
     * Uses 4.33 weeks/month (52 weeks / 12 months) for precision.
     * Example: 11 weeks → ceil(11 / 4.33) → 3 months
     */
    convertWeeksToMonths = (weeks: number): number => Math.ceil(weeks / 4.33);

    /**
     * Builds a holding cost entity from the provided required and optional data.
     * Assigns core financial fields including total cost, duration, and PI value, along with an optional analysis builder reference.
     * Returns a fully constructed entity instance ready for persistence.
     */
    buildHCoastEntity(
        required: {
            holdingCoast: number;
            duration: number;
            durationInMonth: number;
            pIValue: number;
        },
        optional: { analysisBuilder?: ABuilderEntity },
    ): HCoastEntity {
        const result = new HCoastEntity();
        Object.assign(result, required, optional);
        return result;
    }

    /**
     * Resolves the holding cost value from the DTO after validation.
     * If itemized, computes the value from itemized data; otherwise uses the direct value.
     */
    resolveHoldingCoastValue(dto: HCoastDto): number {
        this.validateHoldingCoastDetails(dto);
        return dto.item
            ? this.aBuilderService.hCoastItemizedService.calculateItemizedHoldingCost(dto.item)
            : dto.holdingCoast!;
    }

    /**
     * Handles itemized entity creation if item data is present in the DTO.
     */
    async handleItemizedCreation(dto: HCoastDto, hCoast: HCoastEntity): Promise<void> {
        if (dto.item)
            await this.aBuilderService.hCoastItemizedService.createHCItemizedEntity(
                dto.item,
                hCoast,
            );
    }

    /**
     * Creates a holding cost entity for a given analysis builder using the provided DTO.
     * Validates input constraints, resolves holding cost value, converts duration from weeks to months,
     * and persists the entity. When itemized data is provided, also creates and associates
     * the corresponding itemized holding cost entity.
     * Returns the created holding cost entity.
     */
    async createHCoast(aBuilder: ABuilderEntity, dto: HCoastDto): Promise<HCoastEntity> {
        const holdingCoastValue = this.resolveHoldingCoastValue(dto);

        const hCoast = await this.aBuilderService.hCoastRepository.create(
            this.buildHCoastEntity(
                {
                    duration: dto.duration,
                    durationInMonth: this.convertWeeksToMonths(dto.duration),
                    pIValue: dto.pIValue,
                    holdingCoast: holdingCoastValue,
                },
                { analysisBuilder: aBuilder },
            ),
        );

        await this.handleItemizedCreation(dto, hCoast);
        return hCoast;
    }

    /**
     * Updates an existing holding cost entity with the provided partial data.
     * Validates that update data is present, selectively maps allowed fields, and constructs an update payload.
     * Persists the changes through the repository and returns the update operation result;
     * otherwise returns a message if no updates are provided.
     */
    async updateHCoast(
        hCoast: HCoastEntity,
        itemized?: Partial<{
            holdingCoast: number;
            duration: number;
            durationInMonth: number;
            pIValue: number;
        }>,
    ) {
        if (!itemized || Object.keys(itemized).length === 0)
            return { message: 'No updates provided for holding coast' };

        const otherFields = ['holdingCoast', 'duration', 'pIValue', 'durationInMonth'] as const;
        const updatePayload: Partial<HCoastEntity> = {};

        otherFields.forEach((field) => {
            if (itemized[field] !== undefined) updatePayload[field] = itemized[field] as any;
        });

        return await this.aBuilderService.hCoastRepository.update({ id: hCoast.id }, updatePayload);
    }

    /**
     * Updates an existing holding cost entity with new DTO data.
     * If the existing entity has itemized data, it is deleted before reprocessing.
     * Resolves the new holding cost value, converts duration from weeks to months,
     * applies the update, and recreates itemized data if provided.
     * Returns the updated holding cost entity.
     */
    async handleHCoastUpdate(hCoast: HCoastEntity, dto: HCoastDto): Promise<HCoastEntity> {
        if (hCoast.itemized)
            await this.aBuilderService.hCoastItemizedRepo.delete({ hCoast: { id: hCoast.id } });

        const holdingCoastValue = this.resolveHoldingCoastValue(dto);

        await this.updateHCoast(hCoast, {
            duration: dto.duration,
            durationInMonth: this.convertWeeksToMonths(dto.duration),
            pIValue: dto.pIValue,
            holdingCoast: holdingCoastValue,
        });

        await this.handleItemizedCreation(dto, hCoast);
        return hCoast;
    }
}
