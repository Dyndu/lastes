import { BooleanFieldDecorator, StringFieldDecorator } from '../../../common/decorators';

export class UserLoginDto {
    @StringFieldDecorator('Email of the user', 'lazaresagbo@gmail.com', 5, true, true)
    email: string;

    @StringFieldDecorator('New password', 'Abcd@1234')
    password: string;

    @BooleanFieldDecorator('Remember me', true, false)
    rememberMe?: boolean;
}
