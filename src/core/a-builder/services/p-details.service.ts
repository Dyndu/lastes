import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { PropertyDetailsTypeEnum } from '../../../common/enum';
import { PDetailsEntity, ABuilderEntity } from '../entities';
import { ABuilderService } from './a-builder.service';
import { UnitsDto, UpdatePDetailsDto } from '../dto';

@Injectable()
export class PDetailsService {
    /**
     * Service responsible for handling properties details operations
     */

    constructor(
        @Inject(forwardRef(() => ABuilderService))
        private readonly aBuilderService: ABuilderService,
    ) {}

    /**
     * Validates that a property marked as SINGLE_FAMILY does not have more than one associated unit.
     * Throws a forbidden error if the validation fails.
     */
    checkSingleFamilyUnits(status: PropertyDetailsTypeEnum, units: UnitsDto[]) {
        if (status === PropertyDetailsTypeEnum.SINGLE_FAMILY && units.length > 1)
            this.aBuilderService.errorHandler.forbidden(
                `More than 1 units is not allowed for ${PropertyDetailsTypeEnum.SINGLE_FAMILY}`,
                `Forbidden, you can't add more than one unit for this family type`,
            );
    }

    /**
     * Calculates the total income by summing the monthly rent of all units and adding any additional monthly income.
     * Returns the computed total income as a number.
     */
    calculateTotalIncome = (mRents: number[], monthlyIncome?: number) =>
        mRents.reduce((sum, data: number) => sum + (data ?? 0), 0) +
        (monthlyIncome && monthlyIncome > 0 ? monthlyIncome : 0);

    /**
     * Constructs and returns a PDetailsEntity by merging required and optional properties.
     * Required properties include status, units, analysis, and totalIncome.
     */
    buildPDetailsEntity(
        required: {
            status: PropertyDetailsTypeEnum;
            totalIncome: number;
        },
        optional: {
            analysisBuilder?: ABuilderEntity;
            monthlyIncome?: number;
        },
    ): PDetailsEntity {
        const result = new PDetailsEntity();
        Object.assign(result, required, optional);
        return result;
    }

    /**
     * Asynchronously retrieves a property details entities (PDetailsEntity) based on the provided criteria and optional relations.
     * Formats the criteria for logging, checks for the existence of an active record, and throws a not found error if the record does not exist.
     * Returns the found property details entities.
     */
    async retrievePDetailsByCriteria(
        criteria: Record<string, any>,
        relations?: string[],
    ): Promise<PDetailsEntity> {
        const entries = this.aBuilderService.otherUtils.formatCriteria(criteria);

        this.aBuilderService.logger.info(`Find a property details by ${entries}`);

        const isSettingExist = await this.aBuilderService.pDetailsRepository.findActiveOne(
            this.aBuilderService.pDetailsRepository,
            criteria,
            relations,
        );

        if (!isSettingExist)
            this.aBuilderService.errorHandler.notFound(
                `Data not found with ${entries}`,
                `Data not found`,
            );

        return isSettingExist;
    }

    /**
     * Asynchronously updates specific fields of a property details entities (PDetailsEntity).
     * Accepts partial updates for status, totalIncome, and monthlyIncome.
     * Returns a message if no updates are provided, otherwise updates the entities in the database.
     */
    async updatePDetails(
        pDetails: PDetailsEntity,
        pUpdates?: Partial<{
            status: PropertyDetailsTypeEnum;
            totalIncome: number;
            monthlyIncome: number;
        }>,
    ) {
        if (!pUpdates || Object.keys(pUpdates).length === 0)
            return {
                message: 'No updates provided for property details',
            };

        const otherFields = ['status', 'totalIncome', 'monthlyIncome'] as const;

        const updatePayload: Partial<PDetailsEntity> = {};

        otherFields.forEach((field) => {
            if (pUpdates[field] !== undefined) updatePayload[field] = pUpdates[field] as any;
        });

        return await this.aBuilderService.pDetailsRepository.update(
            { id: pDetails.id },
            updatePayload,
        );
    }

    /**
     * Asynchronously updates property details information for a given ID using the provided DTO.
     * Logs the update action, retrieves the existing property details, and processes updates for monthly income, property type, and units.
     * If units are provided, deletes existing units, validates single-family unit constraints, recalculates total income, and creates new units.
     * Finally, updates the property details with the new values and returns a success message.
     */
    async updatePDInformation(id: string, updateDto: UpdatePDetailsDto) {
        this.aBuilderService.logger.info(`Updating property details by ${id}`);
        const { monthlyIncome, status, units } = updateDto;

        const pDetails = await this.retrievePDetailsByCriteria({ id });

        let totalIncome = pDetails.totalIncome;

        if (units) {
            await this.aBuilderService.unitsService.deletePDetailsUnits(pDetails);
            if (status) this.checkSingleFamilyUnits(status, units);
            if (monthlyIncome)
                totalIncome = this.calculateTotalIncome(
                    units.map((u) => u.monthlyRent),
                    monthlyIncome,
                );
            await this.aBuilderService.unitsService.createPDetailsUnits(pDetails, units);
        }

        await this.updatePDetails(pDetails, {
            monthlyIncome,
            totalIncome,
            status,
        });

        return { message: 'Successfully updated property details' };
    }
}
