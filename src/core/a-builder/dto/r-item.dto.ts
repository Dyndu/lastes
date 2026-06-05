import { NumberFieldDecorator } from '../../../common/decorators';

export class RItemDto {
    @NumberFieldDecorator('The roof repairs coast', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    roof: number;

    @NumberFieldDecorator('The landscaping repairs coast', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    landscaping: number;

    @NumberFieldDecorator('The concierge repairs coast', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    concierge: number;

    @NumberFieldDecorator('The garage repairs coast', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    garage: number;

    @NumberFieldDecorator('The bathrooms repairs coast', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    bathrooms: number;
}
