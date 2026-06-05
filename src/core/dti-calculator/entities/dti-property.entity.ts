import { AfterLoad, Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { decimalTransformer } from '../../../utils/services/transformers';
import { PropertyDetailsTypeEnum } from '../../../common/enum';
import { DtiCalculatorEntity } from './dti-calculator.entity';

@Entity('dti_property')
export class DtiPropertyEntity extends AbstractEntity<DtiPropertyEntity> {
    @Column({ nullable: false })
    streetAddress: string;

    @Column({ nullable: false })
    city: string;

    @Column({ nullable: false })
    state: string;

    @Column({ nullable: false })
    zipCode: string;

    @Column({
        nullable: false,
        default: PropertyDetailsTypeEnum.SINGLE_FAMILY,
        enum: PropertyDetailsTypeEnum,
    })
    propertyType: PropertyDetailsTypeEnum;

    totalExpenses: number;

    @AfterLoad()
    computeTotalExpenses() {
        this.totalExpenses =
            (this.principalInterest ?? 0) +
            (this.taxesEscrow ?? 0) +
            (this.pMInsurance ?? 0) +
            (this.hoaFees ?? 0);
    }

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    principalInterest: number;

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    taxesEscrow: number;

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    pMInsurance: number;

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    hoaFees: number;

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    monthlyRentalIncome: number;

    @Column({
        nullable: false,
        type: 'decimal',
        default: 0,
        transformer: decimalTransformer,
    })
    monthlyRent: number;

    @ManyToOne(() => DtiCalculatorEntity, { eager: false, nullable: false })
    @JoinColumn({ name: 'calculatorId' })
    calculator: DtiCalculatorEntity;
}
