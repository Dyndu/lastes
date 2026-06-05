import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import { MCalculatorService, MCalculatorEquationsService, PreMCalculatorService } from './services';
import { MCalculatorRepository } from './m-calculator.repository';
import { MCalculatorController } from './m-calculator.controller';
import { MCalculatorEntity } from './entities/m-calculator.entity';

@Module({
    imports: [DatabaseModule, DatabaseModule.forFeature([MCalculatorEntity])],
    controllers: [MCalculatorController],
    providers: [
        MCalculatorRepository,
        MCalculatorService,
        MCalculatorEquationsService,
        PreMCalculatorService,
    ],
    exports: [MCalculatorService],
})
export class MCalculatorModule {}
