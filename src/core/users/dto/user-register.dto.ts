import { Match, StringFieldDecorator } from '../../../common/decorators';
import { Matches } from 'class-validator';

export class UserRegisterDto {
    @StringFieldDecorator('Fullname of the user', 'Lazare SAGBOHAN', 5)
    fullname: string;

    @StringFieldDecorator('Email of the user', 'lazaresagbo@gmail.com', 5, true, true)
    email: string;

    @StringFieldDecorator('Password of the user', 'Abcd@1234546789', 12)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{12,}$/, {
        message:
            'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    })
    password: string;

    @StringFieldDecorator('Confirm password', 'Abcd@1234546789', 1)
    @Match('password', {
        message: 'Passwords do not match',
    })
    confirmPassword: string;
}
