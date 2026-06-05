import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';

@Entity('ads_stats')
export class AdsStatsEntity extends AbstractEntity<AdsStatsEntity> {
    @Column({ nullable: false, default: 1 })
    singleton: number;

    @Column({ default: 0 })
    total: number;

    @Column({ default: 0 })
    running: number;

    @Column({ default: 0 })
    expired: number;

    @Column({ default: 0 })
    scheduled: number;
}
