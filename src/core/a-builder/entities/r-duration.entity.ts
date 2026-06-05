import { AfterLoad, Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { decimalTransformer } from '../../../utils/services/transformers';
import { AdItemizedEntity } from './ad-itemized.entity';
import { ABuilderEntity } from './a-builder.entity';

@Entity('rehab_duration')
export class RDurationEntity extends AbstractEntity<RDurationEntity> {
    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    rehabDuration: number;

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    duration: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    rContingency: number;

    totalRCoast: number;

    @AfterLoad()
    computeTotalRCoast() {
        this.totalRCoast = (this.holdingCoast ?? 0) + (this.rContingencyAmount ?? 0);
    }

    @Column({
        nullable: false,
        type: 'decimal',
        default: 0,
        transformer: decimalTransformer,
    })
    rContingencyAmount: number;

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    holdingCoast: number;

    @OneToOne(() => AdItemizedEntity, (item) => item.rDuration, {
        eager: false,
        cascade: true,
    })
    itemized?: AdItemizedEntity;

    @OneToOne(() => ABuilderEntity, (rental) => rental.rDuration, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'analysisBuilderId' })
    analysisBuilder?: ABuilderEntity;
}
