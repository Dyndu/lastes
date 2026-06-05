import {
    EnumFieldDecorator,
    IsValidZipCode,
    NumberFieldDecorator,
    StringFieldDecorator,
} from '../../../common/decorators';
import { PropertyDetailsTypeEnum } from '../../../common/enum';

export class CreateDtiPropertyDto {
    @StringFieldDecorator('Street address of the property', 'Avenue Jean Paul ||', 4)
    streetAddress: string;

    @StringFieldDecorator('City of the property', 'Toronto', 3)
    city: string;

    @StringFieldDecorator('State of the property', 'Crenshaw', 3)
    state: string;

    @StringFieldDecorator('Zip code of the property', 'Crenshaw', 3)
    @IsValidZipCode()
    zipCode: string;

    @EnumFieldDecorator(PropertyDetailsTypeEnum, 'Property type', {
        required: true,
        example: PropertyDetailsTypeEnum.SINGLE_FAMILY,
    })
    propertyType: PropertyDetailsTypeEnum;

    @NumberFieldDecorator('Principal & Interest of the property expense', 299)
    principalInterest: number;

    @NumberFieldDecorator('Taxes and Escrow of the property expense', 299)
    taxesEscrow: number;

    @NumberFieldDecorator('Private Mortgage Insurance of the property expense', 299)
    pMInsurance: number;

    @NumberFieldDecorator('Hoa fees of the property expense', 299)
    hoaFees: number;

    @NumberFieldDecorator('Monthly rental income of the property expense', 299)
    monthlyRentalIncome: number;
}
