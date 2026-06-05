import { StringArrayFieldDecorator } from '../decorators';
import { IsUUID } from 'class-validator';

export class UuidsArrayDto {
    @StringArrayFieldDecorator(
        'Ids',
        ['eb5174d5-1cef-40f6-bb57-97393cde0426', 'eb5174d5-1cef-40f6-bb57-97393cde0426'],
        1,
        true,
    )
    @IsUUID('4', { each: true })
    ids: string[];
}
