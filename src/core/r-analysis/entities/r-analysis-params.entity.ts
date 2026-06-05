import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { RAnalysisEntity } from './r-analysis.entity';
import { decimalTransformer } from '../../../utils/services/transformers';

@Entity('r_analysis_params')
export class RAnalysisParamsEntity extends AbstractEntity<RAnalysisParamsEntity> {
    @OneToOne(() => RAnalysisEntity, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'rAnalysisId' })
    rAnalysis: RAnalysisEntity;

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    ltv: number;

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    occupancyRate: number;

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    managementFeePercent: number;

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    maintenanceEscrowPercent: number;

    @Column({ type: 'decimal', nullable: true, default: 0 })
    pmi?: number;
}
