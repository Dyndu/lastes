import { ApiProperty } from '@nestjs/swagger';
import {
    ADetailsDto,
    CreatePDetailsDto,
    CreateRepairsDto,
    FExpenseDto,
    HDurationDto,
} from '../../a-builder/dto';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWholesaleBuilderDto {
    @ApiProperty({ required: true, type: () => CreatePDetailsDto })
    @ValidateNested()
    @Type(() => CreatePDetailsDto)
    propertyDetails: CreatePDetailsDto;

    @ApiProperty({ required: true, type: () => ADetailsDto })
    @ValidateNested()
    @Type(() => ADetailsDto)
    acquisitionDetails: ADetailsDto;

    @ApiProperty({ required: true, type: () => CreateRepairsDto })
    @ValidateNested()
    @Type(() => CreateRepairsDto)
    repairs: CreateRepairsDto;

    @ApiProperty({ required: true, type: () => FExpenseDto })
    @ValidateNested()
    @Type(() => FExpenseDto)
    fixedExpenses: FExpenseDto;

    @ApiProperty({ required: true, type: () => HDurationDto })
    @ValidateNested()
    @Type(() => HDurationDto)
    hDuration: HDurationDto;
}
