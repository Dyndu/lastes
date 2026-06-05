import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import {
    PDetailsRepository,
    UnitsRepository,
    ADetailsRepository,
    AdItemizedRepository,
    RepairsRepository,
    IRepairsRepository,
    ERepairsRepository,
    ORepairsRepository,
    FExpensesRepository,
    ABuilderRepository,
    SaleRepository,
    HCoastRepository,
    HCoastItemizedRepository,
    HDurationRepository,
    RefinanceRepository,
    RefinanceItemRepository,
    RDurationRepository,
    CCoastRepository,
    BrRefinanceRepository,
} from '../repositories';
import { ErrorHandlerService } from '../../../common/response';
import { OtherUtils } from '../../../utils/services/tools';
import { UnitsService } from './units.service';
import { AdItemizedService } from './ad-itemized.service';
import { ERepairsService } from './e-repairs.service';
import { IRepairsService } from './i-repairs.service';
import { ORepairsService } from './o-repairs.service';
import { ABuilderEntity } from '../entities';
import { RAnalysisEntity } from '../../r-analysis/entities/r-analysis.entity';
import { PDetailsService } from './p-details.service';
import { ADetailsService } from './a-details.service';
import { RepairsService } from './repairs.service';
import { FExpensesService } from './f-expenses.service';
import { TransformABuilderService } from './transform-aBuilder.service';
import { SaleService } from './sale.service';
import { FFlipEntity } from '../../fix-flip/entity/f-flip.entity';
import { CFinancingEntity } from '../../creative-financing/entities/c-financing.entity';
import { HCoastService } from './h-coast.service';
import { HCoastItemizedService } from './h-coast-itemized.service';
import { HDurationService } from './h-duration.service';
import { WholesaleEntity } from '../../wholesale/entities/wholesale.entity';
import { RefinanceItemService } from './refinance-item.service';
import { RefinanceService } from './refinance.service';
import { IStrategyEntity } from '../../i-strategy/entities/i-strategy.entity';
import { RDurationService } from './r-duration.service';
import { CCoastService } from './c-coast.service';
import { BrAnalyzerEntity } from '../../br-analyzer/entities/br-analyzer.entity';
import { BrRefinanceService } from './br-refinance.service';

@Injectable()
export class ABuilderService {
    /**
     * Service responsible for handling analysis builder operations
     */

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        @Inject(forwardRef(() => PDetailsService))
        readonly pDetailsService: PDetailsService,
        @Inject(forwardRef(() => UnitsService))
        readonly unitsService: UnitsService,
        @Inject(forwardRef(() => ADetailsService))
        readonly aDetailsService: ADetailsService,
        @Inject(forwardRef(() => AdItemizedService))
        readonly adItemizedService: AdItemizedService,
        @Inject(forwardRef(() => RepairsService))
        readonly repairsService: RepairsService,
        @Inject(forwardRef(() => ERepairsService))
        readonly eRepairsService: ERepairsService,
        @Inject(forwardRef(() => IRepairsService))
        readonly iRepairsService: IRepairsService,
        @Inject(forwardRef(() => ORepairsService))
        readonly oRepairsService: ORepairsService,
        @Inject(forwardRef(() => SaleService))
        readonly saleService: SaleService,
        @Inject(forwardRef(() => FExpensesService))
        readonly fExpensesService: FExpensesService,
        @Inject(forwardRef(() => HCoastService))
        readonly hCoastService: HCoastService,
        @Inject(forwardRef(() => HCoastItemizedService))
        readonly hCoastItemizedService: HCoastItemizedService,
        @Inject(forwardRef(() => HDurationService))
        readonly hDurationService: HDurationService,
        @Inject(forwardRef(() => RefinanceService))
        readonly refinanceService: RefinanceService,
        @Inject(forwardRef(() => RefinanceItemService))
        readonly refinanceItemService: RefinanceItemService,
        @Inject(forwardRef(() => RDurationService))
        readonly rDurationService: RDurationService,
        @Inject(forwardRef(() => CCoastService))
        readonly cCoastService: CCoastService,
        @Inject(forwardRef(() => BrRefinanceService))
        readonly brRefinanceService: BrRefinanceService,
        @Inject(forwardRef(() => TransformABuilderService))
        readonly transformABuilderService: TransformABuilderService,
        readonly errorHandler: ErrorHandlerService,
        readonly otherUtils: OtherUtils,
        readonly aBuilderRepository: ABuilderRepository,
        readonly pDetailsRepository: PDetailsRepository,
        readonly unitRepository: UnitsRepository,
        readonly aDetailsRepository: ADetailsRepository,
        readonly adItemizedRepo: AdItemizedRepository,
        readonly repairsRepository: RepairsRepository,
        readonly eRepairsRepository: ERepairsRepository,
        readonly iRepairsRepository: IRepairsRepository,
        readonly oRepairsRepository: ORepairsRepository,
        readonly brRefinanceRepository: BrRefinanceRepository,
        readonly fExpensesRepository: FExpensesRepository,
        readonly saleRepository: SaleRepository,
        readonly rDurationRepository: RDurationRepository,
        readonly hDurationRepository: HDurationRepository,
        readonly hCoastRepository: HCoastRepository,
        readonly cCoastRepository: CCoastRepository,
        readonly hCoastItemizedRepo: HCoastItemizedRepository,
        readonly refinanceRepository: RefinanceRepository,
        readonly refiItemRepository: RefinanceItemRepository,
    ) {}

    /**
     * Creates a new ABuilderEntity instance and assigns the provided optional properties.
     * If an rAnalysis entities is supplied, it will be associated with the new builder entities.
     * Returns the newly constructed entities without persisting it to the database.
     */
    buildABuilderEntity(optional: {
        rAnalysis?: RAnalysisEntity;
        fFlip?: FFlipEntity;
        cFinancing?: CFinancingEntity;
        wholesale?: WholesaleEntity;
        iStrategy?: IStrategyEntity;
        brAnalyzer?: BrAnalyzerEntity;
    }): ABuilderEntity {
        const result = new ABuilderEntity();
        Object.assign(result, optional);
        return result;
    }

    /**
     * Creates and persists a new ABuilderEntity, optionally associating it with an existing RAnalysisEntity.
     * Uses the buildABuilderEntity method to construct the entities with the provided analysis relationship.
     * Returns the newly created and saved builder entities from the repository.
     */
    async createABuilder(
        rAnalysis?: RAnalysisEntity,
        fFlip?: FFlipEntity,
        cFinancing?: CFinancingEntity,
        wholesale?: WholesaleEntity,
        iStrategy?: IStrategyEntity,
        brAnalyzer?: BrAnalyzerEntity,
    ): Promise<ABuilderEntity> {
        return await this.aBuilderRepository.create(
            this.buildABuilderEntity({
                rAnalysis,
                fFlip,
                cFinancing,
                wholesale,
                iStrategy,
                brAnalyzer,
            }),
        );
    }

    /**
     * Retrieves an analysis builder entity based on the provided criteria and optional relations.
     * Formats the criteria for logging, queries the repository for an active record, and validates existence.
     * Throws a not found error if no matching entity is found; otherwise returns the retrieved entity.
     */
    async retrieveABuilderByCriteria(
        criteria: Record<string, any>,
        relation?: string[],
    ): Promise<ABuilderEntity> {
        const entry = this.otherUtils.formatCriteria(criteria);
        this.logger.info(`Find an analysis builder by criteria: ${entry}`);

        const isDataExist = await this.aBuilderRepository.findActiveOne(
            this.aBuilderRepository,
            criteria,
            relation,
        );

        if (!isDataExist)
            this.errorHandler.notFound(`Data not found with criteria: ${entry}`, `Data not found`);

        return isDataExist;
    }
}
