import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ABuilderService } from './a-builder.service';
import { ABuilderEntity, BrRefinanceEntity } from '../entities';
import { BrRefiDto } from '../dto';

@Injectable()
export class BrRefinanceService {
    /**
     * Service responsible for handling brrr analyzer refinance operations
     */

    constructor(
        @Inject(forwardRef(() => ABuilderService))
        private readonly aBuilderService: ABuilderService,
    ) {}

    /**
     * Validates refinance detail inputs against item usage and closing cost constraints.
     * Enforces required conditions for manual values and repair item configurations,
     * and raises validation errors when inconsistent refinance data is provided.
     */
    validateBrRefinanceDetails(refi: BrRefiDto) {
        const errors: Record<string, string> = {};

        if (!refi.hasItems && refi.closingCoast == null)
            errors['closingCoast'] = 'Closing coast is required when items are not provided';

        if (refi.hasItems && refi.closingCoast != null)
            errors['closingCoast'] =
                'Closing coast must not be provided when items are used — it is calculated automatically';

        if (refi.hasItems && !refi.eRepairs && !refi.iRepairs && !refi.oRepairs)
            errors['repairs'] =
                'At least one repair item (eRepairs, irepairs, or oRepairs) must be provided when items are used';

        this.aBuilderService.errorHandler.validation(errors);
    }

    /**
     * Resolves the refinancing closing cost value from the provided refinance details.
     * Validates refinance constraints and determines the final amount using either
     * aggregated repair items or the manually provided closing cost value.
     */
    resolveBrRefinanceValue(dto: BrRefiDto): number {
        this.validateBrRefinanceDetails(dto);
        return dto.hasItems
            ? this.aBuilderService.repairsService.resolveTotal(dto)
            : (dto.closingCoast ?? 0);
    }

    /**
     * Handles the creation of itemized refinance repair entries for the given refinance entity.
     * Creates external, internal, and other repair items concurrently based on the provided refinance details,
     * and returns the updated refinance entity after all item creation operations complete.
     */
    async handleBrRefinanceItemizedCreation(
        dto: BrRefiDto,
        refi: BrRefinanceEntity,
    ): Promise<BrRefinanceEntity> {
        const tasks: Promise<unknown>[] = [];

        if (dto.eRepairs)
            tasks.push(
                this.aBuilderService.eRepairsService.createERepair(
                    dto.eRepairs,
                    undefined,
                    undefined,
                    refi,
                ),
            );
        if (dto.iRepairs)
            tasks.push(
                this.aBuilderService.iRepairsService.createIRepair(
                    dto.iRepairs,
                    undefined,
                    undefined,
                    undefined,
                    refi,
                ),
            );
        if (dto.oRepairs)
            tasks.push(
                this.aBuilderService.oRepairsService.createORepair(
                    dto.oRepairs,
                    undefined,
                    undefined,
                    refi,
                ),
            );

        await Promise.all(tasks);
        return refi;
    }

    /**
     * Builds a refinancing entity using the provided required and optional refinance data.
     * Creates and populates a refinancing entity instance with loan, interest, and analysis builder information.
     */
    buildBrRefinance(
        required: {
            afterRepairValue: number;
            refiLTV: number;
            newLoanAmount: number;
            oldLoanAmount: number;
            pInterest: number;
            interestRate: number;
            pmi: number;
            point: number;
            closingCoast: number;
        },
        optional: {
            analysisBuilder?: ABuilderEntity;
        },
    ): BrRefinanceEntity {
        const result = new BrRefinanceEntity();
        Object.assign(result, required, optional);
        return result;
    }

    /**
     * Creates a refinancing entity for the given builder analysis context.
     * Resolves refinance closing costs, calculates the new loan amount, persists the refinance entity,
     * and conditionally creates associated itemized repair entries before returning the result.
     */
    async createBrRefinance(aBuilder: ABuilderEntity, dto: BrRefiDto): Promise<BrRefinanceEntity> {
        const closingCoastValue = this.resolveBrRefinanceValue(dto);

        const refi = await this.aBuilderService.brRefinanceRepository.create(
            this.buildBrRefinance(
                {
                    ...dto,
                    newLoanAmount: this.aBuilderService.refinanceService.determineNewAmount(
                        dto.afterRepairValue,
                        dto.refiLTV,
                    ),
                    closingCoast: closingCoastValue,
                },
                { analysisBuilder: aBuilder },
            ),
        );

        await this.handleBrRefinanceItemizedCreation(dto, refi);
        return refi;
    }

    /**
     * Updates refinance fields for the given refinance entity.
     * Validates the presence of update data, builds a partial update payload from allowed refinance fields,
     * and persists the updated refinance values through the repository layer.
     */
    async updateBrRefinance(
        refinance: BrRefinanceEntity,
        itemized?: Partial<{
            afterRepairValue: number;
            refiLTV: number;
            newLoanAmount: number;
            oldLoanAmount: number;
            pInterest: number;
            interestRate: number;
            pmi: number;
            point: number;
            closingCoast: number;
        }>,
    ) {
        if (!itemized || Object.keys(itemized).length === 0)
            return { message: 'No updates provided for refinance.' };

        const otherFields = [
            'afterRepairValue',
            'refiLTV',
            'newLoanAmount',
            'oldLoanAmount',
            'pInterest',
            'interestRate',
            'pmi',
            'point',
            'closingCoast',
        ] as const;
        const updatePayload: Partial<BrRefinanceEntity> = {};

        otherFields.forEach((field) => {
            if (itemized[field] !== undefined) updatePayload[field] = itemized[field] as any;
        });

        return await this.aBuilderService.brRefinanceRepository.update(
            { id: refinance.id },
            updatePayload,
        );
    }

    /**
     * Handles refinance updates for the given refinance entity and refinance details.
     * Resolves closing costs, updates or creates associated repair items concurrently,
     * recalculates refinance loan values, and persists the updated refinance data.
     */
    async handleBrRefiUpdate(refi: BrRefinanceEntity, dto: BrRefiDto): Promise<BrRefinanceEntity> {
        const closingCoastValue = this.resolveBrRefinanceValue(dto);

        const updates: Promise<unknown>[] = [];

        if (dto.iRepairs)
            updates.push(
                refi.iRepairs
                    ? this.aBuilderService.iRepairsService.updateIRepairs(
                          refi.iRepairs,
                          dto.iRepairs,
                      )
                    : this.aBuilderService.iRepairsService.createIRepair(
                          dto.iRepairs,
                          undefined,
                          undefined,
                          undefined,
                          refi,
                      ),
            );

        if (dto.eRepairs)
            updates.push(
                refi.eRepairs
                    ? this.aBuilderService.eRepairsService.updateERepairs(
                          refi.eRepairs,
                          dto.eRepairs,
                      )
                    : this.aBuilderService.eRepairsService.createERepair(
                          dto.eRepairs,
                          undefined,
                          undefined,
                          refi,
                      ),
            );

        if (dto.oRepairs)
            updates.push(
                refi.oRepairs
                    ? this.aBuilderService.oRepairsService.updateORepairs(
                          refi.oRepairs,
                          dto.oRepairs,
                      )
                    : this.aBuilderService.oRepairsService.createORepair(
                          dto.oRepairs,
                          undefined,
                          undefined,
                          refi,
                      ),
            );

        await Promise.all(updates);

        await this.updateBrRefinance(refi, {
            ...dto,
            newLoanAmount:
                this.aBuilderService.refinanceService.determineNewAmount(
                    dto.afterRepairValue,
                    dto.refiLTV,
                ) ?? refi.newLoanAmount,
            closingCoast: closingCoastValue,
        });

        return refi;
    }
}
