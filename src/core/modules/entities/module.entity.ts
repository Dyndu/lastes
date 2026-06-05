import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { ModuleTypeEnum } from '../../../common/enum';
import { FileLinksEntity } from '../../files/entities/file-links.entity';
import { MFeatureEntity } from './m-feature.entity';
import { MHeaderEntity } from './m-header.entity';
import { MUseEntity } from './m-use.entity';
import { AnalysisUsageEntity } from '../../analysis/entities';

@Entity('modules')
export class ModuleEntity extends AbstractEntity<ModuleEntity> {
    @Column({ nullable: false, type: 'text' })
    label: string;

    @Column({ nullable: false, type: 'text' })
    icon: string;

    @Column({ type: 'boolean', nullable: false, default: true })
    isActive: boolean;

    @Column({ type: 'boolean', nullable: false, default: true })
    isMain: boolean;

    @Column({ type: 'int', nullable: false, default: 0 })
    usageCount: number;

    @Column({ type: 'varchar', nullable: false })
    color: string;

    @Column({
        type: 'enum',
        nullable: false,
        default: ModuleTypeEnum.MODULE,
        enum: ModuleTypeEnum,
    })
    type: ModuleTypeEnum;

    @Column({ nullable: true, type: 'text' })
    description?: string;

    @Column({ type: 'text', nullable: true })
    usageDescription?: string;

    @ManyToOne(() => FileLinksEntity, { eager: false, nullable: true })
    @JoinColumn({ name: 'link' })
    link?: FileLinksEntity;

    @OneToMany(() => MFeatureEntity, (f) => f.module, {
        eager: false,
        cascade: true,
    })
    features?: MFeatureEntity[];

    @OneToMany(() => MHeaderEntity, (f) => f.module, {
        eager: false,
        cascade: true,
    })
    headers?: MHeaderEntity[];

    @OneToMany(() => MUseEntity, (f) => f.module, {
        eager: false,
        cascade: true,
    })
    uses?: MUseEntity[];

    @OneToMany(() => AnalysisUsageEntity, (usage) => usage.module, {
        eager: false,
    })
    usages?: AnalysisUsageEntity[];
}
