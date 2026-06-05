import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';

@Entity('ra-metrics')
export class MetricsEntity extends AbstractEntity<MetricsEntity> {
    @Column({ nullable: false, type: 'text' })
    label: string;

    @Column({ nullable: false, type: 'text' })
    icon: string;

    @Column({ nullable: true, type: 'text' })
    description?: string;
}
