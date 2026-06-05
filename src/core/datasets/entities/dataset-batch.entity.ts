import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { FileLinksEntity } from '../../files/entities/file-links.entity';

@Entity('dataset_batches')
export class DatasetBatchEntity extends AbstractEntity<DatasetBatchEntity> {
    @ManyToOne(() => FileLinksEntity, { eager: false, nullable: false })
    @JoinColumn({ name: 'fileId' })
    file: FileLinksEntity;

    @Column({ default: false })
    isActive: boolean;

    @Column({ type: 'int', default: 0 })
    rowCount: number;
}
