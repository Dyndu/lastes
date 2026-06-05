import { PartialType } from '@nestjs/swagger';
import { CCodeCreateDto } from './c-code-create.dto';

export class CCodeUpdateDto extends PartialType(CCodeCreateDto) {}
