import { TaxDeductionDto } from './tax-deduction.dto';
import { NumberFieldDecorator } from '../../../common/decorators';

export class BuyHoldDto extends TaxDeductionDto {
    @NumberFieldDecorator('Annual appreciation rate percentage', 19, {
        required: false,
        min: 0,
        max: 100,
    })
    annualAppreciationRate?: number = 3;

    @NumberFieldDecorator('Annual income increase percentage', 19, {
        required: false,
        min: 0,
        max: 100,
    })
    incomeIncreasePerYear?: number = 0;

    @NumberFieldDecorator('Annual expense increase percentage', 19, {
        required: false,
        min: 0,
        max: 100,
    })
    expenseIncreasePerYear?: number = 0;

    @NumberFieldDecorator('Selling costs percentage', 19, { required: false, min: 0, max: 100 })
    sellingCosts?: number = 6;

    @NumberFieldDecorator('Vacancy rate percentage', 19, { required: false, min: 0, max: 100 })
    vacancy?: number = 5;
}
