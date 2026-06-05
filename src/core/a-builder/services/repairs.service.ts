import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ABuilderService } from './a-builder.service';
import { ABuilderEntity, RepairsEntity } from '../entities';
import { CreateRepairsDto, UpdateRepairsDto } from '../dto';

@Injectable()
export class RepairsService {
    /**
     * Service responsible for handling repairs operations
     */

    constructor(
        @Inject(forwardRef(() => ABuilderService))
        private readonly aBuilderService: ABuilderService,
    ) {}

    /**
     * Builds a RepairsEntity by assigning the provided optional properties to a new instance.
     */
    buildRepairsEntity(optional: {
        total: number;
        afterRepairsValue?: number;
        analysisBuilder?: ABuilderEntity;
    }): RepairsEntity {
        const result = new RepairsEntity();
        Object.assign(result, optional);
        return result;
    }

    /**
     * Resolves the total for a repairs entity:
     * - If the user explicitly provided a total, use it.
     * - Otherwise, sum up the totals from the sub-repair DTOs.
     */
    resolveTotal(dto: CreateRepairsDto | UpdateRepairsDto): number {
        if (dto.total !== undefined && dto.total !== null) return dto.total;

        const sumFields = (obj: object | undefined): number =>
            obj ? Object.values(obj).reduce((acc, val) => acc + (val ?? 0), 0) : 0;

        return sumFields(dto.eRepairs) + sumFields(dto.iRepairs) + sumFields(dto.oRepairs);
    }

    /**
     * Creates a new RepairsEntity and concurrently creates associated
     * exterior, interior, and other repairs entities if provided.
     */
    async createRepairs(
        createDto: CreateRepairsDto,
        aBuilder?: ABuilderEntity,
    ): Promise<RepairsEntity> {
        const total = this.resolveTotal(createDto);

        const repairs = await this.aBuilderService.repairsRepository.create(
            this.buildRepairsEntity({
                analysisBuilder: aBuilder,
                total,
                afterRepairsValue: createDto.afterRepairValue ?? 0,
            }),
        );

        const tasks: Promise<unknown>[] = [];

        if (createDto.eRepairs)
            tasks.push(
                this.aBuilderService.eRepairsService.createERepair(createDto.eRepairs, repairs),
            );
        if (createDto.iRepairs)
            tasks.push(
                this.aBuilderService.iRepairsService.createIRepair(createDto.iRepairs, repairs),
            );
        if (createDto.oRepairs)
            tasks.push(
                this.aBuilderService.oRepairsService.createORepair(createDto.oRepairs, repairs),
            );

        await Promise.all(tasks);
        return repairs;
    }

    async reconcileBeforeUpdate(repair: RepairsEntity, dto: UpdateRepairsDto): Promise<number> {
        const deletions: Promise<unknown>[] = [];

        if (repair.eRepairs && dto.eRepairs)
            deletions.push(this.aBuilderService.eRepairsService.deleteERepair(repair.eRepairs));
        if (repair.iRepairs && dto.iRepairs)
            deletions.push(this.aBuilderService.iRepairsService.deleteIRepair(repair.iRepairs));
        if (repair.oRepairs && dto.oRepairs)
            deletions.push(this.aBuilderService.oRepairsService.deleteORepair(repair.oRepairs));

        await Promise.all(deletions);
        return this.resolveTotal(dto);
    }

    /**
     * Updates an existing RepairsEntity:
     * - Reconciles (cleans up) sub-entities not present in the DTO.
     * - Updates or creates sub-entities based on the DTO.
     * - Persists the recalculated/provided total.
     */
    async updateRepairs(repair: RepairsEntity, dto: UpdateRepairsDto): Promise<void> {
        const total = await this.reconcileBeforeUpdate(repair, dto);

        const updates: Promise<unknown>[] = [];

        if (dto.iRepairs)
            updates.push(
                repair.iRepairs
                    ? this.aBuilderService.iRepairsService.updateIRepairs(
                          repair.iRepairs,
                          dto.iRepairs,
                      )
                    : this.aBuilderService.iRepairsService.createIRepair(dto.iRepairs, repair),
            );

        if (dto.eRepairs)
            updates.push(
                repair.eRepairs
                    ? this.aBuilderService.eRepairsService.updateERepairs(
                          repair.eRepairs,
                          dto.eRepairs,
                      )
                    : this.aBuilderService.eRepairsService.createERepair(dto.eRepairs, repair),
            );

        if (dto.oRepairs)
            updates.push(
                repair.oRepairs
                    ? this.aBuilderService.oRepairsService.updateORepairs(
                          repair.oRepairs,
                          dto.oRepairs,
                      )
                    : this.aBuilderService.oRepairsService.createORepair(dto.oRepairs, repair),
            );

        await Promise.all(updates);
        await this.aBuilderService.repairsRepository.update(
            { id: repair.id },
            { total, afterRepairsValue: dto.afterRepairValue ?? repair.afterRepairsValue },
        );
    }
}
