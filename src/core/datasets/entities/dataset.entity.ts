import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { DatasetBatchEntity } from './dataset-batch.entity';

@Entity('datasets')
export class DatasetEntity extends AbstractEntity<DatasetEntity> {
    @Column({ nullable: false })
    city: string;

    @Column({ nullable: false })
    state: string;

    @Column({ nullable: false })
    zip_code: string;

    @Column('decimal', { precision: 5, scale: 2, nullable: true })
    average?: number;

    @Column('decimal', { precision: 5, scale: 2, nullable: true })
    single_family?: number;

    @Column('decimal', { precision: 5, scale: 2, nullable: true })
    multi_family?: number;

    @Column('decimal', { precision: 5, scale: 2, nullable: true })
    retail?: number;

    @Column({ nullable: true })
    office?: string;

    @Column({ nullable: true })
    industrial?: string;

    @Column({ nullable: true })
    speciality?: string;

    @Column({ nullable: true })
    property_class?: string;

    @ManyToOne(() => DatasetBatchEntity, { eager: false, nullable: false })
    @JoinColumn({ name: 'batchId' })
    batch: DatasetBatchEntity;
}
