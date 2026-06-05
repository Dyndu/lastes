import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { MRelationDto } from '../dto';
import { In, Not } from 'typeorm';
import { MHeaderEntity, ModuleEntity } from '../entities';

@Injectable()
export class MHeaderService {
    /**
     * Service responsible for handling module header operations
     */

    constructor(
        @Inject(forwardRef(() => ModulesService))
        private readonly modulesService: ModulesService,
    ) {}

    /**
     * Creates and initializes a new MHeaderEntity with the provided required fields (label, icon, module).
     * Returns the newly created header entities.
     */
    buildMHeaderEntity(required: {
        label: string;
        icon: string;
        module: ModuleEntity;
    }): MHeaderEntity {
        const header = new MHeaderEntity();
        Object.assign(header, required);
        return header;
    }

    /**
     * Retrieves a list of module headers by their IDs for a specific module.
     * Logs the retrieval action, ensures all requested headers exist and are not deleted,
     * and throws an error if any header is missing.
     */
    async retrieveMHeaders(ids: string[], mId: string): Promise<MHeaderEntity[]> {
        const filteredIds = [...new Set(ids)];
        this.modulesService.logger.info(
            `Retrieve a module (id: ${mId} headers with ids: ${filteredIds.join(', ')}`,
        );

        const headers = await this.modulesService.mHeaderRepo.find({
            where: { deleted: false, module: { id: mId }, id: In(filteredIds) },
        });

        if (headers.length !== filteredIds.length)
            this.modulesService.errorHandler.notFound(
                `Some module headers aren't found`,
                `Headers not found`,
            );

        return headers;
    }

    /**
     * Updates the details of a module header with the provided partial updates.
     * Trims and validates string fields (label, icon) and updates entities fields (module) if provided.
     * Returns the result of the update operation.
     */
    async updateMHeaderDetails(
        header: MHeaderEntity,
        headerUpdates?: Partial<{
            label: string;
            icon: string;
            module: ModuleEntity;
        }>,
    ) {
        if (!headerUpdates || Object.keys(headerUpdates).length === 0)
            return { message: 'No updates provided for module headers' };

        const stringFields = ['label', 'icon'] as const;

        const updatePayload: Partial<MHeaderEntity> = {};

        stringFields.forEach((field) => {
            if (headerUpdates[field]?.trim()) updatePayload[field] = headerUpdates[field].trim();
        });

        const entityFields = ['module'] as const;

        entityFields.forEach((field) => {
            if (headerUpdates[field] !== undefined)
                updatePayload[field] = headerUpdates[field] as any;
        });

        return await this.modulesService.mHeaderRepo.update({ id: header.id }, updatePayload);
    }

    /**
     * Creates new module headers from a list of DTOs, ensuring no duplicates by label.
     * Filters out existing header labels, builds new header entities, and persists them.
     */
    async createHeaders(module: ModuleEntity, items: MRelationDto[]) {
        if (!items.length) return;

        const filteredItems = [...new Set(items)];

        const existingHeaders = await this.modulesService.mHeaderRepo.find({
            where: { module: { id: module.id } },
        });

        const existingLabels = new Set(existingHeaders.map((f) => f.label.trim().toLowerCase()));

        const newItems = filteredItems.filter((item) => {
            const label = item.label?.trim().toLowerCase();
            return label && !existingLabels.has(label);
        });

        if (!newItems.length) return;

        await this.modulesService.mHeaderRepo.createMany(
            newItems.map((item) =>
                this.buildMHeaderEntity({
                    label: item.label!.trim(),
                    icon: item.icon!.trim(),
                    module,
                }),
            ),
        );
    }

    /**
     * Updates existing module headers based on the provided DTOs.
     * Retrieves headers by IDs, checks for duplicate labels, and applies updates if no duplicates are found.
     */
    async updateHeaders(m: ModuleEntity, items: MRelationDto[]) {
        if (!items.length) return;

        const ids = items.map((item) => item.id!);
        const headers = await this.retrieveMHeaders(ids, m.id);
        const dtoMap = new Map(items.map((item) => [item.id, item]));

        for (const header of headers) {
            const dto = dtoMap.get(header.id)!;

            const isDataExist = await this.modulesService.mHeaderRepo.findOne({
                where: {
                    module: { id: m.id },
                    id: Not(header.id),
                    label: dto.label,
                },
            });

            if (!isDataExist)
                await this.updateMHeaderDetails(header, {
                    icon: dto.icon,
                    label: dto.label,
                });
        }
    }

    /**
     * Processes module headers by creating new ones and updating existing ones based on the provided DTOs.
     * Splits DTOs into create and update operations, then executes both in parallel.
     */
    async processModuleHeaders(module: ModuleEntity, dto?: MRelationDto[]) {
        if (!dto || dto.length === 0) return;
        const { creates, updates } = this.modulesService.preModuleService.splitByMethod(dto);
        await Promise.all([
            this.createHeaders(module, creates),
            this.updateHeaders(module, updates),
        ]);
    }

    /**
     * Deletes a module header by its ID and associated module ID.
     * Returns a confirmation message upon successful deletion.
     */
    async deleteMHeader(id: string, mId: string) {
        await this.modulesService.mHeaderRepo.delete({
            id,
            module: { id: mId },
        });
        return { message: 'Module header deleted' };
    }
}
