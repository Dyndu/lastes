import {
    DateFieldDecorator,
    EnumFieldDecorator,
    NumberFieldDecorator,
} from '../../../common/decorators';
import { CreditScoreEnum, MCalculatorTypeEnum } from '../../../common/enum';

export class CreateMCalculatorDto {
    @NumberFieldDecorator('Purchase price of the calculator', 300)
    purchasePrice: number;

    @NumberFieldDecorator('Down payment amount of the calculator', 300)
    downPaymentAmount: number;

    @NumberFieldDecorator('Down payment percentage of the calculator', 300, {
        min: 0,
        max: 100,
    })
    downPaymentPercentage: number;

    @NumberFieldDecorator('Interest rate of the calculator', 300, { min: 0, max: 100 })
    interestRate: number;

    @NumberFieldDecorator('Loan term in years of the calculator', 300)
    loanTerm: number;

    @EnumFieldDecorator(MCalculatorTypeEnum, 'Calculator type enum', {
        example: MCalculatorTypeEnum.ADVANCED,
    })
    typeEnum: MCalculatorTypeEnum;

    @DateFieldDecorator('The date where loan will be started', '2024-12-01T00:00:00.000Z', {
        required: false,
    })
    loanStartDate?: string;

    @NumberFieldDecorator('Annual property taxes of the calculator', 300, { required: false })
    annualPropertyTaxes?: number;

    @NumberFieldDecorator('Annual home insurance of the calculator', 300, { required: false })
    annualHomeInsurance?: number;

    @NumberFieldDecorator('Additional monthly payment of the calculator', 300, { required: false })
    additionalMonthlyPayment?: number;

    @EnumFieldDecorator(CreditScoreEnum, 'Credit score range', {
        required: false,
        example: CreditScoreEnum.EXCELLENT,
    })
    creditScore?: CreditScoreEnum;
}
