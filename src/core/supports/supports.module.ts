import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { SAdminConRepository, SConRepository, SMessagesRepository } from './repositories';
import {
    SupportsService,
    SAdminConService,
    SMessagesService,
    SConService,
    TransformSEntitiesService,
} from './services';
import { SCodesModule } from '../s-codes/s-codes.module';
import { SAdminConEntity, SConEntity, SMessagesEntity } from './entities';
import { SupportsController } from './supports.controller';

@Global()
@Module({
    imports: [
        DatabaseModule,
        DatabaseModule.forFeature([SConEntity, SMessagesEntity, SAdminConEntity]),
        SCodesModule,
    ],
    controllers: [SupportsController],
    providers: [
        SConRepository,
        SMessagesRepository,
        SAdminConRepository,
        SupportsService,
        SAdminConService,
        SMessagesService,
        SConService,
        TransformSEntitiesService,
    ],
    exports: [SupportsService, SAdminConService, SMessagesService, SConService],
})
export class SupportsModule {}
