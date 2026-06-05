import { NumberFieldDecorator } from '../../../common/decorators';

export class RentalSummaryAppreciationDto {
    @NumberFieldDecorator('Years until exit', 19, {
        required: false,
        min: 1,
        allowNegative: false,
    })
    yearsToExit?: number = 30;

    @NumberFieldDecorator('Annual appreciation rate percentage', 19, {
        required: false,
        min: 0,
        allowNegative: false,
    })
    annualAppreciationRate?: number = 3;

    @NumberFieldDecorator('Additional equity input', 19, {
        required: false,
        min: 0,
        allowNegative: false,
    })
    additionalEquity?: number = 0;
}
