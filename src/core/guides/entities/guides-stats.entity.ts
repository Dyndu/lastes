import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';

@Entity('guides_stats')
export class GuidesStatsEntity extends AbstractEntity<GuidesStatsEntity> {
    @Column({ nullable: false, default: 1 })
    singleton: number;

    @Column({ default: 0 })
    total: number;

    @Column({ default: 0 })
    draft: number;

    @Column({ default: 0 })
    published: number;
}
