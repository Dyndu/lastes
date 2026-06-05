import { Injectable } from '@nestjs/common';
import { PropertyEntity } from '../entities/property.entity';

@Injectable()
export class TransformPropertyEntityService {
    /**
     * Service responsible for transforming properties and related entities to ui view
     */

    createPropertyEntity = () => ['createdBy'];

    /**
     * Transforms a PropertyEntity into a simplified property object containing only essential fields.
     * Maps the original entities to a structured format with id, location details (city, state, zipCode),
     * formatted address, creation timestamp, and last update timestamp as lastUsed.
     */
    transformProperty = (p: PropertyEntity) => ({
        id: p.id,
        city: p.city,
        state: p.state,
        zipCode: p.zipCode,
        address: p.formattedAddress,
        createdAt: p.createdAt,
        lastUsed: p.updatedAt,
    });

    /**
     * Transforms an array of PropertyEntity objects by applying the transformProperty method to each item.
     * Returns a collection of simplified property objects containing only essential fields.
     */
    transformProperties = (ps: PropertyEntity[]) => ps.map((p) => this.transformProperty(p));
}
