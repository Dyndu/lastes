import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { decimalTransformer } from '../../../utils/services/transformers';
import { DtiCalculatorEntity } from './dti-calculator.entity';

@Entity('dti_employment_income')
export class DtiEIncomeEntity extends AbstractEntity<DtiEIncomeEntity> {
    @Column({ nullable: false })
    label: string;

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
