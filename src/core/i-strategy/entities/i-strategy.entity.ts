import { Entity, JoinColumn, OneToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { AnalysisEntity } from '../../analysis/entities';
import { ABuilderEntity } from '../../a-builder/entities';

@Entity('investment_strategy')
export class IStrategyEntity extends AbstractEntity<IStrategyEntity> {
    @OneToOne(() => AnalysisEntity, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'analysisId' })
    analysis: AnalysisEntity;

    @OneToOne(() => ABuilderEntity, (result) => result.iStrategy, {
        eager: false,
        nullable: true,
    })
    analysisBuilder?: ABuilderEntity;
}
