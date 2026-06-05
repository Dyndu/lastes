import {
    NumberFieldDecorator,
    StringFieldDecorator,
    BooleanFieldDecorator,
    StringArrayFieldDecorator,
} from '../../../common/decorators';
import { IsUUID } from 'class-validator';

export class PSettingCreateDto {
    @StringFieldDecorator('Label of the new setting profile', 'My Profile', 2)
    label: string;

    @NumberFieldDecorator('Tax rate of the profile', 2, { required: false })
    taxRate?: number;

    @NumberFieldDecorator('Occupancy rate of the profile', 95, {
        required: false,
    })
    occupancyRate?: number;

    @NumberFieldDecorator('Management fees percentage', 10, { required: false })
    managementFees?: number;

    @NumberFieldDecorator('Maintenance escrow percentage', 5, {
        required: false,
    })
    maintenanceEscrow?: number;

    @NumberFieldDecorator('Cash reserves amount', 5000, { required: false })
    cashReserves?: number;

    @NumberFieldDecorator('Cap rate target', 8, { required: false })
    capRate?: number;

    @NumberFieldDecorator('Gross Operating Income (GOI)', 100000, {
        required: false,
    })
    goi?: number;

    @NumberFieldDecorator('Net Operating Income (NOI)', 80000, {
        required: false,
    })
    noi?: number;

    @NumberFieldDecorator('Break-even ratio (BER)', 70, { required: false })
    ber?: number;

    @NumberFieldDecorator('Operating expense ratio (OER)', 40, {
        required: false,
    })
    oer?: number;

    @NumberFieldDecorator('Debt service coverage ratio (DSCR)', 1.2, {
        required: false,
    })
    dscr?: number;

    @NumberFieldDecorator('Gross rent multiplier (GRM)', 10, {
        required: false,
    })
    grm?: number;

    @NumberFieldDecorator('Annual gross multiplier (AGM)', 12, {
        required: false,
    })
    agm?: number;

    @NumberFieldDecorator('Cash on cash return (CoC)', 15, { required: false })
    coc?: number;

    @NumberFieldDecorator('Monthly cash flow', 500, {
        required: false,
        allowNegative: true,
        min: -999999,
    })
    cashFlow?: number;

    @NumberFieldDecorator('Full-term ROI', 20, { required: false })
    fTermRoi?: number;

    @NumberFieldDecorator('Yearly income', 12000, { required: false })
    yearlyIncome?: number;

    @NumberFieldDecorator('Return on investment (ROI)', 18, { required: false })
    roi?: number;

    @NumberFieldDecorator('Payback period (years)', 5, { required: false })
    payBackPeriod?: number;

    @BooleanFieldDecorator('One percent rule enabled', true, false)
    onePercent?: boolean;

    @BooleanFieldDecorator('Two percent rule enabled', false, false)
    twoPercent?: boolean;

    @BooleanFieldDecorator('Fifty percent rule enabled', false, false)
    fiftyPercent?: boolean;

    @NumberFieldDecorator('Monthly cash flow', 500, {
        required: false,
        allowNegative: true,
        min: -999999,
    })
    cashFlowAtLeast?: number;

    @NumberFieldDecorator('Maximum cash needed', 20000, { required: false })
    cashNeeded?: number;

    @StringArrayFieldDecorator(
        'Metrics assign to the profile setting',
        ['7f3f5860-a780-41a0-8484-4990a811ddd9', '3fb7cde0-35d2-43b7-8172-87ddae7fda60'],
        1,
        false,
    )
    @IsUUID('4', { each: true })
    metrics?: string[];
}
