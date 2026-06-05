import { NumberFieldDecorator } from '../../../common/decorators';

export class SPlanUpdateDto {
    @NumberFieldDecorator('Coast of the monthly subscription plan', 200, {
        required: false,
        min: 0,
    })
    monthlyPrice?: number;

    @NumberFieldDecorator('Coast of the yearly subscription plan', 200, { required: false, min: 0 })
    yearlyPrice?: number;
}
