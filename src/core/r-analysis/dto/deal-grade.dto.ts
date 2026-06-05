import { BaseRentalAnalysisDto } from './base-rental-analysis.dto';
import { NumberFieldDecorator } from '../../../common/decorators';

export class DealGradeDto extends BaseRentalAnalysisDto {
    @NumberFieldDecorator('ZIP average cap rate percentage', 19, {
        required: true,
        min: 0,
        max: 100,
    })
    zipCapAvg: number;

    @NumberFieldDecorator('Minimum monthly cash flow target', 19, { required: false, min: 0 })
    minCashflowTarget?: number = 200;

    @NumberFieldDecorator('Debt risk flag: 0=fixed, 1=variable, 2=balloon', 19, {
        required: false,
        min: 0,
        max: 2,
    })
    debtRiskFlag?: number = 0;

    @NumberFieldDecorator('Capital extracted', 19, { required: false, min: 0 })
    capitalExtracted?: number = 0;
}
