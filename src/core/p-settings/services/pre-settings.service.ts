import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { PSettingsService } from './p-settings.service';
import { PSettingEntity } from '../entities';
import { UserEntity } from '../../users/entities/user.entity';

@Injectable()
export class PreSettingsService {
    /**
     * Service responsible for handling pre settings operations
     */

    constructor(
        @Inject(forwardRef(() => PSettingsService))
        private readonly service: PSettingsService,
    ) {}

    /**
     * Constructs and returns a PSettingEntity by merging required label, basic settings, variable expenses,
     * target financial limits, and cash flow criteria into a single entities.
     */
    buildSettingEntity(
        required: {
            label: string;
            createdBy: UserEntity;
        },
        basicSettings: {
            taxRate?: number;
            occupancyRate?: number;
        },
        variablesExpenses: {
            managementFees?: number;
            maintenanceEscrow?: number;
            cashReserves?: number;
        },
        targetLimits: {
            capRate?: number;
            goi?: number;
            noi?: number;
            ber?: number;
            oer?: number;
            dscr?: number;
            grm?: number;
            agm?: number;
            coc?: number;
            cashFlow?: number;
            fTermRoi?: number;
            yearlyIncome?: number;
            roi?: number;
            payBackPeriod?: number;
        },
        cashFlowCriteria: {
            onePercent?: boolean;
            twoPercent?: boolean;
            fiftyPercent?: boolean;
            cashFlowAtLeast?: number;
            cashNeeded?: number;
        },
    ): PSettingEntity {
        const result = new PSettingEntity();
        Object.assign(
            result,
            required,
            basicSettings,
            variablesExpenses,
            targetLimits,
            cashFlowCriteria,
        );
        return result;
    }

    /**
     * Retrieves a PSettingEntity profile based on specified criteria and optional relations.
     * Logs the retrieval attempt and throws a not found error if no matching profile is found.
     * Returns a promise resolving to the matching PSettingEntity.
     */
    async retrieveSettingByCriteria(
        criteria: Record<string, any>,
        relations?: string[],
    ): Promise<PSettingEntity> {
        const entries = this.service.otherUtils.formatCriteria(criteria);

        this.service.logger.info(`Find a profile setting by ${entries}`);

        const isSettingExist = await this.service.pSettingRepository.findActiveOne(
            this.service.pSettingRepository,
            criteria,
            relations,
        );

        if (!isSettingExist)
            this.service.errorHandler.notFound(`Profile setting not found with ${entries}`, `Profile setting not found`);

        return isSettingExist;
    }

    /**
     * Updates the details of a PSettingEntity with provided partial updates.
     * Validates and processes updates for both required and optional fields, then persists the changes.
     * Returns the result of the update operation.
     */
    async updateSettingDetails(
        setting: PSettingEntity,
        sUpdates?: Partial<{
            label: string;
            taxRate: number;
            occupancyRate: number;
            managementFees: number;
            maintenanceEscrow: number;
            capRate: number;
            goi: number;
            noi: number;
            ber: number;
            oer: number;
            dscr: number;
            grm: number;
            agm: number;
            coc: number;
            cashFlow: number;
            fTermRoi: number;
            yearlyIncome: number;
            roi: number;
            payBackPeriod?: number;
            onePercent?: boolean;
            twoPercent?: boolean;
            fiftyPercent?: boolean;
            cashFlowAtLeast?: number;
            cashNeeded?: number;
        }>,
    ) {
        if (!sUpdates || Object.keys(sUpdates).length === 0)
            return { message: 'No updates provided for settings' };

        const [requiredFields, otherFields] = [
            ['label'] as const,
            [
                'taxRate',
                'occupancyRate',
                'managementFees',
                'maintenanceEscrow',
                'capRate',
                'goi',
                'noi',
                'ber',
                'oer',
                'dscr',
                'grm',
                'agm',
                'coc',
                'cashFlow',
                'fTermToi',
                'yearlyIncome',
                'roi',
                'payBackPeriod',
                'onePercent',
                'twoPercent',
                'fiftyPercent',
                'cashFlowAtLeast',
                'cashNeeded',
            ] as const,
        ];

        const updatePayload: Partial<PSettingEntity> = {};

        requiredFields.forEach((field) => {
            if (sUpdates[field]?.trim()) updatePayload[field] = sUpdates[field].trim();
        });

        otherFields.forEach((field) => {
            if (sUpdates[field] !== undefined) updatePayload[field] = sUpdates[field] as any;
        });

        return await this.service.pSettingRepository.update({ id: setting.id }, updatePayload);
    }

    /**
     * Validates that a setting label is unique among active settings.
     * Throws a validation error if the label is already in use, including detailed error messages.
     */
    async ensureUniqueSettingLabel(label: string) {
        const errors: Record<string, string> = {};
        await this.service.pSettingRepository.assertUniqueActive(
            this.service.pSettingRepository,
            errors,
            { label },
            'Setting',
        );

        if (Object.keys(errors).length > 0) throw this.service.errorHandler.validation(errors);
    }

    /**
     * Validates that a setting label is unique among active settings, excluding the current setting during an update.
     * Throws a validation error if the label is already in use by another setting.
     */
    async ensureUniqueSettingLabelForUpdate(label: string, setting: PSettingEntity) {
        const errors: Record<string, string> = {};
        await this.service.pSettingRepository.assertUniqueActive(
            this.service.pSettingRepository,
            errors,
            { label },
            'Setting',
            setting.id,
        );

        if (Object.keys(errors).length > 0) throw this.service.errorHandler.validation(errors);
    }

    /**
     * Retrieves all non-deleted, non-default profiles associated with a specific user by their ID.
     * Returns a promise resolving to an array of PSettingEntity objects, including related profile entities.
     */
    async getUserProfiles(userId: string): Promise<PSettingEntity[]> {
        return await this.service.pSettingRepository.find({
            where: {
                createdBy: { id: userId },
                deleted: false,
                isDefault: false,
            },
            relations: this.service.transformPSettingService.profileEntities(),
        });
    }

    /**
     * Retrieves the default profile for a specific user by their ID.
     * Falls back to the global default profile if no user-specific default is found.
     * Returns a promise resolving to the PSettingEntity, including related profile entities.
     */
    async getDefaultUserProfile(userId: string): Promise<PSettingEntity> {
        let profile = await this.service.pSettingRepository.findOne({
            where: {
                isDefault: true,
                createdBy: { id: userId },
                deleted: false,
            },
            relations: this.service.transformPSettingService.profileEntities(),
        });

        profile ??= await this.service.pSettingRepository.findOne({
            where: {
                isDefault: true,
                deleted: false,
            },
            relations: this.service.transformPSettingService.profileEntities(),
        });

        if (!profile)
            this.service.errorHandler.notFound(
                `Default profile setting not found for user ${userId}`,
                `Default profile setting not found`,
            );

        return profile;
    }
}
