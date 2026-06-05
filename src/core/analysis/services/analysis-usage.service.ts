import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Between, MoreThanOrEqual } from 'typeorm';
import { subDays, subWeeks, subYears, subMonths } from 'date-fns';
import { AnalysisService } from './analysis.service';
import { AnalysisEntity, AnalysisUsageEntity } from '../entities';
import { ModuleEntity } from '../../modules/entities';
import { UsagePeriod } from '../../../common/enum';

@Injectable()
export class AnalysisUsageService {
    constructor(
        @Inject(forwardRef(() => AnalysisService))
        private readonly analysisService: AnalysisService,
    ) {}

    get repo() {
        return this.analysisService.analysisUsageRepo;
    }

    /**
     * Returns the start date for the specified usage period relative to the current date.
     * Calculates and returns a Date object representing the beginning of the requested period
     * by subtracting the corresponding duration from the current date.
     */
    getPeriodRange(period: UsagePeriod): Date {
        const now = new Date();

        switch (period) {
            case UsagePeriod.ONE_DAY:
                return subDays(now, 1);
            case UsagePeriod.ONE_WEEK:
                return subWeeks(now, 1);
            case UsagePeriod.ONE_MONTH:
                return subMonths(now, 1);
            case UsagePeriod.ONE_YEAR:
                return subYears(now, 1);
        }
    }

    /**
     * Returns the previous period range for the specified usage period.
     * Calculates the end date of the previous period using the current period's start date,
     * then returns an object containing the previous period's from and to dates.
     */
    getPreviousPeriodRange(period: UsagePeriod): { from: Date; to: Date } {
        const to = this.getPeriodRange(period);

        switch (period) {
            case UsagePeriod.ONE_DAY:
                return { from: subDays(to, 1), to };
            case UsagePeriod.ONE_WEEK:
                return { from: subWeeks(to, 1), to };
            case UsagePeriod.ONE_MONTH:
                return { from: subMonths(to, 1), to };
            case UsagePeriod.ONE_YEAR:
                return { from: subYears(to, 1), to };
        }
    }

    /**
     * Builds and returns an AnalysisUsageEntity populated with the required relationships.
     * Creates a new entity instance, assigns the provided analysis and module properties,
     * and returns the constructed entity.
     */
    buildAUsageEntity(required: {
        analysis: AnalysisEntity;
        module: ModuleEntity;
    }): AnalysisUsageEntity {
        const result = new AnalysisUsageEntity();
        Object.assign(result, required);
        return result;
    }

    /**
     * Creates an analysis usage record for the specified analysis.
     * Builds an AnalysisUsageEntity using the analysis and its associated module,
     * then persists the entity via the repository and returns the result.
     */
    async createAUsage(analysis: AnalysisEntity) {
        return await this.repo.create(
            this.buildAUsageEntity({ analysis, module: analysis.module }),
        );
    }

    /**
     * Retrieves usage statistics grouped by time intervals for chart visualization.
     * Uses month grouping for YEAR period or day grouping for other periods,
     * formats labels accordingly (e.g., "Mon YYYY" for months or "DD Mon" for days),
     * filters records from the specified start date, and returns ordered raw results
     * with label and usage count.
     */
    async getTotalUsageChart(period: UsagePeriod, from: Date) {
        const isYear = period === UsagePeriod.ONE_YEAR;

        const truncExpr = isYear
            ? `DATE_TRUNC('month', u."createdAt")`
            : `DATE_TRUNC('day', u."createdAt")`;

        const labelExpr = isYear
            ? `TO_CHAR(DATE_TRUNC('month', u."createdAt"), 'Mon YYYY')`
            : `TO_CHAR(DATE_TRUNC('day', u."createdAt"), 'DD Mon')`;

        return this.repo
            .getRepository()
            .createQueryBuilder('u')
            .select(labelExpr, 'label')
            .addSelect('COUNT(u.id)', 'usages')
            .where('u.createdAt >= :from', { from })
            .groupBy(truncExpr)
            .orderBy(truncExpr, 'ASC')
            .getRawMany<{ label: string; usages: number }>();
    }

    /**
     * Returns total usage statistics for the specified period including comparison with the previous period.
     * Calculates the current period range and previous period range,
     * fetches current usage count, previous usage count, and chart data in parallel
     * (chart data is omitted for ONE_DAY period),
     * computes evolution percentage (or null if previous period had zero usage),
     * and returns an object containing total, previous, evolution, period, and chart data.
     */
    async getTotalUsage(period: UsagePeriod) {
        const from = this.getPeriodRange(period);
        const { from: prevFrom, to: prevTo } = this.getPreviousPeriodRange(period);

        const [current, previous, chart] = await Promise.all([
            this.repo.count({ where: { createdAt: MoreThanOrEqual(from) } }),
            this.repo.count({ where: { createdAt: Between(prevFrom, prevTo) } }),
            period === '1D' ? Promise.resolve(null) : this.getTotalUsageChart(period, from),
        ]);

        const evolution =
            previous === 0 ? null : Math.round(((current - previous) / previous) * 100);

        return { total: current, previous, evolution, period, chart };
    }

    /**
     * Retrieves usage repartition across modules for the specified period.
     * Calculates the start date for the period, then queries modules joined with their usages
     * filtered by creation date and excluding soft-deleted records,
     * groups results by module with aggregated usage counts,
     * orders modules by usage count descending, and returns raw results
     * containing module ID, label, icon, and usage count.
     */
    async getUsageRepartition(period: UsagePeriod) {
        const from = this.getPeriodRange(period);

        return this.analysisService.moduleService.moduleRepository
            .getRepository()
            .createQueryBuilder('m')
            .select('m.id', 'moduleId')
            .addSelect('m.label', 'moduleLabel')
            .addSelect('m.icon', 'moduleIcon')
            .addSelect('COUNT(u.id)', 'usages')
            .leftJoin('m.usages', 'u', 'u.createdAt >= :from AND u.deletedAt IS NULL', { from })
            .groupBy('m.id')
            .addGroupBy('m.label')
            .addGroupBy('m.icon')
            .orderBy('usages', 'DESC')
            .getRawMany<{
                moduleId: string;
                moduleLabel: string;
                moduleIcon: string;
                usages: number;
            }>();
    }
}
