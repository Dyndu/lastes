import { StringArrayFieldDecorator, StringFieldDecorator } from '../../../common/decorators';
import { IsUUID } from 'class-validator';

export class BaseSendMessageDto {
    @StringFieldDecorator('Content of the message', 'Hello World!', 1, false)
    content?: string;

    @StringFieldDecorator('Message to reply to', '7f3f5860-a780-41a0-8484-4990a811ddd9', 1, false)
    messagesId?: string;

    @StringArrayFieldDecorator(
        'Files ids attached to message',
        ['7f3f5860-a780-41a0-8484-4990a811ddd9', '7f3f5860-a780-41a0-8484-4990a811ddd9'],
        1,
        false,
    )
    @IsUUID('4', { each: true })
    files?: string[];
}
