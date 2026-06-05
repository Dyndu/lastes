import { NumberFieldDecorator } from '../../../common/decorators';

export class HCoastItemizedDto {
    @NumberFieldDecorator('The electricity coast of holding coast', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    electricity: number;

    @NumberFieldDecorator('The water coast of holding coast', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    water: number;

    @NumberFieldDecorator('The gas coast of holding coast', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    gas: number;

    @NumberFieldDecorator('The insurance coast of holding coast', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    insurance: number;

    @NumberFieldDecorator('The trash coast of holding coast', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    trash: number;

    @NumberFieldDecorator('The property taxes of holding coast', 19, {
        required: false,
        min: 0,
        allowNegative: false,
    })
    propertyTaxes: number;

    @NumberFieldDecorator('The others fees of holding coast', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    other: number;
}
