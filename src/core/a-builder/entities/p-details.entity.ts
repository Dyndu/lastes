import { AfterLoad, Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { UnitEntity } from './unit.entity';
import { PropertyDetailsTypeEnum } from '../../../common/enum';
import { ABuilderEntity } from './a-builder.entity';
import { decimalTransformer } from '../../../utils/services/transformers';

@Entity('properties_details')
export class PDetailsEntity extends AbstractEntity<PDetailsEntity> {
    @Column({
        nullable: false,
        default: PropertyDetailsTypeEnum.SINGLE_FAMILY,
        enum: PropertyDetailsTypeEnum,
    })
    status: PropertyDetailsTypeEnum;

    @Column({
        nullable: true,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    monthlyIncome?: number;

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    totalIncome: number;

    totalGrossIncome: number;

    @AfterLoad()
    computeTotalGrossIncome() {
        this.totalGrossIncome = (this.totalIncome ?? 0) * 12;
    }

    @OneToMany(() => UnitEntity, (u) => u.pDetails, {
        cascade: true,
        eager: false,
    })
    units: UnitEntity[];

    @OneToOne(() => ABuilderEntity, (rental) => rental.propertyDetails, {
        eager: false,
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'aBuilderId' })
    analysisBuilder?: ABuilderEntity;
}
