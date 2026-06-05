import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { StripeEvent, StripeInvoice, StripeSubscription } from '../../../libs/stripe/stripe-types';
import { BillingsService } from './billings.service';
import { InvoiceStatusEnum, SubscriptionStatusEnum } from '../../../common/enum';
import { CCodeEntity } from '../../c-codes/entities';
import { SubscriptionEntity } from '../entities';

@Injectable()
export class SWebhookService {
    /**
     * Service responsible for handling billing webhook from stripe
     */

    constructor(
        @Inject(forwardRef(() => BillingsService))
        readonly billingsService: BillingsService,
    ) {}

    async handle(event: StripeEvent) {
        this.billingsService.logger.info(`Webhook received: ${event.type}`);
        const obj = event.data.object as unknown as Record<string, unknown>;

        const handlers: Record<string, () => Promise<void>> = {
            'customer.subscription.created': () =>
                this.onSubscriptionCreated(obj as unknown as StripeSubscription),
            'customer.subscription.updated': () =>
                this.onSubscriptionUpdated(obj as unknown as StripeSubscription),
            'customer.subscription.deleted': () =>
                this.onSubscriptionDeleted(obj as unknown as StripeSubscription),
            'invoice.payment_succeeded': () =>
                this.onPaymentSucceeded(obj as unknown as StripeInvoice),
            'invoice.payment_failed': () => this.onPaymentFailed(obj as unknown as StripeInvoice),
            'customer.subscription.trial_will_end': () =>
                this.onTrialWillEnd(obj as unknown as StripeSubscription),
        };

        const handler = handlers[event.type];
        if (handler) await handler();
        else this.billingsService.logger.info(`Unhandled event: ${event.type}`);
    }

    /**
     * Handles the Stripe webhook event for subscription creation.
     * Logs the subscription ID, retrieves the user associated with the Stripe customer ID,
     * and creates a corresponding subscription record in the database.
     */
    async onSubscriptionCreated(sub: StripeSubscription) {
        this.billingsService.logger.info(`Subscription created: ${sub.id}`);

        const user = await this.billingsService.userService.preUserService.retrieveUserByCriteria({
            stripeCustomerId: sub.customer as string,
        });

        await this.billingsService.subscriptionService.createSub(user, sub);
    }

    /**
     * Handles the Stripe webhook event for subscription updates.
     * Logs the subscription ID and new status, retrieves the existing subscription record
     * using the Stripe subscription ID, and updates the local subscription entity
     * with the latest Stripe data including status, auto-renewal flags, price ID,
     * period, and trial dates.
     */
    async onSubscriptionUpdated(sub: StripeSubscription) {
        this.billingsService.logger.info(`Subscription updated: ${sub.id} → ${sub.status}`);

        const existing = await this.billingsService.subscriptionService.retrieveSubByCriteria({
            stripeSubscriptionId: sub.id,
        });

        await this.billingsService.subscriptionService.updateSub(existing, {
            status: sub.status as SubscriptionStatusEnum,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            autoRenew: !sub.cancel_at_period_end,
            stripePriceId: sub.items.data[0].price.id,
            period: this.billingsService.subscriptionService.resolvePeriodFromPriceId(
                sub.items.data[0].price.id,
            ),
            trialStart: sub.trial_start ? new Date(sub.trial_start * 1000) : existing.trialStart,
            trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : existing.trialEnd,
        });
    }

    /**
     * Handles the Stripe webhook event for subscription deletion/cancellation.
     * Logs the subscription ID, retrieves the existing subscription record
     * using the Stripe subscription ID, and updates its status to CANCEL.
     */
    async onSubscriptionDeleted(sub: StripeSubscription) {
        this.billingsService.logger.info(`Subscription canceled: ${sub.id}`);

        const existing = await this.billingsService.subscriptionService.retrieveSubByCriteria({
            stripeSubscriptionId: sub.id,
        });

        await this.billingsService.subscriptionService.updateSub(existing, {
            status: SubscriptionStatusEnum.CANCELED,
        });
    }

    async resolveSubscription(stripeSubscriptionId: string): Promise<SubscriptionEntity | null> {
        const fetch = () =>
            this.billingsService.subscriptionService
                .retrieveSubByCriteria({ stripeSubscriptionId }, ['user'])
                .catch(() => null);

        let sub = await fetch();
        if (sub) return sub;

        this.billingsService.logger.warn(
            `Subscription ${stripeSubscriptionId} not found, retrying...`,
        );

        for (let i = 0; i < 5; i++) {
            await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
            sub = await fetch();
            if (sub) return sub;
        }

        this.billingsService.logger.error(
            `Subscription ${stripeSubscriptionId} still not found after retries`,
        );
        return null;
    }

    /**
     * Handles the Stripe webhook event for successful payment.
     * Logs invoice details including amount and currency, skips processing if no subscription is associated,
     * retrieves the subscription record using the Stripe subscription ID,
     * attempts to find and associate a coupon if one was applied to the invoice,
     * creates a paid invoice record in the database,
     * and creates a coupon redemption record if both a coupon and user exist on the subscription.
     */
    async onPaymentSucceeded(invoice: StripeInvoice) {
        const inv = invoice as any;
        this.billingsService.logger.info(
            `Payment ok: ${invoice.id} — ${inv.amount_paid / 100} ${invoice.currency}`,
        );

        if (!inv.subscription) return;

        const sub = await this.resolveSubscription(inv.subscription);
        if (!sub) return;

        let coupon: CCodeEntity | undefined;
        if (inv.discount?.coupon?.id)
            coupon = await this.billingsService.couponService.preCCService
                .retrieveCCodesByCriteria({ code: inv.discount.coupon.id })
                .catch(() => undefined);

        await this.billingsService.invoiceService.createInvoice(
            sub,
            inv,
            InvoiceStatusEnum.PAID,
            inv.amount_paid,
            coupon,
        );

        if (coupon && sub.user)
            await this.billingsService.couponService.cRedemptionService.createCRedemption(
                sub.user,
                coupon,
            );
    }

    /**
     * Handles the Stripe webhook event for failed payment.
     * Logs a warning with the invoice ID, skips processing if no subscription is associated,
     * retrieves the subscription record using the Stripe subscription ID,
     * creates an invoice record with OPEN status and zero amount,
     * updates the subscription status to PAST_DUE,
     * and persists the updated subscription.
     */
    async onPaymentFailed(invoice: StripeInvoice) {
        const inv = invoice as any;
        this.billingsService.logger.warn(`Payment failed: ${invoice.id}`);

        if (!inv.subscription) return;

        const sub = await this.resolveSubscription(inv.subscription);
        if (!sub) return;

        await this.billingsService.invoiceService.createInvoice(
            sub,
            inv,
            InvoiceStatusEnum.OPEN,
            0,
        );

        await this.billingsService.subscriptionService.updateSub(sub, {
            status: SubscriptionStatusEnum.PAST_DUE,
        });
    }

    async onTrialWillEnd(sub: StripeSubscription) {
        const daysLeft = Math.ceil(((sub.trial_end ?? 0) - Date.now() / 1000) / 86400);
        this.billingsService.logger.info(`Trial ending in ${daysLeft}d for sub ${sub.id}`);

        const existing = await this.billingsService.subscriptionService.retrieveSubByCriteria({
            stripeSubscriptionId: sub.id,
        });

        /**await this.billingsService.notificationService.notifyTrialWillEnd(
         existing.userId,
         daysLeft,
         );*/
    }
}
