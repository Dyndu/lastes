import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { decimalTransformer } from '../../../utils/services/transformers';

@Entity('subscription_plans')
export class SubscriptionEntity extends AbstractEntity<SubscriptionEntity> {
    @Column({
        nullable: false,
        type: 'decimal',
        default: 0,
        transformer: decimalTransformer,
    })
    monthlyPrice: number;

    @Column({
        nullable: false,
        type: 'decimal',
        default: 0,
        transformer: decimalTransformer,
    })
    yearlyPrice: number;
}
