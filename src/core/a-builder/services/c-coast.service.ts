import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ABuilderEntity, CCoastEntity } from '../entities';
import { ABuilderService } from './a-builder.service';
import { CCoastDto } from '../dto';

@Injectable()
export class CCoastService {
    /**
     * Service responsible for handling holding duration operations
     */

    constructor(
        @Inject(forwardRef(() => ABuilderService))
        private readonly aBuilderService: ABuilderService,
    ) {}

    /**
     * Validates construction cost input against itemization and holding cost constraints.
     * Ensures all repair categories are provided when itemization is enabled, enforces required holding cost when items are absent,
     * validates mutual exclusivity between itemized data and holding cost, and triggers a validation exception when constraints are violated.
     */
    validateCCoastDetails(cCoast: CCoastDto): void {
        const errors: Record<string, string> = {};

        if (cCoast.hasItems && (!cCoast.eRepairs || !cCoast.oRepairs || !cCoast.iRepairs))
            errors['eRepairs'] =
                errors['oRepairs'] =
                errors['iRepairs'] =
                    'Itemized repairs are required when has items are true';

        if (!cCoast.hasItems && cCoast.holdingCoast == null)
            errors['holdingCoast'] = 'Holding cost is required when items are not provided';

        if (cCoast.hasItems && cCoast.holdingCoast != null)
            errors['holdingCoast'] =
                'Holding cost must not be provided when items are used — it is calculated automatically';

        this.aBuilderService.errorHandler.validation(errors);
    }

    /**
     * Calculates the total income received based on acquisition monthly income
     * multiplied by the CCoast duration.
     * Defaults missing values to 0 to ensure safe numeric computation.
     */
    calculateIncomeReceived = (builder: ABuilderEntity) =>
        (builder.acquisitionDetails?.monthlyIncome ?? 0) * (builder.cCoast?.duration ?? 0);

    /**
     * Calculates the net carrying cost for a builder entity.
     * Computes the difference between total CCoast and the income received,
     * defaulting missing values to 0 to ensure safe arithmetic operations.
     */
    calculateNetCarryingCoast = (builder: ABuilderEntity) =>
        (builder.cCoast?.totalCCoast ?? 0) - this.calculateIncomeReceived(builder);

    /**
     * Resolves the holding cost value from the provided construction cost data.
     * Returns the explicit holding cost when provided, otherwise computes the total
     * by aggregating values from exterior, interior, and other repair item groups.
     */
    resolveHoldingCoast(dto: CCoastDto): number {
        if (dto.holdingCoast !== undefined && dto.holdingCoast !== null) return dto.holdingCoast;

        const sumFields = (obj: object | undefined): number =>
            obj ? Object.values(obj).reduce((acc, val) => acc + (val ?? 0), 0) : 0;

        return sumFields(dto.eRepairs) + sumFields(dto.iRepairs) + sumFields(dto.oRepairs);
    }

    /**
     * Builds a construction cost entity from required and optional input data.
     * Instantiates a new entity, assigns cost-related and duration fields along with optional relationships,
     * and returns the constructed construction cost instance.
     */
    buildCCoastEntity(
        required: {
            rContingency: number;
            rContingencyTotal: number;
            duration: number;
            holdingCoast: number;
        },
        optional: { analysisBuilder?: ABuilderEntity },
    ): CCoastEntity {
        const result = new CCoastEntity();
        Object.assign(result, required, optional);
        return result;
    }

    /**
     * Creates a construction cost entity for the given analysis builder.
     * Validates input constraints, resolves the holding cost, builds and persists the entity,
     * and conditionally creates associated exterior, interior, and other repair records in parallel.
     */
    async createCCoast(aBuilder: ABuilderEntity, cCoast: CCoastDto): Promise<CCoastEntity> {
        this.validateCCoastDetails(cCoast);
        const holdingCoastValue = this.resolveHoldingCoast(cCoast);

        const result = await this.aBuilderService.cCoastRepository.create(
            this.buildCCoastEntity(
                {
                    ...cCoast,
                    rContingencyTotal: this.aBuilderService.refinanceService.determineNewAmount(
                        cCoast.rContingency,
                        holdingCoastValue,
                    ),
                    holdingCoast: holdingCoastValue,
                },
                { analysisBuilder: aBuilder },
            ),
        );

        const tasks: Promise<unknown>[] = [];

        if (cCoast.eRepairs)
            tasks.push(
                this.aBuilderService.eRepairsService.createERepair(
                    cCoast.eRepairs,
                    undefined,
                    result,
                ),
            );
        if (cCoast.iRepairs)
            tasks.push(
                this.aBuilderService.iRepairsService.createIRepair(
                    cCoast.iRepairs,
                    undefined,
                    undefined,
                    result,
                ),
            );
        if (cCoast.oRepairs)
            tasks.push(
                this.aBuilderService.oRepairsService.createORepair(
                    cCoast.oRepairs,
                    undefined,
                    result,
                ),
            );

        await Promise.all(tasks);
        return result;
    }

    /**
     * Reconciles construction cost relationships before updating the entity.
     * Detects removed repair sections and deletes their associated records,
     * executes deletions in parallel, and resolves the updated holding cost value.
     */
    async reconcileCCoastBeforeUpdate(cCoast: CCoastEntity, dto: CCoastDto): Promise<number> {
        const deletions: Promise<unknown>[] = [];

        if (cCoast.eRepairs && !dto.eRepairs)
            deletions.push(this.aBuilderService.eRepairsService.deleteERepair(cCoast.eRepairs));
        if (cCoast.iRepairs && !dto.iRepairs)
            deletions.push(this.aBuilderService.iRepairsService.deleteIRepair(cCoast.iRepairs));
        if (cCoast.oRepairs && !dto.oRepairs)
            deletions.push(this.aBuilderService.oRepairsService.deleteORepair(cCoast.oRepairs));

        await Promise.all(deletions);
        return this.resolveHoldingCoast(dto);
    }

    /**
     * Updates a construction cost entity and reconciles its related repair data.
     * Handles creation, update, or deletion of associated interior, exterior, and other repairs,
     * recalculates holding cost when needed, and persists updated construction cost fields.
     */
    async updateCCoast(cCoast: CCoastEntity, dto: CCoastDto): Promise<void> {
        const total = await this.reconcileCCoastBeforeUpdate(cCoast, dto);

        const updates: Promise<unknown>[] = [];

        if (dto.iRepairs)
            updates.push(
                cCoast.iRepairs
                    ? this.aBuilderService.iRepairsService.updateIRepairs(
                          cCoast.iRepairs,
                          dto.iRepairs,
                      )
                    : this.aBuilderService.iRepairsService.createIRepair(
                          dto.iRepairs,
                          undefined,
                          undefined,
                          cCoast,
                      ),
            );

        if (dto.eRepairs)
            updates.push(
                cCoast.eRepairs
                    ? this.aBuilderService.eRepairsService.updateERepairs(
                          cCoast.eRepairs,
                          dto.eRepairs,
                      )
                    : this.aBuilderService.eRepairsService.createERepair(
                          dto.eRepairs,
                          undefined,
                          cCoast,
                      ),
            );

        if (dto.oRepairs)
            updates.push(
                cCoast.oRepairs
                    ? this.aBuilderService.oRepairsService.updateORepairs(
                          cCoast.oRepairs,
                          dto.oRepairs,
                      )
                    : this.aBuilderService.oRepairsService.createORepair(
                          dto.oRepairs,
                          undefined,
                          cCoast,
                      ),
            );

        await Promise.all(updates);
        await this.aBuilderService.cCoastRepository.update(
            { id: cCoast.id },
            {
                holdingCoast: dto.holdingCoast ? total : cCoast.holdingCoast,
                rContingency: dto.rContingency ?? cCoast.rContingency,
                rContingencyTotal: dto.rContingency
                    ? this.aBuilderService.refinanceService.determineNewAmount(
                          cCoast.rContingency,
                          total,
                      )
                    : cCoast.rContingencyTotal,
                duration: dto.duration ?? cCoast.duration,
            },
        );
    }
}
