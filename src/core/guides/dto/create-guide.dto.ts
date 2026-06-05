import {
    BooleanFieldDecorator,
    EnumFieldDecorator,
    StringFieldDecorator,
} from '../../../common/decorators';
import { GuideStatusEnum } from '../../../common/enum';
import { IsUUID } from 'class-validator';

export class CreateGuideDto {
    @StringFieldDecorator('Title of the guide', 'Fist title', 2)
    label: string;

    @StringFieldDecorator('Either thumbnail or video id', '759669c6-d2d0-42fa-860c-93cba1838ea6', 2)
    @IsUUID('4')
    fileId: string;

    @StringFieldDecorator('Category id', '759669c6-d2d0-42fa-860c-93cba1838ea6', 2)
    @IsUUID('4')
    categoryId: string;

    @EnumFieldDecorator(GuideStatusEnum, 'Status of the guide', {
        example: GuideStatusEnum.DRAFT,
        required: true,
        isArray: false,
    })
    status: GuideStatusEnum;

    @StringFieldDecorator('Description of the guide', 'Fist description', 4, false)
    description?: string;

    @StringFieldDecorator('Content of the guide', 'Fist description', 4, false)
    content?: string;

    @BooleanFieldDecorator('Specify if the guide is a video or not', true, true)
    isVideo: boolean;
}
