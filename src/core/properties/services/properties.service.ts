import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { PropertiesRepository } from '../properties.repository';
import { ErrorHandlerService } from '../../../common/response';
import { CacheService } from '../../../helpers/cache/cache.service';
import { PropertyEntity } from '../entities/property.entity';
import { PrePropertiesService } from './pre-properties.service';
import { UsersService } from '../../users/services';
import { OtherUtils } from '../../../utils/services/tools';
import { RentalService } from '../../../helpers/rentalcastcash/rental.service';
import { TransformPropertyEntityService } from './transform-property-entity.service';
import { UserEntity } from '../../users/entities/user.entity';
import { CurrentUserInterface } from '../../../interface';

@Injectable()
export class PropertiesService {
    /**
     * Service responsible for handling properties main operations
     */

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        @Inject(forwardRef(() => PrePropertiesService))
        readonly prePropertiesService: PrePropertiesService,
        @Inject(forwardRef(() => TransformPropertyEntityService))
        readonly transformPService: TransformPropertyEntityService,
        readonly propertiesRepo: PropertiesRepository,
        readonly errorHandler: ErrorHandlerService,
        readonly otherUtils: OtherUtils,
        readonly rentCastService: RentalService,
        readonly cacheService: CacheService,
        readonly userService: UsersService,
    ) {}

    /**
     * Retrieves paginated properties for a specific user, with optional search filtering.
     * Uses caching for performance, logs the action, and transforms the results for output.
     */
    async getUserProperties(userId: string, page: number, limit: number, searchTerm?: string) {
        this.logger.info(`Retrieving properties for user ${userId}`);

        const baseKey = this.cacheService.generateRedisKey(`properties-${userId}`, {
            ...(searchTerm ? { search: searchTerm.toLowerCase() } : {}),
        });

        return await this.cacheService.retrieveGenericPaginated(
            baseKey,
            page,
            limit,
            {
                userId,
                searchTerm,
            },
            (offset: number, limit: number) =>
                this.prePropertiesService.retrieveUserProperties(userId, offset, limit, searchTerm),
            (items: PropertyEntity[]) => this.transformPService.transformProperties(items),
        );
    }

    /**
     * Retrieves detailed information for a specific property owned by the given user.
     * Validates ownership by fetching the user and filtering the property by creator and ID,
     * then returns a subset of property attributes including address, type, size, and year built.
     */
    async getPropertyDetails(user: CurrentUserInterface, id: string) {
        this.logger.info(`Retrieve a property with id: ${id} details`);

        const createdBy = await this.userService.preUserService.retrieveUserByCriteria({
            id: user.id,
        });
        const property = await this.prePropertiesService.getPropertyByCriteria({
            createdBy: { id: createdBy.id },
            id,
        });

        return {
            address: property.formattedAddress,
            propertyType: property.propertyType,
            squareFootage: property.squareFootage,
            yearBuilt: property.yearBuilt,
        };
    }

    /**
     * Asynchronously retrieves or creates a property for a user by its ID or formatted address.
     * Logs the process, checks for an existing property by ID or address, and if not found,
     * creates a new PropertyEntity using RentCast data. Invalidates the user's property cache
     * and returns the property.
     */
    async getOrCreateProperty(createdBy: UserEntity, id: string) {
        const userId = createdBy.id;
        this.logger.info(`[Property] Start getOrCreate`, {
            userId,
            propertyId: id,
        });

        let property: PropertyEntity | null;

        property = await this.propertiesRepo.findOne({
            where: { id, createdBy: { id: userId } },
            relations: this.transformPService.createPropertyEntity(),
        });

        if (property) return property;

        const rentCastData = await this.rentCastService.getProperty(id);

        property = await this.propertiesRepo.findOne({
            where: { formattedAddress: rentCastData.formattedAddress, createdBy: { id: userId } },
            relations: this.transformPService.createPropertyEntity(),
        });

        if (property) return property;

        property = await this.propertiesRepo.create(
            this.prePropertiesService.buildPropertyEntity(rentCastData, createdBy),
        );

        await this.prePropertiesService.invalidatePCache(userId);

        return property;
    }
}
