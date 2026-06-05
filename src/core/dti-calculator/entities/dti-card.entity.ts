import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { DtiCalculatorEntity } from './dti-calculator.entity';
import { CardTypeEnum } from '../../../common/enum';
import { decimalTransformer } from '../../../utils/services/transformers';

@Entity('dit_credit_card')
export class DtiCardEntity extends AbstractEntity<DtiCardEntity> {
    @Column({ nullable: false })
    last4: string;

    @Column({ nullable: false, enum: CardTypeEnum, default: CardTypeEnum.VISA })
    brand: CardTypeEnum;

    @Column({ nullable: false })
    fingerprint: string;

    @Column({ nullable: false })
    expiry: string;

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    amount: number;

    @ManyToOne(() => DtiCalculatorEntity, { eager: false, nullable: false })
    @JoinColumn({ name: 'calculatorId' })
    calculator: DtiCalculatorEntity;
}
