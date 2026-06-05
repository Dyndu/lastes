import { Entity, JoinColumn, OneToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { ABuilderEntity } from '../../a-builder/entities';
import { AnalysisEntity } from '../../analysis/entities';

@Entity('fix_flip')
export class FFlipEntity extends AbstractEntity<FFlipEntity> {
    @OneToOne(() => AnalysisEntity, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'analysisId' })
    analysis: AnalysisEntity;

    @OneToOne(() => ABuilderEntity, (result) => result.rAnalysis, {
        eager: false,
        nullable: true,
    })
    analysisBuilder?: ABuilderEntity;
}
