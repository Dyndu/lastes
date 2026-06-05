import { AfterLoad, Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { ABuilderEntity } from './a-builder.entity';
import { decimalTransformer } from '../../../utils/services/transformers';

@Entity('fixed_expenses')
export class FExpensesEntity extends AbstractEntity<FExpensesEntity> {
    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    sewer: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    water: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    trash: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    gas: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    electric: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    internet: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    other: number;

    totalUtilities: number;

    @AfterLoad()
    computeTotalUtilities() {
        this.totalUtilities =
            (this.sewer ?? 0) +
            (this.water ?? 0) +
            (this.trash ?? 0) +
            (this.gas ?? 0) +
            (this.electric ?? 0) +
            (this.internet ?? 0) +
            (this.other ?? 0);
    }

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    hoaFees: number;

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
    hazardInsurance: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    additionalFees: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    cashReserves: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    managementFees: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    maintenanceEscrow: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    total: number;

    @OneToOne(() => ABuilderEntity, (rental) => rental.fExpenses, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'analysisBuilderId' })
    analysisBuilder?: ABuilderEntity;
}
