import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { AdItemizedEntity } from './ad-itemized.entity';
import { ABuilderEntity } from './a-builder.entity';
import { decimalTransformer } from '../../../utils/services/transformers';

@Entity('sales')
export class SaleEntity extends AbstractEntity<SaleEntity> {
    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    afterRepairValue: number;

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    targetProfit: number;

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    saleClosingCoast: number;

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    agentCommission: number;

    @OneToOne(() => AdItemizedEntity, (item) => item.sale, {
        eager: false,
        cascade: true,
    })
    itemized?: AdItemizedEntity;

    @OneToOne(() => ABuilderEntity, (rental) => rental.acquisitionDetails, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'analysisBuilderId' })
    analysisBuilder?: ABuilderEntity;
}
