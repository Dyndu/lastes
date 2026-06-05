import { BooleanFieldDecorator, NumberFieldDecorator } from '../../../common/decorators';
import { ApiProperty } from '@nestjs/swagger';
import { RItemDto } from './r-item.dto';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class BrRefiDto {
    @NumberFieldDecorator('After repairs value of the refinance', 19)
    afterRepairValue: number;

    @NumberFieldDecorator('Refinance LTV in percentage', 19, { min: 0, max: 100 })
    refiLTV: number;

    @NumberFieldDecorator('New loan amount of the refinance', 19)
    oldLoanAmount: number;

    @NumberFieldDecorator('Principal & interest of the refinance', 19)
    pInterest: number;

    @NumberFieldDecorator('Interest in percentage of the refinance', 19, { min: 0, max: 100 })
    interestRate: number;

    @NumberFieldDecorator('The pmi value of the refinance', 19)
    pmi: number;

    @NumberFieldDecorator('The point value of the refinance', 19)
    point: number;

    @BooleanFieldDecorator('Holding items', true, true)
    hasItems: boolean;

    @NumberFieldDecorator('The refinance coast value', 19, {
        required: false,
        min: 0,
        allowNegative: false,
    })
    closingCoast?: number;

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
