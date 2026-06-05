import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BAnalysisService } from './b-analysis.service';
import { RoomExpenseItemEntity, RoomSectionEntity } from '../entities';
import { CalculationMethodEnum } from '../../../common/enum';
import { CreateREItemDto, ResolveREItemDto, UpdateREItemDto } from '../dto';

@Injectable()
export class RoomExpenseItemService {
    /**
     * Service responsible for handling room expenses item operations
     */

    constructor(
        @Inject(forwardRef(() => BAnalysisService))
        readonly bAnalysisService: BAnalysisService,
    ) {}

    /**
     * Computes the total unit value by summing labor and material values.
     * Used for calculation methods that require both labor and material values.
     */
    computeTotalUnit = (laborValue: number, materialValue: number): number =>
        laborValue + materialValue;

    /**
     * Computes the total value based on price per unit and number of units.
     * Used for calculation methods that involve unit-based pricing.
     */
    computeUnitCalculation = (pricePerUnit: number, numberOfUnits: number): number =>
        pricePerUnit * numberOfUnits;

    /**
     * Returns the provided manual total value directly.
     * Used for calculation methods where the total is manually specified.
     */
    computeLaborMaterial = (manualTotal: number): number => manualTotal;

    /**
     * Resolves the total value based on the specified calculation method.
     * Validates the calculation method, applies the corresponding logic to compute the total,
     * and handles errors for unsupported methods.
     */
    resolveTotal(
        cMethod: CalculationMethodEnum,
        laborValue: number,
        materialValue: number,
        manualTotal?: number,
    ): number {
        switch (cMethod) {
            case CalculationMethodEnum.TOTAL_UNIT:
                return this.computeTotalUnit(laborValue, materialValue);
            case CalculationMethodEnum.UNIT_CALCULATION:
                return this.computeUnitCalculation(laborValue, materialValue);
            case CalculationMethodEnum.LABOR_MATERIAL:
                return this.computeLaborMaterial(manualTotal ?? 0);
            default:
                this.bAnalysisService.errorHandler.fail(
                    `Unsupported calculation method: ${cMethod}`,
                    `Unsupported calculation method: ${cMethod}`,
                );
        }
    }

    /**
     * Constructs and returns a new RoomExpenseItemEntity from the provided required fields.
     * Assigns the label, calculation method, labor and material values, and associated room section
     * to a new entities instance, then returns it.
     */
    buildREItemEntity(required: {
        label: string;
        cMethod: CalculationMethodEnum;
        laborValue: number;
        materialValue: number;
        total?: number;
        roomSection: RoomSectionEntity;
    }): RoomExpenseItemEntity {
        const result = new RoomExpenseItemEntity();
        Object.assign(result, {
            ...required,
            total: this.resolveTotal(
                required.cMethod,
                required.laborValue,
                required.materialValue,
                required.total,
            ),
        });
        return result;
    }

    /**
     * Normalizes a CreateREItemDto based on the calculation method.
     * If the method is LABOR_MATERIAL, sets laborValue and materialValue to 0.
     * Otherwise, returns the DTO unchanged.
     */
    normalizeREItemDto(dto: CreateREItemDto): CreateREItemDto {
        if (dto.cMethod !== CalculationMethodEnum.LABOR_MATERIAL) return dto;

        return {
            ...dto,
            laborValue: 0,
            materialValue: 0,
        };
    }

    /**
     * Splits an array of ResolveREItemDto items into two groups: items with an ID (updates) and items without (creates).
     * Returns an object containing separate arrays for items to be created and items to be updated.
     */
    splitDtoByMethod(data: ResolveREItemDto) {
        return data.items.reduce(
            (acc, module) => {
                if (module.id) acc.updates.push(module);
                else acc.creates.push(module);

                return acc;
            },
            {
                creates: [] as UpdateREItemDto[],
                updates: [] as UpdateREItemDto[],
            },
        );
    }

    /**
     * Retrieves a room expense item entity based on the provided criteria.
     * Logs the lookup context, fetches active data with optional relations,
     * and raises a not found error if no matching record exists.
     */
    async retrieveRExpenseByCriteria(
        criteria: Record<string, any>,
        relations?: string[],
    ): Promise<RoomExpenseItemEntity> {
        const entries = this.bAnalysisService.otherUtils.formatCriteria(criteria);
        this.bAnalysisService.logger.info(`Find room expense builder by ${entries}`);

        const isDataExist = await this.bAnalysisService.roomExpenseItemRepo.findActiveOne(
            this.bAnalysisService.roomExpenseItemRepo,
            criteria,
            relations,
        );

        if (!isDataExist)
            this.bAnalysisService.errorHandler.notFound(
                `Room expense not found with ${entries}`,
                `Room expense not found`,
            );

        return isDataExist;
    }

    /**
     * Creates multiple room expense items in bulk for a given room section.
     * Maps each CreateREItemDto to a RoomExpenseItemEntity, then persists them all via the repository.
     */
    async createREItems(roomSection: RoomSectionEntity, creates: CreateREItemDto[]) {
        return await this.bAnalysisService.roomExpenseItemRepo.createMany(
            creates.map((create) => {
                const normalized = this.normalizeREItemDto(create);
                return this.buildREItemEntity({
                    roomSection,
                    cMethod: normalized.cMethod,
                    label: normalized.label,
                    laborValue: normalized.laborValue,
                    materialValue: normalized.materialValue,
                    total: normalized.total,
                });
            }),
        );
    }

    /**
     * Updates a RoomExpenseItemEntity with the provided partial data.
     * Validates the presence of updates, trims string fields, and applies changes to the entities.
     * Persists the updates via the repository and returns the result.
     */
    async updateREItem(
        result: RoomExpenseItemEntity,
        itemized?: Partial<{
            label: string;
            cMethod: CalculationMethodEnum;
            laborValue: number;
            materialValue: number;
            total: number;
        }>,
    ) {
        if (!itemized || Object.keys(itemized).length === 0)
            return {
                message: 'No updates provided for room expense item',
            };

        const stringField = ['label'] as const;
        const otherFields = ['cMethod', 'laborValue', 'materialValue', 'total'] as const;

        const updatePayload: Partial<RoomExpenseItemEntity> = {};

        stringField.forEach((field) => {
            if (itemized[field]?.trim()) updatePayload[field] = itemized[field].trim();
        });

        otherFields.forEach((field) => {
            if (itemized[field] !== undefined) updatePayload[field] = itemized[field] as any;
        });

        return await this.bAnalysisService.roomExpenseItemRepo.update(
            { id: result.id },
            updatePayload,
        );
    }

    /**
     * Normalizes and validates an update DTO for a RoomExpenseItemEntity.
     * Preserves existing values if not provided in the update, ensures consistency with the calculation method,
     * and resolves the total value based on the method and provided values.
     */
    normalizeREItemUpdateDto(
        result: RoomExpenseItemEntity,
        itemized: Partial<{
            label: string;
            cMethod: CalculationMethodEnum;
            laborValue: number;
            materialValue: number;
            total?: number;
        }>,
    ): Partial<RoomExpenseItemEntity> {
        const cMethod = itemized.cMethod ?? result.cMethod;
        const laborValue = itemized.laborValue ?? result.laborValue;
        const materialValue = itemized.materialValue ?? result.materialValue;
        const total = itemized.total ?? result.total;

        const normalized =
            cMethod === CalculationMethodEnum.LABOR_MATERIAL
                ? { cMethod, laborValue: 0, materialValue: 0, total }
                : { cMethod, laborValue, materialValue };

        return {
            ...normalized,
            total: this.resolveTotal(
                cMethod,
                normalized.laborValue,
                normalized.materialValue,
                normalized.total,
            ),
        };
    }

    /**
     * Resolves room expense items by processing both creation and update operations.
     * Splits the input data into creates/updates, persists new items in bulk, and applies updates to existing items.
     * Returns a success message upon completion.
     */
    async resolveREItem(roomSection: RoomSectionEntity, data: ResolveREItemDto) {
        const { creates, updates } = this.splitDtoByMethod(data);
        await this.createREItems(roomSection, creates);

        for (const item of updates) {
            const result = await this.bAnalysisService.roomExpenseItemRepo.findOne({
                where: { id: item.id, roomSection: { id: roomSection.id }, deleted: false },
            });

            if (result) {
                const normalized = this.normalizeREItemUpdateDto(result, item);
                await this.updateREItem(result, normalized);
            }
        }

        return { message: 'Operation on items finished successfully' };
    }
}
