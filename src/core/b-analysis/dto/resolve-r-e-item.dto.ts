import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateREItemDto } from './update-r-e-item.dto';
import { IsREItemUnique } from '../../../common/decorators';

export class ResolveREItemDto {
    @ApiProperty({
        type: [UpdateREItemDto],
        description: 'Record of room expenses item',
    })
    @IsNotEmpty({ message: `Record can't be empty` })
    @IsArray()
    @ArrayMinSize(1, { message: `Record can't be empty` })
    @ValidateNested({ each: true })
    @Type(() => UpdateREItemDto)
    @IsREItemUnique({ message: 'features must be unique' })
    items: UpdateREItemDto[];
}
