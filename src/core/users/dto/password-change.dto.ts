import { Matches } from 'class-validator';
import { IsDifferentFrom, Match, StringFieldDecorator } from '../../../common/decorators';

export class PasswordChangeDto {
    @StringFieldDecorator('Old password', 'Abcd@1234', 2)
    oldPassword: string;

    @StringFieldDecorator('New password', 'Abcd@1234', 12)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{12,}$/, {
        message:
            'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    })
    @IsDifferentFrom('oldPassword', {
        message: 'New password must be different from old password',
    })
    newPassword: string;

    @StringFieldDecorator('Confirm password', 'Abcd@1234', 1)
    @Match('newPassword', {
        message: 'Passwords do not match',
    })
    confirmPassword: string;
}
