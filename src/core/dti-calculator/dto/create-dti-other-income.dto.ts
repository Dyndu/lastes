import { EnumFieldDecorator, NumberFieldDecorator } from '../../../common/decorators';
import { DtiOtherIncomeLabelsEnum } from '../../../common/enum';

export class CreateDtiOtherIncomeDto {
    @EnumFieldDecorator(DtiOtherIncomeLabelsEnum, 'The label of the new income', {
        example: DtiOtherIncomeLabelsEnum.BONUS_PAY,
    })
    label: DtiOtherIncomeLabelsEnum;

    @NumberFieldDecorator('The value of the new income', 290903)
    value: number;
}
