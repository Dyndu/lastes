import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { RAnalysisModule } from '../r-analysis/r-analysis.module';
import { ABuilderModule } from '../a-builder/a-builder.module';
import {
    WholesaleService,
    PreWholesaleService,
    TransformWholesaleEntityService,
    WholesaleCalculatorService,
} from './services';
import { FFlipModule } from '../fix-flip/f-flip.module';
import { WholesaleRepository } from './wholesale.repository';
import { WholesaleEntity } from './entities/wholesale.entity';
import { WholesaleController } from './wholesale.controller';

@Module({
    imports: [
        DatabaseModule,
        DatabaseModule.forFeature([WholesaleEntity]),
        RAnalysisModule,
        FFlipModule,
        ABuilderModule,
    ],
    controllers: [WholesaleController],
    providers: [
        WholesaleRepository,
        WholesaleService,
        PreWholesaleService,
        WholesaleCalculatorService,
        TransformWholesaleEntityService,
    ],
    exports: [WholesaleService],
})
export class WholesaleModule {}
