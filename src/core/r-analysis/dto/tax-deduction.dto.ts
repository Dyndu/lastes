import { BaseRentalAnalysisDto } from './base-rental-analysis.dto';
import { NumberFieldDecorator } from '../../../common/decorators';

export class TaxDeductionDto extends BaseRentalAnalysisDto {
    @NumberFieldDecorator('Depreciation percentage', 19, { required: true, min: 0, max: 100 })
    depreciationPercent: number;

    @NumberFieldDecorator('Income tax rate override', 19, { required: false, min: 0, max: 100 })
    incomeTaxRateOverride?: number;
}
