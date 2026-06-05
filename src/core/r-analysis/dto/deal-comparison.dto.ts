import { StringArrayFieldDecorator } from '../../../common/decorators';
import { IsUUID } from 'class-validator';

export class DealComparisonDto {
    @StringArrayFieldDecorator(
        'Array of analysis ids',
        ['3fb7cde0-35d2-43b7-8172-87ddae7fda60', '3fb9cde0-90d2-43b7-8172-87ddae7fda60'],
        1,
        true,
        4,
    )
    @IsUUID('4', { each: true })
    analysisIds: string[];
}
