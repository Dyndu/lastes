import { NumberFieldDecorator } from '../../../common/decorators';

export class UnitsDto {
    @NumberFieldDecorator('The sq footage of the unit', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    sqFootage: number;

    @NumberFieldDecorator('The number of bedrooms of the unit', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    bedRooms: number;

    @NumberFieldDecorator('The number of bathrooms of the unit', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    bathRooms: number;

    @NumberFieldDecorator('The monthly rent amount of the unit', 19, {
        required: true,
        min: 0,
        allowNegative: false,
    })
    monthlyRent: number;
}
