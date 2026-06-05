import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { SubscriptionRepository } from './subscription.repository';
import { SubscriptionSeeder } from './subscription.seeder';
import { SubscriptionEntity } from './entities/subscription.entity';

@Module({
    imports: [DatabaseModule, DatabaseModule.forFeature([SubscriptionEntity])],
    controllers: [SubscriptionController],
    providers: [SubscriptionService, SubscriptionRepository, SubscriptionSeeder],
    exports: [SubscriptionService],
})
export class SubscriptionModule {}
