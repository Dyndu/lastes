import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { FilesUtils } from '../../../utils/services/tools';
import { SMessagesEntity } from './s-messages.entity';
import { SConStatusEnum } from '../../../common/enum';
import { SCodeEntity } from '../../s-codes/entities/s-code.entity';

@Entity('support_conversations')
export class SConEntity extends AbstractEntity<SConEntity> {
    @Column({ nullable: false, type: 'text' })
    label: string;

    @BeforeInsert()
    assignRandomColor() {
        this.color = FilesUtils.getRandomColor();
    }

    @Column({ type: 'varchar', nullable: false })
    color: string;

    @Column({
        type: 'enum',
        enum: SConStatusEnum,
        default: SConStatusEnum.ACTIVE,
        nullable: false,
    })
    status: SConStatusEnum;

    @ManyToOne(() => UserEntity, { eager: false, nullable: false })
    @JoinColumn({ name: 'createdBy' })
    createdBy: UserEntity;

    @ManyToOne(() => SCodeEntity, { eager: false })
    @JoinColumn({ name: 'codeId' })
    code: SCodeEntity;

    @ManyToOne(() => SMessagesEntity, {
        nullable: true,
        onDelete: 'SET NULL',
        eager: false,
    })
    @JoinColumn({ name: 'lastMessageId' })
    lastMessage?: SMessagesEntity;

    @ManyToOne(() => SMessagesEntity, {
        nullable: true,
        eager: false,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'lastReadMessageId' })
    lastReadMessage?: SMessagesEntity;

    @OneToMany(() => SMessagesEntity, (m) => m.con, {
        eager: false,
        onDelete: 'CASCADE',
    })
    messages: SMessagesEntity[];
}
