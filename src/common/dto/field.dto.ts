import { StringFieldDecorator } from '../decorators';

export class FieldDto {
    @StringFieldDecorator('Field', 'token', 2)
    field: string;
}
