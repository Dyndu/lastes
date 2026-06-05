import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';
import { OtherUtils } from '../../utils/services/tools';
import { CategoriesRepository } from './categories.repository';
import { CategoryEntity } from './entities/category.entity';

@Injectable()
export class CategoriesService {
    /**
     * Service responsible for handling guides categories operation
     */

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        private readonly categoriesRepository: CategoriesRepository,
        readonly envConfigService: EnvConfigService,
        readonly otherUtils: OtherUtils,
        readonly errorHandler: ErrorHandlerService,
    ) {}

    /**
     * Transforms a CategoryEntity object into a simplified object containing only its ID and label.
     */
    transform = (c: CategoryEntity) => ({
        id: c.id,
        label: c.label,
    });

    /**
     * Transforms an array of CategoryEntity objects into an array of simplified objects,
     * each containing only the ID and label of the category.
     */
    transformCats = (cs: CategoryEntity[]) => cs.map((c) => this.transform(c));

    /**
     * Asynchronously retrieves all non-deleted categories from the repository.
     * Logs the retrieval attempt, checks if categories exist, and returns them in a simplified format.
     * Returns an empty array if no categories are found.
     */
    async allCategories() {
        this.logger.info(`Retrieve all permissions`);

        const allCats = await this.categoriesRepository.find({
            where: { deleted: false },
        });

        if (allCats.length === 0) return [];
        return this.transformCats(allCats);
    }

    /**
     * Asynchronously retrieves a category by the specified criteria and optional relations.
     * Formats the criteria for logging, checks if the category exists and is active,
     * and throws a "not found" error if the category does not exist.
     * Returns the found CategoryEntity.
     */
    async retrieveCategoryByCriteria(
        criteria: Record<string, any>,
        relations?: string[],
    ): Promise<CategoryEntity> {
        const entry = this.otherUtils.formatCriteria(criteria);
        this.logger.info(`Find category by criteria: ${entry}`);

        const isDataExist = await this.categoriesRepository.findActiveOne(
            this.categoriesRepository,
            criteria,
            relations,
        );

        if (!isDataExist)
            this.errorHandler.notFound(
                `Category not found with criteria: ${entry}`,
                `Category not found`,
            );

        return isDataExist;
    }
}
