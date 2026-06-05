import Stripe from 'stripe';
type StripeClient = InstanceType<typeof Stripe>;

export type StripeEvent = ReturnType<StripeClient['webhooks']['constructEvent']>;
export type StripeSubscription = Awaited<ReturnType<StripeClient['subscriptions']['retrieve']>>;
export type StripeInvoice = Awaited<ReturnType<StripeClient['invoices']['retrieve']>>;
