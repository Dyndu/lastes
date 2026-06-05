import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DatabaseModule } from '../../libs/database/database.module';
import { NewsletterEntity } from './entities/newsletter.entity';
import { NewslettersRepository } from './newsletters.repository';
import { NewslettersService } from './services/newsletters.service';
import { PreNewslettersService } from './services/pre-newsletters.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { NewslettersController } from './newsletters.controller';
import { NewsletterProcessor } from './services/newsletter.processor';
import { QueueModule } from '../../helpers/bull/bull.module';

@Module({
    imports: [
        DatabaseModule,
        QueueModule,
        BullModule.registerQueue({ name: 'newsletter' }),
        DatabaseModule.forFeature([NewsletterEntity]),
        NotificationsModule,
        UsersModule,
    ],
    controllers: [NewslettersController],
    providers: [
        NewslettersRepository,
        NewslettersService,
        PreNewslettersService,
        NewsletterProcessor,
    ],
    exports: [NewslettersRepository, NewslettersService, PreNewslettersService],
})
export class NewslettersModule {}
