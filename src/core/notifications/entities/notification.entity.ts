import { Column, Entity, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { NotificationSubjectTypeEnum } from '../../../common/enum';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('notifications')
export class NotificationEntity extends AbstractEntity<NotificationEntity> {
    @Column({ type: 'text', nullable: false })
    label: string;

    @Column({ type: 'text', nullable: false })
    content: string;

    @Column({
        type: 'enum',
        enum: NotificationSubjectTypeEnum,
        nullable: false,
        default: NotificationSubjectTypeEnum.NONE,
    })
    subjectType: NotificationSubjectTypeEnum;

    @Column({ type: 'uuid', nullable: true })
    subjectId: string;

    @Column({ nullable: true })
    route?: string;

    @ManyToOne(() => UserEntity, (user) => user.notifications)
    sentBy?: UserEntity;
}
