import { EnumFieldDecorator } from '../../../common/decorators';
import { SubscriptionPeriodEnum } from '../../../common/enum';

export class ChangePeriodDto {
    @EnumFieldDecorator(SubscriptionPeriodEnum, 'Change the subscription plan', {
        example: SubscriptionPeriodEnum.MONTHLY,
        required: true,
    })
    period: SubscriptionPeriodEnum;
}
