import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { AnalysisEntity } from '../entities';
import { ModuleEntity } from '../../modules/entities';
import { PropertyEntity } from '../../properties/entities/property.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Injectable()
export class PreAnalysisService {
    /**
     * Service responsible for handling pre analysis operations
     */

    constructor(
        @Inject(forwardRef(() => AnalysisService))
        private readonly analysisService: AnalysisService,
    ) {}

    /**
     * Builds a base query for analysis records, applying filters for module ID, user ID, and an optional search term.
     * Joins with related entities (createdBy, module, property) and filters out deleted analyses.
     * Matches the search term against property address, description, city, state, or zip code in a case-insensitive manner.
     */
    buildAnalysisBaseQuery(filterItems: { moduleId: string; userId: string; searchTerm?: string }) {
        const { moduleId, userId, searchTerm } = filterItems;

        const query = this.analysisService.analysisRepo
            .getRepository()
            .createQueryBuilder('an')
            .leftJoin('an.createdBy', 'createdBy')
            .leftJoin('an.module', 'module')
            .leftJoinAndSelect('an.property', 'property')
            .where('an.deleted = false')
            .andWhere('createdBy.id = :userId', { userId })
            .andWhere('module.id = :moduleId', { moduleId });

        if (searchTerm) {
            const normalized = `%${searchTerm.trim().toLowerCase()}%`;
            query.andWhere(
                `(LOWER(property.formattedAddress) LIKE :searchTerm
             OR LOWER(an.description) LIKE :searchTerm
             OR LOWER(property.city) LIKE :searchTerm
             OR LOWER(property.state) LIKE :searchTerm
             OR LOWER(property.zipCode) LIKE :searchTerm)`,
                { searchTerm: normalized },
            );
        }

        return query;
    }

    /**
     * Constructs and returns a new AnalysisEntity instance, associating it with a module, property, and user.
     * Optionally includes a description for the analysis.
     */
    buildAnalysisEntity(
        module: ModuleEntity,
        property: PropertyEntity,
        createdBy: UserEntity,
        description?: string,
    ) {
        const result = new AnalysisEntity();
        result.module = module;
        result.createdBy = createdBy;
        result.property = property;
        result.description = description;

        return result;
    }

    /**
     * Retrieves a paginated list of user analyses based on module ID, user ID, and an optional search term.
     * Orders results by the property's last update date in descending order and applies offset/limit for pagination.
     */
    retrieveUserAnalysis(
        filterItems: {
            moduleId: string;
            userId: string;
            searchTerm?: string;
        },
        offset: number,
        limit: number,
    ) {
        const queryBuilder = this.buildAnalysisBaseQuery(filterItems);
        queryBuilder.orderBy('an.updatedAt', 'DESC').skip(offset).take(limit);

        return queryBuilder;
    }

    /**
     * Asynchronously fetches an analysis entities using the specified criteria.
     * Validates the existence of the analysis and throws an error if not found.
     * Optionally includes related entities based on the provided relations.
     */
    async retrieveAnalyseByCriteria(
        criteria: Record<string, any>,
        relation?: string[],
    ): Promise<AnalysisEntity> {
        const entry = this.analysisService.otherUtils.formatCriteria(criteria);
        this.analysisService.logger.info(`Find an analyse by criteria: ${entry}`);

        const isDataExist = await this.analysisService.analysisRepo.findActiveOne(
            this.analysisService.analysisRepo,
            criteria,
            relation,
        );

        if (!isDataExist)
            this.analysisService.errorHandler.notFound(
                `Add not found with criteria: ${entry}`,
                `Add not found`,
            );

        return isDataExist;
    }

    /**
     * Asynchronously invalidates the analysis cache for a specific user and module.
     * Deletes all cache keys matching the base pattern `analysis-${userId}-${moduleId}`.
     */
    async invalidateUserACache(userId: string, moduleId: string) {
        await this.analysisService.cacheService.deleteKeysByBase(`analysis-${userId}-${moduleId}`);
    }
}
