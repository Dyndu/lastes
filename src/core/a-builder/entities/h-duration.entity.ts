import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { decimalTransformer } from '../../../utils/services/transformers';
import { IRepairsEntity } from './i-repairs.entity';
import { ABuilderEntity } from './a-builder.entity';

@Entity('holding_duration')
export class HDurationEntity extends AbstractEntity<HDurationEntity> {
    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    holdingCoast: number;

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    duration: number;

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    transactionFee: number;

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    otherFee: number;

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    targetProfit: number;

    @OneToOne(() => IRepairsEntity, (item) => item.hDuration, {
        eager: false,
        cascade: true,
    })
    itemized?: IRepairsEntity;

    @OneToOne(() => ABuilderEntity, (rental) => rental.hDuration, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'analysisBuilderId' })
    analysisBuilder?: ABuilderEntity;
}
