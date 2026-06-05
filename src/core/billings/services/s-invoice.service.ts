import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BillingsService } from './billings.service';
import { SubscriptionEntity, SubscriptionInvoiceEntity } from '../entities';
import { IncomeCategoryEnum, InvoiceStatusEnum, UserStatusEnum } from '../../../common/enum';
import { StripeInvoice } from '../../../libs/stripe/stripe-types';
import { CCodeEntity } from '../../c-codes/entities';

@Injectable()
export class SInvoiceService {
    /**
     * Service responsible for handling subscription invoice in the database.
     */

    constructor(
        @Inject(forwardRef(() => BillingsService))
        readonly billingsService: BillingsService,
    ) {}

    /**
     * Retrieves recent income records based on optional category, search term, and limit filters.
     * Builds a query joining subscription and coupon relations, orders by paid date descending,
     * applies category filter (affiliate where discount applied, subscription where no discount),
     * applies search term filter on invoice number, and returns the matching invoice entities.
     */
    async getRecentIncome(filters: {
        category?: IncomeCategoryEnum;
        searchTerm?: string;
        limit?: number;
    }): Promise<SubscriptionInvoiceEntity[]> {
        const { category, searchTerm, limit } = filters;

        const qb = this.billingsService.invoiceRepository
            .getRepository()
            .createQueryBuilder('inv')
            .leftJoinAndSelect('inv.subscription', 'subscription')
            .leftJoinAndSelect('inv.coupon', 'coupon')
            .orderBy('inv.paidAt', 'DESC')
            .take(limit);

        if (category === IncomeCategoryEnum.AFFILIATE)
            qb.andWhere('inv.discountApplied IS NOT NULL');
        else if (category === IncomeCategoryEnum.SUBSCRIPTION)
            qb.andWhere('inv.discountApplied IS NULL');

        if (searchTerm)
            qb.andWhere('inv.invoiceNumber ILIKE :search', {
                search: `%${searchTerm}%`,
            });

        return qb.getMany();
    }

    /**
     * Builds and returns a base query builder for members retrieval with optional filters.
     * Creates a query on the user repository with soft-delete filter applied,
     * joins subscription and avatar relations,
     * adds subqueries to calculate total paid income and total successful subscriptions count,
     * and applies optional filters: user status and search term on fullname.
     */
    buildMembersBaseQuery(filters: {
        userId?: string;
        status?: UserStatusEnum;
        searchTerm?: string;
    }) {
        const { status, searchTerm, userId } = filters;

        const query = this.billingsService.userService.userRepo
            .getRepository()
            .createQueryBuilder('user')
            .andWhere('user.deleted = false')
            .leftJoinAndSelect('user.subscription', 'subscription')
            .leftJoinAndSelect('user.avatar', 'avatar')
            .leftJoinAndSelect('avatar.file', 'file')
            .addSelect(
                (subQuery) =>
                    subQuery
                        .select('COALESCE(SUM(inv.amountPaid), 0)')
                        .from(SubscriptionInvoiceEntity, 'inv')
                        .innerJoin('inv.subscription', 'sub')
                        .where('sub.userId = user.id')
                        .andWhere('inv.status = :paid', { paid: InvoiceStatusEnum.PAID }),
                'totalIncome',
            )
            .addSelect(
                (subQuery) =>
                    subQuery
                        .select('COUNT(inv.id)')
                        .from(SubscriptionInvoiceEntity, 'inv')
                        .innerJoin('inv.subscription', 'sub')
                        .where('sub.userId = user.id')
                        .andWhere('inv.status = :paid', { paid: InvoiceStatusEnum.PAID }),
                'totalSubscriptions',
            );

        if (userId) query.andWhere('user.id = :userId', { userId });
        if (status) query.andWhere('user.status = :status', { status });
        if (searchTerm)
            query.andWhere('user.fullname ILIKE :search', {
                search: `%${searchTerm}%`,
            });

        return query;
    }

    /**
     * Builds and returns a paginated query for retrieving members.
     * Constructs the members base query with the provided filters,
     * applies ordering by user creation date descending,
     * and applies pagination skip and take based on offset and limit.
     */
    retrieveMembersQuery(
        offset: number,
        limit: number,
        filters: {
            status?: UserStatusEnum;
            searchTerm?: string;
        },
    ) {
        const queryBuilder = this.buildMembersBaseQuery(filters);
        queryBuilder.orderBy('user.createdAt', 'DESC').skip(offset).take(limit);
        return queryBuilder;
    }

    /**
     * Builds and returns a base query builder for invoice retrieval with optional filters.
     * Creates a query on the invoice repository with soft-delete filter applied,
     * joins subscription and user relations, and applies optional filters:
     * user ID, invoice status, and search term (matching against amount paid,
     * status, or paid date).
     */
    buildInvoiceBaseQuery(filters: {
        userId: string;
        status?: InvoiceStatusEnum;
        searchTerm?: string;
    }) {
        const { userId, status, searchTerm } = filters;

        const query = this.billingsService.invoiceRepository
            .getRepository()
            .createQueryBuilder('invoices')
            .andWhere('invoices.deleted = false')
            .leftJoinAndSelect('invoices.subscription', 'subs')
            .leftJoinAndSelect('subs.user', 'user');

        if (userId) query.andWhere('user.id = :userId', { userId });
        if (status) query.andWhere('invoices.status = :status', { status });
        if (searchTerm) {
            const likePattern = `%${searchTerm.toLowerCase()}%`;

            query.andWhere(
                `(
                CAST(invoices.amountPaid AS TEXT) ILIKE :searchTerm
                OR invoices.status::text ILIKE :searchTerm
                OR invoices."paidAt"::text ILIKE :searchTerm
            )`,
                { searchTerm: likePattern },
            );
        }

        return query;
    }

    /**
     * Builds and returns a paginated query for retrieving user invoices.
     * Constructs the invoice base query with the provided filters (userId and optional searchTerm),
     * applies ordering by updated date descending,
     * and applies pagination skip and take based on offset and limit.
     */
    retrieveUserInvoicesQuery(
        offset: number,
        limit: number,
        filters: {
            userId: string;
            status?: InvoiceStatusEnum;
            searchTerm?: string;
        },
    ) {
        const queryBuilder = this.buildInvoiceBaseQuery(filters);

        queryBuilder.orderBy('invoices.updatedAt', 'DESC').skip(offset).take(limit);
        return queryBuilder;
    }

    /**
     * Builds and returns a SubscriptionInvoiceEntity populated with required and optional properties.
     * Creates a new entity instance, assigns all required fields (Stripe invoice ID, amounts,
     * currency, status, and subscription) along with optional fields (paid date, coupon info,
     * discount amount, invoice number, period dates, and associated coupon entity),
     * and returns the constructed entity.
     */
    buildInvoiceEntity(
        required: {
            stripeInvoiceId: string;
            amountPaid: number;
            originalAmount: number;
            currency: string;
            status: InvoiceStatusEnum;
            subscription: SubscriptionEntity;
        },
        optional: {
            paidAt?: Date;
            stripeCouponId?: string;
            discountApplied?: number;
            invoiceNumber?: string;
            currentPeriodStart?: Date;
            currentPeriodEnd?: Date;
            coupon?: CCodeEntity;
        },
    ) {
        const result = new SubscriptionInvoiceEntity();
        Object.assign(result, required, optional);
        return result;
    }

    /**
     * Builds and returns the base fields object for creating an invoice entity.
     * Extracts and maps Stripe invoice data including invoice ID, paid amount,
     * original amount (using total before discount, subtotal, or paid amount as fallback),
     * currency, status, and associated subscription.
     */
    buildInvoiceBaseFields({
        invoice,
        amountPaid,
        status,
        sub,
    }: {
        invoice: StripeInvoice;
        amountPaid: number;
        status: InvoiceStatusEnum;
        sub: SubscriptionEntity;
    }) {
        const inv = invoice as any;
        return {
            stripeInvoiceId: invoice.id,
            amountPaid,
            originalAmount: inv.total_before_discount ?? inv.subtotal ?? amountPaid,
            currency: invoice.currency,
            status,
            subscription: sub,
        };
    }

    /**
     * Builds and returns the optional fields object for creating an invoice entity.
     * Extracts optional Stripe invoice data including paid date, invoice number,
     * coupon ID and discount applied, billing period dates, and associated coupon entity.
     * Defaults paidAt to current date if not available.
     */
    buildInvoiceOptionalFields({ inv, coupon }: { inv: any; coupon?: CCodeEntity }) {
        return {
            paidAt: inv.status_transitions?.paid_at
                ? new Date(inv.status_transitions.paid_at * 1000)
                : new Date(),
            invoiceNumber: inv.number ?? undefined,
            stripeCouponId: inv.discount?.coupon?.id ?? undefined,
            discountApplied: inv.discount?.coupon?.percent_off ?? undefined,
            currentPeriodStart: inv.lines?.data?.[0]?.period?.start
                ? new Date(inv.lines.data[0].period.start * 1000)
                : undefined,
            currentPeriodEnd: inv.lines?.data?.[0]?.period?.end
                ? new Date(inv.lines.data[0].period.end * 1000)
                : undefined,
            coupon: coupon ?? undefined,
        };
    }

    /**
     * Invalidates invoice-related caches when invoices are updated or created.
     * Deletes all cache keys associated with the specific user's invoices
     * and also invalidates the general members cache.
     */
    async invalidateInvoiceCache(userId: string) {
        await Promise.all([
            this.billingsService.cacheService.deleteKeysByBase(
                this.billingsService.cacheService.generateRedisKey('invoices', { userId }),
            ),
            this.billingsService.cacheService.deleteKeysByBase('members'),
        ]);
    }

    /**
     * Creates an invoice record from Stripe invoice data.
     * Builds the invoice entity by combining base fields and optional fields,
     * persists the entity via the repository,
     * invalidates the user's invoice cache and members cache,
     * and returns the created invoice entity.
     */
    async createInvoice(
        sub: SubscriptionEntity,
        invoice: StripeInvoice,
        status: InvoiceStatusEnum,
        amountPaid: number,
        coupon?: CCodeEntity,
    ) {
        const inv = invoice as any;

        const entity = this.buildInvoiceEntity(
            this.buildInvoiceBaseFields({ invoice, amountPaid, status, sub }),
            this.buildInvoiceOptionalFields({ inv, coupon }),
        );

        const result = await this.billingsService.invoiceRepository.create(entity);
        await this.invalidateInvoiceCache(sub.user.id);
        return result;
    }
}
