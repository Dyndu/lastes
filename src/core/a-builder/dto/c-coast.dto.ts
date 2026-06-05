import { BooleanFieldDecorator, NumberFieldDecorator } from '../../../common/decorators';
import { ApiProperty } from '@nestjs/swagger';
import { RItemDto } from './r-item.dto';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CCoastDto {
    @NumberFieldDecorator('Repairs contingency percentage', 100, { min: 0, max: 100 })
    rContingency: number;

    @NumberFieldDecorator('Duration in month of carrying coast', 100)
    duration: number;

    @BooleanFieldDecorator('The credits of the acquisition details', true, true)
    hasItems: boolean;

    @NumberFieldDecorator('Total coast of the carrying coast', 100, { required: false })
    holdingCoast?: number;

    @ApiProperty({
        description: 'Exterior repairs details',
        required: false,
        type: () => RItemDto,
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => RItemDto)
    eRepairs?: RItemDto;

    @ApiProperty({
        description: 'Interior repairs details',
        required: false,
        type: () => RItemDto,
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => RItemDto)
    iRepairs?: RItemDto;

    @ApiProperty({
        description: 'Other repairs details',
        required: false,
        type: () => RItemDto,
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => RItemDto)
    oRepairs?: RItemDto;
}
