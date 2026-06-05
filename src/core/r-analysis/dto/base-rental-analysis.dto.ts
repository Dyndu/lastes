import { NumberFieldDecorator, StringFieldDecorator } from '../../../common/decorators';
import { RaAdditionalRowsDto } from './ra-additional-rows.dto';
import { IsUUID } from 'class-validator';

export class BaseRentalAnalysisDto extends RaAdditionalRowsDto {
    @NumberFieldDecorator('LTV percentage', 19, { required: true, min: 0, max: 100 })
    ltv: number;

    @NumberFieldDecorator('Occupancy rate percentage', 19, { required: true, min: 0, max: 100 })
    occupancyRate: number;

    @NumberFieldDecorator('Management fee percentage', 19, { required: true, min: 0, max: 100 })
    managementFeePercent: number;

    @NumberFieldDecorator('Maintenance escrow percentage', 19, { required: true, min: 0, max: 100 })
    maintenanceEscrowPercent: number;

    @StringFieldDecorator('Setting profile ID', '3fb7cde0-35d2-43b7-8172-87ddae7fda60', 0, false)
    @IsUUID('4')
    settingId?: string;
}
