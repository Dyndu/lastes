import { NumberFieldDecorator } from '../../../common/decorators';

export class CFinancingGlobalParamsDto {
    @NumberFieldDecorator('Annual appreciation rate', 9, { required: false, min: 0, max: 100 })
    annualAppreciationRate?: number = 3;

    @NumberFieldDecorator('Depreciation percentage', 9, { required: false, min: 0, max: 100 })
    depreciationPercentage?: number = 80;

    @NumberFieldDecorator('Investor tax bracket', 9, { required: false, min: 0, max: 100 })
    investorTaxBracket?: number = 0;
}
