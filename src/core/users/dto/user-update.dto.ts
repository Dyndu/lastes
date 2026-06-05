import { StringFieldDecorator } from '../../../common/decorators';
import { IsUUID } from 'class-validator';

export class UserUpdateDto {
    @StringFieldDecorator('Fullname of the suer', 'Jane Doe', 2, false)
    fullname?: string;

    @StringFieldDecorator('Id of the avatar', 'eb5174d5-1cef-40f6-bb57-97393cde0426', 2, false)
    @IsUUID('4')
    avatar?: string;
}
