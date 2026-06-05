import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { PreNotificationsService, NUsersService, NotificationsService } from './services';
import { NotificationsController } from './notifications.controller';
import { NotificationEntity } from './entities/notification.entity';
import { NUsersEntity } from './entities/n-users.entity';
import { NUsersRepository } from './repositories/n-users.repository';
import { NotificationsRepository } from './repositories/notifications.repository';

@Global()
@Module({
    imports: [DatabaseModule, DatabaseModule.forFeature([NotificationEntity, NUsersEntity])],
    controllers: [NotificationsController],
    providers: [
        NUsersRepository,
        NotificationsRepository,
        PreNotificationsService,
        NUsersService,
        NotificationsService,
    ],
    exports: [PreNotificationsService, NUsersService, NotificationsService],
})
export class NotificationsModule {}
