import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { ModuleEntity } from './module.entity';

@Entity('module_uses')
export class MUseEntity extends AbstractEntity<MUseEntity> {
    @Column({ nullable: false, type: 'text' })
    label: string;

    @Column({ nullable: false, type: 'text' })
    icon: string;

    @ManyToOne(() => ModuleEntity, { eager: false, nullable: false })
    @JoinColumn({ name: 'moduleId' })
    module: ModuleEntity;
}
