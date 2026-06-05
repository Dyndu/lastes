import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { PSettingsService } from './p-settings.service';
import { PSettingEntity, MetricsEntity, SMetricEntity } from '../entities';
import { In } from 'typeorm';

@Injectable()
export class SMetricService {
    /**
     * Service responsible for handling setting metrics relation operations
     */

    constructor(
        @Inject(forwardRef(() => PSettingsService))
        private readonly service: PSettingsService,
    ) {}

    /**
     * Constructs and returns an SMetricEntity by associating a MetricsEntity with a PSettingEntity.
     * The resulting entities links the provided metric and setting for further use.
     */
    buildSMetricEntity(metric: MetricsEntity, setting: PSettingEntity): SMetricEntity {
        const result = new SMetricEntity();
        result.metric = metric;
        result.setting = setting;
        return result;
    }

    /**
     * Validates that the number of metrics associated with a profile does not exceed the maximum allowed limit (5).
     * Throws a forbidden error if the limit is exceeded, including details for logging and user feedback.
     */
    assertMetricLimit(profile: PSettingEntity, length: number) {
        const MAX_PROFILE_METRICS = 5;

        if (length > MAX_PROFILE_METRICS)
            this.service.errorHandler.forbidden(
                `[MetricLimitExceeded] Profile ${profile.id} attempted update with ${length} metrics (max: ${MAX_PROFILE_METRICS})`,
                'A profile cannot have more than 5 metrics.',
            );
    }

    /**
     * Retrieves all non-deleted metrics associated with a specific profile by its ID.
     * Returns a promise resolving to an array of SMetricEntity objects, including their related metric data.
     */
    async getExistingMetrics(profileId: string): Promise<SMetricEntity[]> {
        return await this.service.sMetricRepository.find({
            where: { setting: { id: profileId }, deleted: false },
            relations: ['metric'],
        });
    }

    /**
     * Creates multiple SMetricEntity records by associating each provided MetricsEntity with a PSettingEntity.
     * Returns a promise resolving to an array of the newly created SMetricEntity objects.
     */
    async createSMetrics(s: PSettingEntity, metrics: MetricsEntity[]): Promise<SMetricEntity[]> {
        return await this.service.sMetricRepository.createMany(
            metrics.map((m) => {
                return this.buildSMetricEntity(m, s);
            }),
        );
    }

    /**
     * Computes the difference between existing and incoming metrics for a profile update.
     * Identifies metrics to add (new) and metrics to remove (no longer present in the incoming list).
     * Validates the metric limit before returning the diff result.
     */
    async computeMetricDiffForUpdate(
        profile: PSettingEntity,
        incomingMetrics: MetricsEntity[],
    ): Promise<{
        toAdd: MetricsEntity[];
        toRemove: SMetricEntity[];
    }> {
        const existingRelations = await this.getExistingMetrics(profile.id);
        const existingMetricIds = new Set(existingRelations.map((r) => r.metric.id));

        const uniqueIncomingMap = new Map<string, MetricsEntity>();
        for (const metric of incomingMetrics) {
            uniqueIncomingMap.set(metric.id, metric);
        }

        const uniqueIncoming = Array.from(uniqueIncomingMap.values());
        const incomingIds = uniqueIncoming.map((m) => m.id);

        this.assertMetricLimit(profile, incomingIds.length);

        const toAdd = uniqueIncoming.filter((m) => !existingMetricIds.has(m.id));

        const toRemove = existingRelations.filter((r) => !incomingIds.includes(r.metric.id));

        return { toAdd, toRemove };
    }

    /**
     * Synchronizes a profile's metrics by removing outdated metrics and adding new ones based on the incoming list.
     * Returns a promise resolving to an array of newly created SMetricEntity objects.
     */
    async syncProfileMetrics(
        profile: PSettingEntity,
        incomingMetrics: MetricsEntity[],
    ): Promise<SMetricEntity[]> {
        const { toAdd, toRemove } = await this.computeMetricDiffForUpdate(profile, incomingMetrics);

        if (toRemove.length > 0)
            await this.service.sMetricRepository.delete({
                id: In(toRemove.map((r) => r.id)),
            });

        let created: SMetricEntity[] = [];
        if (toAdd.length > 0) created = await this.createSMetrics(profile, toAdd);

        return created;
    }
}
