import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { MetricsEntity, SMetricEntity, PSettingEntity } from './entities';
import { MetricsSeeder } from './seeder/metrics.seeder';
import { MetricsRepository, SMetricRepository, PSettingRepository } from './repositories';
import {
    MetricsService,
    PSettingsService,
    PreSettingsService,
    TransformPSettingService,
    SMetricService,
} from './services';
import { PSettingsController } from './p-settings.controller';
import { PSettingSeeder } from './seeder/p-setting.seeder';

@Module({
    imports: [
        DatabaseModule,
        DatabaseModule.forFeature([MetricsEntity, SMetricEntity, PSettingEntity]),
    ],
    controllers: [PSettingsController],
    providers: [
        PSettingSeeder,
        MetricsSeeder,
        MetricsRepository,
        SMetricRepository,
        PSettingRepository,
        MetricsService,
        PSettingsService,
        PreSettingsService,
        TransformPSettingService,
        SMetricService,
    ],
    exports: [PSettingsService],
})
export class PSettingsModule {}
