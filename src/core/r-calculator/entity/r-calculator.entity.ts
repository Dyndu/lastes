import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { AnalysisEntity } from '../../analysis/entities/analysis.entity';
import { BAnalysisEntity } from '../../b-analysis/entities';

@Entity('rehab_calculator')
export class RCalculatorEntity extends AbstractEntity<RCalculatorEntity> {
    @OneToOne(() => AnalysisEntity, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'analysisId' })
    analysis: AnalysisEntity;

    @Column({ nullable: true })
    description?: string;

    @OneToOne(() => BAnalysisEntity, (result) => result.rCalculator, {
        eager: false,
        nullable: true,
    })
    analysisBuilder?: BAnalysisEntity;
}
