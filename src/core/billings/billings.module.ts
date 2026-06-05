import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { SubscriptionInvoiceRepository, SubscriptionRepository } from './repositories';
import { SubscriptionEntity, SubscriptionInvoiceEntity } from './entities';
import { CCodesModule } from '../c-codes/c-codes.module';
import {
    BillingsService,
    TransformBEntitiesService,
    SWebhookService,
    SInvoiceService,
    SubscriptionService,
    PreBillingsService,
} from './services';
import { BillingsController } from './billings.controller';
import { AdsModule } from '../ads/ads.module';

@Global()
@Module({
    imports: [
        DatabaseModule,
        DatabaseModule.forFeature([SubscriptionEntity, SubscriptionInvoiceEntity]),
        CCodesModule,
        AdsModule,
    ],
    controllers: [BillingsController],
    providers: [
        SubscriptionInvoiceRepository,
        SubscriptionRepository,
        BillingsService,
        TransformBEntitiesService,
        SWebhookService,
        SInvoiceService,
        PreBillingsService,
        SubscriptionService,
    ],
    exports: [SubscriptionRepository, BillingsService],
})
export class BillingsModule {}
