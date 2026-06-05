import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { SubscriptionPeriodEnum, SubscriptionStatusEnum } from '../../../common/enum';
import { SubscriptionInvoiceEntity } from './subscription-invoice.entity';
import { EncryptionTransformer } from '../../../helpers/encryption/encryption.transformer';

@Entity('subscriptions')
export class SubscriptionEntity extends AbstractEntity<SubscriptionEntity> {
    @Column({ type: 'varchar', nullable: false, transformer: EncryptionTransformer })
    stripeCustomerId: string;

    @Column({ type: 'varchar', nullable: false, transformer: EncryptionTransformer })
    stripeSubscriptionId: string;

    @Column({ type: 'varchar', nullable: false, transformer: EncryptionTransformer })
    stripePriceId: string;

    @Column({
        type: 'enum',
        enum: SubscriptionStatusEnum,
        default: SubscriptionStatusEnum.INCOMPLETE,
    })
    status: SubscriptionStatusEnum;

    @Column({ type: 'enum', enum: SubscriptionPeriodEnum })
    period: SubscriptionPeriodEnum;

    @Column({ type: 'timestamp', nullable: true })
    trialStart?: Date;

    @Column({ type: 'timestamp', nullable: true })
    trialEnd?: Date;

    @Column({ type: 'boolean', default: true })
    autoRenew: boolean;

    @Column({ type: 'boolean', default: false })
    cancelAtPeriodEnd: boolean;

    @OneToOne(() => UserEntity, { eager: false, nullable: false })
    @JoinColumn({ name: 'userId' })
    user: UserEntity;

    @OneToMany(() => SubscriptionInvoiceEntity, (inv) => inv.subscription, {
        cascade: true,
        eager: false,
    })
    invoices: SubscriptionInvoiceEntity[];
}
