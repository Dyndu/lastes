import { StringFieldDecorator } from '../decorators';
import { IsUUID } from 'class-validator';

export class UuidFieldDto {
    @StringFieldDecorator('Id fields', 'eb5174d5-1cef-40f6-bb57-97393cde0426', 2)
    @IsUUID('4')
    field: string;
}
