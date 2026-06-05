import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { FileTypeEnum } from '../../../common/enum';

@Entity('files')
export class FileEntity extends AbstractEntity<FileEntity> {
    @Column()
    label: string;

    @Column({ unique: true })
    path: string;

    @Column({ type: 'float' })
    size: number;

    @Column({ nullable: true })
    width?: number;

    @Column({ nullable: true })
    height?: number;

    @Column({ type: 'enum', enum: FileTypeEnum })
    type: FileTypeEnum;
}
