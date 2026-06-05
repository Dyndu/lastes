import { EnumFieldDecorator, NumberFieldDecorator } from '../../../common/decorators';
import { DtiOtherDebtsLabelsEnum } from '../../../common/enum';

export class CreateDtiOtherDebtDto {
    @EnumFieldDecorator(DtiOtherDebtsLabelsEnum, 'The label of the new debt', {
        example: DtiOtherDebtsLabelsEnum.AUTO_LOAN,
    })
    label: DtiOtherDebtsLabelsEnum;

    @NumberFieldDecorator('The value of the new debt', 290903)
    value: number;
}
