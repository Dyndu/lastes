import { NumberFieldDecorator } from '../../../common/decorators';

export class CalculateDownPaymentDto {
    @NumberFieldDecorator('Purchase price of the calculator', 300)
    purchasePrice: number;

    @NumberFieldDecorator('Down payment percentage of the calculator', 300, {
        min: 0,
        max: 100,
    })
    downPaymentPercentage: number;
}
