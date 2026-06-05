import { Column, Entity, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { CouponTypeEnum, SubscriptionPeriodEnum } from '../../../common/enum';
import { CouponRedemptionEntity } from './coupon-redemption.entity';

@Entity('codes_coupon')
export class CCodeEntity extends AbstractEntity<CCodeEntity> {
    @Column({ type: 'enum', enum: CouponTypeEnum, nullable: false })
    couponType: CouponTypeEnum;

    @Column({ type: 'enum', enum: SubscriptionPeriodEnum, nullable: false })
    subscriptionPeriod: SubscriptionPeriodEnum;

    @Column({ type: 'varchar', length: 100 })
    code: string;

    @Column({ type: 'date', nullable: false })
    startDate: Date;

    @Column({ type: 'date', nullable: false })
    endDate: Date;

    @Column({ type: 'varchar', length: 255, nullable: true })
    label?: string;

    @Column({ type: 'int', nullable: true })
    discountValue?: number;

    @Column({ type: 'int', nullable: true })
    freeTrialDays?: number;

    @OneToMany(() => CouponRedemptionEntity, (r) => r.coupon)
    redemptions: CouponRedemptionEntity[];
}
