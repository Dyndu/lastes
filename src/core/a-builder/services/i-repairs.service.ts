import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ABuilderService } from './a-builder.service';
import {
    BrRefinanceEntity,
    CCoastEntity,
    HDurationEntity,
    IRepairsEntity,
    RepairsEntity,
} from '../entities';
import { RItemDto } from '../dto';

@Injectable()
export class IRepairsService {
    /**
     * Service responsible for handling exterior repairs
     */

    constructor(
        @Inject(forwardRef(() => ABuilderService))
        private readonly aBuilderService: ABuilderService,
    ) {}

    /**
     * Calculates the total interior repairs cost from itemized input data.
     * Aggregates predefined repair fields, filters out invalid numeric values,
     * and returns the accumulated cost.
     */
    calculateItemizedIRepairsCoast(item: RItemDto): number {
        const values = [item.roof, item.garage, item.bathrooms, item.concierge, item.landscaping];

        return values.reduce((sum, value) => {
            if (!Number.isNaN(value)) return sum + value;
            return sum;
        }, 0);
    }

    /**
     * Builds an interior repairs entity from required and optional input data.
     * Instantiates a new entity, assigns repair-related fields and optional relationships,
     * and returns the constructed interior repairs instance.
     */
    buildIRepairsEntity(
        required: {
            roof: number;
            landscaping: number;
            concierge: number;
            garage: number;
            bathrooms: number;
        },
        optional: {
            repairs?: RepairsEntity;
            hDuration?: HDurationEntity;
            cCoast?: CCoastEntity;
            brRefi?: BrRefinanceEntity;
        },
    ): IRepairsEntity {
        const result = new IRepairsEntity();
        Object.assign(result, required, optional);
        return result;
    }

    /**
     * Creates an interior repairs entity from the provided input data and associations.
     * Builds the entity with repair values and optional related entities,
     * persists it through the repository, and returns the created instance.
     */
    async createIRepair(
        createDto: RItemDto,
        repairs?: RepairsEntity,
        hDuration?: HDurationEntity,
        cCoast?: CCoastEntity,
        brRefi?: BrRefinanceEntity,
    ): Promise<IRepairsEntity> {
        return await this.aBuilderService.iRepairsRepository.create(
            this.buildIRepairsEntity({ ...createDto }, { repairs, hDuration, cCoast, brRefi }),
        );
    }

    /**
     * Updates an interior repairs entity with the provided partial data.
     * Validates input presence, extracts supported repair fields, builds an update payload from defined values,
     * and persists the changes for the targeted interior repairs record.
     */
    async updateIRepairs(
        result: IRepairsEntity,
        itemized?: Partial<{
            roof: number;
            landscaping: number;
            concierge: number;
            garage: number;
            bathrooms: number;
        }>,
    ) {
        if (!itemized || Object.keys(itemized).length === 0)
            return {
                message: 'No updates provided for interior repairs update',
            };

        const otherFields = ['roof', 'landscaping', 'concierge', 'garage', 'bathrooms'] as const;

        const updatePayload: Partial<IRepairsEntity> = {};

        otherFields.forEach((field) => {
            if (itemized[field] !== undefined) updatePayload[field] = itemized[field] as any;
        });

        return await this.aBuilderService.iRepairsRepository.update(
            { id: result.id },
            updatePayload,
        );
    }

    /**
     * Deletes an individual internal repair entity.
     * Removes the IRepairs record from persistence based on its identifier.
     */
    async deleteIRepair(result: IRepairsEntity) {
        return await this.aBuilderService.iRepairsRepository.delete({ id: result.id });
    }
}
