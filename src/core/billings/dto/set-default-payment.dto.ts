import { StringFieldDecorator } from '../../../common/decorators';

export class SetDefaultPaymentDto {
    @StringFieldDecorator('Payment method stripe id', 'mkn_oklm', 2, true)
    paymentMethodId: string;
}
