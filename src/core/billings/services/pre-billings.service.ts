import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { BillingsService } from './billings.service';
import {
    AdsStatusEnum,
    InvoiceStatusEnum,
    SubscriptionPeriodEnum,
    UsagePeriod,
} from '../../../common/enum';

@Injectable()
export class PreBillingsService {
    /**
     * Service responsible for handling billing pre operations
     */

    constructor(
        @Inject(forwardRef(() => BillingsService))
        readonly billingsService: BillingsService,
    ) {}

    /**
     * Calculates the total income sum from paid invoices within a specified date range.
     * Queries the invoice repository for paid invoices with paidAt between the from and to dates,
     * returns the sum of amountPaid (or 0 if no invoices found) as a number.
     */
    async getSubIncomeSumByPeriod(from: Date, to: Date): Promise<number> {
        const result = await this.billingsService.invoiceRepository
            .getRepository()
            .createQueryBuilder('inv')
            .select('COALESCE(SUM(inv.amountPaid), 0)', 'total')
            .where('inv.status = :status', { status: InvoiceStatusEnum.PAID })
            .andWhere('inv.paidAt >= :from', { from })
            .andWhere('inv.paidAt < :to', { to })
            .andWhere('inv.discountApplied IS NULL')
            .getRawOne();

        return Number(result.total);
    }

    /**
     * Calculates the total affiliation sum (discount amount) from paid invoices within a specified date range.
     * Queries the invoice repository for paid invoices with paidAt between the from and to dates
     * that have a discount applied and an original amount recorded,
     * returns the sum of (originalAmount - amountPaid) or 0 if no invoices found.
     */
    async getAffiliationSumByPeriod(from: Date, to: Date): Promise<number> {
        const result = await this.billingsService.invoiceRepository
            .getRepository()
            .createQueryBuilder('inv')
            .select('COALESCE(SUM(inv.originalAmount - inv.amountPaid), 0)', 'total')
            .where('inv.status = :status', { status: InvoiceStatusEnum.PAID })
            .andWhere('inv.paidAt >= :from', { from })
            .andWhere('inv.paidAt < :to', { to })
            .andWhere('inv.discountApplied IS NOT NULL')
            .andWhere('inv.originalAmount IS NOT NULL')
            .getRawOne();

        return Number(result.total);
    }

    /**
     * Calculates the total sum of active advertisement amounts within a specified date range.
     * Queries the ads repository for non-deleted, active ads with status RUNNING or EXPIRED
     * whose date range overlaps with the provided from/to period,
     * and returns the sum of amount or 0 if no ads found.
     */
    async getAdsSumByPeriod(from: Date, to: Date): Promise<number> {
        const result = await this.billingsService.adsService.adsRepository
            .getRepository()
            .createQueryBuilder('ads')
            .select('COALESCE(SUM(ads.amount), 0)', 'total')
            .where('ads.deleted = false')
            .andWhere('ads.isActive = true')
            .andWhere('ads.status IN (:...statuses)', {
                statuses: [AdsStatusEnum.RUNNING, AdsStatusEnum.EXPIRED, AdsStatusEnum.SCHEDULED],
            })
            .andWhere('ads.startDate < :to', { to })
            .andWhere('ads.endDate >= :from', { from })
            .getRawOne();

        return Number(result.total);
    }

    /**
     * Generic method to build an overview comparing current period data to the previous period.
     * Resolves start date, previous start date, and end date for the specified period,
     * executes the provided function for both periods in parallel to retrieve numeric values, computes the percentage change (or null if previous value is zero),
     * and returns an object containing the current total and the percentage change rounded to two decimals.
     */
    async buildOverview(period: UsagePeriod, getFn: (from: Date, to: Date) => Promise<number>) {
        const { startDate, previousStartDate, endDate } =
            this.billingsService.otherUtils.resolvePeriodDates(period);
        const [current, previous] = await Promise.all([
            getFn(startDate, endDate),
            getFn(previousStartDate, startDate),
        ]);
        const vsLastPeriod =
            previous === 0 ? null : +(((current - previous) / previous) * 100).toFixed(2);
        return { total: current, previous, vsLastPeriod };
    }

    /**
     * Retrieves subscription income overview for the specified period.
     * Delegates to the generic buildOverview method with a function that calculates
     * subscription income sum between the provided from and to dates.
     */
    getSubIncomeOverview = (period: UsagePeriod) =>
        this.buildOverview(period, (f, t) => this.getSubIncomeSumByPeriod(f, t));

    /**
     * Retrieves affiliation sum overview for the specified period.
     * Delegates to the generic buildOverview method with a function that calculates
     * affiliation sum (discounts) between the provided from and to dates.
     */
    affiliationSumOverview = (period: UsagePeriod) =>
        this.buildOverview(period, (f, t) => this.getAffiliationSumByPeriod(f, t));

    /**
     * Retrieves ads sum overview for the specified period.
     * Delegates to the generic buildOverview method with a function that calculates
     * advertisement amount sum between the provided from and to dates.
     */
    adsSumOverview = (period: UsagePeriod) =>
        this.buildOverview(period, (f, t) => this.getAdsSumByPeriod(f, t));

    /**
     * Retrieves comprehensive income overview combining subscriptions, affiliation, and ads for the specified period.
     * Fetches subscription income, affiliation sum, and ads sum overviews in parallel, calculates total income and total from the previous period,
     * computes the overall percentage change (or null if previous total was zero), calculates share percentages for each revenue source (or 0 if total is zero),
     * and returns an object containing total income, percentage change, and distribution with each category's total, previous value, and share percentage.
     */
    async getIncomeOverview(period: UsagePeriod) {
        const [sub, affiliation, ads] = await Promise.all([
            this.getSubIncomeOverview(period),
            this.affiliationSumOverview(period),
            this.adsSumOverview(period),
        ]);

        const total = sub.total + affiliation.total + ads.total;
        const totalPrevious = sub.previous + affiliation.previous + ads.previous;
        const vsLastPeriod =
            totalPrevious === 0
                ? null
                : +(((total - totalPrevious) / totalPrevious) * 100).toFixed(2);
        const share = (v: number) => (total === 0 ? 0 : +((v / total) * 100).toFixed(2));

        return {
            total,
            vsLastPeriod,
            distribution: {
                subscriptions: { ...sub, share: share(sub.total) },
                affiliation: { ...affiliation, share: share(affiliation.total) },
                ads: { ...ads, share: share(ads.total) },
            },
        };
    }

    /**
     * Calculates the total count and percentage share of active subscriptions
     * grouped by period (monthly / yearly).
     * Queries non-deleted subscriptions, groups by period to get counts,
     * computes the grand total, and returns per-period totals with their
     * percentage rounded to two decimals (or 0 if no subscriptions found).
     */
    async getSubscriptionPeriodRatio(): Promise<{
        monthly: number;
        yearly: number;
    }> {
        const rows: { period: SubscriptionPeriodEnum; count: string }[] =
            await this.billingsService.subscriptionRepo
                .getRepository()
                .createQueryBuilder('sub')
                .select('sub.period', 'period')
                .addSelect('COUNT(*)', 'count')
                .where('sub.deleted = false')
                .groupBy('sub.period')
                .getRawMany();

        const toNumber = (period: SubscriptionPeriodEnum): number => {
            const row = rows.find((r) => r.period === period);
            return row ? Number(row.count) : 0;
        };

        const monthly = toNumber(SubscriptionPeriodEnum.MONTHLY);
        const yearly = toNumber(SubscriptionPeriodEnum.YEARLY);
        const grandTotal = monthly + yearly;

        const pct = (n: number): number =>
            grandTotal === 0 ? 0 : +((n / grandTotal) * 100).toFixed(2);

        return {
            monthly: pct(monthly),
            yearly: pct(yearly),
        };
    }
}
