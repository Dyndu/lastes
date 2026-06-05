import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { ModuleEntity } from './module.entity';

@Entity('module_user')
export class MUsersEntity extends AbstractEntity<MUsersEntity> {
    @ManyToOne(() => ModuleEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'moduleId' })
    module: ModuleEntity;

    @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: UserEntity;

    @Column({ nullable: false, type: 'boolean', default: true })
    isPinned: boolean;
}
