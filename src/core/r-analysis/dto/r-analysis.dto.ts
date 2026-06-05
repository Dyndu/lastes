import { BaseRentalAnalysisDto } from './base-rental-analysis.dto';
import { NumberFieldDecorator } from '../../../common/decorators';

export class RAnalysisDto extends BaseRentalAnalysisDto {
    @NumberFieldDecorator('PMI monthly amount', 19, { required: false, min: 0 })
    pmi?: number;
}
