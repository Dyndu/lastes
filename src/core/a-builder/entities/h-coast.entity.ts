import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { ABuilderEntity } from './a-builder.entity';
import { decimalTransformer } from '../../../utils/services/transformers';
import { HCoastItemizedEntity } from './h-coast-itemized.entity';

@Entity('holding_coast')
export class HCoastEntity extends AbstractEntity<HCoastEntity> {
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
        default: 0,
    })
    durationInMonth: number;

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    pIValue: number;

    @OneToOne(() => HCoastItemizedEntity, (item) => item.hCoast, {
        eager: false,
        cascade: true,
    })
    itemized?: HCoastItemizedEntity;

    @OneToOne(() => ABuilderEntity, (rental) => rental.hCoast, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'analysisBuilderId' })
    analysisBuilder?: ABuilderEntity;
}
