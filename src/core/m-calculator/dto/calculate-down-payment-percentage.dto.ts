import { NumberFieldDecorator } from '../../../common/decorators';

export class CalculateDownPaymentPercentageDto {
    @NumberFieldDecorator('Purchase price of the calculator', 300)
    purchasePrice: number;

    @NumberFieldDecorator('Down payment amount of the calculator', 300)
    downPaymentAmount: number;
}
