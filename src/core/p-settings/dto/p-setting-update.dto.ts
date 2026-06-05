import { PartialType } from '@nestjs/swagger';
import { PSettingCreateDto } from './p-setting-create.dto';

export class PSettingUpdateDto extends PartialType(PSettingCreateDto) {}
