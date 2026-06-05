import { PartialType } from '@nestjs/swagger';
import { CreateAdsDto } from './create-ads.dto';

export class UpdateAdsDto extends PartialType(CreateAdsDto) {}
