import { Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { AnalysisEntity } from './analysis.entity';
import { ModuleEntity } from '../../modules/entities';

@Entity('analysis_usage')
export class AnalysisUsageEntity extends AbstractEntity<AnalysisUsageEntity> {
    @ManyToOne(() => AnalysisEntity, { eager: false, nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'analysisId' })
    analysis: AnalysisEntity;

    @ManyToOne(() => ModuleEntity, { eager: false, nullable: false })
    @JoinColumn({ name: 'moduleId' })
    module: ModuleEntity;
}
