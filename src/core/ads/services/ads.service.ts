import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { PreAdsService } from './pre-ads.service';
import { AdsStatsService } from './ads-stats.service';
import { CacheService } from '../../../helpers/cache/cache.service';
import { SocketService } from '../../../helpers/socket/socket.service';
import { AdsRepository } from '../repositories/ads.repository';
import { ErrorHandlerService } from '../../../common/response';
import { FileLinksService } from '../../files/services/file-links.service';
import { OtherUtils } from '../../../utils/services/tools';
import { AdsEntity } from '../entities/ads.entity';
import { UsersEntityTransformService } from '../../users/services';
import { AdsStatsEntity } from '../entities/ads-stats.entity';
import { AdsStatusEnum, AdsTypeEnum } from '../../../common/enum';
import { CreateAdsDto, ReuseAdsDto, UpdateAdsDto } from '../dto';

@Injectable()
export class AdsService {
    /**
     * Service responsible for handling ads main operations
     */

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        @Inject(forwardRef(() => PreAdsService))
        readonly preAdsService: PreAdsService,
        @Inject(forwardRef(() => AdsStatsService))
        readonly adsStatsService: AdsStatsService,
        readonly adsRepository: AdsRepository,
        readonly cacheService: CacheService,
        readonly socketService: SocketService,
        readonly errorHandler: ErrorHandlerService,
        readonly fileLinkService: FileLinksService,
        readonly otherUtils: OtherUtils,
        readonly transformService: UsersEntityTransformService,
    ) {}

    /**
     * Transforms a AdsEntity object into a simplified object containing its ID, label, company name, status,
     * and the transformed file associated with the guide.
     */
    transformAd = (ads: AdsEntity) => ({
        id: ads.id,
        label: ads.label,
        company: ads.companyName,
        isActive: ads.isActive,
        type: ads.type,
        format: ads.format,
        status: ads.status,
        startDate: ads.startDate,
        endDate: ads.endDate,
        amount: ads.amount,
        file: this.transformService.transformFiles(ads.file.file),
    });

    /**
     * Transforms an array of AdsEntity objects into an array of simplified guide objects
     * using the transformGuide method for each entity.
     */
    transformAds = (ads: AdsEntity[]) => ads.map((ad) => this.transformAd(ad));

    /**
     * Transforms an advertisement statistics entities into a simplified object containing total, expired, scheduled, and running counts.
     */
    transformAdsCount = (c: AdsStatsEntity) => ({
        total: c.total,
        expired: c.expired,
        scheduled: c.scheduled,
        running: c.running,
    });

    async adsStats() {
        const stats = await this.adsStatsService.getSingleton();
        return this.transformAdsCount(stats);
    }

    /**
     * Retrieves a paginated list of advertisements, optionally filtered by status and search term.
     * Uses a cache layer to optimize performance and transforms the results before returning.
     * Logs the retrieval process for tracking.
     */
    async allAds(
        page: number,
        limit: number,
        filterItems: {
            status?: AdsStatusEnum;
            searchTerm?: string;
        },
    ) {
        this.logger.info(`Retrieve ads from cache or database.`);
        const baseKey = this.cacheService.generateRedisKey('ads', {
            ...(filterItems.status ? { status: filterItems.status } : {}),
            ...(filterItems.searchTerm ? { search: filterItems.searchTerm.toLowerCase() } : {}),
        });

        return await this.cacheService.retrieveGenericPaginated(
            baseKey,
            page,
            limit,
            {
                status: filterItems.status,
                searchTerm: filterItems.searchTerm,
            },
            (offset: number, limit: number) =>
                this.preAdsService.retrieveAdsQuery(offset, limit, {
                    status: filterItems.status,
                    searchTerm: filterItems.searchTerm,
                }),
            (items: AdsEntity[]) => this.transformAds(items),
        );
    }

    /**
     * Retrieves advertisements for a specific month and groups them by their type.
     * Returns an object where each key is an advertisement type and the value is an array of advertisements of that type.
     */
    async retrieveAdsGroupedByType(date: Date) {
        const ads = await this.preAdsService.findAdsByMonth(date);

        return ads.reduce(
            (acc, ad) => {
                if (!acc[ad.type]) acc[ad.type] = [];
                acc[ad.type].push(ad);
                return acc;
            },
            {} as Record<AdsTypeEnum, AdsEntity[]>,
        );
    }

    /**
     * Retrieves and transforms all ads that are currently running for the current day.
     */
    async getRunningAdsForToday() {
        this.logger.info(`Retrieve running ads of the day`);
        const ads = await this.preAdsService.findRunningAdsForToday();
        return this.transformAds(ads);
    }

    /**
     * Retrieves and transforms all scheduled ads for the current month.
     * Logs the action and returns the formatted ads data.
     */
    async getCurrentMonthAds() {
        this.logger.info(`Retrieve current scheduled ads for the current month`);

        const ads = await this.preAdsService.findAdsForCurrentMonth();
        return this.transformAds(ads);
    }

    /**
     * Retrieves and transforms the details of a specific advertisement by its ID.
     * Logs the retrieval process for tracking.
     */
    async adsDetails(id: string) {
        this.logger.info(`Ads details for ${id}`);
        const ads = await this.preAdsService.retrieveAddByCriteria({ id });

        return this.transformAd(ads);
    }

    /**
     * Creates a new advertisement using the provided data.
     * Ensures the advertisement label and company name are unique, prepares and persists the advertisement data,
     * and handles post-creation actions such as cache invalidation.
     * Logs the creation process and returns a success message.
     */
    async createAds(createDto: CreateAdsDto) {
        this.logger.info(`Create a new Ads ${JSON.stringify(createDto)}`);

        await this.preAdsService.ensureUniqueAdsLabel(createDto.label, createDto.companyName);
        const adsData = await this.preAdsService.prepareAdsData(createDto);
        const newAds = await this.preAdsService.persistAds(adsData);

        await this.preAdsService.handlePostAdsCreation(newAds, newAds.status);

        setImmediate(async () => {
            await this.preAdsService.scheduleInvalidateAdsCache();
        });

        return { message: 'Ads created successfully' };
    }

    /**
     * Updates an existing advertisement with the provided data.
     * Retrieves the advertisement, prepares and applies updates, and handles post-update actions such as file cleanup and cache invalidation.
     * Logs the update process and returns a success message.
     */
    async updateAds(id: string, updateDto: UpdateAdsDto) {
        this.logger.info(`Update ads with id: ${id} with data ${JSON.stringify(updateDto)}`);

        const ads = await this.preAdsService.retrieveAddByCriteria({ id });
        const adsUpdates = await this.preAdsService.prepareAdsUpdates(updateDto, ads);

        await this.preAdsService.updateAdsDetails(ads, adsUpdates);

        const updated = await this.preAdsService.retrieveAddByCriteria({ id });

        await this.preAdsService.handlePostAdsUpdate(updated, ads.status, updated.status);

        setImmediate(async () => {
            if (updateDto.fileId) await this.fileLinkService.unlinkAndCleanup(ads.file.id);
            await this.preAdsService.scheduleInvalidateAdsCache();
        });

        return { message: 'Ads updated successfully' };
    }

    /**
     * Toggles the active status of an advertisement by its ID.
     * Retrieves the advertisement, updates its active status, and handles post-update actions such as cache invalidation.
     * Logs the toggle process for tracking.
     */
    async toggleAds(id: string) {
        this.logger.info(`Toggle activeness of add with id: ${id}`);

        const ads = await this.preAdsService.retrieveAddByCriteria({ id });

        await this.preAdsService.updateAdsDetails(ads, {
            isActive: !ads.isActive,
        });

        const updatedAd = await this.preAdsService.retrieveAddByCriteria({
            id,
        });

        await this.preAdsService.handlePostAdsUpdate(updatedAd, ads.status, updatedAd.status);

        setImmediate(async () => {
            await this.preAdsService.scheduleInvalidateAdsCache();
        });

        return { message: 'Ads updated successfully' };
    }

    /**
     * Reuses an expired advertisement by scheduling it for a new date range.
     * Validates the new dates, ensures no overlap with existing ads, updates the ad details,
     * and handles post-update actions such as cache invalidation.
     * Logs the reuse process and returns a success message.
     */
    async reuseExpiredAd(id: string, dto: ReuseAdsDto) {
        this.logger.info(`Schedule an ads with id: ${id} to a new date`);

        const { startDate, endDate } = dto;

        const ads = await this.preAdsService.retrieveAddByCriteria({ id });

        if (ads.status !== AdsStatusEnum.EXPIRED)
            this.errorHandler.forbidden(
                `Ads with id: ${id} isn't expired, can't reuse`,
                `Ads has to be expired for reuse`,
            );

        this.otherUtils.validateAdsDates(startDate, endDate);
        await this.preAdsService.ensureNoDateOverlap(startDate, endDate, ads.type, ads.id);

        await this.preAdsService.updateAdsDetails(ads, {
            startDate,
            endDate,
            status: this.preAdsService.determineAdsStatus(startDate),
        });

        const updatedAd = await this.preAdsService.retrieveAddByCriteria({
            id,
        });

        await this.preAdsService.handlePostAdsUpdate(updatedAd, ads.status, updatedAd.status);

        setImmediate(async () => {
            await this.preAdsService.scheduleInvalidateAdsCache();
        });

        return { message: 'Ads reused successfully' };
    }
}
