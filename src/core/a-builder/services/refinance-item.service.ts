import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { RefinanceEntity, RefinanceItemEntity } from '../entities';
import { RefiItemDto, RefiItemResolveDto, RefiItemUpdateDto } from '../dto';
import { ABuilderService } from './a-builder.service';
import { In } from 'typeorm';

@Injectable()
export class RefinanceItemService {
    /**
     * Service responsible for handling refinance item operations
     */

    constructor(
        @Inject(forwardRef(() => ABuilderService))
        private readonly aBuilderService: ABuilderService,
    ) {}

    /**
     * Calculates the total refinance amount from the provided itemized entries.
     * Iterates through each item, converts values to numbers, filters out non-finite values,
     * and accumulates the valid amounts into a final sum.
     */
    calculateItemizedRefinance = (item: RefiItemResolveDto): number =>
        item.items.reduce((sum, current) => {
            const value = Number(current.value);
            return Number.isFinite(value) ? sum + value : sum;
        }, 0);

    /**
     * Builds a refinancing item entity from the provided required data.
     * Instantiates a new entity, assigns the given properties, and returns the populated instance.
     */
    buildRefiItemEntity(required: {
        label: string;
        value: number;
        refi: RefinanceEntity;
    }): RefinanceItemEntity {
        const result = new RefinanceItemEntity();
        Object.assign(result, required);
        return result;
    }

    /**
     * Splits refinance item DTOs into create and update groups based on identifier presence.
     * Iterates through items, classifies entries with an id as updates and others as creates,
     * and aggregates them into their respective collections.
     */
    splitRefiItemDtoByMethod(data: RefiItemResolveDto) {
        return data.items.reduce(
            (acc, module) => {
                if (module.id) acc.updates.push(module);
                else acc.creates.push(module);

                return acc;
            },
            {
                creates: [] as RefiItemUpdateDto[],
                updates: [] as RefiItemUpdateDto[],
            },
        );
    }

    /**
     * Creates refinance items for the given entity from the provided input list.
     * Validates non-empty input, retrieves existing non-deleted items, filters out duplicates based on normalized labels,
     * builds new entities for unique entries, and persists them in bulk.
     */
    async createRefiItems(refi: RefinanceEntity, creates: RefiItemDto[]) {
        if (creates.length === 0) return;

        const existingItems = await this.aBuilderService.refiItemRepository.find({
            where: { refi: { id: refi.id }, deleted: false },
        });

        const existingLabels = new Set(
            existingItems.map((item) => item.label.toLowerCase().trim()),
        );

        const newItems = creates.filter(
            (create) => !existingLabels.has(create.label.toLowerCase().trim()),
        );

        if (newItems.length === 0) return;

        return await this.aBuilderService.refiItemRepository.createMany(
            newItems.map((create) =>
                this.buildRefiItemEntity({
                    label: create.label.trim(),
                    value: create.value,
                    refi,
                }),
            ),
        );
    }

    /**
     * Updates a refinancing item entity with the provided partial data.
     * Validates input presence, selectively processes string and non-string fields, trims string values,
     * constructs an update payload with defined properties, and persists the changes.
     */
    async updateRefiItem(
        result: RefinanceItemEntity,
        itemized?: Partial<{
            label: string;
            value: number;
        }>,
    ) {
        if (!itemized || Object.keys(itemized).length === 0)
            return {
                message: 'No updates provided for refi item item',
            };

        const stringField = ['label'] as const;
        const otherFields = ['value'] as const;

        const updatePayload: Partial<RefinanceItemEntity> = {};

        stringField.forEach((field) => {
            if (itemized[field]?.trim()) updatePayload[field] = itemized[field].trim();
        });

        otherFields.forEach((field) => {
            if (itemized[field] !== undefined) updatePayload[field] = itemized[field] as any;
        });

        return await this.aBuilderService.refiItemRepository.update(
            { id: result.id },
            updatePayload,
        );
    }

    /**
     * Normalizes refinance item update data by merging input with existing entity values.
     * Resolves each field by prioritizing provided values and falling back to current entity data,
     * and returns a consistent partial entity payload.
     */
    normalizeRefiItemUpdateDto(
        result: RefinanceItemEntity,
        itemized: Partial<{
            label: string;
            value: number;
        }>,
    ): Partial<RefinanceItemEntity> {
        const value = itemized.value ?? result.value;
        const label = itemized.label ?? result.label;

        return {
            value,
            label,
        };
    }

    /**
     * Resolves refinance items by processing create and update operations for the given entity.
     * Splits input data into create and update groups, persists new items, retrieves existing ones by identifiers,
     * normalizes update payloads, applies updates iteratively, and completes the operation flow.
     */
    async resolveRefiItem(refi: RefinanceEntity, data: RefiItemResolveDto) {
        const { creates, updates } = this.splitRefiItemDtoByMethod(data);
        await this.createRefiItems(refi, creates);

        const ids = updates.map((item) => item.id);
        const existingItems = await this.aBuilderService.refiItemRepository.find({
            where: { id: In(ids), refi: { id: refi.id }, deleted: false },
        });

        const existingMap = new Map(existingItems.map((item) => [item.id, item]));

        for (const item of updates) {
            if (!item.id) continue;
            const result = existingMap.get(item.id);
            if (result) {
                const normalized = this.normalizeRefiItemUpdateDto(result, item);
                await this.updateRefiItem(result, normalized);
            }
        }

        return { message: 'Operation on refinance items finished successfully' };
    }
}
