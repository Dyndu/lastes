import { PartialType } from '@nestjs/swagger';
import { CreatePDetailsDto } from './create-p-details.dto';

export class UpdatePDetailsDto extends PartialType(CreatePDetailsDto) {}
