import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { EnvConfigService } from '../../utils/services/config';

@Injectable()
export class StripeService {
    public client: InstanceType<typeof Stripe>;

    constructor(private readonly envConfig: EnvConfigService) {
        this.client = new Stripe(this.envConfig.stripeSecretKey, {
            apiVersion: '2026-04-22.dahlia',
        });
    }

    /**
     * Constructs a Stripe webhook event from the request payload, signature, and webhook secret.
     * Verifies the event authenticity using the provided signature and secret,
     * and returns the constructed event object.
     */
    constructWebhookEvent = (payload: Buffer, signature: string, secret: string) =>
        this.client.webhooks.constructEvent(payload, signature, secret);

    /**
     * Retrieves a Stripe customer by their customer ID.
     * Calls the Stripe API to fetch and return the customer object.
     */
    getCustomer = (customerId: string) => this.client.customers.retrieve(customerId);

    /**
     * Creates a new Stripe customer with the provided email, name, and optional metadata.
     * Calls the Stripe API to create and return the customer object.
     */
    createCustomer = (email: string, name: string, metadata?: Record<string, string>) =>
        this.client.customers.create({ email, name, metadata });

    /**
     * Cancels a Stripe subscription either immediately or at period end.
     * If immediately is true, cancels the subscription right away.
     * If immediately is false, updates the subscription to cancel at the end of the current billing period.
     */
    cancelSubscription(subscriptionId: string, immediately = false) {
        if (immediately) return this.client.subscriptions.cancel(subscriptionId);
        return this.client.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
        });
    }

    /**
     * Resumes a canceled Stripe subscription by removing the cancel-at-period-end flag.
     * Updates the subscription to prevent cancellation at the end of the current billing period.
     */
    resumeSubscription = (subscriptionId: string) =>
        this.client.subscriptions.update(subscriptionId, {
            cancel_at_period_end: false,
        });

    /**
     * Sets a payment method as the default for a Stripe customer.
     * Updates the customer's invoice settings to use the specified payment method as default.
     */
    setDefaultPaymentMethod = (customerId: string, paymentMethodId: string) =>
        this.client.customers.update(customerId, {
            invoice_settings: { default_payment_method: paymentMethodId },
        });

    /**
     * Lists all card payment methods for a Stripe customer.
     * Retrieves and returns a list of payment methods filtered by type 'card' for the specified customer.
     */
    listPaymentMethods = (customerId: string) =>
        this.client.paymentMethods.list({ customer: customerId, type: 'card' });

    /**
     * Detaches a payment method from a Stripe customer.
     * Calls the Stripe API to detach the specified payment method, removing it from the customer.
     */
    detachPaymentMethod = (paymentMethodId: string) =>
        this.client.paymentMethods.detach(paymentMethodId);

    /**
     * Updates a Stripe subscription to a new price ID.
     * Retrieves the existing subscription, then updates its first line item to use the new price ID
     * with prorations enabled to properly adjust billing.
     */
    async updateSubscription(subscriptionId: string, priceId: string) {
        return this.client.subscriptions.retrieve(subscriptionId).then((sub) =>
            this.client.subscriptions.update(subscriptionId, {
                items: [{ id: sub.items.data[0].id, price: priceId }],
                proration_behavior: 'create_prorations',
            }),
        );
    }

    /**
     * Creates a Stripe checkout session for subscription payment.
     * Builds a checkout session with customer ID, subscription mode, price ID, optional trial days and coupon discount,
     * promotion codes enabled if no coupon is provided, and success/cancel URLs for redirection.
     */
    createCheckoutSession = (
        customerId: string,
        priceId: string,
        urls: { success: string; cancel: string },
        trialDays?: number,
        couponId?: string,
    ) =>
        this.client.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            line_items: [{ price: priceId, quantity: 1 }],
            ...(couponId ? { discounts: [{ coupon: couponId }] } : { allow_promotion_codes: true }),
            subscription_data: {
                ...(trialDays ? { trial_period_days: trialDays } : {}),
            },
            success_url: urls.success,
            cancel_url: urls.cancel,
        });

    /**
     * Creates a Stripe coupon with the specified parameters.
     * Creates a coupon using the provided ID, name, percent off, optional max redemptions, and optional redeem-by date, with duration set to 'once' and currency in USD.
     */
    createCoupon = (params: {
        id: string;
        name: string;
        percentOff: number;
        maxRedemptions?: number;
        redeemBy?: number;
    }) =>
        this.client.coupons.create({
            id: params.id,
            name: params.name,
            percent_off: params.percentOff,
            duration: 'once',
            max_redemptions: params.maxRedemptions,
            redeem_by: params.redeemBy,
            currency: 'usd',
        });

    /**
     * Deletes a Stripe coupon by its ID.
     * Calls the Stripe API to permanently delete the specified coupon.
     */
    deleteCoupon = (couponId: string) => this.client.coupons.del(couponId);
}
