import { Type } from 'class-transformer';
import { IsUUID } from 'class-validator';
import { StringArrayFieldDecorator, StringFieldDecorator } from '../../../common/decorators';

export class CreateGroupDto {
    @StringFieldDecorator('The label of the group', 'Management', 2)
    label: string;

    @StringArrayFieldDecorator(
        'Array of permissions UUIDs',
        ['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001'],
        1,
        true,
    )
    @Type(() => String)
    @IsUUID(4, { each: true })
    permissionIds: string[];
}
