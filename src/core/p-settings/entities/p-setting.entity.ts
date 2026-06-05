import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { SMetricEntity } from './s-metric.entity';

@Entity('settings')
export class PSettingEntity extends AbstractEntity<PSettingEntity> {
    @Column({ type: 'text', nullable: false })
    label: string;

    @Column({ type: 'boolean', nullable: false, default: false })
    isDefault: boolean;

    @Column({ type: 'decimal', nullable: false, default: 0 })
    taxRate: number;

    @Column({ type: 'decimal', nullable: false, default: 0 })
    occupancyRate: number;

    @Column({ type: 'decimal', nullable: false, default: 0 })
    managementFees: number;

    @Column({ type: 'decimal', nullable: false, default: 0 })
    maintenanceEscrow: number;

    @Column({ type: 'decimal', nullable: false, default: 0 })
    cashReserves: number;

    @Column({ type: 'decimal', nullable: false, default: 0 })
    capRate: number;

    @Column({ type: 'decimal', nullable: false, default: 0 })
    goi: number;

    @Column({ type: 'decimal', nullable: false, default: 0 })
    noi: number;

    @Column({ type: 'decimal', nullable: false, default: 0 })
    ber: number;

    @Column({ type: 'decimal', nullable: false, default: 0 })
    oer: number;

    @Column({ type: 'decimal', nullable: false, default: 0 })
    dscr: number;

    @Column({ type: 'decimal', nullable: false, default: 0 })
    grm: number;

    @Column({ type: 'decimal', nullable: false, default: 0 })
    agm: number;

    @Column({ type: 'decimal', nullable: false, default: 0 })
    coc: number;

    @Column({ type: 'decimal', nullable: false, default: 0 })
    cashFlow: number;

    @Column({ type: 'decimal', nullable: false, default: 0 })
    fTermRoi: number;

    @Column({ type: 'decimal', nullable: false, default: 0 })
    yearlyIncome: number;

    @Column({ type: 'decimal', nullable: false, default: 0 })
    roi: number;

    @Column({ type: 'decimal', nullable: false, default: 0 })
    payBackPeriod: number;

    @Column({ type: 'boolean', nullable: false, default: false })
    onePercent: boolean;

    @Column({ type: 'boolean', nullable: false, default: false })
    twoPercent: boolean;

    @Column({ type: 'boolean', nullable: false, default: false })
    fiftyPercent: boolean;

    @Column({ type: 'decimal', nullable: false, default: 0 })
    cashFlowAtLeast: number;

    @Column({ type: 'decimal', nullable: false, default: 0 })
    cashNeeded: number;

    @OneToMany(() => SMetricEntity, (n) => n.setting, {
        cascade: true,
        eager: false,
    })
    metrics: SMetricEntity[];

    @ManyToOne(() => UserEntity, { eager: false, nullable: true })
    @JoinColumn({ name: 'createdBy' })
    createdBy?: UserEntity;
}
