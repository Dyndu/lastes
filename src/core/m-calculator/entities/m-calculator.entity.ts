import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { decimalTransformer } from '../../../utils/services/transformers';
import { UserEntity } from '../../users/entities/user.entity';
import { CreditScoreEnum, MCalculatorTypeEnum } from '../../../common/enum';

@Entity('mortgage_calculator')
export class MCalculatorEntity extends AbstractEntity<MCalculatorEntity> {
    @OneToOne(() => UserEntity, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'createdBy' })
    createdBy: UserEntity;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    purchasePrice: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    downPaymentAmount: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    downPaymentPercentage: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    loanAmount: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    interestRate: number;

    @Column({
        type: 'enum',
        enum: MCalculatorTypeEnum,
        nullable: false,
        default: MCalculatorTypeEnum.BASIC,
    })
    typeEnum: MCalculatorTypeEnum;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    loanTerm: number;

    @Column({ type: 'date', nullable: true })
    loanStartDate?: Date;

    @Column({
        nullable: true,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    annualPropertyTaxes?: number;

    @Column({
        nullable: true,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    annualHomeInsurance?: number;

    @Column({
        nullable: true,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    additionalMonthlyPayment?: number;

    @Column({
        type: 'enum',
        enum: CreditScoreEnum,
        nullable: true,
    })
    creditScore?: CreditScoreEnum;
}
