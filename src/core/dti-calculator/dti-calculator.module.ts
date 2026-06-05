import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../libs/database/database.module';
import {
    DtiCalculatorRepository,
    DtiCardRepository,
    DtiEIncomeRepository,
    DtiOtherDebtsRepository,
    DtiOtherIncomeRepository,
    DtiPropertyRepository,
} from './repositories';
import {
    DtiCalculatorService,
    DtiCardService,
    DtiEIncomeService,
    DtiOtherDebtsService,
    DtiOtherIncomeService,
    DtiPropertyService,
    TransformDtiService,
    PreDtiCalculatorService,
} from './services';
import {
    DtiCalculatorEntity,
    DtiCardEntity,
    DtiEIncomeEntity,
    DtiOtherIncomeEntity,
    DtiOtherDebtsEntity,
    DtiPropertyEntity,
} from './entities';
import { DtiCalculatorController } from './dti-calculator.controller';

@Module({
    imports: [
        DatabaseModule,
        DatabaseModule.forFeature([
            DtiCalculatorEntity,
            DtiCardEntity,
            DtiEIncomeEntity,
            DtiPropertyEntity,
            DtiOtherIncomeEntity,
            DtiOtherDebtsEntity,
        ]),
    ],
    controllers: [DtiCalculatorController],
    providers: [
        DtiCalculatorRepository,
        DtiCardRepository,
        DtiEIncomeRepository,
        DtiOtherDebtsRepository,
        DtiOtherIncomeRepository,
        DtiPropertyRepository,
        DtiCalculatorService,
        DtiCardService,
        DtiEIncomeService,
        DtiOtherDebtsService,
        DtiOtherIncomeService,
        DtiPropertyService,
        TransformDtiService,
        PreDtiCalculatorService,
    ],
    exports: [DtiCalculatorService],
})
export class DtiCalculatorModule {}
