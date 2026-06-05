import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ErrorHandlerService } from '../../../common/response';
import { OtherUtils } from '../../../utils/services/tools';
import { PreAnalysisService } from './pre-analysis.service';
import { CurrentUserInterface } from '../../../interface';
import { AnalysisCreateDto } from '../dto/analysis-create.dto';
import { UserEntity } from '../../users/entities/user.entity';
import { UsersService } from '../../users/services';
import { ModulesService } from '../../modules/services';
import { PropertiesService } from '../../properties/services';
import { AnalysisRepository, AnalysisUsageRepository } from '../repositories';
import { CacheService } from '../../../helpers/cache/cache.service';
import { TransformAEntityService } from './transform-a-entity.service';
import { AnalysisEntity } from '../entities';
import { AnalysisUsageService } from './analysis-usage.service';
import { ModuleLabelEnum, UsagePeriod } from '../../../common/enum';
import { ABuilderService } from '../../a-builder/services';
import { RCalculatorService } from '../../r-calculator/services';
import { AnalysisCloneService } from './analysis-clone.service';
import { AnalysisDuplicateDto } from '../dto/analysis-duplicate.dto';
import { RAnalysisService } from '../../r-analysis/services';
import { FFlipService } from '../../fix-flip/services';
import { CFinancingService } from '../../creative-financing/services';
import { WholesaleService } from '../../wholesale/services';
import { IStrategyService } from '../../i-strategy/services';
import { BrAnalyzerService } from '../../br-analyzer/services';

@Injectable()
export class AnalysisService {
    /**
     * Service responsible for handling all global analysis operations
     */

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        @Inject(forwardRef(() => PreAnalysisService))
        readonly preAnalysisService: PreAnalysisService,
        @Inject(forwardRef(() => AnalysisUsageService))
        readonly analysisUsageService: AnalysisUsageService,
        @Inject(forwardRef(() => AnalysisCloneService))
        readonly analysisCloneService: AnalysisCloneService,
        @Inject(forwardRef(() => TransformAEntityService))
        readonly transformAEntityService: TransformAEntityService,
        @Inject(forwardRef(() => RAnalysisService))
        readonly rAnalysisService: RAnalysisService,
        @Inject(forwardRef(() => FFlipService))
        readonly fFlipService: FFlipService,
        @Inject(forwardRef(() => CFinancingService))
        readonly cFinancingService: CFinancingService,
        @Inject(forwardRef(() => WholesaleService))
        readonly wholesaleService: WholesaleService,
        @Inject(forwardRef(() => IStrategyService))
        readonly iStrategyService: IStrategyService,
        @Inject(forwardRef(() => BrAnalyzerService))
        readonly brAnalyzerService: BrAnalyzerService,
        readonly analysisRepo: AnalysisRepository,
        readonly analysisUsageRepo: AnalysisUsageRepository,
        readonly userService: UsersService,
        readonly aBuilderService: ABuilderService,
        readonly moduleService: ModulesService,
        readonly propertyService: PropertiesService,
        readonly cacheService: CacheService,
        readonly rCalculatorService: RCalculatorService,
        readonly errorHandler: ErrorHandlerService,
        readonly otherUtils: OtherUtils,
    ) {}

    /**
     * Asynchronously retrieves a UserEntity by its ID using the user service.
     */
    async getUser(id: string): Promise<UserEntity> {
        return await this.userService.preUserService.retrieveUserByCriteria({
            id,
        });
    }

    /**
     * Asynchronously retrieves paginated analyses for a user and module, utilizing caching for performance.
     * Generates a cache key, attempts to fetch paginated results from cache, and falls back to querying the database
     * if necessary. Transforms the retrieved AnalysisEntity objects into simplified analysis objects.
     * Logs the retrieval process and returns the paginated, transformed results.
     */
    async getUserModuleAnalyses(
        userId: string,
        moduleId: string,
        page: number,
        limit: number,
        searchTerm?: string,
    ) {
        this.logger.info(`Retrieving analysis for user ${userId}`);

        const baseKey = this.cacheService.generateRedisKey(`analysis-${userId}-${moduleId}`, {
            ...(searchTerm ? { search: searchTerm.toLowerCase() } : {}),
        });

        return await this.cacheService.retrieveGenericPaginated(
            baseKey,
            page,
            limit,
            {
                userId,
                moduleId,
                searchTerm,
            },
            (offset: number, limit: number) =>
                this.preAnalysisService.retrieveUserAnalysis(
                    { moduleId, userId, searchTerm },
                    offset,
                    limit,
                ),
            (items: AnalysisEntity[]) => this.transformAEntityService.transformAs(items),
        );
    }

    /**
     * Retrieves analysis details for a given user and analysis ID.
     * Fetches the analysis entity using ownership criteria, logs the operation,
     * and returns a minimal structured payload containing core metadata fields.
     */
    async analysisDetails(user: CurrentUserInterface, id: string) {
        this.logger.info(`Retrieve an analysis with id: ${id} details by user ${user.id}`);

        const analysis = await this.preAnalysisService.retrieveAnalyseByCriteria({
            createdBy: { id: user.id },
            id,
        });

        return {
            id,
            description: analysis.description,
            createdAt: analysis.createdAt,
        };
    }

    /**
     * Updates an analysis entity for a given user and analysis ID.
     * Verifies ownership by retrieving the analysis, conditionally updates the description when provided,
     * and persists changes before returning a success message.
     */
    async updateAnalysis(user: CurrentUserInterface, id: string, description?: string) {
        this.logger.info(`Update an analysis with id: ${id} details by user ${user.id}`);

        const analysis = await this.preAnalysisService.retrieveAnalyseByCriteria(
            {
                createdBy: { id: user.id },
                id,
            },
            ['module'],
        );

        if (description)
            await this.analysisRepo.update(
                { id: analysis.id },
                { description: description.trim() },
            );
        await this.preAnalysisService.invalidateUserACache(user.id, analysis.module.id);
        return { message: 'Analysis updated successfully.' };
    }

    /**
     * Creates a new analysis for the current user with the provided data.
     * Logs the creation request, retrieves the user and active module in parallel,
     * fetches or creates the property, persists the analysis entity,
     * creates an associated analysis usage record, invalidates the user's analysis cache,
     * and returns a success message.
     */
    async createAnalysis(user: CurrentUserInterface, dto: AnalysisCreateDto) {
        this.logger.info(
            `Creating a new analysis for user ${user.id} with data: ${JSON.stringify(dto)}`,
        );
        const [createdBy, module] = await Promise.all([
            this.getUser(user.id),
            this.moduleService.preModuleService.findModuleByCriteria({
                id: dto.moduleId,
                isActive: true,
            }),
        ]);

        const property = await this.propertyService.getOrCreateProperty(createdBy, dto.propertyId);

        const result = await this.analysisRepo.create(
            this.preAnalysisService.buildAnalysisEntity(
                module,
                property,
                createdBy,
                dto.description,
            ),
        );

        await this.analysisUsageService.createAUsage(result);
        await this.moduleService.preModuleService.updateModuleDetails(module, {
            usageCount: module.usageCount + 1,
        });

        await this.preAnalysisService.invalidateUserACache(createdBy.id, module.id);
        return { message: 'Analysis created successfully.' };
    }

    /**
     * Retrieves total usage statistics for the specified period.
     * Delegates to the analysis usage service to compute and return the aggregated usage data.
     */
    async getTotalUsageStats(period: UsagePeriod) {
        this.logger.info(
            `Retrieve based on period ${JSON.stringify(period)} analysis total usage stats`,
        );
        return await this.analysisUsageService.getTotalUsage(period);
    }

    /**
     * Retrieves module analysis usage repartition for the specified period.
     * Logs the request with the period parameter and delegates to the analysis usage service
     * to compute and return the distribution of usage across different modules.
     */
    async getUsageRepartition(period: UsagePeriod) {
        this.logger.info(
            `Retrieve based on period ${JSON.stringify(period)} module analysis usage repartition`,
        );
        return await this.analysisUsageService.getUsageRepartition(period);
    }

    /**
     * Saves analysis usage record for the specified analysis ID.
     * Logs the operation, retrieves the analysis with its module relation,
     * creates an analysis usage entity, increments the module's usage count by one,
     * and returns a success message.
     */
    async saveUsage(id: string) {
        this.logger.info(`Save analysis with id${id} module usage into the database`);

        const data = await this.preAnalysisService.retrieveAnalyseByCriteria({ id }, [
            'module',
            'createdBy',
        ]);
        await this.analysisUsageService.createAUsage(data);
        await this.moduleService.preModuleService.updateModuleDetails(data.module, {
            usageCount: data.module.usageCount + 1,
        });

        await this.analysisRepo.update({ id }, { updatedAt: new Date() });
        await this.preAnalysisService.invalidateUserACache(data.createdBy.id, data.module.id);
        return { message: 'Analysis usage saved successfully.' };
    }

    async duplicateAnalysis(user: CurrentUserInterface, dto: AnalysisDuplicateDto) {
        this.logger.info(`Duplicating analysis ${dto.analysisId} for user ${user.id}`);

        const createdBy = await this.getUser(user.id);

        const { analysis, module, property } =
            await this.analysisCloneService.resolveAnalysisDuplicateTargets(createdBy, dto);

        const newAnalysis = await this.analysisRepo.create(
            this.preAnalysisService.buildAnalysisEntity(module, property, createdBy, dto.description),
        );

        const newModuleEntity = await this.analysisCloneService.createModuleEntity(
            module.label as ModuleLabelEnum,
            newAnalysis,
        );

        await this.analysisCloneService.duplicateBuilder(analysis, newModuleEntity);

        await Promise.all([
            this.analysisUsageService.createAUsage(newAnalysis),
            this.preAnalysisService.invalidateUserACache(createdBy.id, module.id),
        ]);

        return { message: 'Analysis duplicated successfully.' };
    }
}
