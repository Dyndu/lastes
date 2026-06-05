import { EnumFieldDecorator, StringFieldDecorator } from '../../../common/decorators';
import { ModuleTypeEnum } from '../../../common/enum';
import { IsUUID } from 'class-validator';

export class ModuleUpdateDto {
    @StringFieldDecorator('Label of the module', 'Fix and flip', 2, false)
    label?: string;

    @StringFieldDecorator('Color of the module', '#235345', 2, false)
    color?: string;

    @StringFieldDecorator('Icon of the module', 'fix-and-flip', 2, false)
    icon?: string;

    @StringFieldDecorator('Description of the module', 'A big text', 2, false)
    description?: string;

    @StringFieldDecorator(
        'How to use description of the module',
        'Come to me, all those who are laboured and burden',
        2,
        false,
    )
    usageDescription?: string;

    @EnumFieldDecorator(ModuleTypeEnum, 'Module type', {
        example: ModuleTypeEnum.MODULE,
        required: false,
    })
    type?: ModuleTypeEnum;

    @StringFieldDecorator('Media link of the module', 'the file id', 2, false)
    @IsUUID('4')
    link?: string;
}
