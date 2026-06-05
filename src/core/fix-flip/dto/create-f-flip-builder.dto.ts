import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import {
    ADetailsDto,
    CreatePDetailsDto,
    CreateRepairsDto,
    CreateSaleDto,
    HCoastDto,
} from '../../a-builder/dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFFlipBuilderDto {
    @ApiProperty({
        required: true,
        type: () => CreatePDetailsDto,
    })
    @ValidateNested()
    @Type(() => CreatePDetailsDto)
    propertyDetails: CreatePDetailsDto;

    @ApiProperty({
        required: true,
        type: () => ADetailsDto,
    })
    @ValidateNested()
    @Type(() => ADetailsDto)
    acquisitionDetails: ADetailsDto;

    @ApiProperty({
        required: true,
        type: () => CreateRepairsDto,
    })
    @ValidateNested()
    @Type(() => CreateRepairsDto)
    repairs: CreateRepairsDto;

    @ApiProperty({
        required: true,
        type: () => HCoastDto,
    })
    @ValidateNested()
    @Type(() => HCoastDto)
    hCoast: HCoastDto;

    @ApiProperty({
        required: true,
        type: () => CreateSaleDto,
    })
    @ValidateNested()
    @Type(() => CreateSaleDto)
    sale: CreateSaleDto;
}
