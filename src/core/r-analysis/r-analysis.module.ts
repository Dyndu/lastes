import { forwardRef, Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { RAnalysisEntity, RAnalysisParamsEntity } from './entities';
import { RAnalysisRepository, RAnalysisParamsRepository } from './repositories';
import {
    RAnalysisService,
    PreRAnalysisService,
    RaABuilderService,
    TransformRaService,
    RentalAnalysisCalculatorService,
    RentalSummaryCalculatorService,
    RentalMetricsCalculatorService,
    RentalFullBreakdownCalculatorService,
    DealGradeCalculatorService,
    RAnalysisParamsService,
} from './services';
import { AnalysisModule } from '../analysis/analysis.module';
import { ABuilderModule } from '../a-builder/a-builder.module';
import { RAnalysisController } from './r-analysis.controller';
import { PSettingsModule } from '../p-settings/p-settings.module';

@Module({
    imports: [
        DatabaseModule,
        DatabaseModule.forFeature([RAnalysisEntity, RAnalysisParamsEntity]),
        forwardRef(() => AnalysisModule),
        ABuilderModule,
        PSettingsModule,
    ],
    controllers: [RAnalysisController],
    providers: [
        RAnalysisRepository,
        RAnalysisService,
        PreRAnalysisService,
        DealGradeCalculatorService,
        RaABuilderService,
        RentalMetricsCalculatorService,
        RAnalysisParamsRepository,
        RentalAnalysisCalculatorService,
        RAnalysisParamsService,
        RentalFullBreakdownCalculatorService,
        TransformRaService,
        RentalSummaryCalculatorService,
    ],
    exports: [RAnalysisService],
})
export class RAnalysisModule {}
