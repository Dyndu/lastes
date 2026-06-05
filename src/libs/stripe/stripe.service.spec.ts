import { Test, TestingModule } from '@nestjs/testing';
import { StripeService } from './stripe.service';
import { EnvConfigService } from '../../utils/services/config';

jest.mock('stripe');

const MockStripe = require('stripe') as jest.Mock;

const mockStripeClient = {
    webhooks: {
        constructEvent: jest.fn(),
    },
    customers: {
        retrieve: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    },
    subscriptions: {
        cancel: jest.fn(),
        update: jest.fn(),
        retrieve: jest.fn(),
    },
    paymentMethods: {
        list: jest.fn(),
        detach: jest.fn(),
    },
    checkout: {
        sessions: {
            create: jest.fn(),
        },
    },
    coupons: {
        create: jest.fn(),
        del: jest.fn(),
    },
};

MockStripe.mockImplementation(() => mockStripeClient);

describe('StripeService', () => {
    let service: StripeService;
    let envConfigService: EnvConfigService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StripeService,
                {
                    provide: EnvConfigService,
                    useValue: {
                        stripeSecretKey: 'sk_test_mock_key',
                    },
                },
            ],
        }).compile();

        service = module.get<StripeService>(StripeService);
        envConfigService = module.get<EnvConfigService>(EnvConfigService);
    });

    describe('constructor', () => {
        it('should initialize Stripe client with the correct secret key and API version', () => {
            expect(MockStripe).toHaveBeenCalledWith('sk_test_mock_key', {
                apiVersion: '2026-04-22.dahlia',
            });
            expect(service.client).toBe(mockStripeClient);
        });
    });

    describe('constructWebhookEvent', () => {
        it('should call webhooks.constructEvent with correct arguments and return the event', () => {
            const payload = Buffer.from('payload');
            const signature = 'sig_test';
            const secret = 'whsec_test';
            const mockEvent = { type: 'payment_intent.succeeded' };

            mockStripeClient.webhooks.constructEvent.mockReturnValue(mockEvent);

            const result = service.constructWebhookEvent(payload, signature, secret);

            expect(mockStripeClient.webhooks.constructEvent).toHaveBeenCalledWith(
                payload,
                signature,
                secret,
            );
            expect(result).toBe(mockEvent);
        });
    });

    describe('getCustomer', () => {
        it('should call customers.retrieve with the correct customer ID and return the customer', async () => {
            const customerId = 'cus_test123';
            const mockCustomer = { id: customerId, email: 'test@example.com' };

            mockStripeClient.customers.retrieve.mockResolvedValue(mockCustomer);

            const result = await service.getCustomer(customerId);

            expect(mockStripeClient.customers.retrieve).toHaveBeenCalledWith(customerId);
            expect(result).toBe(mockCustomer);
        });
    });

    describe('createCustomer', () => {
        it('should create a customer with email, name, and metadata', async () => {
            const email = 'test@example.com';
            const name = 'Test User';
            const metadata = { userId: '42' };
            const mockCustomer = { id: 'cus_new', email, name };

            mockStripeClient.customers.create.mockResolvedValue(mockCustomer);

            const result = await service.createCustomer(email, name, metadata);

            expect(mockStripeClient.customers.create).toHaveBeenCalledWith({
                email,
                name,
                metadata,
            });
            expect(result).toBe(mockCustomer);
        });

        it('should create a customer without metadata when not provided', async () => {
            const email = 'test@example.com';
            const name = 'Test User';
            const mockCustomer = { id: 'cus_new', email, name };

            mockStripeClient.customers.create.mockResolvedValue(mockCustomer);

            const result = await service.createCustomer(email, name);

            expect(mockStripeClient.customers.create).toHaveBeenCalledWith({
                email,
                name,
                metadata: undefined,
            });
            expect(result).toBe(mockCustomer);
        });
    });

    describe('cancelSubscription', () => {
        it('should cancel subscription immediately when immediately=true', async () => {
            const subscriptionId = 'sub_test123';
            const mockCanceledSub = { id: subscriptionId, status: 'canceled' };

            mockStripeClient.subscriptions.cancel.mockResolvedValue(mockCanceledSub);

            const result = await service.cancelSubscription(subscriptionId, true);

            expect(mockStripeClient.subscriptions.cancel).toHaveBeenCalledWith(subscriptionId);
            expect(mockStripeClient.subscriptions.update).not.toHaveBeenCalled();
            expect(result).toBe(mockCanceledSub);
        });

        it('should set cancel_at_period_end when immediately=false (default)', async () => {
            const subscriptionId = 'sub_test123';
            const mockUpdatedSub = { id: subscriptionId, cancel_at_period_end: true };

            mockStripeClient.subscriptions.update.mockResolvedValue(mockUpdatedSub);

            const result = await service.cancelSubscription(subscriptionId, false);

            expect(mockStripeClient.subscriptions.update).toHaveBeenCalledWith(subscriptionId, {
                cancel_at_period_end: true,
            });
            expect(mockStripeClient.subscriptions.cancel).not.toHaveBeenCalled();
            expect(result).toBe(mockUpdatedSub);
        });

        it('should default to cancel_at_period_end when immediately is not provided', async () => {
            const subscriptionId = 'sub_test123';
            const mockUpdatedSub = { id: subscriptionId, cancel_at_period_end: true };

            mockStripeClient.subscriptions.update.mockResolvedValue(mockUpdatedSub);

            const result = await service.cancelSubscription(subscriptionId);

            expect(mockStripeClient.subscriptions.update).toHaveBeenCalledWith(subscriptionId, {
                cancel_at_period_end: true,
            });
            expect(result).toBe(mockUpdatedSub);
        });
    });

    describe('resumeSubscription', () => {
        it('should set cancel_at_period_end to false to resume the subscription', async () => {
            const subscriptionId = 'sub_test123';
            const mockResumedSub = { id: subscriptionId, cancel_at_period_end: false };

            mockStripeClient.subscriptions.update.mockResolvedValue(mockResumedSub);

            const result = await service.resumeSubscription(subscriptionId);

            expect(mockStripeClient.subscriptions.update).toHaveBeenCalledWith(subscriptionId, {
                cancel_at_period_end: false,
            });
            expect(result).toBe(mockResumedSub);
        });
    });

    describe('setDefaultPaymentMethod', () => {
        it('should update the customer invoice settings with the given payment method', async () => {
            const customerId = 'cus_test123';
            const paymentMethodId = 'pm_test123';
            const mockUpdatedCustomer = { id: customerId };

            mockStripeClient.customers.update.mockResolvedValue(mockUpdatedCustomer);

            const result = await service.setDefaultPaymentMethod(customerId, paymentMethodId);

            expect(mockStripeClient.customers.update).toHaveBeenCalledWith(customerId, {
                invoice_settings: { default_payment_method: paymentMethodId },
            });
            expect(result).toBe(mockUpdatedCustomer);
        });
    });

    describe('listPaymentMethods', () => {
        it('should list all card payment methods for the given customer', async () => {
            const customerId = 'cus_test123';
            const mockPaymentMethods = { data: [{ id: 'pm_1' }, { id: 'pm_2' }] };

            mockStripeClient.paymentMethods.list.mockResolvedValue(mockPaymentMethods);

            const result = await service.listPaymentMethods(customerId);

            expect(mockStripeClient.paymentMethods.list).toHaveBeenCalledWith({
                customer: customerId,
                type: 'card',
            });
            expect(result).toBe(mockPaymentMethods);
        });
    });

    describe('detachPaymentMethod', () => {
        it('should detach the specified payment method', async () => {
            const paymentMethodId = 'pm_test123';
            const mockDetachedPm = { id: paymentMethodId, customer: null };

            mockStripeClient.paymentMethods.detach.mockResolvedValue(mockDetachedPm);

            const result = await service.detachPaymentMethod(paymentMethodId);

            expect(mockStripeClient.paymentMethods.detach).toHaveBeenCalledWith(paymentMethodId);
            expect(result).toBe(mockDetachedPm);
        });
    });

    describe('updateSubscription', () => {
        it('should retrieve the subscription and update it with the new price ID', async () => {
            const subscriptionId = 'sub_test123';
            const priceId = 'price_new123';
            const mockSub = {
                id: subscriptionId,
                items: { data: [{ id: 'si_item123' }] },
            };
            const mockUpdatedSub = {
                id: subscriptionId,
                items: { data: [{ price: { id: priceId } }] },
            };

            mockStripeClient.subscriptions.retrieve.mockResolvedValue(mockSub);
            mockStripeClient.subscriptions.update.mockResolvedValue(mockUpdatedSub);

            const result = await service.updateSubscription(subscriptionId, priceId);

            expect(mockStripeClient.subscriptions.retrieve).toHaveBeenCalledWith(subscriptionId);
            expect(mockStripeClient.subscriptions.update).toHaveBeenCalledWith(subscriptionId, {
                items: [{ id: 'si_item123', price: priceId }],
                proration_behavior: 'create_prorations',
            });
            expect(result).toBe(mockUpdatedSub);
        });
    });

    describe('createCheckoutSession', () => {
        const customerId = 'cus_test123';
        const priceId = 'price_test123';
        const urls = {
            success: 'https://example.com/success',
            cancel: 'https://example.com/cancel',
        };
        const mockSession = { id: 'cs_test123', url: 'https://checkout.stripe.com/test' };

        beforeEach(() => {
            mockStripeClient.checkout.sessions.create.mockResolvedValue(mockSession);
        });

        it('should create a checkout session without trial days or coupon', async () => {
            const result = await service.createCheckoutSession(customerId, priceId, urls);

            expect(mockStripeClient.checkout.sessions.create).toHaveBeenCalledWith({
                customer: customerId,
                mode: 'subscription',
                line_items: [{ price: priceId, quantity: 1 }],
                allow_promotion_codes: true,
                subscription_data: {},
                success_url: urls.success,
                cancel_url: urls.cancel,
            });
            expect(result).toBe(mockSession);
        });

        it('should create a checkout session with trial days', async () => {
            const result = await service.createCheckoutSession(customerId, priceId, urls, 14);

            expect(mockStripeClient.checkout.sessions.create).toHaveBeenCalledWith({
                customer: customerId,
                mode: 'subscription',
                line_items: [{ price: priceId, quantity: 1 }],
                allow_promotion_codes: true,
                subscription_data: { trial_period_days: 14 },
                success_url: urls.success,
                cancel_url: urls.cancel,
            });
            expect(result).toBe(mockSession);
        });

        it('should create a checkout session with a coupon (no promotion codes)', async () => {
            const couponId = 'COUPON50';

            const result = await service.createCheckoutSession(
                customerId,
                priceId,
                urls,
                undefined,
                couponId,
            );

            expect(mockStripeClient.checkout.sessions.create).toHaveBeenCalledWith({
                customer: customerId,
                mode: 'subscription',
                line_items: [{ price: priceId, quantity: 1 }],
                discounts: [{ coupon: couponId }],
                subscription_data: {},
                success_url: urls.success,
                cancel_url: urls.cancel,
            });
            expect(result).toBe(mockSession);
        });

        it('should create a checkout session with both trial days and a coupon', async () => {
            const couponId = 'COUPON50';

            const result = await service.createCheckoutSession(
                customerId,
                priceId,
                urls,
                7,
                couponId,
            );

            expect(mockStripeClient.checkout.sessions.create).toHaveBeenCalledWith({
                customer: customerId,
                mode: 'subscription',
                line_items: [{ price: priceId, quantity: 1 }],
                discounts: [{ coupon: couponId }],
                subscription_data: { trial_period_days: 7 },
                success_url: urls.success,
                cancel_url: urls.cancel,
            });
            expect(result).toBe(mockSession);
        });
    });

    describe('createCoupon', () => {
        it('should create a coupon with all parameters', async () => {
            const params = {
                id: 'SUMMER20',
                name: 'Summer Sale 20%',
                percentOff: 20,
                maxRedemptions: 100,
                redeemBy: 1735689600,
            };
            const mockCoupon = { id: params.id, percent_off: params.percentOff };

            mockStripeClient.coupons.create.mockResolvedValue(mockCoupon);

            const result = await service.createCoupon(params);

            expect(mockStripeClient.coupons.create).toHaveBeenCalledWith({
                id: params.id,
                name: params.name,
                percent_off: params.percentOff,
                duration: 'once',
                max_redemptions: params.maxRedemptions,
                redeem_by: params.redeemBy,
                currency: 'usd',
            });
            expect(result).toBe(mockCoupon);
        });

        it('should create a coupon without optional maxRedemptions and redeemBy', async () => {
            const params = {
                id: 'PROMO10',
                name: 'Promo 10%',
                percentOff: 10,
            };
            const mockCoupon = { id: params.id, percent_off: params.percentOff };

            mockStripeClient.coupons.create.mockResolvedValue(mockCoupon);

            const result = await service.createCoupon(params);

            expect(mockStripeClient.coupons.create).toHaveBeenCalledWith({
                id: params.id,
                name: params.name,
                percent_off: params.percentOff,
                duration: 'once',
                max_redemptions: undefined,
                redeem_by: undefined,
                currency: 'usd',
            });
            expect(result).toBe(mockCoupon);
        });
    });

    describe('deleteCoupon', () => {
        it('should delete the specified coupon', async () => {
            const couponId = 'SUMMER20';
            const mockDeletedCoupon = { id: couponId, deleted: true };

            mockStripeClient.coupons.del.mockResolvedValue(mockDeletedCoupon);

            const result = await service.deleteCoupon(couponId);

            expect(mockStripeClient.coupons.del).toHaveBeenCalledWith(couponId);
            expect(result).toBe(mockDeletedCoupon);
        });
    });
});
