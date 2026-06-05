import { NumberFieldDecorator } from '../../../common/decorators';

export class AdItemizedDto {
    @NumberFieldDecorator('The origination fee of the acquisition details', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    originationFee: number;

    @NumberFieldDecorator('The hazard insurance of the acquisition details', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    hazardInsurance: number;

    @NumberFieldDecorator('The flood insurance of the acquisition details', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    floodInsurance: number;

    @NumberFieldDecorator('The property taxes of the acquisition details', 19, {
        required: false,
        min: 0,
        allowNegative: false,
    })
    propertyTaxes: number;

    @NumberFieldDecorator('The annual assessment of the acquisition details', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    annualAssessment: number;

    @NumberFieldDecorator('The escrow fees of the acquisition details', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    escrowFees: number;

    @NumberFieldDecorator('The attorney fees of the acquisition details', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    attorneyFees: number;

    @NumberFieldDecorator('The inspection fees of the acquisition details', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    inspectionFees: number;

    @NumberFieldDecorator('The lender fees of the acquisition details', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    lenderFees: number;

    @NumberFieldDecorator('The recording fees of the acquisition details', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    recordingFees: number;

    @NumberFieldDecorator('The app appraisal of the acquisition details', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    appraisal: number;

    @NumberFieldDecorator('The transfer tax of the acquisition details', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    transferTax: number;

    @NumberFieldDecorator('Other acquisition of the acquisition details', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    other: number;
}
