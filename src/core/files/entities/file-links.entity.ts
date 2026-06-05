import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { FileEntity } from './file.entity';
import { FileUsageEnum } from '../../../common/enum';
import { SMessagesEntity } from '../../supports/entities';

@Entity('file_links')
export class FileLinksEntity extends AbstractEntity<FileLinksEntity> {
    @ManyToOne(() => FileEntity, { onDelete: 'CASCADE' })
    file: FileEntity;

    @Column({ type: 'enum', enum: FileUsageEnum, nullable: false })
    usage: FileUsageEnum;

    @ManyToOne(() => SMessagesEntity, (m) => m.files, {
        eager: false,
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'messageId' })
    message?: SMessagesEntity;
}
