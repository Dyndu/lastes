import { EnumFieldDecorator, NumberFieldDecorator } from '../../../common/decorators';
import { ExtraPaymentFrequencyEnum } from '../../../common/enum';

export class AmortizationQueryDto {
    @NumberFieldDecorator('Extra payment amount', 0, { required: false, min: 0 })
    extraPayment?: number;

    @EnumFieldDecorator(ExtraPaymentFrequencyEnum, 'Extra payment frequency', {
        required: false,
        example: ExtraPaymentFrequencyEnum.MONTHLY,
    })
    frequency?: ExtraPaymentFrequencyEnum;
}
