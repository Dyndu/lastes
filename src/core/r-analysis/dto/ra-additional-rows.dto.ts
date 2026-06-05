import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested, IsArray, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { AdditionalLineItemDto } from './additional-line-item.dto';

export class RaAdditionalRowsDto {
    @ApiProperty({ required: false, type: () => [AdditionalLineItemDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AdditionalLineItemDto)
    additionalPurchaseCosts?: AdditionalLineItemDto[];

    @ApiProperty({ required: false, type: () => [AdditionalLineItemDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AdditionalLineItemDto)
    additionalFixedExpenses?: AdditionalLineItemDto[];

    @ApiProperty({ required: false, type: () => [AdditionalLineItemDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AdditionalLineItemDto)
    additionalIncome?: AdditionalLineItemDto[];
}
