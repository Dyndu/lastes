import { Match, StringFieldDecorator } from '../../../common/decorators';
import { Matches } from 'class-validator';

export class PasswordResetDto {
    @StringFieldDecorator('New password', 'Abcd@1234', 12)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{12,}$/, {
        message:
            'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    })
    newPassword: string;

    @StringFieldDecorator('Confirm password', 'Abcd@1234', 1)
    @Match('newPassword', {
        message: 'Passwords do not match',
    })
    confirmPassword: string;
}
