import { EnumFieldDecorator, StringFieldDecorator } from '../../../common/decorators';
import { ModuleMethodEnum } from '../../../common/enum';
import { IsDefined, ValidateIf } from 'class-validator';

export class MRelationDto {
    @EnumFieldDecorator(ModuleMethodEnum, 'Specify either a creation or update an existing one', {
        required: true,
        example: ModuleMethodEnum.UPDATE,
    })
    method: ModuleMethodEnum;

    @ValidateIf((o) => o.method === 'UPDATE')
    @IsDefined({ message: 'id is required when method is UPDATE' })
    @StringFieldDecorator(
        'Id of existing module use, feature or header',
        '34eeee5a-f3a5-46bc-8502-7160d04114be',
        2,
        false,
    )
    id?: string;

    @ValidateIf((o) => o.method === ModuleMethodEnum.CREATE)
    @IsDefined({ message: 'label is required when method is CREATE' })
    @StringFieldDecorator('Label of module use, feature or header', 'Whatever', 2, false)
    label?: string;

    @ValidateIf((o) => o.method === 'CREATE')
    @IsDefined({ message: 'icon is required when method is CREATE' })
    @StringFieldDecorator('Icon of module use, feature or header', 'Whatever', 1, false)
    icon?: string;
}
