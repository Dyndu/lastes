import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { CCodeEntity, CouponRedemptionEntity } from './entities';
import { AdsModule } from '../ads/ads.module';
import { CCodesController } from './c-codes.controller';
import { CCodesService, PreCCodesService, CRedemptionService } from './services';
import { CCodesRepository, CouponRedemptionRepository } from './repositories';

@Module({
    imports: [
        DatabaseModule,
        DatabaseModule.forFeature([CCodeEntity, CouponRedemptionEntity]),
        AdsModule,
    ],
    controllers: [CCodesController],
    providers: [
        CCodesService,
        PreCCodesService,
        CCodesRepository,
        CouponRedemptionRepository,
        CRedemptionService,
    ],
    exports: [CCodesService, PreCCodesService, CCodesRepository],
})
export class CCodesModule {}
