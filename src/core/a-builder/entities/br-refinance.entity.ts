import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { decimalTransformer } from '../../../utils/services/transformers';
import { ABuilderEntity } from './a-builder.entity';
import { BaseRefiEntity } from './base-refi.entity';
import { ERepairsEntity } from './e-repairs.entity';
import { IRepairsEntity } from './i-repairs.entity';
import { ORepairsEntity } from './o-repairs.entity';

@Entity('brrrr_refinance')
export class BrRefinanceEntity extends BaseRefiEntity<BrRefinanceEntity> {
    @Column({
        nullable: false,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    closingCoast: number;

    @OneToOne(() => ERepairsEntity, (details) => details.brRefi, {
        eager: false,
        nullable: true,
    })
    eRepairs?: ERepairsEntity;

    @OneToOne(() => IRepairsEntity, (details) => details.brRefi, {
        eager: false,
        nullable: true,
    })
    iRepairs?: IRepairsEntity;

    @OneToOne(() => ORepairsEntity, (details) => details.brRefi, {
        eager: false,
        nullable: true,
    })
    oRepairs?: ORepairsEntity;

    @OneToOne(() => ABuilderEntity, (rental) => rental.brRefi, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'analysisBuilderId' })
    analysisBuilder?: ABuilderEntity;
}
