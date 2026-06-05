import { Column, Entity, ManyToMany } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { GroupEntity } from '../../groups/entities/group.entity';

@Entity('permission')
export class PermissionEntity extends AbstractEntity<PermissionEntity> {
    @Column({ type: 'text', nullable: false })
    label: string;

    @Column({ type: 'text', nullable: false })
    action: string;

    @Column({ type: 'text', nullable: false })
    ui: string;

    @ManyToMany(() => GroupEntity, (g) => g.permissions)
    groups: GroupEntity[];
}
