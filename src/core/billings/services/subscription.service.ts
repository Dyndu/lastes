import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BillingsService } from './billings.service';
import { SubscriptionEntity } from '../entities';
import {
    CouponTypeEnum,
    SubscriptionPeriodEnum,
    SubscriptionStatusEnum,
} from '../../../common/enum';
import { UserEntity } from '../../users/entities/user.entity';
import { CCodeEntity } from '../../c-codes/entities';
import { StripeSubscription } from '../../../libs/stripe/stripe-types';

@Injectable()
export class SubscriptionService {
    /**
     * Service responsible for handling subscriptions operations
     */

    constructor(
        @Inject(forwardRef(() => BillingsService))
        readonly billingsService: BillingsService,
    ) {}

    /**
     * Resolves the Stripe price ID for the specified subscription period.
     * Returns the monthly price ID from environment configuration for MONTHLY period,
     * or the yearly price ID for YEARLY period.
     */
    resolvePriceId(period: SubscriptionPeriodEnum): string {
        const map: Record<SubscriptionPeriodEnum, string> = {
            [SubscriptionPeriodEnum.MONTHLY]:
                this.billingsService.envConfig.stripePriceStarterMonthly,
            [SubscriptionPeriodEnum.YEARLY]:
                this.billingsService.envConfig.stripePriceStarterYearly,
        };
        return map[period];
    }

    /**
     * Asserts that the user does not have an active subscription.
     * Returns early if no existing subscription is provided.
     * Throws a conflict error if the existing subscription status is ACTIVE, TRIALING, or PAST_DUE.
     */
    assertNoActiveSubscription(existing?: SubscriptionEntity): void {
        if (!existing) return;

        if (
            [
                SubscriptionStatusEnum.ACTIVE,
                SubscriptionStatusEnum.TRIALING,
                SubscriptionStatusEnum.PAST_DUE,
            ].includes(existing.status)
        )
            this.billingsService.errorHandler.conflict(
                'User already has an active subscription',
                'This user already has an active subscription',
            );
    }

    /**
     * Resolves the subscription period from a Stripe price ID.
     * Returns MONTHLY if the price ID matches the monthly price configuration,
     * returns YEARLY if it matches the yearly price configuration,
     * otherwise throws a bad request error indicating an unknown price ID.
     */
    resolvePeriodFromPriceId(priceId: string): SubscriptionPeriodEnum {
        if (priceId === this.billingsService.envConfig.stripePriceStarterMonthly)
            return SubscriptionPeriodEnum.MONTHLY;
        if (priceId === this.billingsService.envConfig.stripePriceStarterYearly)
            return SubscriptionPeriodEnum.YEARLY;

        this.billingsService.errorHandler.badRequest(`Unknown priceId: ${priceId}`);
    }

    /**
     * Builds and returns a SubscriptionEntity populated with required and optional properties.
     * Creates a new entity instance, assigns all required fields (customer, subscription, price IDs,
     * status, period, auto-renew flags, and user) along with optional trial dates, and returns the constructed entity.
     */
    buildSEntity(
        required: {
            stripeCustomerId: string;
            stripeSubscriptionId: string;
            stripePriceId: string;
            status: SubscriptionStatusEnum;
            period: SubscriptionPeriodEnum;
            autoRenew: boolean;
            cancelAtPeriodEnd: boolean;
            user: UserEntity;
        },
        optional: {
            trialStart?: Date;
            trialEnd?: Date;
        },
    ): SubscriptionEntity {
        const result = new SubscriptionEntity();
        Object.assign(result, required, optional);
        return result;
    }

    /**
     * Validates that a Stripe coupon exists and is still valid.
     * Retrieves the coupon from Stripe using the provided coupon ID.
     * Throws a bad request error if the coupon is not found or if its valid flag is false.
     */
    async validateStripeCoupon(couponId: string): Promise<void> {
        try {
            const stripeCoupon =
                await this.billingsService.stripeService.client.coupons.retrieve(couponId);
            if (!stripeCoupon.valid)
                this.billingsService.errorHandler.badRequest(
                    `Coupon "${couponId}" is no longer valid on Stripe`,
                    `Coupon not valid`,
                );
        } catch {
            this.billingsService.errorHandler.badRequest(
                `Coupon "${couponId}" not found on Stripe`,
            );
        }
    }

    /**
     * Resolves and validates a coupon code for a specific user and subscription period.
     * Retrieves the coupon matching the code and period, checks that the current date falls within
     * the coupon's start and end dates, asserts that the user has not already redeemed the coupon,
     * and returns the validated coupon entity.
     */
    async resolveCoupon(
        user: UserEntity,
        code: string,
        period: SubscriptionPeriodEnum,
    ): Promise<CCodeEntity> {
        const now = new Date();

        const coupon =
            await this.billingsService.couponService.preCCService.retrieveCCodesByCriteria({
                code,
                subscriptionPeriod: period,
            });

        if (now < coupon.startDate || now > coupon.endDate)
            this.billingsService.errorHandler.badRequest(
                `Coupon "${code}" is expired or not yet active`,
            );

        await this.billingsService.couponService.cRedemptionService.assertNotRedeemed(user, coupon);

        return coupon;
    }

    /**
     * Retrieves a subscription entity by the specified criteria.
     * Formats the criteria for logging, attempts to find an active subscription
     * matching the criteria, throws a not found error if none exists,
     * and returns the found subscription.
     */
    async retrieveSubByCriteria(
        criteria: Record<string, any>,
        relations?: string[],
    ): Promise<SubscriptionEntity> {
        const entry = this.billingsService.otherUtils.formatCriteria(criteria);
        this.billingsService.logger.info(`Finding a subscription by ${entry}`);

        const isSubExist = await this.billingsService.subscriptionRepo.findActiveOne(
            this.billingsService.subscriptionRepo,
            criteria,
            relations,
        );

        if (!isSubExist)
            this.billingsService.errorHandler.notFound(
                `Subscription not found with entry ${entry}`,
                `Subscription not found`,
            );

        return isSubExist;
    }

    /**
     * Retrieves an existing Stripe customer ID for the user or creates a new Stripe customer.
     * Checks for an existing subscription with a Stripe customer ID,
     * returns the existing ID if found,
     * otherwise creates a new Stripe customer using the user's email and metadata,
     * and returns the newly created customer ID.
     */
    async getOrCreateStripeCustomer(user: UserEntity): Promise<string> {
        if (user.stripeCustomerId) return user.stripeCustomerId;

        const customer = await this.billingsService.stripeService.createCustomer(
            user.email,
            `${user.fullname}`,
            { userId: user.id },
        );

        await this.billingsService.userService.preUserService.updateUserDetails(user, {
            stripeCustomerId: customer.id,
        });

        return customer.id;
    }

    /**
     * Determines if the user is subscribing for the first time.
     * Counts all invoices associated with the user's subscriptions,
     * returns true if the count is zero (no previous invoices),
     * otherwise returns false.
     */
    async isFirstSubscription(user: UserEntity): Promise<boolean> {
        const count = await this.billingsService.invoiceRepository
            .getRepository()
            .createQueryBuilder('invoices')
            .leftJoin('invoices.subscription', 'sub')
            .leftJoin('sub.user', 'user')
            .where('user.id = :userId', { userId: user.id })
            .getCount();
        return count === 0;
    }

    /**
     * Resolves applicable discounts (free trial days and/or Stripe coupon) for a user's subscription.
     * Checks if the user is a first-time subscriber to determine base trial eligibility.
     * If no coupon code is provided, returns trial days for first-time users only.
     * If an ADDITIONAL_FREE_TRIAL coupon is used, adds or replaces trial days based on first-time status.
     * For PRICE_DISCOUNT coupons, validates the coupon with Stripe and returns the stripeCouponId along with standard first-time trial days.
     */
    async resolveDiscounts(
        user: UserEntity,
        dto: {
            period: SubscriptionPeriodEnum;
            couponCode?: string;
        },
    ): Promise<{ trialDays?: number; stripeCouponId?: string }> {
        const isFirst = await this.isFirstSubscription(user);

        if (!dto.couponCode)
            return {
                trialDays: isFirst ? this.billingsService.envConfig.freeTrialDays : undefined,
            };

        const coupon = await this.resolveCoupon(user, dto.couponCode, dto.period);

        if (coupon.couponType === CouponTypeEnum.ADDITIONAL_FREE_TRIAL)
            return {
                trialDays: isFirst
                    ? this.billingsService.envConfig.freeTrialDays + (coupon.freeTrialDays ?? 0)
                    : (coupon.freeTrialDays ?? undefined),
            };

        await this.validateStripeCoupon(coupon.code);
        return {
            stripeCouponId: coupon.code,
            trialDays: isFirst ? this.billingsService.envConfig.freeTrialDays : undefined,
        };
    }

    /**
     * Creates a Stripe checkout session for subscription payment.
     * Delegates to the Stripe service to create a checkout session using the provided customer ID,
     * price ID, trial days, and optional coupon ID.
     * Uses dashboard link for success URL and admin support link with billing cancel path for cancel URL.
     */
    async createStripeSession(
        stripeCustomerId: string,
        priceId: string,
        trialDays?: number,
        stripeCouponId?: string,
    ) {
        return this.billingsService.stripeService.createCheckoutSession(
            stripeCustomerId,
            priceId,
            {
                success: `${this.billingsService.envConfig.dashboardLink}`,
                cancel: `${this.billingsService.envConfig.subFailedLink}`,
            },
            trialDays,
            stripeCouponId,
        );
    }

    /**
     * Creates a Stripe checkout session for a user's subscription.
     * Checks for and asserts no active subscription exists for the user,
     * resolves the Stripe price ID for the requested period,
     * calculates applicable discounts (trial days and coupon),
     * retrieves or creates the Stripe customer,
     * creates a Stripe checkout session with all resolved parameters,
     * and returns the session URL for redirection.
     */
    async createCheckout(
        user: UserEntity,
        dto: {
            period: SubscriptionPeriodEnum;
            couponCode?: string;
        },
    ) {
        const existing = await this.billingsService.subscriptionRepo.findOne({
            where: { user: { id: user.id } },
        });
        this.assertNoActiveSubscription(existing ?? undefined);

        const priceId = this.resolvePriceId(dto.period);
        const { trialDays, stripeCouponId } = await this.resolveDiscounts(user, dto);
        const stripeCustomerId = await this.getOrCreateStripeCustomer(user);
        const session = await this.createStripeSession(
            stripeCustomerId,
            priceId,
            trialDays,
            stripeCouponId,
        );

        return { url: session.url };
    }

    async cancelNow(userId: string): Promise<{ message: string }> {
        const sub = await this.retrieveSubByCriteria({ user: { id: userId } });
        await this.billingsService.stripeService.cancelSubscription(sub.stripeSubscriptionId, true);
        return { message: 'Subscription cancelled successfully.' };
    }

    async changePeriod(
        userId: string,
        newPeriod: SubscriptionPeriodEnum,
    ): Promise<{ message: string }> {
        const sub = await this.retrieveSubByCriteria({ user: { id: userId } });

        if (sub.period === newPeriod)
            this.billingsService.errorHandler.badRequest('Already on this period');

        const newPriceId = this.resolvePriceId(newPeriod);
        await this.billingsService.stripeService.updateSubscription(
            sub.stripeSubscriptionId,
            newPriceId,
        );

        return { message: 'Subscription period updated successfully.' };
    }

    /**
     * Creates a local subscription record from Stripe subscription data.
     * Resolves the subscription period from the Stripe price ID, builds a subscription entity using the Stripe subscription details and associated user,
     * including customer ID, subscription ID, price ID, status, period, auto-renew flags,
     * and optional trial dates, and persists the entity via the repository.
     */
    async createSub(user: UserEntity, sub: StripeSubscription) {
        const period = this.billingsService.subscriptionService.resolvePeriodFromPriceId(
            sub.items.data[0].price.id,
        );

        return await this.billingsService.subscriptionRepo.create(
            this.billingsService.subscriptionService.buildSEntity(
                {
                    stripeCustomerId: sub.customer as string,
                    stripeSubscriptionId: sub.id,
                    stripePriceId: sub.items.data[0].price.id,
                    status: sub.status as SubscriptionStatusEnum,
                    period,
                    autoRenew: !sub.cancel_at_period_end,
                    cancelAtPeriodEnd: sub.cancel_at_period_end,
                    user,
                },
                {
                    trialStart: sub.trial_start ? new Date(sub.trial_start * 1000) : undefined,
                    trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : undefined,
                },
            ),
        );
    }

    async updateSub(
        result: SubscriptionEntity,
        itemized?: Partial<{
            stripePriceId: string;
            status: SubscriptionStatusEnum;
            period: SubscriptionPeriodEnum;
            currentPeriodStart: Date;
            currentPeriodEnd: Date;
            autoRenew: boolean;
            cancelAtPeriodEnd: boolean;
            trialStart?: Date;
            trialEnd?: Date;
            stripeCouponId?: string;
            discountApplied?: number;
        }>,
    ) {
        if (!itemized || Object.keys(itemized).length === 0)
            return {
                message: 'No updates provided for acquisition update',
            };

        const stringFields = ['stripePriceId', 'stripeCouponId'];

        const otherFields = [
            'status',
            'period',
            'currentPeriodStart',
            'currentPeriodEnd',
            'autoRenew',
            'cancelAtPeriodEnd',
            'trialStart',
            'trialEnd',
            'discountApplied',
        ] as const;

        const updatePayload: Partial<SubscriptionEntity> = {};

        stringFields.forEach((field) => {
            if (itemized[field]?.trim()) updatePayload[field] = itemized[field].trim();
        });

        otherFields.forEach((field) => {
            if (itemized[field] !== undefined) updatePayload[field] = itemized[field] as any;
        });

        return await this.billingsService.subscriptionRepo.update({ id: result.id }, updatePayload);
    }
}
