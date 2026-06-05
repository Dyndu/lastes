import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { In, Not } from 'typeorm';
import { ModulesService } from './modules.service';
import { ModuleEntity, MFeatureEntity } from '../entities';
import { MRelationDto } from '../dto';

@Injectable()
export class MFeatureService {
    /**
     * Service responsible for handling module feature operations
     */

    constructor(
        @Inject(forwardRef(() => ModulesService))
        private readonly modulesService: ModulesService,
    ) {}

    /**
     * Creates and initializes a new MFeatureEntity with the provided required fields (label, icon, module).
     * Returns the newly created feature entities.
     */
    buildMFeatureEntity(required: {
        label: string;
        icon: string;
        module: ModuleEntity;
    }): MFeatureEntity {
        const feature = new MFeatureEntity();
        Object.assign(feature, required);
        return feature;
    }

    /**
     * Retrieves a list of module features by their IDs for a specific module.
     * Logs the retrieval action, ensures all requested features exist and are not deleted,
     * and throws an error if any feature is missing.
     */
    async retrieveMFeatures(ids: string[], mId: string): Promise<MFeatureEntity[]> {
        const filteredIds = [...new Set(ids)];
        this.modulesService.logger.info(
            `Retrieve a module (id: ${mId} features with ids: ${filteredIds.join(', ')}`,
        );

        const features = await this.modulesService.mFeatureRepo.find({
            where: { deleted: false, module: { id: mId }, id: In(filteredIds) },
        });

        if (features.length !== filteredIds.length)
            this.modulesService.errorHandler.notFound(
                `Some module feature aren't found`,
                `Features not found`,
            );

        return features;
    }

    /**
     * Updates the details of a module feature with the provided partial updates.
     * Trims and validates string fields (label, icon) and updates entities fields (module) if provided.
     * Returns the result of the update operation.
     */
    async updateMFeatureDetails(
        feature: MFeatureEntity,
        featureUpdates?: Partial<{
            label: string;
            icon: string;
            module: ModuleEntity;
        }>,
    ) {
        if (!featureUpdates || Object.keys(featureUpdates).length === 0)
            return { message: 'No updates provided for module features' };

        const stringFields = ['label', 'icon'] as const;

        const updatePayload: Partial<MFeatureEntity> = {};

        stringFields.forEach((field) => {
            if (featureUpdates[field]?.trim()) updatePayload[field] = featureUpdates[field].trim();
        });

        const entityFields = ['module'] as const;

        entityFields.forEach((field) => {
            if (featureUpdates[field] !== undefined)
                updatePayload[field] = featureUpdates[field] as any;
        });

        return await this.modulesService.mFeatureRepo.update({ id: feature.id }, updatePayload);
    }

    /**
     * Creates new module features from a list of DTOs, ensuring no duplicates by label.
     * Filters out existing feature labels, builds new feature entities, and persists them.
     */
    async createFeatures(module: ModuleEntity, items: MRelationDto[]) {
        if (!items.length) return;

        const filteredItems = [...new Set(items)];

        const existingFeatures = await this.modulesService.mFeatureRepo.find({
            where: { module: { id: module.id } },
        });

        const existingLabels = new Set(existingFeatures.map((f) => f.label.trim().toLowerCase()));

        const newItems = filteredItems.filter((item) => {
            const label = item.label?.trim().toLowerCase();
            return label && !existingLabels.has(label);
        });

        if (!newItems.length) return;

        await this.modulesService.mFeatureRepo.createMany(
            newItems.map((item) =>
                this.buildMFeatureEntity({
                    label: item.label!.trim(),
                    icon: item.icon!.trim(),
                    module,
                }),
            ),
        );
    }

    /**
     * Updates existing module features based on the provided DTOs.
     * Retrieves features by IDs, checks for duplicate labels, and applies updates if no duplicates are found.
     */
    async updateFeatures(m: ModuleEntity, items: MRelationDto[]) {
        if (!items.length) return;

        const ids = items.map((item) => item.id!);
        const features = await this.retrieveMFeatures(ids, m.id);
        const dtoMap = new Map(items.map((item) => [item.id, item]));

        for (const feature of features) {
            const dto = dtoMap.get(feature.id)!;

            const isDataExist = await this.modulesService.mFeatureRepo.findOne({
                where: {
                    module: { id: m.id },
                    id: Not(feature.id),
                    label: dto.label,
                },
            });

            if (!isDataExist)
                await this.updateMFeatureDetails(feature, {
                    icon: dto.icon,
                    label: dto.label,
                });
        }
    }

    /**
     * Processes module features by creating new ones and updating existing ones based on the provided DTOs.
     * Splits DTOs into create and update operations, then executes both in parallel.
     */
    async processModuleFeatures(module: ModuleEntity, dto?: MRelationDto[]) {
        if (!dto || dto.length === 0) return;
        const { creates, updates } = this.modulesService.preModuleService.splitByMethod(dto);
        await Promise.all([
            this.createFeatures(module, creates),
            this.updateFeatures(module, updates),
        ]);
    }

    /**
     * Deletes a module feature by its ID and associated module ID.
     * Returns a confirmation message upon successful deletion.
     */
    async deleteMFeature(id: string, mId: string) {
        await this.modulesService.mFeatureRepo.delete({
            id,
            module: { id: mId },
        });
        return { message: 'Module feature deleted' };
    }
}
