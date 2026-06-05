import { EnumFieldDecorator, NumberFieldDecorator } from '../../../common/decorators';
import { UnitsDto } from './units.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PropertyDetailsTypeEnum } from '../../../common/enum';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePDetailsDto {
    @EnumFieldDecorator(PropertyDetailsTypeEnum, 'Property details type', {
        required: true,
        example: PropertyDetailsTypeEnum.SINGLE_FAMILY,
    })
    status: PropertyDetailsTypeEnum;

    @NumberFieldDecorator('The monthly income ot the property', 19, {
        required: false,
        min: 0,
        allowNegative: false,
    })
    monthlyIncome?: number;

    @ApiPropertyOptional({
        type: [UnitsDto],
        description: 'Units of the property',
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UnitsDto)
    units: UnitsDto[];
}
