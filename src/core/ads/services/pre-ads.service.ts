import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { AdsService } from './ads.service';
import {
    AdsFormatEnum,
    AdsStatusEnum,
    AdsTypeEnum,
    FileUsageEnum,
    SocketEventEnum,
} from '../../../common/enum';
import { FileLinksEntity } from '../../files/entities/file-links.entity';
import { AdsEntity } from '../entities/ads.entity';
import { CreateAdsDto, UpdateAdsDto } from '../dto';
import { SelectQueryBuilder } from 'typeorm';

type AdsUpdatePayload = Partial<{
    label: string;
    companyName: string;
    status: AdsStatusEnum;
    type: AdsTypeEnum;
    format: AdsFormatEnum;
    amount: number;
    startDate: Date;
    endDate: Date;
    file: FileLinksEntity;
}>;

@Injectable()
export class PreAdsService {
    /**
     * Service responsible for handling pre ads operation
     */

    constructor(
        @Inject(forwardRef(() => AdsService))
        private readonly adsService: AdsService,
    ) {}

    /**
     * Builds a query for advertisements, applying optional filters for status and a search term,
     * while excluding deleted ads. Joins related file links and file entities for comprehensive results.
     */
    buildAdsQuery(filters: { status?: AdsStatusEnum; searchTerm?: string }) {
        const { status, searchTerm } = filters;

        const query = this.adsService.adsRepository
            .getRepository()
            .createQueryBuilder('ads')
            .andWhere('ads.deleted = false')
            .leftJoinAndSelect('ads.file', 'fileLinks')
            .leftJoinAndSelect('fileLinks.file', 'file');

        if (status) query.andWhere('ads.status = :status', { status });

        if (searchTerm) {
            const likePattern = `%${searchTerm.split('').join('%')}%`;
            query.andWhere(
                `(ads.label ILIKE :searchTerm
                  OR ads.companyName ILIKE :searchTerm
                  OR LOWER(CAST(ads.amount AS TEXT)) ILIKE :searchTerm)`,
                { searchTerm: likePattern },
            );
        }

        return query;
    }

    /**
     * Retrieves a paginated list of advertisements based on optional status and search term filters,
     * ordered by the most recently updated ads first. Uses offset and limit for pagination.
     */
    retrieveAdsQuery(
        offset: number,
        limit: number,
        filters: {
            status?: AdsStatusEnum;
            searchTerm?: string;
        },
    ) {
        const queryBuilder = this.buildAdsQuery(filters);

        queryBuilder.orderBy('ads.updatedAt', 'DESC').skip(offset).take(limit);

        return queryBuilder;
    }

    /**
     * Builds a query to retrieve all non-deleted ads that are active during the specified month.
     * Filters ads whose date range overlaps with the first and last day of the month.
     * Orders results by start date in ascending order.
     */
    buildAdsQueryForMonth(date: Date): SelectQueryBuilder<AdsEntity> {
        const fullDate = new Date(date);
        const [year, month] = [fullDate.getFullYear(), fullDate.getMonth()];

        const [firstDayOfMonth, lastDayOfMonth] = [
            new Date(year, month, 1),
            new Date(year, month + 1, 0),
        ];

        return this.adsService.adsRepository
            .getRepository()
            .createQueryBuilder('ads')
            .where('ads.deleted = false')
            .andWhere('(ads.startDate <= :lastDay AND ads.endDate >= :firstDay)', {
                firstDay: firstDayOfMonth,
                lastDay: lastDayOfMonth,
            })
            .orderBy('ads.startDate', 'ASC');
    }

    /**
     * Retrieves all ads that are active during a specific month and year.
     * An ad is considered active in a month if its date range overlaps with that month.
     */
    async findAdsByMonth(date: Date): Promise<AdsEntity[]> {
        return await this.buildAdsQueryForMonth(date)
            .select(['ads.id', 'ads.startDate', 'ads.endDate', 'ads.type'])
            .getMany();
    }

    /**
     * Retrieves all scheduled and active ads for the current month.
     * Uses the current date to filter ads within the month's date range.
     */
    async findAdsForCurrentMonth(): Promise<AdsEntity[]> {
        const date = new Date();

        return await this.buildAdsQueryForMonth(date)
            .andWhere('ads.status = :status', {
                status: AdsStatusEnum.SCHEDULED,
            })
            .getMany();
    }

    /**
     * Retrieves all active and running ads for the current day.
     * Filters ads by today's date, active status, and running state.
     * Logs the retrieval action and returns results ordered by start date.
     */
    async findRunningAdsForToday(): Promise<AdsEntity[]> {
        const today = new Date();

        this.adsService.logger.info(
            `Retrieving running ads for ${today.toISOString().split('T')[0]}`,
        );

        return await this.adsService.adsRepository
            .getRepository()
            .createQueryBuilder('ads')
            .where('ads.deleted = false')
            .andWhere('ads.isActive = :isActive', { isActive: true })
            .andWhere('ads.status = :status', { status: AdsStatusEnum.RUNNING })
            .leftJoinAndSelect('ads.file', 'fileLinks')
            .leftJoinAndSelect('fileLinks.file', 'file')
            .andWhere('(ads.startDate <= :today AND ads.endDate >= :today)', {
                today,
            })
            .orderBy('ads.startDate', 'ASC')
            .getMany();
    }

    /**
     * Retrieves an advertisement by specific criteria after formatting and validation.
     * Logs the search attempt and throws a "not found" error if no matching ad exists.
     * Includes related file associations in the result.
     */
    async retrieveAddByCriteria(criteria: Record<string, any>): Promise<AdsEntity> {
        const entry = this.adsService.otherUtils.formatCriteria(criteria);
        this.adsService.logger.info(`Find ads by criteria: ${entry}`);

        const isAddExist = await this.adsService.adsRepository.findActiveOne(
            this.adsService.adsRepository,
            criteria,
            ['file', 'file.file'],
        );

        if (!isAddExist)
            this.adsService.errorHandler.notFound(
                `Add not found with criteria: ${entry}`,
                `Add not found`,
            );

        return isAddExist;
    }

    /**
     * Ensures that there is no date overlap with any existing ads.
     * If any ad exists during the specified period, throws a validation error.
     * When updating an ad, it should be allowed to keep its own dates by passing its ID.
     */
    async ensureNoDateOverlap(
        startDate: Date,
        endDate: Date,
        type: AdsTypeEnum,
        excludeAdsId?: string,
    ): Promise<void> {
        const query = this.adsService.adsRepository
            .getRepository()
            .createQueryBuilder('ads')
            .where('ads.deleted = false')
            .andWhere('(ads.startDate <= :endDate AND ads.endDate >= :startDate)', {
                startDate,
                endDate,
            });

        if (excludeAdsId) query.andWhere('ads.id != :excludeAdsId', { excludeAdsId });

        if (type === AdsTypeEnum.EXCLUSIVE) {
            const overlappingAds = await query.getMany();

            if (overlappingAds.length > 0) {
                const conflictingAd = overlappingAds[0];
                this.adsService.errorHandler.badRequest(
                    `Cannot create/update exclusive ad: An ad "${conflictingAd.label}" (${conflictingAd.type}) is already scheduled from ${conflictingAd.startDate} to ${conflictingAd.endDate}`,
                    'Date conflict with existing ad',
                );
            }
        } else {
            query.andWhere('ads.type = :exclusiveType', {
                exclusiveType: AdsTypeEnum.EXCLUSIVE,
            });

            const overlappingExclusiveAds = await query.getMany();

            if (overlappingExclusiveAds.length > 0) {
                const conflictingAd = overlappingExclusiveAds[0];
                this.adsService.errorHandler.badRequest(
                    `Cannot create/update ad: An exclusive ad "${conflictingAd.label}" is already scheduled from ${conflictingAd.startDate} to ${conflictingAd.endDate}`,
                    'Date conflict with exclusive ad',
                );
            }
        }
    }

    /**
     * Constructs and returns a new AdsEntity instance using the provided required fields:
     * label, companyName, status, type, format, associated file, amount, and date range.
     */
    buildAddEntity(required: {
        label: string;
        companyName: string;
        status: AdsStatusEnum;
        type: AdsTypeEnum;
        format: AdsFormatEnum;
        file: FileLinksEntity;
        amount: number;
        startDate: Date;
        endDate: Date;
    }) {
        const ads = new AdsEntity();
        Object.assign(ads, required);
        return ads;
    }

    /**
     * Updates the details of an existing AdsEntity based on the provided partial updates.
     * Validates and trims string fields, processes other fields, and applies entities updates.
     * Returns the result of the repository update operation.
     */
    async updateAdsDetails(
        ads: AdsEntity,
        adsUpdates?: Partial<{
            label: string;
            companyName: string;
            status: AdsStatusEnum;
            type: AdsTypeEnum;
            format: AdsFormatEnum;
            file: FileLinksEntity;
            amount: number;
            isActive: boolean;
            startDate: Date;
            endDate: Date;
        }>,
    ) {
        if (!adsUpdates || Object.keys(adsUpdates).length === 0)
            return { message: 'No updates provided for ads' };

        const stringFields = ['label', 'companyName'] as const;

        const updatePayload: Partial<AdsEntity> = {};

        stringFields.forEach((field) => {
            if (adsUpdates[field]?.trim()) updatePayload[field] = adsUpdates[field].trim();
        });

        const otherFields = [
            'status',
            'type',
            'format',
            'amount',
            'startDate',
            'endDate',
            'isActive',
        ] as const;

        otherFields.forEach((field) => {
            if (adsUpdates[field] !== undefined) updatePayload[field] = adsUpdates[field] as any;
        });

        const entityFields = ['file'] as const;

        entityFields.forEach((field) => {
            if (adsUpdates[field] !== undefined) updatePayload[field] = adsUpdates[field] as any;
        });

        return await this.adsService.adsRepository.update({ id: ads.id }, updatePayload);
    }

    /**
     * Ensures the uniqueness of an ad's label and company name combination.
     * Throws a validation error if a duplicate active ad is found.
     */
    async ensureUniqueAdsLabel(label: string, companyName: string) {
        const errors: Record<string, string> = {};
        await this.adsService.adsRepository.assertUniqueActive(
            this.adsService.adsRepository,
            errors,
            { label, companyName },
            'Ads',
        );

        if (Object.keys(errors).length > 0) throw this.adsService.errorHandler.validation(errors);
    }

    /**
     * Ensures the uniqueness of an ad's label and company name combination during an update,
     * excluding the current ad entities from the uniqueness check.
     * Throws a validation error if a duplicate active ad is found.
     */
    async ensureUniqueAdsLabelForUpdate(label: string, companyName: string, ads: AdsEntity) {
        const errors: Record<string, string> = {};
        await this.adsService.adsRepository.assertUniqueActive(
            this.adsService.adsRepository,
            errors,
            { label, companyName },
            'Ads',
            ads.id,
        );

        if (Object.keys(errors).length > 0) throw this.adsService.errorHandler.validation(errors);
    }

    /**
     * Determines the appropriate status for an ad based on its start date.
     * If the start date is today or in the past, the ad is RUNNING.
     * If the start date is in the future, the ad is SCHEDULED.
     */
    determineAdsStatus(startDate: Date): AdsStatusEnum {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        return start <= today ? AdsStatusEnum.RUNNING : AdsStatusEnum.SCHEDULED;
    }

    /**
     * Prepares and validates advertisement data for creation, including date validation,
     * overlap checks, and file linkage. Returns a structured object ready for entities creation.
     */
    async prepareAdsData(createDto: CreateAdsDto) {
        const { label, companyName, endDate, startDate, format, amount, type, fileId } = createDto;

        this.adsService.otherUtils.validateAdsDates(startDate, endDate);
        await this.ensureNoDateOverlap(startDate, endDate, type);

        const fileLinks = await this.adsService.fileLinkService.linkFileToEntity(
            fileId,
            FileUsageEnum.ADS,
        );

        return {
            label: label.trim(),
            companyName: companyName.trim(),
            status: this.determineAdsStatus(startDate),
            endDate,
            startDate,
            format,
            amount,
            type,
            file: fileLinks,
        };
    }

    /**
     * Persists a new advertisement entities using the provided ads' data.
     * Constructs the entities and saves it via the repository's create method.
     */
    async persistAds(adsData: any) {
        return await this.adsService.adsRepository.create(
            this.buildAddEntity({
                label: adsData.label,
                companyName: adsData.companyName,
                status: adsData.status,
                startDate: adsData.startDate,
                endDate: adsData.endDate,
                format: adsData.format,
                type: adsData.type,
                file: adsData.file,
                amount: adsData.amount,
            }),
        );
    }

    /**
     * Validates that both startDate and endDate are either provided together or both omitted.
     * Throws a bad request error if only one of the dates is provided.
     */
    validateDatePair(startDate?: Date, endDate?: Date): void {
        const hasStartDate = startDate !== undefined;
        const hasEndDate = endDate !== undefined;

        if (hasStartDate !== hasEndDate) {
            const message = 'Start date and end date must be provided together';
            this.adsService.errorHandler.badRequest(message, message);
        }
    }

    /**
     * Prepares and validates advertisement update data, ensuring uniqueness of label and company name,
     * validating date pairs, and handling file linkage. Returns a structured payload for updating an ad.
     */
    async prepareAdsUpdates(updateDto: UpdateAdsDto, ads: AdsEntity): Promise<AdsUpdatePayload> {
        const { label, companyName, fileId, startDate, endDate, format, amount, type } = updateDto;

        const adsUpdates: AdsUpdatePayload = {};

        if (label && companyName) {
            await this.ensureUniqueAdsLabelForUpdate(label, companyName, ads);
            adsUpdates.label = label;
            adsUpdates.companyName = companyName;
        }

        this.validateDatePair(startDate, endDate);
        if (type !== undefined) adsUpdates.type = type ?? ads.type;
        if (format !== undefined) adsUpdates.format = format;
        if (amount !== undefined) adsUpdates.amount = amount;

        if (startDate && endDate) {
            this.adsService.otherUtils.validateAdsDates(startDate, endDate);
            await this.ensureNoDateOverlap(startDate, endDate, adsUpdates.type!, ads.id);
            adsUpdates.status = this.determineAdsStatus(startDate);
            adsUpdates.startDate = startDate;
            adsUpdates.endDate = endDate;
        }

        if (fileId)
            adsUpdates.file = await this.adsService.fileLinkService.linkFileToEntity(
                fileId,
                FileUsageEnum.ADS,
            );

        return adsUpdates;
    }

    /**
     * Notifies relevant clients about a change in ads (e.g., creation, update, deletion)
     * by sending the transformed ads data via socket to the 'ads' route.
     * Uses the provided event type to specify the nature of the change.
     */
    notifyAdsChange(ads: AdsEntity, event: SocketEventEnum): void {
        const data = this.adsService.transformAd(ads);
        this.adsService.socketService.sendDataToRoute('/ads', event, {
            payload: [data],
        });

        if (ads.status === AdsStatusEnum.RUNNING && ads.isActive)
            this.adsService.socketService.sendDataToRoute('/ads-running', event, {
                payload: [data],
            });
    }

    /**
     * Notifies relevant clients about updated ads statistics
     * by sending the stats data via socket to the 'ads' route.
     * Uses the ADS_BADGE_COUNT event to indicate a statistics update.
     */
    notifyAdsStatsUpdated(stats: any): void {
        this.adsService.socketService.sendDataToRoute(
            '/ads/badge-count',
            SocketEventEnum.ADS_BADGE_COUNT,
            { payload: this.adsService.transformAdsCount(stats) },
        );
    }

    /**
     * Asynchronously schedules the invalidation of cache entries related to ads
     * by deleting all cache keys with the base 'ads'.
     */
    async scheduleInvalidateAdsCache() {
        await this.adsService.cacheService.deleteKeysByBase('ads');
    }

    /**
     * Asynchronously handles post-creation actions for an ads.
     * Updates ads statistics based on the ads status,
     * notifies relevant clients about the new ads creation,
     * and broadcasts updated statistics.
     */
    async handlePostAdsCreation(ads: AdsEntity, status: AdsStatusEnum): Promise<void> {
        const stats = await this.adsService.adsStatsService.onCreate(status);

        this.notifyAdsChange(ads, SocketEventEnum.NEW_ADS_CREATED);
        this.notifyAdsStatsUpdated(stats);
    }

    /**
     * Asynchronously handles post-update actions for an ads, especially when its status changes.
     * Updates ads statistics based on the old and new status,
     * notifies relevant clients about the ads update,
     * and broadcasts updated statistics.
     */
    async handlePostAdsUpdate(
        ads: AdsEntity,
        oldStatus: AdsStatusEnum,
        status?: AdsStatusEnum,
    ): Promise<void> {
        const stats = await this.adsService.adsStatsService.onStatusChange(oldStatus, status);
        this.notifyAdsChange(ads, SocketEventEnum.ADS_UPDATED);
        this.notifyAdsStatsUpdated(stats);
    }
}
