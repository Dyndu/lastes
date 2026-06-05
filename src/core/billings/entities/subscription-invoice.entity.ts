import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../libs/database/abstract.entity';
import { SubscriptionEntity } from './subscription.entity';
import { InvoiceStatusEnum } from '../../../common/enum';
import { CCodeEntity } from '../../c-codes/entities';
import { decimalTransformer } from '../../../utils/services/transformers';

@Entity('subscription_invoices')
export class SubscriptionInvoiceEntity extends AbstractEntity<SubscriptionInvoiceEntity> {
    @Column({ type: 'varchar', nullable: false })
    stripeInvoiceId: string;

    @Column({
        nullable: true,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    amountPaid: number;

    @Column({
        nullable: true,
        type: 'decimal',
        transformer: decimalTransformer,
    })
    originalAmount?: number;

    @Column({ type: 'varchar', nullable: true })
    stripeCouponId?: string;

    @Column({ nullable: true, type: 'decimal', transformer: decimalTransformer })
    discountApplied?: number;

    @Column({ type: 'varchar', length: 3, nullable: false })
    currency: string;

    @Column({ type: 'enum', enum: InvoiceStatusEnum, default: InvoiceStatusEnum.OPEN })
    status: InvoiceStatusEnum;

    @Column({ type: 'timestamp', nullable: true })
    paidAt?: Date;

    @Column({ type: 'varchar', nullable: true })
    invoiceNumber?: string;

    @Column({ type: 'timestamp', nullable: true })
    currentPeriodStart: Date;

    @Column({ type: 'timestamp', nullable: true })
    currentPeriodEnd: Date;

    @ManyToOne(() => SubscriptionEntity, (sub) => sub.invoices, { eager: false, nullable: false })
    @JoinColumn({ name: 'subscriptionId' })
    subscription: SubscriptionEntity;

    @ManyToOne(() => CCodeEntity, { eager: false, nullable: true })
    @JoinColumn({ name: 'couponId' })
    coupon?: CCodeEntity;
}
