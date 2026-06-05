import { IsUUID, IsUrl } from 'class-validator';
import { StringFieldDecorator } from '../../../common/decorators';

export class AddMediaDto {
    @StringFieldDecorator('The main file id', '432715fa-b1dd-41b0-b895-bed6f3952588', 2, false)
    @IsUUID('4')
    fileId?: string;

    @StringFieldDecorator('The file full link', 'https://s3.example.com/image.png', 2, false)
    @IsUrl()
    fileLink?: string;

    @StringFieldDecorator('The thumbnail file id', '432715fa-b1dd-41b0-b895-bed6f3952588', 2, false)
    @IsUUID('4')
    thumbnailId?: string;

    @StringFieldDecorator(
        'The thumbnail file full link',
        'https://s3.example.com/image.png',
        2,
        false,
    )
    @IsUrl()
    thumbnailLink?: string;
}
