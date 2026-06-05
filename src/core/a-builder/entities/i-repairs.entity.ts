import { Entity, JoinColumn, OneToOne } from 'typeorm';
import { RepairsEntity } from './repairs.entity';
import { BaseRepairsEntity } from './base-repairs.entity';
import { HDurationEntity } from './h-duration.entity';
import { CCoastEntity } from './c-coast.entity';
import { BrRefinanceEntity } from './br-refinance.entity';

@Entity('interior_repairs')
export class IRepairsEntity extends BaseRepairsEntity<IRepairsEntity> {
    @OneToOne(() => RepairsEntity, (repair) => repair.iRepairs, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'repairsId' })
    repairs?: RepairsEntity;

    @OneToOne(() => HDurationEntity, (repair) => repair.itemized, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'hDurationId' })
    hDuration?: HDurationEntity;

    @OneToOne(() => CCoastEntity, (cCoast) => cCoast.iRepairs, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'cCoastId' })
    cCoast?: CCoastEntity;

    @OneToOne(() => BrRefinanceEntity, (brRefi) => brRefi.iRepairs, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'brRefinanceId' })
    brRefi?: BrRefinanceEntity;
}
