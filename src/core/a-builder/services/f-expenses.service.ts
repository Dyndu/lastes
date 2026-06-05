import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ABuilderService } from './a-builder.service';
import { ABuilderEntity, FExpensesEntity } from '../entities';
import { FExpenseDto } from '../dto';

@Injectable()
export class FExpensesService {
    /**
     * Service responsible for fixed expenses operations
     */

    constructor(
        @Inject(forwardRef(() => ABuilderService))
        private readonly aBuilderService: ABuilderService,
    ) {}

    /**
     * Constructs a new FExpensesEntity by combining required financial expense values with optional relationships.
     * All required expense fields (utilities, fees, taxes, insurance, etc.) must be provided and are assigned
     * alongside the optional analysisBuilder association. Returns the fully constructed entities instance
     * ready for persistence or further manipulation.
     */
    buildFExpenseEntity(
        required: {
            sewer: number;
            water: number;
            trash: number;
            gas: number;
            electric: number;
            internet: number;
            other: number;
            hoaFees: number;
            propertyTaxes: number;
            hazardInsurance: number;
            additionalFees: number;
            cashReserves: number;
            managementFees: number;
            maintenanceEscrow: number;
            total: number;
        },
        optional: {
            analysisBuilder?: ABuilderEntity;
        },
    ): FExpensesEntity {
        const result = new FExpensesEntity();
        Object.assign(result, required, optional);
        return result;
    }

    /**
     * Calculates the monthly expense breakdown based on total income and expense ratios.
     * Computes maintenance escrow, management fees, and cash reserves as proportional values
     * of the provided total income.
     */
    calcMonthlyExpenseBreakdown = (
        totalIncome: number,
        { maintenanceEscrow, managementFees, cashReserves }: FExpenseDto,
    ) => ({
        mEscrow: this.aBuilderService.otherUtils.r2((totalIncome * maintenanceEscrow) / 100),
        mFees: this.aBuilderService.otherUtils.r2((totalIncome * managementFees) / 100),
        cReserves: this.aBuilderService.otherUtils.r2((totalIncome * cashReserves) / 100),
    });

    /**
     * Resolves the total FExpense value for a given expense DTO and income baseline.
     * Sums flat expense fields, adds proportional monthly expense breakdown
     * (maintenance escrow, management fees, cash reserves), and returns the final total.
     */
    resolveFETotal(createDto: FExpenseDto, totalIncome: number): number {
        const flatFields: (keyof FExpenseDto)[] = [
            'sewer',
            'water',
            'trash',
            'gas',
            'electric',
            'internet',
            'other',
            'hoaFees',
            'propertyTaxes',
            'hazardInsurance',
            'additionalFees',
        ];

        const flatTotal = flatFields.reduce((acc, field) => acc + (createDto[field] ?? 0), 0);
        const { mEscrow, mFees, cReserves } = this.calcMonthlyExpenseBreakdown(
            totalIncome,
            createDto,
        );

        return this.aBuilderService.otherUtils.r2(flatTotal + mEscrow + mFees + cReserves);
    }

    /**
     * Creates and persists a new FExpensesEntity by combining the provided financial expense DTO data
     * with an optional association to an ABuilderEntity. Delegates entities construction to buildFExpenseEntity
     * which handles the required expense fields and optional builder relationship. Returns the newly created
     * and saved financial expenses entities from the repository.
     */
    async createFExpense(
        createDto: FExpenseDto,
        totalIncome: number,
        analysisBuilder?: ABuilderEntity,
    ): Promise<FExpensesEntity> {
        const total = this.resolveFETotal(createDto, totalIncome);
        return await this.aBuilderService.fExpensesRepository.create(
            this.buildFExpenseEntity({ ...createDto, total }, { analysisBuilder }),
        );
    }

    /**
     * Updates financial expense fields of an existing FExpensesEntity by selectively applying only the values
     * present in the provided partial update object. The method filters through all possible expense categories
     * (utilities, fees, taxes, insurance, reserves, etc.) and builds a payload containing only the fields
     * that were explicitly supplied. Returns early with a notification message if no valid updates are provided,
     * otherwise persists the filtered changes to the repository.
     */
    async updateFExpense(
        result: FExpensesEntity,
        totalIncome: number,
        itemized?: Partial<FExpenseDto>,
    ) {
        if (!itemized || Object.keys(itemized).length === 0)
            return { message: 'No updates provided for fixed expenses update' };

        const otherFields = [
            'sewer',
            'water',
            'trash',
            'gas',
            'electric',
            'internet',
            'other',
            'hoaFees',
            'propertyTaxes',
            'hazardInsurance',
            'additionalFees',
            'cashReserves',
            'managementFees',
            'maintenanceEscrow',
        ] as const;

        const updatePayload: Partial<FExpensesEntity> = {};

        otherFields.forEach((field) => {
            if (itemized[field] !== undefined) updatePayload[field] = itemized[field] as any;
        });

        const merged: FExpenseDto = {
            sewer: itemized.sewer ?? result.sewer,
            water: itemized.water ?? result.water,
            trash: itemized.trash ?? result.trash,
            gas: itemized.gas ?? result.gas,
            electric: itemized.electric ?? result.electric,
            internet: itemized.internet ?? result.internet,
            other: itemized.other ?? result.other,
            hoaFees: itemized.hoaFees ?? result.hoaFees,
            propertyTaxes: itemized.propertyTaxes ?? result.propertyTaxes,
            hazardInsurance: itemized.hazardInsurance ?? result.hazardInsurance,
            additionalFees: itemized.additionalFees ?? result.additionalFees,
            cashReserves: itemized.cashReserves ?? result.cashReserves,
            managementFees: itemized.managementFees ?? result.managementFees,
            maintenanceEscrow: itemized.maintenanceEscrow ?? result.maintenanceEscrow,
        };

        updatePayload.total = this.resolveFETotal(merged, totalIncome);

        return await this.aBuilderService.fExpensesRepository.update(
            { id: result.id },
            updatePayload,
        );
    }
}
