import { StringFieldDecorator } from '../../../common/decorators';
import { IsUUID } from 'class-validator';
import { BaseSendMessageDto } from './base-send-message.dto';

export class AdminSendMessageDto extends BaseSendMessageDto {
    @StringFieldDecorator('The conversation id', '7f3f5860-a780-41a0-8484-4990a811ddd9', 2, true)
    @IsUUID('4')
    conId: string;
}
