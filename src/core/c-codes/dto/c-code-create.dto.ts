import {
    DateFieldDecorator,
    EnumFieldDecorator,
    NumberFieldDecorator,
    StringFieldDecorator,
} from '../../../common/decorators';
import { CouponTypeEnum, SubscriptionPeriodEnum } from '../../../common/enum';
import { Matches } from 'class-validator';

export class CCodeCreateDto {
    @EnumFieldDecorator(CouponTypeEnum, 'The type of the coupon code to create', {
        example: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
    })
    couponType: CouponTypeEnum;

    @EnumFieldDecorator(SubscriptionPeriodEnum, 'The subscriptions period', {
        example: SubscriptionPeriodEnum.MONTHLY,
    })
    subscriptionPeriod: SubscriptionPeriodEnum;

    @StringFieldDecorator('The code of coupon', 'xMwe8902', 8, true, false, 8)
    @Matches(/^[A-Za-z0-9]+$/, {
        message: 'Code must contain only letters and numbers',
    })
    code: string;

    @DateFieldDecorator('Start date of the coupon', '2026-12-01T00:00:00.000Z', {
        required: true,
    })
    startDate: Date;

    @DateFieldDecorator('Start date of the coupon', '2026-12-01T00:00:00.000Z', {
        required: true,
    })
    endDate: Date;

    @StringFieldDecorator('The name or label of coupon', 'DAKAYAO', 2, false)
    label?: string;

    @NumberFieldDecorator('Discount (percent) of the affiliation code', 100, {
        required: false,
        allowNegative: false,
    })
    discountValue?: number;

    @NumberFieldDecorator('Number of days of the free trail of the coupon code', 100, {
        required: false,
        allowNegative: false,
    })
    freeTrialDays?: number;
}
