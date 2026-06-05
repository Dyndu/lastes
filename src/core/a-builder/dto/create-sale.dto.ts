import { NumberFieldDecorator } from '../../../common/decorators';
import { ApiProperty } from '@nestjs/swagger';
import { AdItemizedDto } from './ad-itemized.dto';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSaleDto {
    @NumberFieldDecorator('The value after repairs', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    afterRepairValue: number;

    @NumberFieldDecorator('The target profit of the sales', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    targetProfit: number;

    @NumberFieldDecorator('The value of the agent commission of the sale.', 19, {
        required: false,
        min: 0,
        max: 6,
        allowNegative: false,
    })
    agentCommission: number;

    @NumberFieldDecorator('The value of the closing coast of the sale.', 19, {
        required: false,
        min: 0,
        allowNegative: false,
    })
    saleClosingCoast?: number;

    @ApiProperty({
        required: false,
        type: () => AdItemizedDto,
    })
    @ValidateNested()
    @Type(() => AdItemizedDto)
    @IsOptional()
    item?: AdItemizedDto;
}
