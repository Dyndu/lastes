import { NumberFieldDecorator } from '../../../common/decorators';

export class FExpenseDto {
    @NumberFieldDecorator('The sewer of the fixed expenses', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    sewer: number;

    @NumberFieldDecorator('The water of the fixed expenses', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    water: number;

    @NumberFieldDecorator('The trash of the fixed expenses', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    trash: number;

    @NumberFieldDecorator('The gas of the fixed expenses', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    gas: number;

    @NumberFieldDecorator('The electric of the fixed expenses', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    electric: number;

    @NumberFieldDecorator('The internet of the fixed expenses', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    internet: number;

    @NumberFieldDecorator('The other of the fixed expenses', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    other: number;

    @NumberFieldDecorator('The hoa fees of the fixed expenses', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    hoaFees: number;

    @NumberFieldDecorator('The property taxes of the fixed expenses', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    propertyTaxes: number;

    @NumberFieldDecorator('The hazard insurance of the fixed expenses', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    hazardInsurance: number;

    @NumberFieldDecorator('The additional fees of the fixed expenses', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    additionalFees: number;

    @NumberFieldDecorator('The cash reserves of the fixed expenses', 19, {
        required: true,
        min: 0,
        max: 100,
        allowNegative: false,
    })
    cashReserves: number;

    @NumberFieldDecorator('The management fees of the fixed expenses', 19, {
        required: true,
        min: 0,
        max: 100,
        allowNegative: false,
    })
    managementFees: number;

    @NumberFieldDecorator('The maintenance escrow of the fixed expenses', 19, {
        required: true,
        min: 0,
        max: 100,
        allowNegative: false,
    })
    maintenanceEscrow: number;
}
