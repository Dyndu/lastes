import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IsREItemUnique } from '../../../common/decorators';
import { RefiItemUpdateDto } from './refi-item-update.dto';

export class RefiItemResolveDto {
    @ApiProperty({
        type: [RefiItemUpdateDto],
        description: 'Record of refinance item',
    })
    @IsNotEmpty({ message: `Record can't be empty` })
    @IsArray()
    @ArrayMinSize(1, { message: `Record can't be empty` })
    @ValidateNested({ each: true })
    @Type(() => RefiItemUpdateDto)
    @IsREItemUnique({ message: 'Record must be unique' })
    items: RefiItemUpdateDto[];
}
