import { Injectable } from '@nestjs/common';
import { AdsStatsEntity } from '../entities/ads-stats.entity';
import { AdsStatusEnum } from '../../../common/enum';
import { BaseStatsService } from '../../../helpers/base-stats/base-stats.service';
import { AdsStatsRepository } from '../repositories/ads-stats.repository';

@Injectable()
export class AdsStatsService extends BaseStatsService<AdsStatusEnum, AdsStatsEntity> {
    constructor(private readonly adsStatsRepository: AdsStatsRepository) {
        super(adsStatsRepository);
    }
}
