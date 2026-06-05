import { Entity, JoinColumn, OneToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { AnalysisEntity } from '../../analysis/entities';
import { ABuilderEntity } from '../../a-builder/entities';

@Entity('creative_financing')
export class CFinancingEntity extends AbstractEntity<CFinancingEntity> {
    @OneToOne(() => AnalysisEntity, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'analysisId' })
    analysis: AnalysisEntity;

    @OneToOne(() => ABuilderEntity, (result) => result.cFinancing, {
        eager: false,
        nullable: true,
    })
    analysisBuilder?: ABuilderEntity;
}
