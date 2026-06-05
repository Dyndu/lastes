import { Entity, JoinColumn, OneToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { PDetailsEntity } from './p-details.entity';
import { ADetailsEntity } from './a-details.entity';
import { RepairsEntity } from './repairs.entity';
import { FExpensesEntity } from './f-expenses.entity';
import { RAnalysisEntity } from '../../r-analysis/entities/r-analysis.entity';
import { FFlipEntity } from '../../fix-flip/entity/f-flip.entity';
import { SaleEntity } from './sale.entity';
import { CFinancingEntity } from '../../creative-financing/entities/c-financing.entity';
import { HCoastEntity } from './h-coast.entity';
import { HDurationEntity } from './h-duration.entity';
import { WholesaleEntity } from '../../wholesale/entities/wholesale.entity';
import { IStrategyEntity } from '../../i-strategy/entities/i-strategy.entity';
import { RDurationEntity } from './r-duration.entity';
import { RefinanceEntity } from './refinance.entity';
import { CCoastEntity } from './c-coast.entity';
import { BrAnalyzerEntity } from '../../br-analyzer/entities/br-analyzer.entity';
import { BrRefinanceEntity } from './br-refinance.entity';

@Entity('analysis_builder')
export class ABuilderEntity extends AbstractEntity<ABuilderEntity> {
    @OneToOne(() => RAnalysisEntity, (rental) => rental.analysisBuilder, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'rAnalysisId' })
    rAnalysis?: RAnalysisEntity;

    @OneToOne(() => FFlipEntity, (fFlip) => fFlip.analysisBuilder, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'fFlipId' })
    fFlip?: FFlipEntity;

    @OneToOne(() => CFinancingEntity, (cFinancing) => cFinancing.analysisBuilder, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'cFinancingId' })
    cFinancing?: CFinancingEntity;

    @OneToOne(() => WholesaleEntity, (wholesale) => wholesale.analysisBuilder, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'wholesaleId' })
    wholesale?: WholesaleEntity;

    @OneToOne(() => IStrategyEntity, (iStrategy) => iStrategy.analysisBuilder, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'iStrategyId' })
    iStrategy?: IStrategyEntity;

    @OneToOne(() => BrAnalyzerEntity, (brAnalyzer) => brAnalyzer.analysisBuilder, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'brAnalyzerId' })
    brAnalyzer?: BrAnalyzerEntity;

    @OneToOne(() => PDetailsEntity, (details) => details.analysisBuilder, {
        eager: false,
        nullable: true,
    })
    propertyDetails?: PDetailsEntity;

    @OneToOne(() => ADetailsEntity, (details) => details.analysisBuilder, {
        eager: false,
        nullable: true,
    })
    acquisitionDetails?: ADetailsEntity;

    @OneToOne(() => RepairsEntity, (details) => details.analysisBuilder, {
        eager: false,
        nullable: true,
    })
    repairs?: RepairsEntity;

    @OneToOne(() => FExpensesEntity, (details) => details.analysisBuilder, {
        eager: false,
        nullable: true,
    })
    fExpenses?: FExpensesEntity;

    @OneToOne(() => SaleEntity, (details) => details.analysisBuilder, {
        eager: false,
        nullable: true,
    })
    sale?: SaleEntity;

    @OneToOne(() => HCoastEntity, (details) => details.analysisBuilder, {
        eager: false,
        nullable: true,
    })
    hCoast?: HCoastEntity;

    @OneToOne(() => HDurationEntity, (details) => details.analysisBuilder, {
        eager: false,
        nullable: true,
    })
    hDuration?: HDurationEntity;

    @OneToOne(() => RefinanceEntity, (details) => details.analysisBuilder, {
        eager: false,
        nullable: true,
    })
    refinance?: RefinanceEntity;

    @OneToOne(() => RDurationEntity, (details) => details.analysisBuilder, {
        eager: false,
        nullable: true,
    })
    rDuration?: RDurationEntity;

    @OneToOne(() => CCoastEntity, (details) => details.analysisBuilder, {
        eager: false,
        nullable: true,
    })
    cCoast?: CCoastEntity;

    @OneToOne(() => BrRefinanceEntity, (details) => details.analysisBuilder, {
        eager: false,
        nullable: true,
    })
    brRefi?: BrRefinanceEntity;
}
