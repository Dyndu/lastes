import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { NotificationEntity } from './notification.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('notifications_receiver')
export class NUsersEntity extends AbstractEntity<NUsersEntity> {
    @Column({ type: 'boolean', nullable: false, default: true })
    isNew: boolean;

    @ManyToOne(() => NotificationEntity, { eager: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'notificationId' })
    notification: NotificationEntity;

    @ManyToOne(() => UserEntity, { eager: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: UserEntity;
}
