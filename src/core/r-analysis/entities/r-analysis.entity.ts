import { Entity, JoinColumn, OneToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { ABuilderEntity } from '../../a-builder/entities';
import { AnalysisEntity } from '../../analysis/entities';
import { RAnalysisParamsEntity } from './r-analysis-params.entity';

@Entity('rental_analysis')
export class RAnalysisEntity extends AbstractEntity<RAnalysisEntity> {
    @OneToOne(() => AnalysisEntity, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'analysisId' })
    analysis: AnalysisEntity;

    @OneToOne(() => ABuilderEntity, (result) => result.rAnalysis, {
        eager: false,
        nullable: true,
    })
    analysisBuilder?: ABuilderEntity;

    @OneToOne(() => RAnalysisParamsEntity, (p) => p.rAnalysis, { nullable: true })
    params?: RAnalysisParamsEntity;
}
