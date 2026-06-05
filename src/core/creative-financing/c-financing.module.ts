import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { RAnalysisModule } from '../r-analysis/r-analysis.module';
import { ABuilderModule } from '../a-builder/a-builder.module';
import { CFinancingEntity } from './entities/c-financing.entity';
import { CFinancingController } from './c-financing.controller';
import { CFinancingRepository } from './c-financing.repository';
import { CFinancingService, PreCFinancingService, CFinancingCalculatorService } from './services';
import { FFlipModule } from '../fix-flip/f-flip.module';

@Module({
    imports: [
        DatabaseModule,
        DatabaseModule.forFeature([CFinancingEntity]),
        RAnalysisModule,
        FFlipModule,
        ABuilderModule,
    ],
    controllers: [CFinancingController],
    providers: [
        CFinancingRepository,
        CFinancingService,
        PreCFinancingService,
        CFinancingCalculatorService,
    ],
    exports: [CFinancingService],
})
export class CFinancingModule {}
