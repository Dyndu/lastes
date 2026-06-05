import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ADetailsDto, CreatePDetailsDto, CreateRepairsDto, FExpenseDto } from '../../a-builder/dto';

export class CreateRaBuilderDto {
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
}
