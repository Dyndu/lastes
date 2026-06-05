import { EnumFieldDecorator, StringFieldDecorator } from '../../../common/decorators';
import { IsUUID } from 'class-validator';
import { UserStatusEnum } from '../../../common/enum';

export class AdminUserUpdateBySDto {
    @StringFieldDecorator('Id of the group', '5a1a6428-8f18-4f79-abf2-1e374a5ffca2', 2, false)
    @IsUUID('4')
    groupId?: string;

    @StringFieldDecorator('Label of the role', 'support', 2, false)
    roleId?: string;

    @EnumFieldDecorator(UserStatusEnum, 'Status of the user', {
        example: UserStatusEnum.SUSPENDED,
        isArray: false,
        required: false,
    })
    status?: UserStatusEnum;
}
