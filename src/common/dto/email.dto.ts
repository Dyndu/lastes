import { StringFieldDecorator } from '../decorators';

export class EmailDto {
    @StringFieldDecorator('Email of the user', 'lazaresagbo@gmail.com', 5, true, true)
    email: string;
}
