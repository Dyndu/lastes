import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { UserEntity } from '../../users/entities/user.entity';
import { AnalysisDuplicateDto } from '../dto/analysis-duplicate.dto';
import { ModuleEntity } from '../../modules/entities';
import { PropertyEntity } from '../../properties/entities/property.entity';
import { AnalysisService } from './analysis.service';
import { ModuleLabelEnum } from '../../../common/enum';
import { AnalysisEntity } from '../entities';
import { RAnalysisEntity } from '../../r-analysis/entities';
import { FFlipEntity } from '../../fix-flip/entity/f-flip.entity';
import { RCalculatorEntity } from '../../r-calculator/entity/r-calculator.entity';
import { CFinancingEntity } from '../../creative-financing/entities/c-financing.entity';
import { WholesaleEntity } from '../../wholesale/entities/wholesale.entity';
import { IStrategyEntity } from '../../i-strategy/entities/i-strategy.entity';
import { BrAnalyzerEntity } from '../../br-analyzer/entities/br-analyzer.entity';
import {
    ABuilderEntity,
    ADetailsEntity,
    AdItemizedEntity,
    BrRefinanceEntity,
    CCoastEntity,
    ERepairsEntity,
    FExpensesEntity,
    HCoastEntity,
    HCoastItemizedEntity,
    HDurationEntity,
    IRepairsEntity,
    ORepairsEntity,
    PDetailsEntity,
    RDurationEntity,
    RefinanceEntity,
    RefinanceItemEntity,
    RepairsEntity,
    SaleEntity,
    UnitEntity,
} from '../../a-builder/entities';
import {
    BAnalysisEntity,
    RoomCategoryEntity,
    RoomExpenseItemEntity,
    RoomSectionEntity,
} from '../../b-analysis/entities';

type ABuilderModuleKey =
    | 'rAnalysis'
    | 'fFlip'
    | 'cFinancing'
    | 'wholesale'
    | 'iStrategy'
    | 'brAnalyzer';
const ABSTRACT_FIELDS = ['id', 'createdAt', 'updatedAt', 'deleted'] as const;

@Injectable()
export class AnalysisCloneService {
    /**
     * Service responsible for cloning analysis
     */

    constructor(
        @Inject(forwardRef(() => AnalysisService))
        private readonly analysisService: AnalysisService,
    ) {}

    buildModuleEntity(
        moduleLabel: ModuleLabelEnum,
    ):
        | RAnalysisEntity
        | FFlipEntity
        | RCalculatorEntity
        | CFinancingEntity
        | WholesaleEntity
        | IStrategyEntity
        | BrAnalyzerEntity {
        switch (moduleLabel) {
            case ModuleLabelEnum.RENTAL_ANALYZER:
                return new RAnalysisEntity();

            case ModuleLabelEnum.FIX_FLIP_ANALYZER:
                return new FFlipEntity();

            case ModuleLabelEnum.REHAB_CALCULATOR:
                return new RCalculatorEntity();

            case ModuleLabelEnum.CREATIVE_FINANCING_ANALYZER:
                return new CFinancingEntity();

            case ModuleLabelEnum.WHOLESALE_ANALYZER:
                return new WholesaleEntity();

            case ModuleLabelEnum.INVESTMENT_STRATEGY_ANALYZER:
                return new IStrategyEntity();

            case ModuleLabelEnum.BRRRR_ANALYZER:
                return new BrAnalyzerEntity();

            default:
                this.analysisService.errorHandler.badRequest(
                    `No builder found for module: ${moduleLabel}`,
                    `Unsupported module`,
                );
        }
    }

    async createModuleEntity(
        label: ModuleLabelEnum,
        newAnalysis: AnalysisEntity,
    ): Promise<
        | RAnalysisEntity
        | FFlipEntity
        | RCalculatorEntity
        | CFinancingEntity
        | WholesaleEntity
        | IStrategyEntity
        | BrAnalyzerEntity
    > {
        switch (label) {
            case ModuleLabelEnum.RENTAL_ANALYZER:
                return this.analysisService.rAnalysisService.preRAnalysisService.createRAnalyzer(
                    newAnalysis,
                );

            case ModuleLabelEnum.FIX_FLIP_ANALYZER:
                return this.analysisService.fFlipService.preFFlipService.createFFlip(newAnalysis);

            case ModuleLabelEnum.REHAB_CALCULATOR:
                return this.analysisService.rCalculatorService.rCalculatorRepo.create(
                    this.analysisService.rCalculatorService.preRCalculatorService.buildRCalculator({
                        analysis: newAnalysis,
                    }),
                );

            case ModuleLabelEnum.CREATIVE_FINANCING_ANALYZER:
                return this.analysisService.cFinancingService.preCFinancingService.createCFinancing(
                    newAnalysis,
                );

            case ModuleLabelEnum.WHOLESALE_ANALYZER:
                return this.analysisService.wholesaleService.preWholesaleService.createWholesale(
                    newAnalysis,
                );

            case ModuleLabelEnum.INVESTMENT_STRATEGY_ANALYZER:
                return this.analysisService.iStrategyService.preIStrategyService.createIStrategy(
                    newAnalysis,
                );

            case ModuleLabelEnum.BRRRR_ANALYZER:
                return this.analysisService.brAnalyzerService.preBrAnalyzerService.createBrAnalyzer(
                    newAnalysis,
                );

            default:
                this.analysisService.errorHandler.badRequest(
                    `No creator found for module: ${label}`,
                    `Unsupported module`,
                );
        }
    }

    async resolveAnalysisDuplicateTargets(
        createdBy: UserEntity,
        dto: AnalysisDuplicateDto,
    ): Promise<{
        analysis: AnalysisEntity;
        module: ModuleEntity;
        property: PropertyEntity;
    }> {
        const analysis = await this.analysisService.preAnalysisService.retrieveAnalyseByCriteria(
            { id: dto.analysisId },
            this.analysisService.transformAEntityService.resolveAnalysisDuplicateEntities(),
        );

        let property: PropertyEntity | undefined;

        if (dto.propertyId)
            property = await this.analysisService.propertyService.getOrCreateProperty(
                createdBy,
                dto.propertyId,
            );
        else property = analysis.property;

        return { analysis, module: analysis.module, property };
    }

    getModuleEntityKey(label: ModuleLabelEnum): ABuilderModuleKey {
        const map: Partial<Record<ModuleLabelEnum, ABuilderModuleKey>> = {
            [ModuleLabelEnum.RENTAL_ANALYZER]: 'rAnalysis',
            [ModuleLabelEnum.FIX_FLIP_ANALYZER]: 'fFlip',
            [ModuleLabelEnum.CREATIVE_FINANCING_ANALYZER]: 'cFinancing',
            [ModuleLabelEnum.WHOLESALE_ANALYZER]: 'wholesale',
            [ModuleLabelEnum.INVESTMENT_STRATEGY_ANALYZER]: 'iStrategy',
            [ModuleLabelEnum.BRRRR_ANALYZER]: 'brAnalyzer',
        };

        const key = map[label];

        if (!key)
            this.analysisService.errorHandler.badRequest(
                `No builder key found for module label: ${label}`,
                `Unsupported module`,
            );

        return key;
    }

    buildABuilderArgs = (moduleKey: ABuilderModuleKey, newModuleEntity: object) =>
        ['rAnalysis', 'fFlip', 'cFinancing', 'wholesale', 'iStrategy', 'brAnalyzer'].map((k) =>
            k === moduleKey ? newModuleEntity : undefined,
        ) as [
            RAnalysisEntity?,
            FFlipEntity?,
            CFinancingEntity?,
            WholesaleEntity?,
            IStrategyEntity?,
            BrAnalyzerEntity?,
        ];

    async getExistingBuilder(
        existingAnalysis: AnalysisEntity,
        label: ModuleLabelEnum,
    ): Promise<ABuilderEntity> {
        const analysisRelationMap: Partial<Record<ModuleLabelEnum, keyof AnalysisEntity>> = {
            [ModuleLabelEnum.RENTAL_ANALYZER]: 'rentalAnalysis',
            [ModuleLabelEnum.FIX_FLIP_ANALYZER]: 'fFlip',
            [ModuleLabelEnum.CREATIVE_FINANCING_ANALYZER]: 'cFinancing',
            [ModuleLabelEnum.WHOLESALE_ANALYZER]: 'wholesale',
            [ModuleLabelEnum.INVESTMENT_STRATEGY_ANALYZER]: 'iStrategy',
            [ModuleLabelEnum.BRRRR_ANALYZER]: 'brAnalyzer',
        };

        const builderRelationMap: Partial<Record<ModuleLabelEnum, keyof ABuilderEntity>> = {
            [ModuleLabelEnum.RENTAL_ANALYZER]: 'rAnalysis',
            [ModuleLabelEnum.FIX_FLIP_ANALYZER]: 'fFlip',
            [ModuleLabelEnum.CREATIVE_FINANCING_ANALYZER]: 'cFinancing',
            [ModuleLabelEnum.WHOLESALE_ANALYZER]: 'wholesale',
            [ModuleLabelEnum.INVESTMENT_STRATEGY_ANALYZER]: 'iStrategy',
            [ModuleLabelEnum.BRRRR_ANALYZER]: 'brAnalyzer',
        };

        const analysisRelation = analysisRelationMap[label];
        const builderRelation = builderRelationMap[label];

        if (!analysisRelation || !builderRelation)
            this.analysisService.errorHandler.badRequest(
                `No relation mapping found for module label: ${label}`,
                `Unsupported module`,
            );

        const moduleEntity = existingAnalysis[analysisRelation] as any;

        if (!moduleEntity)
            this.analysisService.errorHandler.notFound(
                `No ${analysisRelation} found on analysis ${existingAnalysis.id}`,
                `Analysis builder not found`,
            );

        return this.analysisService.aBuilderService.retrieveABuilderByCriteria(
            { [builderRelation]: { id: moduleEntity.id } },
            this.analysisService.transformAEntityService.resolveBuilderRelationsByLabel(label),
        );
    }

    cloneEntity<T extends object>(source: T, EntityClass: new () => T, overrides?: Partial<T>): T {
        const clone = new EntityClass();

        for (const key of Object.keys(source) as (keyof T)[]) {
            const value = source[key];
            const isAbstract = (ABSTRACT_FIELDS as readonly string[]).includes(key as string);
            const isRelation = value !== null && typeof value === 'object';

            if (!isAbstract && !isRelation) {
                (clone as any)[key] = value;
            }
        }

        if (overrides) Object.assign(clone, overrides);

        return clone;
    }

    async clonePropertyDetails(source: ABuilderEntity, newBuilder: ABuilderEntity): Promise<void> {
        if (!source.propertyDetails) return;

        const newPDetails = this.cloneEntity(source.propertyDetails, PDetailsEntity, {
            analysisBuilder: newBuilder,
        });
        const saved =
            await this.analysisService.aBuilderService.pDetailsRepository.create(newPDetails);

        if (source.propertyDetails.units?.length) {
            const units = source.propertyDetails.units.map((unit) =>
                this.cloneEntity(unit, UnitEntity, { pDetails: saved }),
            );
            await Promise.all(
                units.map((u) => this.analysisService.aBuilderService.unitRepository.create(u)),
            );
        }
    }

    async cloneAcquisitionDetails(
        source: ABuilderEntity,
        newBuilder: ABuilderEntity,
    ): Promise<void> {
        if (!source.acquisitionDetails) return;

        const newADetails = this.cloneEntity(source.acquisitionDetails, ADetailsEntity, {
            analysisBuilder: newBuilder,
        });
        const saved =
            await this.analysisService.aBuilderService.aDetailsRepository.create(newADetails);

        if (source.acquisitionDetails.itemized) {
            const newItemized = this.cloneEntity(
                source.acquisitionDetails.itemized,
                AdItemizedEntity,
                {
                    aDetails: saved,
                },
            );
            await this.analysisService.aBuilderService.adItemizedRepo.create(newItemized);
        }
    }

    async cloneRepairs(source: ABuilderEntity, newBuilder: ABuilderEntity): Promise<void> {
        if (!source.repairs) return;

        const newRepairs = this.cloneEntity(source.repairs, RepairsEntity, {
            analysisBuilder: newBuilder,
        });
        const saved =
            await this.analysisService.aBuilderService.repairsRepository.create(newRepairs);

        await Promise.all(
            [
                source.repairs.iRepairs &&
                    this.analysisService.aBuilderService.iRepairsRepository.create(
                        this.cloneEntity(source.repairs.iRepairs, IRepairsEntity, {
                            repairs: saved,
                        }),
                    ),
                source.repairs.eRepairs &&
                    this.analysisService.aBuilderService.eRepairsRepository.create(
                        this.cloneEntity(source.repairs.eRepairs, ERepairsEntity, {
                            repairs: saved,
                        }),
                    ),
                source.repairs.oRepairs &&
                    this.analysisService.aBuilderService.oRepairsRepository.create(
                        this.cloneEntity(source.repairs.oRepairs, ORepairsEntity, {
                            repairs: saved,
                        }),
                    ),
            ].filter(Boolean),
        );
    }

    async cloneSale(source: SaleEntity, newBuilder: ABuilderEntity): Promise<void> {
        const newSale = this.cloneEntity(source, SaleEntity, { analysisBuilder: newBuilder });
        const saved = await this.analysisService.aBuilderService.saleRepository.create(newSale);

        if (source.itemized) {
            await this.analysisService.aBuilderService.adItemizedRepo.create(
                this.cloneEntity(source.itemized, AdItemizedEntity, { sale: saved }),
            );
        }
    }

    async cloneHCoast(source: HCoastEntity, newBuilder: ABuilderEntity): Promise<void> {
        const newHCoast = this.cloneEntity(source, HCoastEntity, { analysisBuilder: newBuilder });
        const saved = await this.analysisService.aBuilderService.hCoastRepository.create(newHCoast);

        if (source.itemized)
            await this.analysisService.aBuilderService.hCoastItemizedRepo.create(
                this.cloneEntity(source.itemized, HCoastItemizedEntity, { hCoast: saved }),
            );
    }

    async cloneHDuration(source: HDurationEntity, newBuilder: ABuilderEntity): Promise<void> {
        const newHDuration = this.cloneEntity(source, HDurationEntity, {
            analysisBuilder: newBuilder,
        });
        const saved =
            await this.analysisService.aBuilderService.hDurationRepository.create(newHDuration);

        if (source.itemized)
            await this.analysisService.aBuilderService.iRepairsRepository.create(
                this.cloneEntity(source.itemized, IRepairsEntity, { hDuration: saved }),
            );
    }

    async cloneRefinance(source: RefinanceEntity, newBuilder: ABuilderEntity): Promise<void> {
        const newRefinance = this.cloneEntity(source, RefinanceEntity, {
            analysisBuilder: newBuilder,
        });
        const saved =
            await this.analysisService.aBuilderService.refinanceRepository.create(newRefinance);

        if (source.itemized?.length)
            await Promise.all(
                source.itemized.map((item) =>
                    this.analysisService.aBuilderService.refiItemRepository.create(
                        this.cloneEntity(item, RefinanceItemEntity, { refi: saved }),
                    ),
                ),
            );
    }

    async cloneRDuration(source: RDurationEntity, newBuilder: ABuilderEntity): Promise<void> {
        const newRDuration = this.cloneEntity(source, RDurationEntity, {
            analysisBuilder: newBuilder,
        });
        const saved =
            await this.analysisService.aBuilderService.rDurationRepository.create(newRDuration);

        if (source.itemized)
            await this.analysisService.aBuilderService.adItemizedRepo.create(
                this.cloneEntity(source.itemized, AdItemizedEntity, { rDuration: saved }),
            );
    }

    async cloneCCoast(source: CCoastEntity, newBuilder: ABuilderEntity): Promise<void> {
        const newCCoast = this.cloneEntity(source, CCoastEntity, { analysisBuilder: newBuilder });
        const saved = await this.analysisService.aBuilderService.cCoastRepository.create(newCCoast);

        await Promise.all(
            [
                source.iRepairs &&
                    this.analysisService.aBuilderService.iRepairsRepository.create(
                        this.cloneEntity(source.iRepairs, IRepairsEntity, { cCoast: saved }),
                    ),
                source.eRepairs &&
                    this.analysisService.aBuilderService.eRepairsRepository.create(
                        this.cloneEntity(source.eRepairs, ERepairsEntity, { cCoast: saved }),
                    ),
                source.oRepairs &&
                    this.analysisService.aBuilderService.oRepairsRepository.create(
                        this.cloneEntity(source.oRepairs, ORepairsEntity, { cCoast: saved }),
                    ),
            ].filter(Boolean),
        );
    }

    async cloneFExpenses(source: FExpensesEntity, newBuilder: ABuilderEntity): Promise<void> {
        const newFExpense = this.cloneEntity(source, FExpensesEntity, {
            analysisBuilder: newBuilder,
        });
        await this.analysisService.aBuilderService.fExpensesRepository.create(newFExpense);
    }

    async cloneBrRefinance(source: BrRefinanceEntity, newBuilder: ABuilderEntity): Promise<void> {
        const newBrRefi = this.cloneEntity(source, BrRefinanceEntity, {
            analysisBuilder: newBuilder,
        });
        const saved =
            await this.analysisService.aBuilderService.brRefinanceRepository.create(newBrRefi);

        await Promise.all(
            [
                source.iRepairs &&
                    this.analysisService.aBuilderService.iRepairsRepository.create(
                        this.cloneEntity(source.iRepairs, IRepairsEntity, { brRefi: saved }),
                    ),
                source.eRepairs &&
                    this.analysisService.aBuilderService.eRepairsRepository.create(
                        this.cloneEntity(source.eRepairs, ERepairsEntity, { brRefi: saved }),
                    ),
                source.oRepairs &&
                    this.analysisService.aBuilderService.oRepairsRepository.create(
                        this.cloneEntity(source.oRepairs, ORepairsEntity, { brRefi: saved }),
                    ),
            ].filter(Boolean),
        );
    }

    cloneModuleSpecificEntities(
        source: ABuilderEntity,
        newBuilder: ABuilderEntity,
        label: ModuleLabelEnum,
    ): Promise<any>[] {
        const tasks: Promise<any>[] = [];

        const pushFExpenses = () =>
            source.fExpenses && tasks.push(this.cloneFExpenses(source.fExpenses, newBuilder));

        switch (label) {
            case ModuleLabelEnum.FIX_FLIP_ANALYZER:
                if (source.sale) tasks.push(this.cloneSale(source.sale, newBuilder));
                if (source.hCoast) tasks.push(this.cloneHCoast(source.hCoast, newBuilder));
                break;

            case ModuleLabelEnum.RENTAL_ANALYZER:
            case ModuleLabelEnum.CREATIVE_FINANCING_ANALYZER:
                pushFExpenses();
                break;

            case ModuleLabelEnum.BRRRR_ANALYZER:
                pushFExpenses();
                if (source.cCoast) tasks.push(this.cloneCCoast(source.cCoast, newBuilder));
                if (source.brRefi) tasks.push(this.cloneBrRefinance(source.brRefi, newBuilder));
                break;

            case ModuleLabelEnum.WHOLESALE_ANALYZER:
                pushFExpenses();
                if (source.hDuration) tasks.push(this.cloneHDuration(source.hDuration, newBuilder));
                break;

            case ModuleLabelEnum.INVESTMENT_STRATEGY_ANALYZER:
                pushFExpenses();
                if (source.rDuration) tasks.push(this.cloneRDuration(source.rDuration, newBuilder));
                if (source.refinance) tasks.push(this.cloneRefinance(source.refinance, newBuilder));
                break;
        }

        return tasks;
    }

    async cloneABuilder(
        existingAnalysis: AnalysisEntity,
        newModuleEntity: object,
        label: ModuleLabelEnum,
    ): Promise<void> {
        const moduleKey = this.getModuleEntityKey(label);

        const existingBuilder = await this.getExistingBuilder(existingAnalysis, label);

        const newBuilder = await this.analysisService.aBuilderService.createABuilder(
            ...this.buildABuilderArgs(moduleKey, newModuleEntity),
        );

        await Promise.all([
            this.clonePropertyDetails(existingBuilder, newBuilder),
            this.cloneAcquisitionDetails(existingBuilder, newBuilder),
            this.cloneRepairs(existingBuilder, newBuilder),
            ...this.cloneModuleSpecificEntities(existingBuilder, newBuilder, label),
        ]);
    }

    async cloneBAnalysis(
        existingRCalculator: RCalculatorEntity,
        newRCalculator: RCalculatorEntity,
    ): Promise<void> {
        const bAnalysis =
            await this.analysisService.rCalculatorService.bAnalysisService.retrieveBAnalysisByCriteria(
                { rCalculator: { id: existingRCalculator.id } },
                ['rooms', 'rooms.sections', 'rooms.sections.expenses'],
            );

        const newBAnalysis =
            await this.analysisService.rCalculatorService.bAnalysisService.bAnalysisRepo.create(
                this.cloneEntity(bAnalysis, BAnalysisEntity, { rCalculator: newRCalculator }),
            );

        if (!bAnalysis.rooms?.length) return;

        await Promise.all(
            bAnalysis.rooms.map(async (room) => {
                const newRoom =
                    await this.analysisService.rCalculatorService.bAnalysisService.roomCategoryRepo.create(
                        this.cloneEntity(room, RoomCategoryEntity, { bAnalysis: newBAnalysis }),
                    );

                if (!room.sections?.length) return;

                await Promise.all(
                    room.sections.map(async (section) => {
                        const newSection =
                            await this.analysisService.rCalculatorService.bAnalysisService.roomSectionRepo.create(
                                this.cloneEntity(section, RoomSectionEntity, {
                                    roomCategory: newRoom,
                                }),
                            );

                        if (!section.expenses?.length) return;

                        await Promise.all(
                            section.expenses.map((expense) =>
                                this.analysisService.rCalculatorService.bAnalysisService.roomExpenseItemRepo.create(
                                    this.cloneEntity(expense, RoomExpenseItemEntity, {
                                        roomSection: newSection,
                                    }),
                                ),
                            ),
                        );
                    }),
                );
            }),
        );
    }

    async duplicateBuilder(
        existingAnalysis: AnalysisEntity,
        newModuleEntity:
            | RAnalysisEntity
            | FFlipEntity
            | RCalculatorEntity
            | CFinancingEntity
            | WholesaleEntity
            | IStrategyEntity
            | BrAnalyzerEntity,
    ): Promise<void> {
        const label = existingAnalysis.module.label as ModuleLabelEnum;

        if (label === ModuleLabelEnum.REHAB_CALCULATOR) {
            if (!existingAnalysis.rehabCalculator)
                this.analysisService.errorHandler.notFound(
                    `No rehabCalculator found on analysis ${existingAnalysis.id}`,
                    `Rehab calculator not found`,
                );

            await this.cloneBAnalysis(
                existingAnalysis.rehabCalculator,
                newModuleEntity as RCalculatorEntity,
            );
            return;
        }

        await this.cloneABuilder(existingAnalysis, newModuleEntity, label);
    }
}
