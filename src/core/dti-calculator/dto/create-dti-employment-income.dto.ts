import { NumberFieldDecorator, StringFieldDecorator } from '../../../common/decorators';

export class CreateDtiEmploymentIncomeDto {
    @StringFieldDecorator('The label of the new employment income', 'Primary employment')
    label: string;

    @NumberFieldDecorator('The value of the new employment income', 290903)
    value: number;
}
