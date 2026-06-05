import { Injectable } from '@nestjs/common';
import { GuideStatusEnum } from '../../../common/enum';
import { BaseStatsService } from '../../../helpers/base-stats/base-stats.service';
import { GuidesStatsEntity } from '../entities';
import { GuidesStatsRepository } from '../repositories';

@Injectable()
export class GuidesStatsService extends BaseStatsService<GuideStatusEnum, GuidesStatsEntity> {
    constructor(private readonly guidesStatsRepo: GuidesStatsRepository) {
        super(guidesStatsRepo);
    }
}
