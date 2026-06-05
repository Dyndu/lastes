import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { ERepairsEntity } from './e-repairs.entity';
import { IRepairsEntity } from './i-repairs.entity';
import { ORepairsEntity } from './o-repairs.entity';
import { ABuilderEntity } from './a-builder.entity';
import { decimalTransformer } from '../../../utils/services/transformers';

@Entity('repairs')
export class RepairsEntity extends AbstractEntity<RepairsEntity> {
    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    total: number;

    @Column({
        nullable: false,
        default: 0,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    afterRepairsValue?: number;

    @OneToOne(() => ERepairsEntity, (details) => details.repairs, {
        eager: false,
        nullable: true,
    })
    eRepairs?: ERepairsEntity;

    @OneToOne(() => IRepairsEntity, (details) => details.repairs, {
        eager: false,
        nullable: true,
    })
    iRepairs?: IRepairsEntity;

    @OneToOne(() => ORepairsEntity, (details) => details.repairs, {
        eager: false,
        nullable: true,
    })
    oRepairs?: ORepairsEntity;

    @OneToOne(() => ABuilderEntity, (rental) => rental.repairs, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'analysisBuilderId' })
    analysisBuilder?: ABuilderEntity;
}
