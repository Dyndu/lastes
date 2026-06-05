import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ABuilderService } from './a-builder.service';
import { BrRefinanceEntity, CCoastEntity, ERepairsEntity, RepairsEntity } from '../entities';
import { RItemDto } from '../dto';

@Injectable()
export class ERepairsService {
    /**
     * Service responsible for handling exterior repairs
     */

    constructor(
        @Inject(forwardRef(() => ABuilderService))
        private readonly aBuilderService: ABuilderService,
    ) {}

    /**
     * Builds an exterior repairs entity from required and optional input data.
     * Instantiates a new entity, assigns repair-related fields and optional relationships,
     * and returns the constructed exterior repairs instance.
     */
    buildERepairsEntity(
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
    ): ERepairsEntity {
        const result = new ERepairsEntity();
        Object.assign(result, required, optional);
        return result;
    }

    /**
     * Creates an exterior repairs entity from the provided input data and associations.
     * Builds the entity with repair values and optional related entities,
     * persists it through the repository, and returns the created instance.
     */
    async createERepair(
        createDto: RItemDto,
        repairs?: RepairsEntity,
        cCoast?: CCoastEntity,
        brRefi?: BrRefinanceEntity,
    ): Promise<ERepairsEntity> {
        return await this.aBuilderService.eRepairsRepository.create(
            this.buildERepairsEntity({ ...createDto }, { repairs, cCoast, brRefi }),
        );
    }

    /**
     * Updates an exterior repairs entity with the provided partial data.
     * Validates input presence, extracts supported repair fields, builds an update payload from defined values,
     * and persists the changes for the targeted exterior repairs record.
     */
    async updateERepairs(
        result: ERepairsEntity,
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
                message: 'No updates provided for exterior repairs update',
            };

        const otherFields = ['roof', 'landscaping', 'concierge', 'garage', 'bathrooms'] as const;

        const updatePayload: Partial<ERepairsEntity> = {};

        otherFields.forEach((field) => {
            if (itemized[field] !== undefined) updatePayload[field] = itemized[field] as any;
        });

        return await this.aBuilderService.eRepairsRepository.update(
            { id: result.id },
            updatePayload,
        );
    }

    /**
     * Deletes an individual external repair entity.
     * Removes the IRepairs record from persistence based on its identifier.
     */
    async deleteERepair(result: ERepairsEntity) {
        return await this.aBuilderService.eRepairsRepository.delete({ id: result.id });
    }
}
