import { BooleanFieldDecorator, NumberFieldDecorator } from '../../../common/decorators';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { HCoastItemizedDto } from './h-coast-itemized.dto';

export class HCoastDto {
    @NumberFieldDecorator('The duration of the holding coast', 19, {
        required: true,
        min: 1,
        allowNegative: false,
    })
    duration: number;

    @NumberFieldDecorator('The pi value of the holding coast', 19, {
        required: true,
        min: 2300,
        max: 2301,
        allowNegative: false,
    })
    pIValue: number;

    @BooleanFieldDecorator('Holding coast items', true, true)
    hasItems: boolean;

    @NumberFieldDecorator('The holding coast value', 19, {
        required: false,
        min: 0,
        allowNegative: false,
    })
    holdingCoast?: number;

    @ApiProperty({
        required: false,
        type: () => HCoastItemizedDto,
    })
    @ValidateNested()
    @Type(() => HCoastItemizedDto)
    @IsOptional()
    item?: HCoastItemizedDto;
}
