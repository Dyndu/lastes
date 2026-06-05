import { NumberFieldDecorator, StringFieldDecorator } from '../../../common/decorators';

export class RefiItemDto {
    @StringFieldDecorator('The label of the refinance item', 'Roof', 2, true)
    label: string;

    @NumberFieldDecorator('The value of the label')
    value: number;
}
