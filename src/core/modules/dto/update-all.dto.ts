import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested, IsOptional } from 'class-validator';
import { MRelationDto } from './m-relation.dto';
import { IsMRelationUnique } from './is-mrelation-unique.decorator';
import { ModuleUpdateDto } from './module-update.dto';

export class UpdateAllDto extends ModuleUpdateDto {
    @ApiPropertyOptional({
        type: [MRelationDto],
        description: 'Features of the module',
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MRelationDto)
    @IsMRelationUnique({ message: 'features must be unique' })
    features?: MRelationDto[];

    @ApiPropertyOptional({
        type: [MRelationDto],
        description: 'Headers of the module',
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MRelationDto)
    @IsMRelationUnique({ message: 'headers must be unique' })
    headers?: MRelationDto[];

    @ApiPropertyOptional({
        type: [MRelationDto],
        description: 'Uses of the module',
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MRelationDto)
    @IsMRelationUnique({ message: 'uses must be unique' })
    uses?: MRelationDto[];
}
