import { BooleanFieldDecorator } from '../../../common/decorators';

export class PinStateDto {
    @BooleanFieldDecorator('Either pin or unpin module', true, true)
    isPin: boolean;
}
