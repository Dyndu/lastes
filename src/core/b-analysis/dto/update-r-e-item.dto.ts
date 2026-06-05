import { CreateREItemDto } from './create-r-e-item.dto';
import { StringFieldDecorator } from '../../../common/decorators';
import { IsUUID } from 'class-validator';

export class UpdateREItemDto extends CreateREItemDto {
    @StringFieldDecorator(
        'The id of the expense item record',
        '2908dec0-a048-4a29-9810-e730e48a057b',
        2,
        false,
    )
    @IsUUID('4')
    id?: string;
}
