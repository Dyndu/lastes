import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { UserEntity } from './user.entity';

@Entity('users_code')
export class UsersCodeEntity extends AbstractEntity<UsersCodeEntity> {
    @Column({ nullable: false })
    code: string;

    @Column({ nullable: false })
    expireAt: Date;

    @Column({ default: 0 })
    count: number;

    @Column({ default: false, type: 'boolean' })
    rememberMe: boolean;

    @Column({ nullable: true })
    delayDate?: Date;

    @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({ name: 'userId' })
    user: UserEntity;
}
