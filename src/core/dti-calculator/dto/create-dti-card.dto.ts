import { NumberFieldDecorator, StringFieldDecorator } from '../../../common/decorators';

export class CreateDtiCardDto {
    @StringFieldDecorator('The code of the card', 'xxxx-xxx-xxx-xxxxx', 8)
    code: string;

    @NumberFieldDecorator('The amount to retrieve from the card', 100)
    amount: number;

    @StringFieldDecorator('Card expiry', 'MM/YYYY')
    expiry: string;
}
