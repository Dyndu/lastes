import { AfterLoad, Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { decimalTransformer } from '../../../utils/services/transformers';
import { HCoastEntity } from './h-coast.entity';

@Entity('holding_coast_itemized')
export class HCoastItemizedEntity extends AbstractEntity<HCoastItemizedEntity> {
    totalUtilities: number;

    @AfterLoad()
    computeTotalUtilities() {
        this.totalUtilities =
            (this.electricity ?? 0) + (this.water ?? 0) + (this.gas ?? 0) + (this.trash ?? 0);
    }

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    electricity: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    water: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    insurance: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    gas: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    trash: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    propertyTaxes: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    other: number;

    @OneToOne(() => HCoastEntity, (details) => details.itemized, {
        nullable: true,
        eager: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'hCoastId' })
    hCoast?: HCoastEntity;
}
