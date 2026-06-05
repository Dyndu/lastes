import { Entity, JoinColumn, OneToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { AnalysisEntity } from '../../analysis/entities';
import { ABuilderEntity } from '../../a-builder/entities';

@Entity('brrr_analyzer')
export class BrAnalyzerEntity extends AbstractEntity<BrAnalyzerEntity> {
    @OneToOne(() => AnalysisEntity, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'analysisId' })
    analysis: AnalysisEntity;

    @OneToOne(() => ABuilderEntity, (result) => result.brAnalyzer, {
        eager: false,
        nullable: true,
    })
    analysisBuilder?: ABuilderEntity;
}
