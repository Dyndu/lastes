import { Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { SConEntity } from './s-con.entity';
import { SMessagesEntity } from './s-messages.entity';

@Entity('support_users_conversation')
export class SAdminConEntity extends AbstractEntity<SAdminConEntity> {
    @ManyToOne(() => UserEntity, {
        eager: false,
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'adminId' })
    admin: UserEntity;

    @ManyToOne(() => SConEntity, {
        eager: false,
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'conId' })
    conversation: SConEntity;

    @ManyToOne(() => SMessagesEntity, {
        eager: false,
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'lastReadMessageId' })
    lastReadMessage?: SMessagesEntity;
}
