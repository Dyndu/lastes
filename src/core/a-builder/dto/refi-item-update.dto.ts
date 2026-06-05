import { StringFieldDecorator } from '../../../common/decorators';
import { IsUUID } from 'class-validator';
import { RefiItemDto } from './refi-item.dto';

export class RefiItemUpdateDto extends RefiItemDto {
    @StringFieldDecorator(
        'The id of the refi item record',
        '2908dec0-a048-4a29-9810-e730e48a057b',
        2,
        false,
    )
    @IsUUID('4')
    id?: string;
}
