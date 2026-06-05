import { StringFieldDecorator } from '../../../common/decorators';
import { IsUUID } from 'class-validator';

export class AnalysisCreateDto {
    @StringFieldDecorator('The id of the property', '3fb7cde0-35d2-43b7-8172-87ddae7fda60', 2)
    @IsUUID('4')
    propertyId: string;

    @StringFieldDecorator(
        'The id of the module to create an analysis for',
        '7f3f5860-a780-41a0-8484-4990a811ddd9',
        2,
    )
    @IsUUID('4')
    moduleId: string;

    @StringFieldDecorator(
        'Description of the analysis',
        'Analysis on my house at New York',
        2,
        false,
    )
    description?: string;
}
