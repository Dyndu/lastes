import { PartialType } from '@nestjs/swagger';
import { ADetailsDto } from './a-details.dto';

export class ADetailsUpdateDto extends PartialType(ADetailsDto) {}
