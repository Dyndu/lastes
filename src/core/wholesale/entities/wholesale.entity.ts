import { Entity, JoinColumn, OneToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { AnalysisEntity } from '../../analysis/entities';
import { ABuilderEntity } from '../../a-builder/entities';

@Entity('wholesale')
export class WholesaleEntity extends AbstractEntity<WholesaleEntity> {
    @OneToOne(() => AnalysisEntity, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'analysisId' })
    analysis: AnalysisEntity;

    @OneToOne(() => ABuilderEntity, (result) => result.wholesale, {
        eager: false,
        nullable: true,
    })
    analysisBuilder?: ABuilderEntity;
}
