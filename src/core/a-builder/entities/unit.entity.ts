import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { PDetailsEntity } from './p-details.entity';
import { decimalTransformer } from '../../../utils/services/transformers';

@Entity('units')
export class UnitEntity extends AbstractEntity<UnitEntity> {
    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    sqFootage: number;

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    bedRooms: number;

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    bathRooms: number;

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    monthlyRent: number;

    @ManyToOne(() => PDetailsEntity, { eager: false, nullable: false })
    @JoinColumn({ name: 'pDetailId' })
    pDetails: PDetailsEntity;
}
