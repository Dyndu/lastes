import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { ADetailsEntity } from './a-details.entity';
import { decimalTransformer } from '../../../utils/services/transformers';
import { SaleEntity } from './sale.entity';
import { RDurationEntity } from './r-duration.entity';

@Entity('acquisitions_details_itemized')
export class AdItemizedEntity extends AbstractEntity<AdItemizedEntity> {
    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    originationFee: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    hazardInsurance: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    floodInsurance: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    propertyTaxes: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    annualAssessment: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    escrowFees: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    attorneyFees: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    inspectionFees: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    lenderFees: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    recordingFees: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    appraisal: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    transferTax: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    other: number;

    @OneToOne(() => ADetailsEntity, (details) => details.itemized, {
        nullable: true,
        eager: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'acquisitionId' })
    aDetails?: ADetailsEntity;

    @OneToOne(() => SaleEntity, (details) => details.itemized, {
        nullable: true,
        eager: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'saleId' })
    sale?: SaleEntity;

    @OneToOne(() => RDurationEntity, (details) => details.itemized, {
        nullable: true,
        eager: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'rDurationId' })
    rDuration?: RDurationEntity;
}
