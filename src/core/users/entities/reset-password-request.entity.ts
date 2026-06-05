import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { UserEntity } from './user.entity';

@Entity('reset_password_request')
export class ResetPasswordRequestEntity extends AbstractEntity<ResetPasswordRequestEntity> {
    @Column({ nullable: false })
    expireAt: Date;

    @Column({ default: 0 })
    count: number;

    @Column({ nullable: true })
    delayDate?: Date;

    @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({ name: 'userId' })
    user: UserEntity;
}
