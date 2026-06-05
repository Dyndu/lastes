import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { In, Not } from 'typeorm';
import { ModuleEntity, MUseEntity } from '../entities';
import { MRelationDto } from '../dto';

@Injectable()
export class MUseService {
    /**
     * Service responsible for handling module use operations
     */

    constructor(
        @Inject(forwardRef(() => ModulesService))
        private readonly modulesService: ModulesService,
    ) {}

    /**
     * Creates and initializes a new MUseEntity with the provided required fields (label, icon, module).
     * Returns the newly created use entities.
     */
    buildMUseEntity(required: { label: string; icon: string; module: ModuleEntity }): MUseEntity {
        const mUse = new MUseEntity();
        Object.assign(mUse, required);
        return mUse;
    }

    /**
     * Retrieves a list of module uses by their IDs for a specific module.
     * Logs the retrieval action, ensures all requested uses exist and are not deleted,
     * and throws an error if any use is missing.
     */
    async retrieveMUses(ids: string[], mId: string): Promise<MUseEntity[]> {
        const filteredIds = [...new Set(ids)];
        this.modulesService.logger.info(
            `Retrieve a module (id: ${mId} uses with ids: ${filteredIds.join(', ')}`,
        );

        const uses = await this.modulesService.mUseRepository.find({
            where: { deleted: false, module: { id: mId }, id: In(filteredIds) },
        });

        if (uses.length !== filteredIds.length)
            this.modulesService.errorHandler.notFound(
                `Some module uses aren't found`,
                `Uses not found`,
            );

        return uses;
    }

    /**
     * Updates the details of a module use with the provided partial updates.
     * Trims and validates string fields (label, icon) and updates entities fields (module) if provided.
     * Returns the result of the update operation.
     */
    async updateMUseDetails(
        mUse: MUseEntity,
        mUseUpdates?: Partial<{
            label: string;
            icon: string;
            module: ModuleEntity;
        }>,
    ) {
        if (!mUseUpdates || Object.keys(mUseUpdates).length === 0)
            return { message: 'No updates provided for module mUses' };

        const stringFields = ['label', 'icon'] as const;

        const updatePayload: Partial<MUseEntity> = {};

        stringFields.forEach((field) => {
            if (mUseUpdates[field]?.trim()) updatePayload[field] = mUseUpdates[field].trim();
        });

        const entityFields = ['module'] as const;

        entityFields.forEach((field) => {
            if (mUseUpdates[field] !== undefined) updatePayload[field] = mUseUpdates[field] as any;
        });

        return await this.modulesService.mUseRepository.update({ id: mUse.id }, updatePayload);
    }

    /**
     * Creates new module uses from a list of DTOs, ensuring no duplicates by label.
     * Filters out existing use labels, builds new use entities, and persists them.
     */
    async createUses(module: ModuleEntity, items: MRelationDto[]) {
        if (!items.length) return;

        const filteredItems = [...new Set(items)];

        const existingUses = await this.modulesService.mUseRepository.find({
            where: { module: { id: module.id } },
        });

        const existingLabels = new Set(existingUses.map((f) => f.label.trim().toLowerCase()));

        const newItems = filteredItems.filter((item) => {
            const label = item.label?.trim().toLowerCase();
            return label && !existingLabels.has(label);
        });

        if (!newItems.length) return;

        await this.modulesService.mUseRepository.createMany(
            newItems.map((item) =>
                this.buildMUseEntity({
                    label: item.label!.trim(),
                    icon: item.icon!.trim(),
                    module,
                }),
            ),
        );
    }

    /**
     * Updates existing module uses based on the provided DTOs.
     * Retrieves uses by IDs, checks for duplicate labels, and applies updates if no duplicates are found.
     */
    async updateUses(m: ModuleEntity, items: MRelationDto[]) {
        if (!items.length) return;

        const ids = items.map((item) => item.id!);
        const uses = await this.retrieveMUses(ids, m.id);
        const dtoMap = new Map(items.map((item) => [item.id, item]));

        for (const use of uses) {
            const dto = dtoMap.get(use.id)!;

            const isDataExist = await this.modulesService.mUseRepository.findOne({
                where: {
                    module: { id: m.id },
                    id: Not(use.id),
                    label: dto.label,
                },
            });

            if (!isDataExist)
                await this.updateMUseDetails(use, {
                    icon: dto.icon,
                    label: dto.label,
                });
        }
    }

    /**
     * Processes module uses by creating new ones and updating existing ones based on the provided DTOs.
     * Splits DTOs into create and update operations, then executes both in parallel.
     */
    async processModuleUses(module: ModuleEntity, dto?: MRelationDto[]) {
        if (!dto || dto.length === 0) return;
        const { creates, updates } = this.modulesService.preModuleService.splitByMethod(dto);
        await Promise.all([this.createUses(module, creates), this.updateUses(module, updates)]);
    }

    /**
     * Deletes a module use by its ID and associated module ID.
     * Returns a confirmation message upon successful deletion.
     */
    async deleteMUse(id: string, mId: string) {
        await this.modulesService.mUseRepository.delete({
            id,
            module: { id: mId },
        });
        return { message: 'Module use deleted' };
    }
}
