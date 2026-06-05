import { Entity, JoinColumn, OneToOne } from 'typeorm';
import { RepairsEntity } from './repairs.entity';
import { BaseRepairsEntity } from './base-repairs.entity';
import { CCoastEntity } from './c-coast.entity';
import { BrRefinanceEntity } from './br-refinance.entity';

@Entity('other_repairs')
export class ORepairsEntity extends BaseRepairsEntity<ORepairsEntity> {
    @OneToOne(() => RepairsEntity, (repair) => repair.oRepairs, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'repairsId' })
    repairs?: RepairsEntity;

    @OneToOne(() => CCoastEntity, (cCoast) => cCoast.oRepairs, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'cCoastId' })
    cCoast?: CCoastEntity;

    @OneToOne(() => BrRefinanceEntity, (brRefi) => brRefi.oRepairs, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'brRefinanceId' })
    brRefi?: BrRefinanceEntity;
}
