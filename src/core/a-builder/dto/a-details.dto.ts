import {
    BooleanFieldDecorator,
    EnumFieldDecorator,
    NumberFieldDecorator,
} from '../../../common/decorators';
import { ApiProperty } from '@nestjs/swagger';
import { AdItemizedDto } from './ad-itemized.dto';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AcquisitionLoanTypeEnum, AcquisitionMethodEnum } from '../../../common/enum';

export class ADetailsDto {
    @EnumFieldDecorator(AcquisitionMethodEnum, 'Acquisition details method', {
        required: true,
        example: AcquisitionMethodEnum.CASH,
    })
    method: AcquisitionMethodEnum;

    @NumberFieldDecorator('The purchase price of the acquisition details', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    purchasePrice: number;

    @NumberFieldDecorator('The seller concessions of the acquisition details', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    sellerConcessions: number;

    @NumberFieldDecorator('The credits of the acquisition details', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    credits: number;

    @BooleanFieldDecorator('The credits of the acquisition details', true, true)
    hasItems: boolean;

    @NumberFieldDecorator('The acquisition coast of the acquisition details', 19, {
        required: false,
        min: 0,
        allowNegative: false,
    })
    acquisitionCoast?: number;

    @NumberFieldDecorator('The down payment of the acquisition details', 19, {
        required: false,
        min: 0,
        allowNegative: false,
    })
    downPayment?: number;

    @NumberFieldDecorator('The loan interest of the acquisition details', 19, {
        required: false,
        min: 0,
        max: 100,
        allowNegative: false,
    })
    loanInterest?: number;

    @NumberFieldDecorator('The number of points', 19, {
        required: false,
        min: 0,
        max: 100,
        allowNegative: false,
    })
    points?: number;

    @NumberFieldDecorator('The loan length of the acquisition details', 19, {
        required: false,
        min: 0,
        allowNegative: false,
    })
    loanLength?: number;

    @NumberFieldDecorator('The monthly income of the acquisition details', 19, {
        required: false,
        min: 0,
        allowNegative: false,
    })
    monthlyIncome?: number;

    @NumberFieldDecorator('The earnest money deposit of the acquisition details', 19, {
        required: false,
        min: 0,
        allowNegative: false,
    })
    earnestMoneyDeposit?: number;

    @NumberFieldDecorator('The closing cost fees of the acquisition details', 19, {
        required: false,
        min: 0,
        allowNegative: false,
    })
    closingCostFees?: number;

    @NumberFieldDecorator('The holding period of the acquisition details', 19, {
        required: false,
        min: 0,
        allowNegative: false,
    })
    holdingPeriod?: number;

    @NumberFieldDecorator('The other fees of the acquisition details', 19, {
        required: false,
        min: 0,
        allowNegative: false,
    })
    othersFees?: number;

    @EnumFieldDecorator(
        AcquisitionLoanTypeEnum,
        'Loan type when acquisition details method is financed',
        {
            required: false,
            example: AcquisitionLoanTypeEnum.BridgeLoan,
        },
    )
    loanType?: AcquisitionLoanTypeEnum;

    @ApiProperty({
        required: false,
        type: () => AdItemizedDto,
    })
    @ValidateNested()
    @Type(() => AdItemizedDto)
    @IsOptional()
    item?: AdItemizedDto;
}
