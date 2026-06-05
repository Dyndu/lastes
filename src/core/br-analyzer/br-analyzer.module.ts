import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { RAnalysisModule } from '../r-analysis/r-analysis.module';
import {
    BrAnalyzerService,
    PreBrAnalyzerService,
    TransformBrAnalyzerService,
    BrAnalyzerSummaryService,
} from './services';
import { BrAnalyzerEntity } from './entities/br-analyzer.entity';
import { BrAnalyzerController } from './br-analyzer.controller';
import { BrAnalyzerRepository } from './br-analyzer.repository';

@Module({
    imports: [DatabaseModule, DatabaseModule.forFeature([BrAnalyzerEntity]), RAnalysisModule],
    controllers: [BrAnalyzerController],
    providers: [
        BrAnalyzerRepository,
        BrAnalyzerService,
        PreBrAnalyzerService,
        TransformBrAnalyzerService,
        BrAnalyzerSummaryService,
    ],
    exports: [BrAnalyzerService],
})
export class BrAnalyzerModule {}
