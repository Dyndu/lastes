import { StringFieldDecorator } from '../../../common/decorators';
import { Matches } from 'class-validator';

export class VerifyUserCodeDto {
    @StringFieldDecorator('Email of the user', 'lazaresa@gmail.com', 5, true, true)
    email: string;

    @Matches(/^\d+$/, { message: 'Code must contain only numbers' })
    @StringFieldDecorator('Code', '123456', 5, true, false, 6)
    code: string;
}
