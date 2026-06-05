import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { ModuleEntity } from '../../modules/entities';
import { PropertyEntity } from '../../properties/entities/property.entity';
import { RAnalysisEntity } from '../../r-analysis/entities';
import { UserEntity } from '../../users/entities/user.entity';
import { FFlipEntity } from '../../fix-flip/entity/f-flip.entity';
import { RCalculatorEntity } from '../../r-calculator/entity/r-calculator.entity';
import { CFinancingEntity } from '../../creative-financing/entities/c-financing.entity';
import { WholesaleEntity } from '../../wholesale/entities/wholesale.entity';
import { IStrategyEntity } from '../../i-strategy/entities/i-strategy.entity';
import { BrAnalyzerEntity } from '../../br-analyzer/entities/br-analyzer.entity';

@Entity('analysis')
export class AnalysisEntity extends AbstractEntity<AnalysisEntity> {
    @ManyToOne(() => ModuleEntity, { eager: false, nullable: false })
    @JoinColumn({ name: 'moduleId' })
    module: ModuleEntity;

    @ManyToOne(() => PropertyEntity, { eager: false, nullable: false })
    @JoinColumn({ name: 'propertyId' })
    property: PropertyEntity;

    @ManyToOne(() => UserEntity, { eager: false, nullable: false })
    @JoinColumn({ name: 'createdBy' })
    createdBy: UserEntity;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @OneToOne(() => RAnalysisEntity, (rental) => rental.analysis, {
        eager: false,
        nullable: true,
    })
    rentalAnalysis?: RAnalysisEntity;

    @OneToOne(() => FFlipEntity, (fFlip) => fFlip.analysis, {
        eager: false,
        nullable: true,
    })
    fFlip?: FFlipEntity;

    @OneToOne(() => RCalculatorEntity, (rCalculator) => rCalculator.analysis, {
        eager: false,
        nullable: true,
    })
    rehabCalculator?: RCalculatorEntity;

    @OneToOne(() => CFinancingEntity, (cFinancing) => cFinancing.analysis, {
        eager: false,
        nullable: true,
    })
    cFinancing?: CFinancingEntity;

    @OneToOne(() => WholesaleEntity, (wholesale) => wholesale.analysis, {
        eager: false,
        nullable: true,
    })
    wholesale?: WholesaleEntity;

    @OneToOne(() => IStrategyEntity, (strategy) => strategy.analysis, {
        eager: false,
        nullable: true,
    })
    iStrategy?: IStrategyEntity;

    @OneToOne(() => BrAnalyzerEntity, (strategy) => strategy.analysis, {
        eager: false,
        nullable: true,
    })
    brAnalyzer?: BrAnalyzerEntity;
}
