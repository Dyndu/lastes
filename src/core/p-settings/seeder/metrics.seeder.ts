import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { MetricsRepository } from '../repositories';
import { MetricsEntity } from '../entities';

const createRaMetric = (label: string, icon: string, description?: string) => ({
    label,
    icon,
    description,
});

const allMetrics = [
    createRaMetric('CoC', 'coc', 'Cash on cash'),
    createRaMetric('NOI', 'noi', 'Net Operation Income'),
    createRaMetric('ROI', 'roi'),
    createRaMetric('GOI', 'goi'),

    createRaMetric('OER', 'oer', 'Operating Expense Ratio'),
    createRaMetric('Yearly Income', 'y_i'),
    createRaMetric('GRM', 'grm', 'Gross Rent Multiplier'),
    createRaMetric('BER', 'er'),

    createRaMetric('AGM', 'arm', 'Annual Gross Multiplier'),
    createRaMetric('Cap Rate', 'caprate'),
    createRaMetric('Cash Flow', 'cash_flow'),
    createRaMetric('Playback Period', 'period'),

    createRaMetric('DSCR', 'dscr'),
    createRaMetric('Full Term Roi', 'm_roi'),
];

@Injectable()
export class MetricsSeeder {
    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        private readonly raMetricsRepository: MetricsRepository,
    ) {}

    async seed() {
        this.logger.info('[MetricsSeeder] Seeding started');

        const existingMetrics = await this.raMetricsRepository.find({
            where: { deleted: false },
        });

        this.logger.info(`[MetricsSeeder] Found ${existingMetrics.length} existing metrics`);

        const existingKeySet = new Set(
            existingMetrics.map(
                (m) => `${m.label.trim()}|${m.icon.trim()}|${m.description?.trim() ?? 'null'}`,
            ),
        );

        const getMissingMetrics = (rawMetrics: typeof allMetrics) => {
            return rawMetrics
                .filter((metric) => {
                    const key = `${metric.label.trim()}|${metric.icon.trim()}|${metric.description?.trim() ?? 'null'}`;
                    return !existingKeySet.has(key);
                })
                .map((metric) => {
                    const entity = new MetricsEntity();
                    entity.label = metric.label.trim();
                    entity.icon = metric.icon.trim();
                    entity.description = metric.description?.trim() ?? null!;

                    return entity;
                });
        };

        const metricsToInsert = getMissingMetrics(allMetrics);

        if (metricsToInsert.length === 0) {
            this.logger.info('[MetricsSeeder] No new metrics to insert');
            return;
        }

        this.logger.info(`[MetricsSeeder] Inserting ${metricsToInsert.length} new metrics`);

        try {
            await this.raMetricsRepository.createMany(metricsToInsert);
            this.logger.info('[MetricsSeeder] Seeding completed successfully');
        } catch (error) {
            this.logger.error('[MetricsSeeder] Failed to seed metrics', {
                error,
            });
            throw error;
        }
    }
}
