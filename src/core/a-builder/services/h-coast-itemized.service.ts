import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { AdItemizedEntity, HCoastEntity, HCoastItemizedEntity } from '../entities';
import { ABuilderService } from './a-builder.service';
import { HCoastItemizedDto } from '../dto';

@Injectable()
export class HCoastItemizedService {
    /**
     * Service responsible for handling holding coast itemized operations
     */

    constructor(
        @Inject(forwardRef(() => ABuilderService))
        private readonly aBuilderService: ABuilderService,
    ) {}

    /**
     * Calculates the total itemized holding cost from the provided cost breakdown.
     * Aggregates individual cost components including utilities, taxes, and other expenses.
     * Ignores invalid numeric values (NaN) during summation to ensure a reliable total.
     */
    calculateItemizedHoldingCost(item: HCoastItemizedDto): number {
        const values = [
            item.electricity,
            item.water,
            item.trash,
            item.gas,
            item.propertyTaxes,
            item.other,
        ];

        return values.reduce((sum, value) => {
            if (!Number.isNaN(value)) return sum + value;
            return sum;
        }, 0);
    }

    /**
     * Builds a holding cost itemized entity from the provided required and optional data.
     * Assigns utility, tax, and additional cost fields along with an optional parent holding cost reference.
     * Returns a fully constructed entity instance ready for persistence.
     */
    buildHCItemizedEntity(
        required: {
            electricity: number;
            water: number;
            gas: number;
            propertyTaxes: number;
            trash: number;
            other: number;
        },
        optional: {
            hCoast?: HCoastEntity;
        },
    ): HCoastItemizedEntity {
        const result = new HCoastItemizedEntity();
        Object.assign(result, required, optional);
        return result;
    }

    /**
     * Retrieves a holding cost itemized entity based on the provided criteria and optional relations.
     * Formats the search criteria for logging, queries the repository for an active record, and validates existence.
     * Throws a not found error if no matching data is found; otherwise returns the retrieved entity.
     */
    async retrieveHCItemizedByCriteria(
        criteria: Record<string, any>,
        relations?: string[],
    ): Promise<HCoastItemizedEntity> {
        const entries = this.aBuilderService.otherUtils.formatCriteria(criteria);

        this.aBuilderService.logger.info(`Find a holding coast itemized details  by ${entries}`);

        const isDataExist = await this.aBuilderService.hCoastItemizedRepo.findActiveOne(
            this.aBuilderService.hCoastItemizedRepo,
            criteria,
            relations,
        );

        if (!isDataExist)
            this.aBuilderService.errorHandler.notFound(
                `Data not found with ${entries}`,
                `Data not found`,
            );

        return isDataExist;
    }

    /**
     * Creates a holding cost itemized entity from the provided DTO and optional parent holding cost.
     * Builds the entity using the itemized data and associates it with the given holding cost when provided.
     * Persists the entity through the repository and returns the created instance.
     */
    async createHCItemizedEntity(
        createDto: HCoastItemizedDto,
        hCoast?: HCoastEntity,
    ): Promise<HCoastItemizedEntity> {
        return await this.aBuilderService.hCoastItemizedRepo.create(
            this.buildHCItemizedEntity(
                {
                    ...createDto,
                },
                { hCoast },
            ),
        );
    }

    /**
     * Updates an existing holding cost itemized entity with the provided partial data.
     * Validates that update data is present, selectively maps allowed fields, and constructs an update payload.
     * Persists the changes through the repository and returns the update operation result; otherwise returns a message if no updates are provided.
     */
    async updateHCItemized(
        result: HCoastItemizedEntity,
        itemized?: Partial<{
            electricity: number;
            water: number;
            gas: number;
            propertyTaxes: number;
            trash: number;
            other: number;
        }>,
    ) {
        if (!itemized || Object.keys(itemized).length === 0)
            return {
                message: 'No updates provided for holding coast itemized details',
            };

        const otherFields = [
            'electricity',
            'water',
            'gas',
            'propertyTaxes',
            'trash',
            'other',
        ] as const;

        const updatePayload: Partial<AdItemizedEntity> = {};

        otherFields.forEach((field) => {
            if (itemized[field] !== undefined) updatePayload[field] = itemized[field] as any;
        });

        return await this.aBuilderService.adItemizedRepo.update({ id: result.id }, updatePayload);
    }

    /**
     * Updates holding cost itemized details for a given entity identifier and parent holding cost.
     * Retrieves the existing itemized entity using the provided identifiers and applies updates from the DTO.
     * Persists the changes and returns a success message upon completion.
     */
    async updateHCItemizedInfo(id: string, hCoast: HCoastEntity, createDto: HCoastItemizedDto) {
        const result = await this.retrieveHCItemizedByCriteria({
            id,
            hCoast: { id: hCoast.id },
        });

        await this.updateHCItemized(result, {
            electricity: createDto.electricity,
            water: createDto.water,
            gas: createDto.gas,
            propertyTaxes: createDto.propertyTaxes,
            trash: createDto.trash,
            other: createDto.other,
        });

        return { message: 'Holding coast items updated successfully' };
    }

    /**
     * Deletes a holding cost itemized entity when data is provided.
     * Extracts the entity identifier and performs a delete operation through the repository.
     * Returns the result of the deletion operation.
     */
    async deleteHCItemized(data?: HCoastItemizedEntity) {
        return await this.aBuilderService.hCoastItemizedRepo.delete({ id: data?.id });
    }
}
