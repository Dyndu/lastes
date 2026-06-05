import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { RAnalysisModule } from '../r-analysis/r-analysis.module';
import {
    IStrategyService,
    IStrategySummaryService,
    PreIStrategyService,
    TransformIStrategyEntityService,
} from './services';
import { IStrategyEntity } from './entities/i-strategy.entity';
import { IStrategyController } from './i-strategy.controller';
import { IStrategyRepository } from './i-strategy.repository';
import { ABuilderModule } from '../a-builder/a-builder.module';

@Module({
    imports: [
        DatabaseModule,
        DatabaseModule.forFeature([IStrategyEntity]),
        RAnalysisModule,
        ABuilderModule,
    ],
    controllers: [IStrategyController],
    providers: [
        IStrategyRepository,
        IStrategyService,
        PreIStrategyService,
        TransformIStrategyEntityService,
        IStrategySummaryService,
    ],
    exports: [IStrategyService],
})
export class IStrategyModule {}
