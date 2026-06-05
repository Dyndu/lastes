import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { GuideEntity, GuidesStatsEntity, UserGuideLikeEntity } from './entities';
import { GuidesController } from './guides.controller';
import {
    GuidesService,
    PreGuideService,
    GuidesStatsService,
    UserGuideLikeService,
} from './services';
import { GuidesRepository, GuidesStatsRepository, UserGuideLikeRepository } from './repositories';

@Module({
    imports: [
        DatabaseModule,
        DatabaseModule.forFeature([GuideEntity, GuidesStatsEntity, UserGuideLikeEntity]),
        PermissionsModule,
    ],
    controllers: [GuidesController],
    providers: [
        UserGuideLikeRepository,
        GuidesStatsRepository,
        GuidesService,
        PreGuideService,
        UserGuideLikeService,
        GuidesRepository,
        GuidesStatsService,
    ],
    exports: [
        GuidesStatsRepository,
        GuidesService,
        PreGuideService,
        GuidesRepository,
        GuidesStatsService,
    ],
})
export class GuidesModule {}
