import { BooleanFieldDecorator, StringFieldDecorator } from '../../../common/decorators';
import { IsUUID } from 'class-validator';

export class AdminRegisterDto {
    @StringFieldDecorator('Email of the user', 'lazaresagbo@gmail.com', 5, true, true)
    email: string;

    @StringFieldDecorator('Role ot the administrator', 'support', 2, true)
    role: string;

    @StringFieldDecorator('Group ot the administrator', 'admin-group', 2, false)
    @IsUUID('4')
    groupId?: string;

    @BooleanFieldDecorator('User is authorized or not', true)
    isAuthorized: boolean;
}
