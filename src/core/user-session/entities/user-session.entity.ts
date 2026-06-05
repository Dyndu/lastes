import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('user_session')
export class UserSessionEntity extends AbstractEntity<UserSessionEntity> {
    @Column({ nullable: false, type: 'text' })
    refreshTokenHash: string;

    @Column({ nullable: false, type: 'text' })
    deviceName: string;

    @Column({ type: 'int', default: 1 })
    tokenVersion: number;

    @Column({ nullable: false })
    lastActivityAt: Date;

    @Column({ nullable: false })
    expiredAt: Date;

    @Column({ nullable: true })
    revokedAt?: Date;

    @Column({ nullable: true })
    ipAddress?: string;

    @Column({ nullable: true })
    userAgent?: string;

    @ManyToOne(() => UserEntity, { eager: false, nullable: false })
    @JoinColumn({ name: 'userId' })
    user: UserEntity;
}
