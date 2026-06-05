import { IsArray, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CFinancingGlobalParamsDto } from './c-financing-global-params.dto';
import { CFinancingColumnInputDto } from './c-financing-column-Input.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CFinancingCalculatorDto {
    @ApiProperty({ required: true, type: () => CFinancingGlobalParamsDto })
    @ValidateNested()
    @Type(() => CFinancingGlobalParamsDto)
    @IsOptional()
    globalParams?: CFinancingGlobalParamsDto;

    @ApiProperty({
        required: true,
        type: () => CFinancingColumnInputDto,
        isArray: true,
    })
    @IsArray()
    @IsNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => CFinancingColumnInputDto)
    columns: CFinancingColumnInputDto[];
}
