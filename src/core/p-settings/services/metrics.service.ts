import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { PSettingsService } from './p-settings.service';
import { MetricsEntity } from '../entities';
import { In } from 'typeorm';

@Injectable()
export class MetricsService {
    /**
     * Service responsible for handling metrics operations
     */

    constructor(
        @Inject(forwardRef(() => PSettingsService))
        private readonly service: PSettingsService,
    ) {}

    /**
     * Retrieves multiple metrics by their IDs, ensuring none are marked as deleted.
     * Throws a not found error if the number of retrieved metrics does not match the number of requested IDs.
     * Logs the retrieval attempt and returns a promise resolving to an array of MetricsEntity objects.
     */
    async retrieveMetrics(ids: string[]): Promise<MetricsEntity[]> {
        this.service.logger.info(`Retrieve metrics with ids ${ids.join(', ')}`);

        const metrics = await this.service.metricsRepository.find({
            where: { id: In(ids), deleted: false },
        });

        if (metrics.length !== ids.length)
            this.service.errorHandler.notFound(
                `Metrics found length ${metrics.length} is different from provided ids ${ids.length}`,
                `Metrics not found`,
            );

        return metrics;
    }

    /**
     * Retrieves all non-deleted metrics from the repository.
     * Logs the retrieval attempt and returns a promise resolving to an array of transformed metric objects.
     */
    async getAllMetrics() {
        this.service.logger.info(`Get all non deleted metrics`);

        const metrics = await this.service.metricsRepository.find({
            where: { deleted: false },
        });
        return this.service.transformPSettingService.transformMetrics(metrics);
    }
}
