import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import {
    FFlipService,
    FFlipSummaryService,
    PreFFlipService,
    TransformFFlipService,
} from './services';
import { FFlipEntity } from './entity/f-flip.entity';
import { FFlipController } from './f-flip.controller';
import { FFlipRepository } from './f-flip.repository';
import { RAnalysisModule } from '../r-analysis/r-analysis.module';
import { ABuilderModule } from '../a-builder/a-builder.module';

@Module({
    imports: [
        DatabaseModule,
        DatabaseModule.forFeature([FFlipEntity]),
        RAnalysisModule,
        ABuilderModule,
    ],
    controllers: [FFlipController],
    providers: [
        FFlipRepository,
        FFlipService,
        PreFFlipService,
        TransformFFlipService,
        FFlipSummaryService,
    ],
    exports: [FFlipService],
})
export class FFlipModule {}
