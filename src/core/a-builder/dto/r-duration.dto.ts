import { BooleanFieldDecorator, NumberFieldDecorator } from '../../../common/decorators';
import { ApiProperty } from '@nestjs/swagger';
import { AdItemizedDto } from './ad-itemized.dto';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RDurationDto {
    @NumberFieldDecorator('The duration of the rehab in years', 19)
    rehabDuration: number;

    @NumberFieldDecorator('Rehab contingency', 19, {
        min: 0,
        max: 100,
    })
    rContingency: number;

    @BooleanFieldDecorator('Either the rehab has items or not', true, true)
    hasItems: boolean;

    @NumberFieldDecorator('Total holding coast', 19, {
        required: false,
    })
    holdingCoast?: number;

    @ApiProperty({
        required: false,
        type: () => AdItemizedDto,
    })
    @ValidateNested()
    @Type(() => AdItemizedDto)
    @IsOptional()
    item?: AdItemizedDto;
}
