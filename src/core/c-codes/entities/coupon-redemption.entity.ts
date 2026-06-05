import { Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { CCodeEntity } from './c-code.entity';

@Entity('coupon_redemptions')
export class CouponRedemptionEntity extends AbstractEntity<CouponRedemptionEntity> {
    @ManyToOne(() => UserEntity, { eager: false, nullable: false })
    @JoinColumn({ name: 'userId' })
    user: UserEntity;

    @ManyToOne(() => CCodeEntity, { eager: false, nullable: false })
    @JoinColumn({ name: 'couponId' })
    coupon: CCodeEntity;
}
