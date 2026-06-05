import { Entity, JoinColumn, OneToOne } from 'typeorm';
import { RepairsEntity } from './repairs.entity';
import { BaseRepairsEntity } from './base-repairs.entity';
import { CCoastEntity } from './c-coast.entity';
import { BrRefinanceEntity } from './br-refinance.entity';

@Entity('exterior_repairs')
export class ERepairsEntity extends BaseRepairsEntity<ERepairsEntity> {
    @OneToOne(() => RepairsEntity, (repair) => repair.eRepairs, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'repairsId' })
    repairs?: RepairsEntity;

    @OneToOne(() => CCoastEntity, (cCoast) => cCoast.eRepairs, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'cCoastId' })
    cCoast?: CCoastEntity;

    @OneToOne(() => BrRefinanceEntity, (brRefi) => brRefi.eRepairs, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'brRefinanceId' })
    brRefi?: BrRefinanceEntity;
}
