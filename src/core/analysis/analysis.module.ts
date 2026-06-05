import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { AnalysisEntity, AnalysisUsageEntity } from './entities';
import { AnalysisRepository, AnalysisUsageRepository } from './repositories';
import {
    AnalysisService,
    PreAnalysisService,
    TransformAEntityService,
    AnalysisUsageService,
    AnalysisCloneService,
} from './services';
import { ModulesModule } from '../modules/modules.module';
import { PropertiesModule } from '../properties/properties.module';
import { AnalysisController } from './analysis.controller';
import { ABuilderModule } from '../a-builder/a-builder.module';
import { RCalculatorModule } from '../r-calculator/r-calculator.module';
import { BrAnalyzerModule } from '../br-analyzer/br-analyzer.module';
import { WholesaleModule } from '../wholesale/wholesale.module';
import { FFlipModule } from '../fix-flip/f-flip.module';
import { IStrategyModule } from '../i-strategy/i-strategy.module';
import { CFinancingModule } from '../creative-financing/c-financing.module';
import { RAnalysisModule } from '../r-analysis/r-analysis.module';

@Module({
    imports: [
        DatabaseModule,
        DatabaseModule.forFeature([AnalysisEntity, AnalysisUsageEntity]),
        ModulesModule,
        PropertiesModule,
        ABuilderModule,
        BrAnalyzerModule,
        WholesaleModule,
        FFlipModule,
        RCalculatorModule,
        IStrategyModule,
        CFinancingModule,
        RAnalysisModule,
    ],
    controllers: [AnalysisController],
    providers: [
        AnalysisRepository,
        AnalysisUsageRepository,
        AnalysisService,
        PreAnalysisService,
        TransformAEntityService,
        AnalysisCloneService,
        AnalysisUsageService,
    ],
    exports: [AnalysisService],
})
export class AnalysisModule {}
