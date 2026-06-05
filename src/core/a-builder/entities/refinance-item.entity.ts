import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { decimalTransformer } from '../../../utils/services/transformers';
import { RefinanceEntity } from './refinance.entity';

@Entity('refinance-item')
export class RefinanceItemEntity extends AbstractEntity<RefinanceItemEntity> {
    @Column({ nullable: false })
    label: string;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    value: number;

    @ManyToOne(() => RefinanceEntity, (refi) => refi.itemized, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'refiId' })
    refi: RefinanceEntity;
}
