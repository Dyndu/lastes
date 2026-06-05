import { BooleanFieldDecorator, NumberFieldDecorator } from '../../../common/decorators';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RItemDto } from './r-item.dto';

export class HDurationDto {
    @NumberFieldDecorator('The duration of the holding in term of months', 19)
    duration: number;

    @NumberFieldDecorator('The value of the transaction fee of the holding duration', 19)
    transactionFee: number;

    @NumberFieldDecorator('The value of the transaction fee of the holding duration', 19)
    otherFee: number;

    @NumberFieldDecorator('The value of the transaction fee of the holding duration', 19)
    targetProfit: number;

    @BooleanFieldDecorator('Holding duration items', true, true)
    hasItems: boolean;

    @NumberFieldDecorator('The holding coast value', 19, {
        required: false,
        min: 0,
        allowNegative: false,
    })
    holdingCoast?: number;

    @ApiProperty({
        required: false,
        type: () => RItemDto,
    })
    @ValidateNested()
    @Type(() => RItemDto)
    @IsOptional()
    item?: RItemDto;
}
