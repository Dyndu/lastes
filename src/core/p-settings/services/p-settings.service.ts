import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { PSettingRepository, MetricsRepository, SMetricRepository } from '../repositories';
import { ErrorHandlerService } from '../../../common/response';
import { TransformPSettingService } from './transform-p-setting.service';
import { PreSettingsService } from './pre-settings.service';
import { PSettingCreateDto } from '../dto/p-setting-create.dto';
import { UsersService } from '../../users/services';
import { OtherUtils } from '../../../utils/services/tools';
import { PSettingUpdateDto } from '../dto/p-setting-update.dto';
import { MetricsEntity, PSettingEntity } from '../entities';
import { UserEntity } from '../../users/entities/user.entity';
import { MetricsService } from './metrics.service';
import { SMetricService } from './s-metric.service';

@Injectable()
export class PSettingsService {
    /**
     * Service responsible for handling all settings operations
     */

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        @Inject(forwardRef(() => TransformPSettingService))
        readonly transformPSettingService: TransformPSettingService,
        @Inject(forwardRef(() => PreSettingsService))
        readonly preSettingService: PreSettingsService,
        @Inject(forwardRef(() => MetricsService))
        readonly metricsService: MetricsService,
        @Inject(forwardRef(() => SMetricService))
        readonly sMetricService: SMetricService,
        readonly userService: UsersService,
        readonly pSettingRepository: PSettingRepository,
        readonly otherUtils: OtherUtils,
        readonly metricsRepository: MetricsRepository,
        readonly sMetricRepository: SMetricRepository,
        readonly errorHandler: ErrorHandlerService,
    ) {}

    /**
     * Retrieves and transforms all profiles (default and custom) for a specific user by their ID.
     * Logs the retrieval attempt and returns a promise resolving to the transformed array of profiles.
     */
    async retrieveUserSProfile(userId: string) {
        this.logger.info(`Getting user profiles for ${userId}`);

        const [profiles, defaultOne] = await Promise.all([
            this.preSettingService.getUserProfiles(userId),
            this.preSettingService.getDefaultUserProfile(userId),
        ]);

        return this.transformPSettingService.transformProfiles([defaultOne, ...profiles]);
    }

    /**
     * Retrieves and transforms the details of a PSettingEntity by its ID.
     * Logs the retrieval attempt and returns a promise resolving to the structured profile object.
     */
    async settingDetails(id: string) {
        this.logger.info(`Retrieving a setting details for ${id}`);

        const result = await this.preSettingService.retrieveSettingByCriteria(
            { id },
            this.transformPSettingService.updateSettingEntities(),
        );

        return this.transformPSettingService.transformProfile(result);
    }

    /**
     * Generically creates a new PSettingEntity by combining required, basic settings, variable expenses,
     * target financial limits, and cash flow criteria into a single entities, then persists it.
     * Returns a promise resolving to the newly created PSettingEntity.
     */
    async genericPSettingCreation(
        input: PSettingCreateDto & { createdBy: UserEntity },
    ): Promise<PSettingEntity> {
        return await this.pSettingRepository.create(
            this.preSettingService.buildSettingEntity(
                { label: input.label, createdBy: input.createdBy },
                { taxRate: input.taxRate, occupancyRate: input.occupancyRate },
                {
                    managementFees: input.managementFees,
                    maintenanceEscrow: input.maintenanceEscrow,
                    cashReserves: input.cashReserves,
                },
                {
                    capRate: input.capRate,
                    cashFlow: input.cashFlow,
                    fTermRoi: input.fTermRoi,
                    roi: input.roi,
                    agm: input.agm,
                    ber: input.ber,
                    oer: input.oer,
                    dscr: input.dscr,
                    coc: input.coc,
                    goi: input.goi,
                    noi: input.noi,
                    payBackPeriod: input.payBackPeriod,
                    grm: input.grm,
                    yearlyIncome: input.yearlyIncome,
                },
                {
                    cashNeeded: input.cashNeeded,
                    cashFlowAtLeast: input.cashFlowAtLeast,
                    fiftyPercent: input.fiftyPercent,
                    onePercent: input.onePercent,
                    twoPercent: input.twoPercent,
                },
            ),
        );
    }

    /**
     * Constructs a PSettingCreateDto object from a PSettingEntity and its associated UserEntity (createdBy).
     * Extracts all relevant fields from the entities and returns them in a structured DTO format.
     */
    private buildInputFromEntity(
        entity: PSettingEntity,
        createdBy: UserEntity,
    ): PSettingCreateDto & { createdBy: UserEntity } {
        const {
            label,
            taxRate,
            occupancyRate,
            managementFees,
            maintenanceEscrow,
            cashReserves,
            capRate,
            cashFlow,
            fTermRoi,
            roi,
            agm,
            ber,
            oer,
            dscr,
            coc,
            goi,
            noi,
            payBackPeriod,
            grm,
            yearlyIncome,
            cashNeeded,
            cashFlowAtLeast,
            fiftyPercent,
            onePercent,
            twoPercent,
        } = entity;

        return {
            createdBy,
            label,
            taxRate,
            occupancyRate,
            managementFees,
            maintenanceEscrow,
            cashReserves,
            capRate,
            cashFlow,
            fTermRoi,
            roi,
            agm,
            ber,
            oer,
            dscr,
            coc,
            goi,
            noi,
            payBackPeriod,
            grm,
            yearlyIncome,
            cashNeeded,
            cashFlowAtLeast,
            fiftyPercent,
            onePercent,
            twoPercent,
        };
    }

    /**
     * Retrieves the UserEntity associated with the provided user ID.
     * Returns a promise resolving to the UserEntity.
     */
    async getCreatedBy(userID: string) {
        return await this.userService.preUserService.retrieveUserByCriteria({
            id: userID,
        });
    }

    /**
     * Creates a new PSettingEntity profile for a user based on the provided DTO.
     * Validates the uniqueness of the profile label, associates it with the user, and persists the new profile.
     * Logs the creation attempt and returns a success message upon completion.
     */
    async createPSetting(userId: string, createDto: PSettingCreateDto) {
        this.logger.info(
            `Creating a new setting profile by user ${userId} with data ${JSON.stringify(createDto)}`,
        );

        const { label, metrics } = createDto;
        let mEntities: MetricsEntity[] = [];

        await this.preSettingService.ensureUniqueSettingLabel(label);
        const createdBy = await this.getCreatedBy(userId);

        if (metrics) mEntities = await this.metricsService.retrieveMetrics(metrics);
        const result = await this.genericPSettingCreation({
            ...createDto,
            createdBy,
        });

        if (mEntities.length > 0) await this.sMetricService.createSMetrics(result, mEntities);
        return { message: 'Profile setting created successfully' };
    }

    /**
     * Updates a PSettingEntity with the provided DTO, handling both profile details and associated metrics.
     * Logs the update attempt, ensures the existence of the setting, and synchronizes metrics if provided.
     * Returns a success message upon completion.
     */
    async updatePSetting(userId: string, id: string, updateDto: PSettingUpdateDto) {
        this.logger.info(
            `Update setting with id: ${id} with updateDto: ${JSON.stringify(updateDto)}`,
        );

        const createdBy = await this.getCreatedBy(userId);
        let isSExist = await this.preSettingService.retrieveSettingByCriteria(
            { id },
            this.transformPSettingService.createdBy(),
        );

        if (isSExist.isDefault && !isSExist.createdBy)
            isSExist = await this.genericPSettingCreation(
                this.buildInputFromEntity(isSExist, createdBy),
            );

        const result = await this.preSettingService.retrieveSettingByCriteria(
            { id: isSExist.id },
            this.transformPSettingService.updateSettingEntities(),
        );

        await this.preSettingService.updateSettingDetails(result, {
            label: updateDto.label,
            taxRate: updateDto.taxRate,
            occupancyRate: updateDto.occupancyRate,
            managementFees: updateDto.managementFees,
            maintenanceEscrow: updateDto.maintenanceEscrow,
            capRate: updateDto.capRate,
            goi: updateDto.goi,
            noi: updateDto.noi,
            ber: updateDto.ber,
            oer: updateDto.oer,
            dscr: updateDto.dscr,
            grm: updateDto.grm,
            agm: updateDto.agm,
            coc: updateDto.coc,
            cashFlow: updateDto.cashFlow,
            fTermRoi: updateDto.fTermRoi,
            yearlyIncome: updateDto.yearlyIncome,
            roi: updateDto.roi,
            payBackPeriod: updateDto.payBackPeriod,
            onePercent: updateDto.onePercent,
            twoPercent: updateDto.twoPercent,
            fiftyPercent: updateDto.fiftyPercent,
            cashFlowAtLeast: updateDto.cashFlowAtLeast,
            cashNeeded: updateDto.cashNeeded,
        });

        if (updateDto?.metrics && updateDto.metrics.length > 0) {
            const metrics = await this.metricsService.retrieveMetrics(updateDto.metrics);
            await this.sMetricService.syncProfileMetrics(result, metrics);
        }

        return { message: 'Profile setting updated successfully' };
    }
}
