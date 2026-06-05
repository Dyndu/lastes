import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AdsService, PreAdsService, AdsStatsService } from './services';
import { AdsEntity } from './entities/ads.entity';
import { AdsStatsEntity } from './entities/ads-stats.entity';
import { AdsController } from './ads.controller';
import { AdsStatsRepository } from './repositories/ads-stats.repository';
import { AdsRepository } from './repositories/ads.repository';

@Module({
    imports: [
        DatabaseModule,
        DatabaseModule.forFeature([AdsEntity, AdsStatsEntity]),
        PermissionsModule,
    ],
    controllers: [AdsController],
    providers: [AdsStatsRepository, AdsService, PreAdsService, AdsRepository, AdsStatsService],
    exports: [AdsStatsRepository, AdsService, PreAdsService, AdsRepository, AdsStatsService],
})
export class AdsModule {}
