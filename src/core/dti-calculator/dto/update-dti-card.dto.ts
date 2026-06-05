import { NumberFieldDecorator } from '../../../common/decorators';

export class UpdateDtiCardDto {
    @NumberFieldDecorator('The amount to retrieve from the card', 100, { required: false })
    amount?: number;
}
