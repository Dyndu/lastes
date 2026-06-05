import { NumberFieldDecorator } from '../../../common/decorators';
import { TaxDeductionDto } from './tax-deduction.dto';

export class AppreciationDto extends TaxDeductionDto {
    @NumberFieldDecorator('Annual appreciation rate percentage', 19, {
        required: false,
        min: 0,
        max: 100,
    })
    annualAppreciationRate?: number = 3;
}
