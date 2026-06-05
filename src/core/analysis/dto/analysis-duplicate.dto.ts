import { StringFieldDecorator } from '../../../common/decorators';
import { IsUUID } from 'class-validator';

export class AnalysisDuplicateDto {
    @StringFieldDecorator('The id of the analysis', '3fb7cde0-35d2-43b7-8172-87ddae7fda60', 2)
    @IsUUID('4')
    analysisId: string;

    @StringFieldDecorator(
        'The description of the new analysis',
        'Duplicated analysis description contains the same description',
        2,
        false,
    )
    description?: string;

    @StringFieldDecorator(
        'The id of the analysis',
        '3fb7cde0-35d2-43b7-8172-87ddae7fda60',
        2,
        false,
    )
    @IsUUID('4')
    propertyId?: string;
}
