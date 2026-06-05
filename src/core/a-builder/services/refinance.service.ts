import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ABuilderService } from './a-builder.service';
import { ABuilderEntity, RefinanceEntity } from '../entities';
import { RefiCreateDto } from '../dto';

@Injectable()
export class RefinanceService {
    /**
     * Service responsible for handling refinance operations
     */

    constructor(
        @Inject(forwardRef(() => ABuilderService))
        private readonly aBuilderService: ABuilderService,
    ) {}

    /**
     * Validates refinance detail inputs against itemization and closing cost rules.
     * Enforces presence of itemized data when required, ensures closing cost is provided or omitted based on itemization state,
     * collects validation errors, and triggers a validation exception when constraints are violated.
     */
    validateRefinanceDetails(refi: RefiCreateDto) {
        const errors: Record<string, string> = {};

        if (refi.hasItems && !refi.item)
            errors['item'] = 'Itemized details are required for refinance';

        if (!refi.hasItems && refi.closingCoast == null)
            errors['closingCoast'] = 'Closing coast is required when items are not provided';

        if (refi.hasItems && refi.closingCoast != null)
            errors['closingCoast'] =
                'Closing coast must not be provided when items are used — it is calculated automatically';

        this.aBuilderService.errorHandler.validation(errors);
    }

    /**
     * Determines the new loan amount based on the AR value and LTV percentage.
     * Computes the loanable amount by applying the LTV ratio to the AR value.
     */
    determineNewAmount = (arValue: number, ltv: number) => (arValue * ltv) / 100;

    /**
     * Calculates refinance cash based on AR value, LTV, and existing loan amount.
     * Determines the new allowable loan amount and subtracts the current loan amount
     * to compute available cash from refinancing.
     */
    calculateRefiCash = (arValue: number, ltv: number, loanAmount: number) =>
        this.determineNewAmount(arValue, ltv) - loanAmount;

    /**
     * Resolves the refinancing value from the provided input data.
     * Validates refinance details, computes the total from itemized entries when present,
     * otherwise falls back to the provided closing cost or a default value.
     */
    resolveRefinanceValue(dto: RefiCreateDto): number {
        this.validateRefinanceDetails(dto);
        return dto.item
            ? this.aBuilderService.refinanceItemService.calculateItemizedRefinance(dto.item)
            : (dto.closingCoast ?? 0);
    }

    /**
     * Handles creation of itemized refinance details for the given entity.
     * Checks for the presence of itemized data and delegates processing to the refinancing item service
     * to resolve and persist create and update operations when applicable.
     */
    async handleRefinanceItemizedCreation(
        dto: RefiCreateDto,
        refi: RefinanceEntity,
    ): Promise<void> {
        if (dto.item)
            await this.aBuilderService.refinanceItemService.resolveRefiItem(refi, dto.item);
    }

    /**
     * Builds a refinancing entity from required and optional input data.
     * Instantiates a new entity, assigns all required financial fields and optional relationships,
     * and returns the fully constructed refinance instance.
     */
    buildRefinance(
        required: {
            afterRepairValue: number;
            refiLTV: number;
            newLoanAmount: number;
            oldLoanAmount: number;
            pInterest: number;
            interestRate: number;
            pmi: number;
            hoa: number;
            point: number;
            closingCoast: number;
        },
        optional: {
            analysisBuilder?: ABuilderEntity;
            vacancy?: number;
        },
    ): RefinanceEntity {
        const result = new RefinanceEntity();
        Object.assign(result, required, optional);
        return result;
    }

    /**
     * Creates a refinancing entity for the given analysis builder and input data.
     * Resolves the refinancing value, builds the refinancing entity with computed and provided fields,
     * persists it, triggers optional itemized creation handling, and returns the created entity.
     */
    async createRefinance(aBuilder: ABuilderEntity, dto: RefiCreateDto): Promise<RefinanceEntity> {
        const closingCoastValue = this.resolveRefinanceValue(dto);

        const refi = await this.aBuilderService.refinanceRepository.create(
            this.buildRefinance(
                {
                    ...dto,
                    newLoanAmount: this.determineNewAmount(dto.afterRepairValue, dto.refiLTV),
                    closingCoast: closingCoastValue,
                },
                { analysisBuilder: aBuilder, vacancy: dto.vacancy },
            ),
        );

        await this.handleRefinanceItemizedCreation(dto, refi);
        return refi;
    }

    /**
     * Updates a refinancing entity with the provided partial financial data.
     * Validates input presence, extracts supported numeric fields, builds an update payload from defined values,
     * and persists the changes for the targeted refinance record.
     */
    async updateRefinance(
        refinance: RefinanceEntity,
        itemized?: Partial<{
            afterRepairValue: number;
            refiLTV: number;
            newLoanAmount: number;
            oldLoanAmount: number;
            pInterest: number;
            interestRate: number;
            pmi: number;
            hoa: number;
            point: number;
            closingCoast: number;
            vacancy?: number;
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
            'hoa',
            'point',
            'closingCoast',
            'vacancy',
        ] as const;
        const updatePayload: Partial<RefinanceEntity> = {};

        otherFields.forEach((field) => {
            if (itemized[field] !== undefined) updatePayload[field] = itemized[field] as any;
        });

        return await this.aBuilderService.refinanceRepository.update(
            { id: refinance.id },
            updatePayload,
        );
    }

    /**
     * Handles refinance update operations for the given entity.
     * Resolves the refinancing value, applies updates to the refinancing record,
     * triggers itemized creation handling when applicable, and returns the updated entity reference.
     */
    async handleRefiUpdate(refi: RefinanceEntity, dto: RefiCreateDto): Promise<RefinanceEntity> {
        const closingCoastValue = this.resolveRefinanceValue(dto);

        await this.updateRefinance(refi, {
            ...dto,
            newLoanAmount:
                this.determineNewAmount(dto.afterRepairValue, dto.refiLTV) ?? refi.newLoanAmount,
            closingCoast: closingCoastValue,
        });

        await this.handleRefinanceItemizedCreation(dto, refi);
        return refi;
    }
}
