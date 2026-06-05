import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { AcquisitionLoanTypeEnum, AcquisitionMethodEnum } from '../../../common/enum';
import { AdItemizedEntity } from './ad-itemized.entity';
import { ABuilderEntity } from './a-builder.entity';
import { decimalTransformer } from '../../../utils/services/transformers';

@Entity('acquisitions_details')
export class ADetailsEntity extends AbstractEntity<ADetailsEntity> {
    @Column({
        nullable: false,
        default: AcquisitionMethodEnum.CASH,
        enum: AcquisitionMethodEnum,
    })
    method: AcquisitionMethodEnum;

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    purchasePrice: number;

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    sellerConcessions: number;

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    credits: number;

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    acquisitionCoast: number;

    @Column({
        nullable: true,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    downPayment?: number;

    @Column({
        nullable: true,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    loanInterest?: number;

    @Column({
        nullable: true,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    loanLength?: number;

    @Column({
        nullable: true,
        enum: AcquisitionLoanTypeEnum,
    })
    loanType?: AcquisitionLoanTypeEnum;

    @Column({
        nullable: true,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    points?: number;

    @Column({
        nullable: true,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    monthlyIncome?: number;

    @Column({
        nullable: true,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    earnestMoneyDeposit?: number;

    @Column({
        nullable: true,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    closingCostFees?: number;

    @Column({
        nullable: true,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    holdingPeriod?: number;

    @Column({
        nullable: true,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    othersFees?: number;

    @OneToOne(() => AdItemizedEntity, (item) => item.aDetails, {
        eager: false,
        cascade: true,
    })
    itemized?: AdItemizedEntity;

    @OneToOne(() => ABuilderEntity, (rental) => rental.acquisitionDetails, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'analysisBuilderId' })
    analysisBuilder?: ABuilderEntity;
}
