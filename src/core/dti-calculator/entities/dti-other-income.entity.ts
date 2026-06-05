import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { decimalTransformer } from '../../../utils/services/transformers';
import { DtiOtherIncomeLabelsEnum } from '../../../common/enum';
import { DtiCalculatorEntity } from './dti-calculator.entity';

@Entity('dti_other_income')
export class DtiOtherIncomeEntity extends AbstractEntity<DtiOtherIncomeEntity> {
    @Column({
        nullable: false,
        default: DtiOtherIncomeLabelsEnum.OTHER,
        enum: DtiOtherIncomeLabelsEnum,
    })
    label: DtiOtherIncomeLabelsEnum;

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    value: number;

    @ManyToOne(() => DtiCalculatorEntity, { eager: false, nullable: false })
    @JoinColumn({ name: 'calculatorId' })
    calculator: DtiCalculatorEntity;
}
