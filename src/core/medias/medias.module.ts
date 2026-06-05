import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { MediaEntity, FooterInfoEntity, SocialEntity } from './entities';
import { MediasRepository, FooterInfoRepository, SocialRepository } from './repositories';
import { FInfoService, MediasService, SocialService } from './services';
import { MediasController } from './medias.controller';
import { SocialSeeder } from './seeders/social.seeder';
import { FInfoSeeder } from './seeders/f-info.seeder';

@Module({
    imports: [
        DatabaseModule,
        DatabaseModule.forFeature([MediaEntity, FooterInfoEntity, SocialEntity]),
    ],
    controllers: [MediasController],
    providers: [
        MediasRepository,
        MediasService,
        FooterInfoRepository,
        SocialRepository,
        SocialService,
        FInfoService,
        SocialSeeder,
        FInfoSeeder,
    ],
    exports: [MediasService],
})
export class MediasModule {}
