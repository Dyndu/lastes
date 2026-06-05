import { StringArrayFieldDecorator, StringFieldDecorator } from '../../../common/decorators';
import { IsUUID } from 'class-validator';

export class CreateConDto {
    @StringFieldDecorator('The support code id', '7f3f5860-a780-41a0-8484-4990a811ddd9', 1, true)
    codeId: string;

    @StringFieldDecorator(
        'Content of the first message to send',
        '7f3f5860-a780-41a0-8484-4990a811ddd9',
        2,
        true,
    )
    content: string;

    @StringArrayFieldDecorator(
        'Files ids attached to message',
        ['7f3f5860-a780-41a0-8484-4990a811ddd9', '7f3f5860-a780-41a0-8484-4990a811ddd9'],
        1,
        false,
    )
    @IsUUID('4', { each: true })
    files?: string[];
}
