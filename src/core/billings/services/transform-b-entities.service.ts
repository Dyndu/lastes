import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { SubscriptionEntity, SubscriptionInvoiceEntity } from '../entities';
import { BillingsService } from './billings.service';
import { IncomeCategoryEnum, SubscriptionPeriodEnum } from '../../../common/enum';
import { UserEntity } from '../../users/entities/user.entity';

@Injectable()
export class TransformBEntitiesService {
    /**
     * Service responsible for transforming billing entities to ui views
     */

    constructor(
        @Inject(forwardRef(() => BillingsService))
        readonly billingsService: BillingsService,
    ) {}

    /**
     * Transforms a SubscriptionInvoiceEntity into a formatted object.
     * Returns an object containing the invoice ID, Stripe invoice ID, amount paid,
     * currency, status, paid date, and the subscription period as billing type.
     */
    transformInvoice = (inv: SubscriptionInvoiceEntity) => ({
        id: inv.id,
        stripeInvoiceId: inv.stripeInvoiceId,
        invoiceNumber: inv.invoiceNumber,
        amountPaid: inv.amountPaid,
        currency: inv.currency,
        status: inv.status,
        paidAt: inv.paidAt,
        bType: inv.subscription.period,
    });

    /**
     * Transforms an array of SubscriptionInvoiceEntities into formatted objects.
     * Maps each invoice through the transformInvoice method and returns the resulting array.
     */
    transformInvoices = (invs: SubscriptionInvoiceEntity[]) =>
        invs.map((inv: SubscriptionInvoiceEntity) => this.transformInvoice(inv));

    /**
     * Transforms a SubscriptionEntity into a formatted subscription info object.
     * Returns an object containing the subscription ID, status, period, and auto-renewal flag.
     */
    transformSubInfo = (sub: SubscriptionEntity) => ({
        id: sub.id,
        status: sub.status,
        period: sub.period,
        autoRenew: sub.autoRenew,
    });

    /**
     * Transforms a Stripe payment method object into a formatted payment method object.
     * Returns an object containing the payment method ID, card brand, last four digits,
     * expiration month and year, and a boolean indicating whether it is the default payment method.
     */
    transformPayMethod = (pm: any, defaultPmId?: string) => ({
        id: pm.id,
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        expMonth: pm.card?.exp_month,
        expYear: pm.card?.exp_year,
        isDefault: pm.id === defaultPmId,
    });

    /**
     * Transforms an array of Stripe payment method objects into formatted payment method objects.
     * Maps each payment method through the transformPayMethod method with the optional default payment method ID and returns the resulting array.
     */
    transformPayMethods = (pms: any[], defaultPmId?: string) =>
        pms.map((pm: any) => this.transformPayMethod(pm, defaultPmId));

    /**
     * Deduces the income category from the invoice.
     * AFFILIATE if discountApplied is not null, SUBSCRIPTION otherwise.
     */
    getInvoiceCategory = (inv: SubscriptionInvoiceEntity): IncomeCategoryEnum =>
        inv.discountApplied == null
            ? IncomeCategoryEnum.SUBSCRIPTION
            : IncomeCategoryEnum.AFFILIATE;

    /**
     * Builds a human-readable revenue label based on the invoice category and subscription period.
     * e.g. "Membership (Monthly)", "Membership Affiliate Program (Yearly)"
     */
    getRevenueLabel = (inv: SubscriptionInvoiceEntity): string => {
        const category = this.getInvoiceCategory(inv);
        const period = inv.subscription.period;

        const periodLabel = period === SubscriptionPeriodEnum.YEARLY ? 'Yearly' : 'Monthly';

        return category === IncomeCategoryEnum.AFFILIATE
            ? `Membership Affiliate Program (${periodLabel})`
            : `Membership (${periodLabel})`;
    };

    /**
     * Transforms a SubscriptionInvoiceEntity into a recent income formatted object.
     * Extends the base transformInvoice with a human-readable revenue label and income category.
     */
    transformRecentIncome = (inv: SubscriptionInvoiceEntity) => ({
        invoiceNumber: inv.invoiceNumber,
        amountPaid: inv.amountPaid,
        dateIssued: inv.paidAt,
        status: inv.status,
        category: this.getInvoiceCategory(inv),
        revenueLabel: this.getRevenueLabel(inv),
    });

    /**
     * Transforms an array of SubscriptionInvoiceEntities into recent income formatted objects.
     */
    transformRecentIncomes = (invs: SubscriptionInvoiceEntity[]) =>
        invs.map((inv) => this.transformRecentIncome(inv));

    transformUser = (user: UserEntity & { totalIncome?: number; totalSubscriptions?: number }) => ({
        id: user.id,
        fullname: user.fullname,
        status: user.status,
        registeredAt: user.createdAt,
        avatar: user.avatar?.file,
        color: user.color,
        totalIncome: Number(user['totalIncome'] ?? 0),
        totalSubscriptions: Number(user['totalSubscriptions'] ?? 0),
    });

    transformUsers = (users: UserEntity[]) => users.map((user) => this.transformUser(user));
}
