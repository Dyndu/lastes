import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { SubscriptionRepository, SubscriptionInvoiceRepository } from '../repositories';
import { OtherUtils } from '../../../utils/services/tools';
import { ErrorHandlerService } from '../../../common/response';
import { StripeService } from '../../../libs/stripe/stripe.service';
import { EnvConfigService } from '../../../utils/services/config';
import { CCodesService } from '../../c-codes/services';
import { UsersService } from '../../users/services';
import { SubscriptionService } from './subscription.service';
import { SInvoiceService } from './s-invoice.service';
import { CacheService } from '../../../helpers/cache/cache.service';
import { SubscriptionInvoiceEntity } from '../entities';
import { TransformBEntitiesService } from './transform-b-entities.service';
import type { CurrentUserInterface } from '../../../interface';
import { CreateCheckoutDto } from '../dto';
import { SWebhookService } from './s-webhook.service';
import { AdsService } from '../../ads/services';
import { PreBillingsService } from './pre-billings.service';
import { IncomeCategoryEnum, InvoiceStatusEnum, UserStatusEnum } from '../../../common/enum';
import { UserEntity } from '../../users/entities/user.entity';

@Injectable()
export class BillingsService {
    /**
     * Service responsible for handling billing operation
     */

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        @Inject(forwardRef(() => SubscriptionService))
        readonly subscriptionService: SubscriptionService,
        @Inject(forwardRef(() => SInvoiceService))
        readonly invoiceService: SInvoiceService,
        @Inject(forwardRef(() => SWebhookService))
        readonly sWebhookService: SWebhookService,
        @Inject(forwardRef(() => PreBillingsService))
        readonly preBillingsService: PreBillingsService,
        @Inject(forwardRef(() => TransformBEntitiesService))
        readonly transformBEntitiesService: TransformBEntitiesService,
        readonly stripeService: StripeService,
        readonly couponService: CCodesService,
        readonly adsService: AdsService,
        readonly userService: UsersService,
        readonly cacheService: CacheService,
        readonly subscriptionRepo: SubscriptionRepository,
        readonly invoiceRepository: SubscriptionInvoiceRepository,
        readonly otherUtils: OtherUtils,
        readonly envConfig: EnvConfigService,
        readonly errorHandler: ErrorHandlerService,
    ) {}

    /**
     * Retrieves paginated invoices for a specific user with caching support.
     * Logs the request, generates a Redis cache key based on user ID and optional search term,
     * delegates to the cache service for paginated retrieval,
     * provides a fallback query function that fetches user invoices from the database with pagination,
     * and transforms the retrieved invoice entities before returning.
     */
    async getUserInvoicesByAdmin(
        page: number,
        limit: number,
        filterItems: {
            userId: string;
            searchTerm?: string;
        },
    ) {
        this.logger.info(
            `Retrieve user with id:${filterItems.userId} invoices from cache or database.`,
        );
        const baseKey = this.cacheService.generateRedisKey('invoices', {
            ...(filterItems.userId ? { userId: filterItems.userId } : {}),
            ...(filterItems.searchTerm ? { search: filterItems.searchTerm.toLowerCase() } : {}),
        });

        return await this.cacheService.retrieveGenericPaginated(
            baseKey,
            page,
            limit,
            {
                userId: filterItems.userId,
                searchTerm: filterItems.searchTerm,
            },
            (offset: number, limit: number) =>
                this.invoiceService.retrieveUserInvoicesQuery(offset, limit, {
                    userId: filterItems.userId,
                    searchTerm: filterItems.searchTerm,
                }),
            (items: SubscriptionInvoiceEntity[]) =>
                this.transformBEntitiesService.transformInvoices(items),
        );
    }

    /**
     * Retrieves paginated invoices for the current user with caching support.
     * Logs the request, generates a Redis cache key based on user ID and optional status or search term filters,
     * delegates to the cache service for paginated retrieval,
     * provides a fallback query function that fetches user invoices from the database with pagination and filters,
     * and transforms the retrieved invoice entities before returning.
     */
    async userInvoices(
        user: CurrentUserInterface,
        page: number,
        limit: number,
        filterItems: {
            status?: InvoiceStatusEnum;
            searchTerm?: string;
        },
    ) {
        this.logger.info(`Retrieve user with id:${user.id} invoices from cache or database.`);
        const baseKey = this.cacheService.generateRedisKey('invoices', {
            ...(user.id ? { userId: user.id } : {}),
            ...(filterItems.status ? { search: filterItems.status } : {}),
            ...(filterItems.searchTerm ? { search: filterItems.searchTerm.toLowerCase() } : {}),
        });

        return await this.cacheService.retrieveGenericPaginated(
            baseKey,
            page,
            limit,
            {
                userId: user.id,
                status: filterItems.status,
                searchTerm: filterItems.searchTerm,
            },
            (offset: number, limit: number) =>
                this.invoiceService.retrieveUserInvoicesQuery(offset, limit, {
                    userId: user.id,
                    status: filterItems.status,
                    searchTerm: filterItems.searchTerm,
                }),
            (items: SubscriptionInvoiceEntity[]) =>
                this.transformBEntitiesService.transformInvoices(items),
        );
    }

    /**
     * Retrieves paginated members list with caching support.
     * Logs the request, generates a Redis cache key based on status and search term filters,
     * delegates to the cache service for paginated retrieval,
     * provides a fallback query function that fetches members from the database with pagination and filters,
     * and transforms the retrieved user entities before returning.
     */
    async getMembers(
        page: number,
        limit: number,
        filterItems: {
            status?: UserStatusEnum;
            searchTerm?: string;
        },
    ) {
        this.logger.info(`Retrieve members list from cache or database.`);
        const baseKey = this.cacheService.generateRedisKey('members', {
            ...(filterItems.status ? { status: filterItems.status } : {}),
            ...(filterItems.searchTerm ? { search: filterItems.searchTerm.toLowerCase() } : {}),
        });

        return await this.cacheService.retrieveGenericPaginated(
            baseKey,
            page,
            limit,
            filterItems,
            (offset: number, limit: number) =>
                this.invoiceService.retrieveMembersQuery(offset, limit, {
                    status: filterItems.status,
                    searchTerm: filterItems.searchTerm,
                }),
            (items: UserEntity[]) => this.transformBEntitiesService.transformUsers(items),
        );
    }

    /**
     * Retrieves a single member by ID with enriched data from the database.
     * Logs the request, builds the members base query with userId filter,
     * executes the query to get the user, throws a not found error if no user exists,
     * and transforms the user entity before returning.
     */
    async getMemberById(userId: string) {
        this.logger.info(`Retrieve member with id:${userId} from database.`);
        const user = await this.invoiceService.buildMembersBaseQuery({ userId }).getOne();

        if (!user) this.errorHandler.notFound('Member not found');

        return this.transformBEntitiesService.transformUser(user);
    }

    /**
     * Retrieves recent income records based on optional category and search term filters.
     * Logs the request, delegates to the invoice service to fetch recent income records,
     * and transforms the returned invoice entities before returning.
     */
    async getRecentIncome(filters: {
        limit: number;
        category?: IncomeCategoryEnum;
        searchTerm?: string;
    }) {
        this.logger.info(`Retrieve last income based on filters: ${JSON.stringify(filters)}`);
        const invs = await this.invoiceService.getRecentIncome(filters);
        return this.transformBEntitiesService.transformRecentIncomes(invs);
    }

    /**
     * Retrieves subscription information for a specific user.
     * Logs the request, finds an active (non-deleted) subscription associated with the user ID,
     * transforms the subscription entity if found, otherwise returns null.
     */
    async userSubInfo(userId: string) {
        this.logger.info(
            `Retrieve user with id: ${userId} subscription information if he has one.`,
        );

        const sub = await this.subscriptionRepo.findOne({
            where: { user: { id: userId }, deleted: false },
        });

        if (sub) return this.transformBEntitiesService.transformSubInfo(sub);
        return null;
    }

    /**
     * Retrieves and transforms payment methods for a user's subscription.
     * Finds the user's subscription record to obtain the Stripe customer ID,
     * lists all payment methods from Stripe for that customer,
     * and transforms the payment methods data before returning.
     */
    async getPaymentMethods(userId: string) {
        const user = await this.userService.preUserService.retrieveUserByCriteria({ id: userId });
        if (!user.stripeCustomerId)
            this.errorHandler.badRequest('No Stripe customer found for this user');

        const [customer, result] = await Promise.all([
            this.stripeService.getCustomer(user.stripeCustomerId),
            this.stripeService.listPaymentMethods(user.stripeCustomerId),
        ]);

        const defaultPmId = (customer as any).invoice_settings?.default_payment_method;
        return this.transformBEntitiesService.transformPayMethods(result.data, defaultPmId);
    }

    /**
     * Toggles the auto-renewal setting for a user's subscription.
     * Retrieves the subscription for the given user ID, calculates the new auto-renewal state,
     * logs the action, calls Stripe to resume or cancel the subscription accordingly,
     * updates the subscription entity with the new auto-renewal and cancel-at-period-end flags, and returns a success message indicating the new state.
     */
    async toggleAutoRenew(userId: string) {
        const sub = await this.subscriptionService.retrieveSubByCriteria({ user: { id: userId } });
        const newAutoRenew = !sub.autoRenew;

        this.logger.info(
            `Auto-renew ${newAutoRenew ? 'enabled' : 'disabled'} by user with id: ${userId}`,
        );

        if (newAutoRenew) await this.stripeService.resumeSubscription(sub.stripeSubscriptionId);
        else await this.stripeService.cancelSubscription(sub.stripeSubscriptionId, false);

        await this.subscriptionService.updateSub(sub, {
            autoRenew: newAutoRenew,
            cancelAtPeriodEnd: !newAutoRenew,
        });

        return { message: `Auto-renew ${newAutoRenew ? 'enabled' : 'disabled'} successfully.` };
    }

    /**
     * Detaches a payment method from the user's Stripe customer account.
     * Logs the operation, calls the Stripe service to detach the specified payment method,
     * and returns a success message.
     */
    async detachPaymentMethod(paymentMethodId: string) {
        this.logger.info('Detach a payment method from user list');
        await this.stripeService.detachPaymentMethod(paymentMethodId);
        return { message: 'Payment method removed successfully.' };
    }

    /**
     * Sets a payment method as the default for a user's subscription.
     * Retrieves the user's subscription to obtain the Stripe customer ID,
     * calls the Stripe service to update the default payment method for that customer,
     * and returns a success message.
     */
    async setDefaultPaymentMethod(userId: string, paymentMethodId: string) {
        this.logger.info(`Set payment method with id ${paymentMethodId} as default one`);
        const sub = await this.subscriptionService.retrieveSubByCriteria({ user: { id: userId } });
        await this.stripeService.setDefaultPaymentMethod(sub.stripeCustomerId, paymentMethodId);
        return { message: 'Default payment method updated successfully.' };
    }

    /**
     * Creates a checkout session for the current user.
     * Logs the request, retrieves the full user entity using the current user's ID,
     * and delegates to the subscription service to create a checkout session
     * with the specified period and optional coupon code.
     */
    async createCheckout(user: CurrentUserInterface, dto: CreateCheckoutDto) {
        this.logger.info(`Creating checkout for user: ${user.id}`);
        const subUser = await this.userService.preUserService.retrieveUserByCriteria({
            id: user.id,
        });
        return this.subscriptionService.createCheckout(subUser, {
            period: dto.period,
            couponCode: dto.couponCode,
        });
    }
}
