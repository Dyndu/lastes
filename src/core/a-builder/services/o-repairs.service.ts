import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ABuilderService } from './a-builder.service';
import { BrRefinanceEntity, CCoastEntity, ORepairsEntity, RepairsEntity } from '../entities';
import { RItemDto } from '../dto';

@Injectable()
export class ORepairsService {
    /**
     * Service responsible for handling others repairs
     */

    constructor(
        @Inject(forwardRef(() => ABuilderService))
        private readonly aBuilderService: ABuilderService,
    ) {}

    /**
     * Builds another repairs entity from required and optional input data.
     * Instantiates a new entity, assigns repair-related fields and optional relationships,
     * and returns the constructed exterior repairs instance.
     */
    buildORepairsEntity(
        required: {
            roof: number;
            landscaping: number;
            concierge: number;
            garage: number;
            bathrooms: number;
        },
        optional: {
            repairs?: RepairsEntity;
            cCoast?: CCoastEntity;
            brRefi?: BrRefinanceEntity;
        },
    ): ORepairsEntity {
        const result = new ORepairsEntity();
        Object.assign(result, required, optional);
        return result;
    }

    /**
     * Creates another repairs entity from the provided input data and associations.
     * Builds the entity with repair values and optional related entities,
     * persists it through the repository, and returns the created instance.
     */
    async createORepair(
        createDto: RItemDto,
        repairs?: RepairsEntity,
        cCoast?: CCoastEntity,
        brRefi?: BrRefinanceEntity,
    ): Promise<ORepairsEntity> {
        return await this.aBuilderService.oRepairsRepository.create(
            this.buildORepairsEntity({ ...createDto }, { repairs, cCoast, brRefi }),
        );
    }

    /**
     * Updates another repairs entity with the provided partial data.
     * Validates input presence, extracts supported repair fields, builds an update payload from defined values,
     * and persists the changes for the targeted exterior repairs record.
     */
    async updateORepairs(
        result: ORepairsEntity,
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
                message: 'No updates provided for other repairs update',
            };

        const otherFields = ['roof', 'landscaping', 'concierge', 'garage', 'bathrooms'] as const;

        const updatePayload: Partial<ORepairsEntity> = {};

        otherFields.forEach((field) => {
            if (itemized[field] !== undefined) updatePayload[field] = itemized[field] as any;
        });

        return await this.aBuilderService.oRepairsRepository.update(
            { id: result.id },
            updatePayload,
        );
    }

    /**
     * Deletes an individual other repair entity.
     * Removes the IRepairs record from persistence based on its identifier.
     */
    async deleteORepair(result: ORepairsEntity) {
        return await this.aBuilderService.oRepairsRepository.delete({ id: result.id });
    }
}
