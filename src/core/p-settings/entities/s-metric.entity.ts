import { Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { MetricsEntity } from './metrics.entity';
import { PSettingEntity } from './p-setting.entity';

@Entity('setting_metrics')
export class SMetricEntity extends AbstractEntity<SMetricEntity> {
    @ManyToOne(() => MetricsEntity, {
        eager: false,
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'metricId' })
    metric: MetricsEntity;

    @ManyToOne(() => PSettingEntity, {
        eager: false,
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'settingId' })
    setting: PSettingEntity;
}
