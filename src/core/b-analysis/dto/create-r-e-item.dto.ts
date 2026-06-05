import {
    EnumFieldDecorator,
    NumberFieldDecorator,
    StringFieldDecorator,
} from '../../../common/decorators';
import { CalculationMethodEnum } from '../../../common/enum';

export class CreateREItemDto {
    @StringFieldDecorator('The type expense label', 'Roof Maintenance', 2, true)
    label: string;

    @EnumFieldDecorator(
        CalculationMethodEnum,
        'The calculation method of the record of the expense',
        { example: CalculationMethodEnum.LABOR_MATERIAL },
    )
    cMethod: CalculationMethodEnum;

    @NumberFieldDecorator('The value of the labor')
    laborValue: number;

    @NumberFieldDecorator('The value of the material')
    materialValue: number;

    @NumberFieldDecorator('The manually entered total (only used for LABOR_MATERIAL method)', 100, {
        required: false,
    })
    total?: number;
}
