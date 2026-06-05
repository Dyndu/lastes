import { PartialType } from '@nestjs/swagger';
import { CreateMExportDto } from './create-m-export.dto';

export class UpdateMExportDto extends PartialType(CreateMExportDto) {}
