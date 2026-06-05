import { forwardRef, Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { RCalculatorService, PreRCalculatorService, TransformRCalculatorService } from './services';
import { RCalculatorController } from './r-calculator.controller';
import { RCalculatorRepository } from './r-calculator.repository';
import { RCalculatorEntity } from './entity/r-calculator.entity';
import { RAnalysisModule } from '../r-analysis/r-analysis.module';
import { BAnalysisModule } from '../b-analysis/b-analysis.module';

@Module({
    imports: [
        DatabaseModule,
        DatabaseModule.forFeature([RCalculatorEntity]),
        forwardRef(() => RAnalysisModule),
        BAnalysisModule,
    ],
    controllers: [RCalculatorController],
    providers: [
        RCalculatorRepository,
        RCalculatorService,
        PreRCalculatorService,
        TransformRCalculatorService,
    ],
    exports: [RCalculatorService],
})
export class RCalculatorModule {}
