import { BaseRentalAnalysisDto } from './base-rental-analysis.dto';
import { NumberFieldDecorator } from '../../../common/decorators';
import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested } from 'class-validator';
import { RentalSummaryAppreciationDto } from './r-summary-appreciation.dto';
import { Type } from 'class-transformer';

export class RentalSummaryDto extends BaseRentalAnalysisDto {
    @NumberFieldDecorator('Depreciation percentage', 19, { required: true, min: 0, max: 100 })
    depreciationPercent: number;

    @NumberFieldDecorator('Income tax rate override', 19, { required: false, min: 0, max: 100 })
    incomeTaxRateOverride?: number;

    @ApiProperty({ required: false, type: () => RentalSummaryAppreciationDto })
    @ValidateNested()
    @Type(() => RentalSummaryAppreciationDto)
    appreciation?: RentalSummaryAppreciationDto;
}
