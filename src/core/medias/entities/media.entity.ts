import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { FileLinksEntity } from '../../files/entities/file-links.entity';

@Entity('medias')
export class MediaEntity extends AbstractEntity<MediaEntity> {
    @ManyToOne(() => FileLinksEntity, { eager: false })
    @JoinColumn({ name: 'fileId' })
    file: FileLinksEntity;

    @Column({ nullable: true, type: 'text' })
    fileLink?: string;

    @ManyToOne(() => FileLinksEntity, { eager: false, nullable: true })
    @JoinColumn({ name: 'thumbnailId' })
    thumbnail?: FileLinksEntity;

    @Column({ nullable: true, type: 'text' })
    thumbnailLink?: string;
}
