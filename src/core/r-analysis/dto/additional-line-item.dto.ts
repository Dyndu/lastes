import { NumberFieldDecorator, StringFieldDecorator } from '../../../common/decorators';

export class AdditionalLineItemDto {
    @StringFieldDecorator('Label of the additional line item', 'Additional fee', 1, true)
    label: string;

    @NumberFieldDecorator('Amount of the additional line item', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    amount: number;
}
