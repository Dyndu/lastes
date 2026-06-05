import { AfterLoad, Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { decimalTransformer } from '../../../utils/services/transformers';
import { ERepairsEntity } from './e-repairs.entity';
import { IRepairsEntity } from './i-repairs.entity';
import { ORepairsEntity } from './o-repairs.entity';
import { ABuilderEntity } from './a-builder.entity';

@Entity('carrying_coast')
export class CCoastEntity extends AbstractEntity<CCoastEntity> {
    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    rContingency: number;

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    rContingencyTotal: number;

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    duration: number;

    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    holdingCoast: number;

    totalCCoast: number;

    @AfterLoad()
    computeTotalCCoast() {
        this.totalCCoast = (this.holdingCoast ?? 0) * (this.duration ?? 0);
    }

    @OneToOne(() => ERepairsEntity, (details) => details.cCoast, {
        eager: false,
        nullable: true,
    })
    eRepairs?: ERepairsEntity;

    @OneToOne(() => IRepairsEntity, (details) => details.cCoast, {
        eager: false,
        nullable: true,
    })
    iRepairs?: IRepairsEntity;

    @OneToOne(() => ORepairsEntity, (details) => details.cCoast, {
        eager: false,
        nullable: true,
    })
    oRepairs?: ORepairsEntity;

    @OneToOne(() => ABuilderEntity, (rental) => rental.cCoast, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'analysisBuilderId' })
    analysisBuilder?: ABuilderEntity;
}
