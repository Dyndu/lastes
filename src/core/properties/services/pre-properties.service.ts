import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertyEntity } from '../entities/property.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { ExistenceCheckModeEnum } from '../../../common/enum';

export type BasePropertyDto = {
    rentCastId: string;
    formattedAddress: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    stateFips: string;
    zipCode: string;
    county: string;
    countyFips: string;
    latitude: number;
    longitude: number;
    propertyType: string;
    bedrooms?: number;
    bathrooms?: number;
    squareFootage?: number;
    lotSize?: number;
    yearBuilt?: number;
};

@Injectable()
export class PrePropertiesService {
    /**
     * Service responsible for handling pre properties operations
     */

    constructor(
        @Inject(forwardRef(() => PropertiesService))
        private readonly propertiesService: PropertiesService,
    ) {}

    /**
     * Builds a base query for properties, applying optional filters for user ID and search term.
     * Joins with the user who created the property and filters out deleted properties.
     * Adds conditions for user ID and search term (matching city, state, or zip code) if provided.
     */
    basePropertyBaseQuery(filters: { userId?: string; searchTerm?: string }) {
        const { userId, searchTerm } = filters;

        const query = this.propertiesService.propertiesRepo
            .getRepository()
            .createQueryBuilder('property')
            .leftJoin('property.createdBy', 'createdBy')
            .where('property.deleted = false');

        if (userId) query.andWhere('createdBy.id = :userId', { userId });

        if (searchTerm) {
            const likePattern = `%${searchTerm}%`;

            query.andWhere(
                `(property.city ILIKE :searchTerm 
            OR property.state ILIKE :searchTerm 
            OR property.zipCode ILIKE :searchTerm)`,
                { searchTerm: likePattern },
            );
        }

        return query;
    }

    /**
     * Constructs a new PropertyEntity using required fields (label, createdBy) and optional fields (description).
     * Returns the initialized property entities.
     */
    buildPropertyEntity(dto: BasePropertyDto, createdBy: UserEntity): PropertyEntity {
        const property = new PropertyEntity();

        property.rentCastId = dto.rentCastId;
        property.formattedAddress = dto.formattedAddress;
        property.addressLine1 = dto.addressLine1;
        property.addressLine2 = dto.addressLine2;
        property.city = dto.city;
        property.state = dto.state;
        property.stateFips = dto.stateFips;
        property.zipCode = dto.zipCode;
        property.county = dto.county;
        property.countyFips = dto.countyFips;
        property.latitude = dto.latitude;
        property.longitude = dto.longitude;
        property.propertyType = dto.propertyType;
        property.bedrooms = dto.bedrooms;
        property.bathrooms = dto.bathrooms;
        property.squareFootage = dto.squareFootage;
        property.lotSize = dto.lotSize;
        property.yearBuilt = dto.yearBuilt;
        property.createdBy = createdBy;

        return property;
    }

    /**
     * Retrieves paginated properties for a specific user, with optional search filtering.
     * Uses the base query builder, applies pagination, and orders results by update date in descending order.
     */
    retrieveUserProperties(userId: string, offset: number, limit: number, searchTerm?: string) {
        const queryBuilder = this.basePropertyBaseQuery({ userId, searchTerm });

        queryBuilder.orderBy('property.updatedAt', 'DESC').skip(offset).take(limit);

        return queryBuilder;
    }

    /**
     * Retrieves a property by the specified criteria and optional relations.
     * Logs the search, checks for existence, and throws a "not found" error if the property does not exist.
     * Returns the found property entities.
     */
    async getPropertyByCriteria(
        criteria: Record<string, any>,
        relations?: string[],
    ): Promise<PropertyEntity> {
        const entry = this.propertiesService.otherUtils.formatCriteria(criteria);
        this.propertiesService.logger.info(`Find property by criteria: ${entry}`);

        const isPropertyExist = await this.propertiesService.propertiesRepo.findActiveOne(
            this.propertiesService.propertiesRepo,
            criteria,
            relations,
        );

        if (!isPropertyExist)
            this.propertiesService.errorHandler.notFound(
                `Property not found with criteria: ${entry}`,
                `Property not found`,
            );

        return isPropertyExist;
    }

    /**
     * Asserts that the specified user owns the given property.
     * Throws an error if the property's creator ID does not match the provided user ID.
     */
    assertPropertyOwnership(userId: string, p: PropertyEntity) {
        this.propertiesService.otherUtils.assertState(
            p.createdBy.id,
            userId,
            ExistenceCheckModeEnum.MUST_EXIST,
        );
    }

    /**
     * Asynchronously ensures the uniqueness of a property label (formatted address) for a user.
     * Validates that no other active property with the same label exists for the user, excluding the current property.
     * Throws a validation error if a duplicate is found.
     */
    async ensurePLabelUFUpdate(property: PropertyEntity, label: string) {
        const errors: Record<string, string> = {};

        await this.propertiesService.propertiesRepo.assertUniqueActive(
            this.propertiesService.propertiesRepo,
            errors,
            {
                formattedAddress: label,
                createdBy: { id: property.createdBy.id },
            },
            'Property',
            property.id,
        );

        if (Object.keys(errors).length > 0)
            throw this.propertiesService.errorHandler.validation(errors);
    }

    /**
     * Invalidates the cache for a user's properties.
     * Deletes all cache keys matching the base pattern for the specified user ID.
     */
    async invalidatePCache(userId: string) {
        await this.propertiesService.cacheService.deleteKeysByBase(`properties-${userId}`);
    }
}
