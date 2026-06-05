import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { SConEntity } from './s-con.entity';
import { FileLinksEntity } from '../../files/entities/file-links.entity';

@Entity('support_messages')
export class SMessagesEntity extends AbstractEntity<SMessagesEntity> {
    @Column({ type: 'boolean', default: true })
    canBeModified: boolean;

    @Column({ type: 'int', generated: 'increment', unique: true })
    serialId: number;

    @Column({ type: 'boolean', default: false })
    isModified: boolean;

    @Column({ type: 'text', nullable: true })
    content?: string;

    @ManyToOne(() => UserEntity, { eager: false, nullable: false })
    @JoinColumn({ name: 'sentBy' })
    sentBy: UserEntity;

    @ManyToOne(() => SConEntity, (c) => c.messages, {
        eager: false,
        nullable: false,
    })
    @JoinColumn({ name: 'conId' })
    con: SConEntity;

    @ManyToOne(() => SMessagesEntity, { eager: false, nullable: true })
    @JoinColumn({ name: 'replyToMessageId' })
    replyToMessage?: SMessagesEntity;

    @OneToMany(() => FileLinksEntity, (f) => f.message, {
        eager: false,
        cascade: true,
    })
    files?: FileLinksEntity[];
}
