import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ErrorHandlerService } from '../../../common/response';
import { OtherUtils } from '../../../utils/services/tools';
import {
    BAnalysisRepository,
    RoomCategoryRepository,
    RoomExpenseItemRepository,
    RoomSectionRepository,
} from '../repositories';
import { RoomExpenseItemService } from './room-expense-item.service';
import { RoomSectionService } from './room-section.service';
import { RoomCategoryService } from './room-category.service';
import { RCalculatorEntity } from '../../r-calculator/entity/r-calculator.entity';
import { BAnalysisEntity } from '../entities';
import { TransformBAEntitiesService } from './transform-b-a-entities.service';

@Injectable()
export class BAnalysisService {
    /**
     * Service responsible for handling rehab calculator analysis builder operations
     */

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        @Inject(forwardRef(() => RoomCategoryService))
        readonly roomCategoryService: RoomCategoryService,
        @Inject(forwardRef(() => RoomSectionService))
        readonly roomSectionService: RoomSectionService,
        @Inject(forwardRef(() => RoomExpenseItemService))
        readonly roomExpenseItemService: RoomExpenseItemService,
        @Inject(forwardRef(() => TransformBAEntitiesService))
        readonly transformBAEntitiesService: TransformBAEntitiesService,
        readonly bAnalysisRepo: BAnalysisRepository,
        readonly roomCategoryRepo: RoomCategoryRepository,
        readonly roomSectionRepo: RoomSectionRepository,
        readonly roomExpenseItemRepo: RoomExpenseItemRepository,
        readonly errorHandler: ErrorHandlerService,
        readonly otherUtils: OtherUtils,
    ) {}

    /**
     * Constructs and returns a new BAnalysisEntity from the provided required fields.
     * Assigns the optional room calculator entities to a new BAnalysisEntity instance.
     */
    buildBAnalysis(required: { rCalculator?: RCalculatorEntity }): BAnalysisEntity {
        const result = new BAnalysisEntity();
        Object.assign(result, required);
        return result;
    }

    /**
     * Creates a B analysis entity associated with the provided rental calculator.
     * Checks for an existing non-deleted analysis and returns it if found; otherwise builds and persists a new entity.
     * Ensures a single active B analysis is maintained per rental calculator.
     */
    async createBAnalysis(rCalculator: RCalculatorEntity) {
        const existing = await this.bAnalysisRepo.findOne({
            where: { rCalculator: { id: rCalculator.id }, deleted: false },
        });
        return existing ?? (await this.bAnalysisRepo.create(this.buildBAnalysis({ rCalculator })));
    }

    /**
     * Retrieves a BAnalysisEntity based on the provided criteria and optional relations.
     * Formats and logs the criteria, checks for the existence of an active analysis,
     * and throws a not-found error if no matching analysis is found.
     */
    async retrieveBAnalysisByCriteria(
        criteria: Record<string, any>,
        relations?: string[],
    ): Promise<BAnalysisEntity> {
        const entries = this.otherUtils.formatCriteria(criteria);
        this.logger.info(`Find rehab calculator analysis builder by ${entries}`);

        const isDataExist = await this.bAnalysisRepo.findActiveOne(
            this.bAnalysisRepo,
            criteria,
            relations,
        );

        if (!isDataExist)
            this.errorHandler.notFound(`Analysis not found with ${entries}`, `Analysis not found`);

        return isDataExist;
    }
}
