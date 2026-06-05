import { NumberFieldDecorator, StringFieldDecorator } from '../../../common/decorators';

export class CFinancingColumnInputDto {
    @StringFieldDecorator('Label of the item', 'New Label', 2)
    label: string;

    @NumberFieldDecorator('Purchase price of the item', 100, { min: 0 })
    purchasePrice: number;

    @NumberFieldDecorator('Down payment of the item', 100, { min: 0 })
    downPayment: number;

    @NumberFieldDecorator('Interest rate', 100, { min: 0, max: 100 })
    interestRate: number;

    @NumberFieldDecorator('Loan length in number of years', 100, { min: 0 })
    loanLengthYears: number;

    @NumberFieldDecorator('Closing coast amount value', 100, { min: 0 })
    closingCosts: number;

    @NumberFieldDecorator('Rehab coast amount value', 100, { min: 0 })
    rehabCosts: number;

    @NumberFieldDecorator('Monthly income amount value', 100, { min: 0 })
    monthlyIncome: number;

    @NumberFieldDecorator('Monthly fixed expense amount value', 100, { min: 0 })
    monthlyFixedExpenses: number;

    @NumberFieldDecorator('Refi interest rate', 100, { required: false, min: 0, max: 100 })
    refiInterestRate?: number = 0;

    @NumberFieldDecorator('Refi loan length in number of years ', 100, { required: false, min: 0 })
    refiLoanLengthYears?: number = 0;

    @NumberFieldDecorator('Refi closing coast value', 100, { required: false, min: 0 })
    refiClosingCosts?: number = 0;
}
