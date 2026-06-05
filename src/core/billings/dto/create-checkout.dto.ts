import { StringFieldDecorator } from '../../../common/decorators';
import { ChangePeriodDto } from './change-period.dto';

export class CreateCheckoutDto extends ChangePeriodDto {
    @StringFieldDecorator('The code of the affiliation code', 'CDGHNKML', 8, false)
    couponCode?: string;
}
