import { PartialType } from '@nestjs/swagger';
import { CreateDtiPropertyDto } from './create-dti-property.dto';
import { NumberFieldDecorator } from '../../../common/decorators';

export class UpdateDtiPropertyDto extends PartialType(CreateDtiPropertyDto) {
    @NumberFieldDecorator('The monthly rent of the property', 2300, {
        required: false,
        allowNegative: false,
    })
    monthlyRent?: number;
}
