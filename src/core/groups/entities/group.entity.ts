import { Column, Entity, JoinTable, ManyToMany, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { PermissionEntity } from '../../permissions/entities/permission.entity';

@Entity('group')
export class GroupEntity extends AbstractEntity<GroupEntity> {
    @Column({ type: 'text', nullable: false })
    label: string;

    @ManyToMany(() => PermissionEntity, (p) => p.groups)
    @JoinTable()
    permissions: PermissionEntity[];

    @OneToMany(() => UserEntity, (u) => u.group)
    users: UserEntity[];
}
