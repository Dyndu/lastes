import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RItemDto } from './r-item.dto';
import { NumberFieldDecorator } from '../../../common/decorators';

export class CreateRepairsDto {
    @NumberFieldDecorator('Total coast of the repairs', 100, { required: false })
    total?: number;

    @NumberFieldDecorator('After repairs value of the repairs', 100, { required: false })
    afterRepairValue?: number;

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
