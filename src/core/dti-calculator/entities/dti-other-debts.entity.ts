import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { DtiOtherDebtsLabelsEnum } from '../../../common/enum';
import { decimalTransformer } from '../../../utils/services/transformers';
import { DtiCalculatorEntity } from './dti-calculator.entity';

@Entity('dti_other_debts')
export class DtiOtherDebtsEntity extends AbstractEntity<DtiOtherDebtsEntity> {
    @Column({
        nullable: false,
        default: DtiOtherDebtsLabelsEnum.ALIMONY,
        enum: DtiOtherDebtsLabelsEnum,
    })
    label: DtiOtherDebtsLabelsEnum;

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
