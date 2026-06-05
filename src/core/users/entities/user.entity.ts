import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { Exclude } from 'class-transformer';
import { RoleEntity } from '../../roles/entities/role.entity';
import { FilesUtils } from '../../../utils/services/tools';
import { EncryptionTransformer } from '../../../helpers/encryption/encryption.transformer';
import { FileLinksEntity } from '../../files/entities/file-links.entity';
import { GroupEntity } from '../../groups/entities/group.entity';
import { NotificationEntity } from '../../notifications/entities/notification.entity';
import { UserStatusEnum } from '../../../common/enum';
import { PSettingEntity } from '../../p-settings/entities';
import { SubscriptionEntity } from '../../billings/entities';

@Entity('users')
export class UserEntity extends AbstractEntity<UserEntity> {
    @Column({ nullable: false, transformer: EncryptionTransformer })
    email: string;

    @Column({
        nullable: false,
        default: UserStatusEnum.ACTIVE,
        enum: UserStatusEnum,
    })
    status: UserStatusEnum;

    @Column({ nullable: true })
    fullname?: string;

    @Column({ nullable: true })
    googleId?: string;

    @Column({ nullable: true })
    googleAvatar?: string;

    @Exclude()
    @Column({ nullable: true })
    password?: string;

    @BeforeInsert()
    assignRandomColor() {
        this.color = FilesUtils.getRandomColor();
    }

    @Column({ type: 'varchar', nullable: false })
    color: string;

    @Column({ type: 'varchar', nullable: true })
    stripeCustomerId?: string;

    @ManyToOne(() => RoleEntity, { eager: false })
    @JoinColumn({ name: 'roleId' })
    role: RoleEntity;

    @ManyToOne(() => FileLinksEntity, { eager: false, nullable: true })
    @JoinColumn({ name: 'avatar' })
    avatar?: FileLinksEntity;

    @ManyToOne(() => GroupEntity, { eager: false, nullable: true })
    @JoinColumn({ name: 'groupId' })
    group?: GroupEntity;

    @OneToOne(() => SubscriptionEntity, (sub) => sub.user, {
        eager: false,
        nullable: true,
    })
    subscription?: SubscriptionEntity;

    @OneToMany(() => NotificationEntity, (n) => n.sentBy, {
        cascade: true,
        eager: false,
    })
    notifications: NotificationEntity[];

    @OneToMany(() => PSettingEntity, (setting) => setting.createdBy)
    settings: PSettingEntity[];
}
