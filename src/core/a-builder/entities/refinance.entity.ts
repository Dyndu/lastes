import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { decimalTransformer } from '../../../utils/services/transformers';
import { ABuilderEntity } from './a-builder.entity';
import { RefinanceItemEntity } from './refinance-item.entity';
import { BaseRefiEntity } from './base-refi.entity';

@Entity('refinances')
export class RefinanceEntity extends BaseRefiEntity<RefinanceEntity> {
    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    closingCoast: number;

    @Column({
        nullable: true,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    vacancy?: number;

    @OneToMany(() => RefinanceItemEntity, (item) => item.refi)
    itemized: RefinanceItemEntity[];

    @OneToOne(() => ABuilderEntity, (rental) => rental.hDuration, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'analysisBuilderId' })
    analysisBuilder?: ABuilderEntity;
}
