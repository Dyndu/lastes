import { PartialType } from '@nestjs/swagger';
import { CreateRepairsDto } from './create-repairs.dto';

export class UpdateRepairsDto extends PartialType(CreateRepairsDto) {}
