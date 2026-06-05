import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { CCodesRepository, CouponRedemptionRepository } from '../repositories';
import { PreCCodesService } from './pre-c-codes.service';
import { CCodeEntity } from '../entities';
import { OtherUtils } from '../../../utils/services/tools';
import { ErrorHandlerService } from '../../../common/response';
import { CacheService } from '../../../helpers/cache/cache.service';
import { SocketService } from '../../../helpers/socket/socket.service';
import { CCodeCreateDto } from '../dto/c-code-create.dto';
import { AdsService } from '../../ads/services';
import { CCodeUpdateDto } from '../dto/c-code-update.dto';
import { CouponTypeEnum, SocketEventEnum, SubscriptionPeriodEnum } from '../../../common/enum';
import { StripeService } from '../../../libs/stripe/stripe.service';
import { CRedemptionService } from './c-redemption.service';

type CCodeUpdatePayload = Partial<{
    couponType: CouponTypeEnum;
    subscriptionPeriod: SubscriptionPeriodEnum;
    code: string;
    startDate: Date;
    endDate: Date;
    label: string;
    discountValue: number;
    freeTrialDays: number;
}>;

@Injectable()
export class CCodesService {
    /**
     * Service responsible for handling coupon codes operations
     */

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        @Inject(forwardRef(() => CRedemptionService))
        readonly cRedemptionService: CRedemptionService,
        @Inject(forwardRef(() => PreCCodesService))
        readonly preCCService: PreCCodesService,
        readonly cCodeRepo: CCodesRepository,
        readonly cRedemptionRepository: CouponRedemptionRepository,
        readonly otherUtils: OtherUtils,
        readonly errorHandler: ErrorHandlerService,
        readonly cacheService: CacheService,
        readonly adsService: AdsService,
        readonly stripeService: StripeService,
        readonly socketService: SocketService,
    ) {}

    transformCCode = (c: CCodeEntity & { revenue?: string }) => ({
        id: c.id,
        label: c.label,
        code: c.code,
        plan: c.subscriptionPeriod,
        couponType: c.couponType,
        discountValue: c.discountValue,
        freeTrialDays: c.freeTrialDays,
        startDate: c.startDate,
        endDate: c.endDate,
        revenue: Number(c['revenue'] ?? 0),
    });

    transformCCodes = (cs: (CCodeEntity & { revenue?: string })[]) =>
        cs.map((c) => this.transformCCode(c));

    /**
     * Retrieves a paginated list of coupon codes, either from cache or the database, based on an optional search term.
     * Generates a cache key using the search term, and fetches or caches the results using a paginated query.
     * Transforms the retrieved coupon code entities into simplified objects before returning.
     */
    async allCouponCodes(
        page: number,
        limit: number,
        filterItems: {
            searchTerm?: string;
        },
    ) {
        this.logger.info(`Getting all coupon coe from cache or database`);

        const baseKey = this.cacheService.generateRedisKey('code-coupon', {
            ...(filterItems.searchTerm ? { search: filterItems.searchTerm.toLowerCase() } : {}),
        });

        return await this.cacheService.retrieveGenericPaginated(
            baseKey,
            page,
            limit,
            {
                searchTerm: filterItems.searchTerm,
            },
            (offset: number, limit: number) =>
                this.preCCService.retrieveCCodesQuery(offset, limit, {
                    searchTerm: filterItems.searchTerm,
                }),
            (items: CCodeEntity[]) => this.transformCCodes(items),
        );
    }

    /**
     * Retrieves and returns the details of a coupon code by its ID.
     * Logs the retrieval attempt and transforms the coupon code entities into a simplified object.
     */
    async cCodeDetails(id: string) {
        this.logger.info(`Getting code coupon details with id: ${id}`);
        const isCodeExist = await this.preCCService.retrieveCCodesByCriteria({
            id,
        });
        return this.transformCCode(isCodeExist);
    }

    /**
     * Handles post-insertion actions for a coupon code:
     * - Notifies clients about the change via socket.
     * - Schedules cache invalidation for coupon codes asynchronously.
     */
    async handlePostInsertion(cCode: CCodeEntity, event: SocketEventEnum) {
        this.preCCService.notifyCCodeChange(cCode, event);

        setImmediate(async () => {
            await this.preCCService.scheduleInvalidateCodesCache();
        });
    }

    /**
     * Resolves normalized coupon values from the provided creation DTO.
     * Extracts coupon type, discount value, and free trial days from the DTO,
     * then delegates to the pre-CC service for validation and normalization
     * of coupon values based on the specified coupon type.
     */
    resolveNormalizedValues(createDto: CCodeCreateDto) {
        const { couponType, discountValue, freeTrialDays } = createDto;

        return this.preCCService.validateAndNormalizeCouponValues(couponType, {
            discountValue,
            freeTrialDays,
        });
    }

    /**
     * Validates creation constraints for a new coupon code.
     * Extracts code, label, start date, and end date from the DTO,
     * validates the date range (start date before end date),
     * and ensures uniqueness of both the code and label fields.
     */
    async validateCreationConstraints(createDto: CCodeCreateDto) {
        const { code, label, startDate, endDate } = createDto;

        this.otherUtils.validateAdsDates(startDate, endDate);
        await this.preCCService.uniqueFieldsForCodeCreation(code, label);
    }

    /**
     * Persists a new coupon code entity using the provided creation DTO and normalized values.
     * Extracts code, coupon type, dates, subscription period, and label from the DTO,
     * combines them with normalized discount value and free trial days,
     * builds the entity through the pre-CC service, and creates it via the repository.
     */
    async persistCCode(
        createDto: CCodeCreateDto,
        normalizedValues: { discountValue: number; freeTrialDays: number },
    ) {
        const { code, couponType, endDate, startDate, subscriptionPeriod, label } = createDto;
        const { discountValue, freeTrialDays } = normalizedValues;

        const entity = this.preCCService.buildNewLetterEntity(
            { code, couponType, endDate, startDate, subscriptionPeriod },
            { label, discountValue, freeTrialDays },
        );

        return this.cCodeRepo.create(entity);
    }

    /**
     * Synchronizes the coupon with Stripe if the coupon type is PRICE_DISCOUNT.
     * Skips synchronization for other coupon types.
     * For PRICE_DISCOUNT coupons, creates a Stripe coupon using the code as ID,
     * the discount value as percent off, and the end date converted to Unix timestamp as redeem by date.
     */
    async syncWithStripeIfNeeded(createDto: CCodeCreateDto) {
        if (createDto.couponType !== CouponTypeEnum.PRICE_DISCOUNT) return;

        await this.stripeService.createCoupon({
            id: createDto.code,
            name: createDto.code,
            percentOff: createDto.discountValue!,
            redeemBy: Math.floor(new Date(createDto.endDate).getTime() / 1000),
        });
    }

    /**
     * Creates a new coupon code with the provided data.
     * Logs the creation request, resolves and normalizes coupon values,
     * validates creation constraints (unique code/label and valid date range),
     * persists the coupon code entity, synchronizes with Stripe if needed,
     * triggers post-insertion operations including socket events, and returns a success message.
     */
    async createCCode(createDto: CCodeCreateDto) {
        this.logger.info(`Create a new coupon code with data ${JSON.stringify(createDto)}`);

        const normalizedValues = this.resolveNormalizedValues(createDto);
        await this.validateCreationConstraints(createDto);

        const cCode = await this.persistCCode(createDto, {
            discountValue: normalizedValues.discountValue!,
            freeTrialDays: normalizedValues.freeTrialDays!,
        });
        await this.syncWithStripeIfNeeded(createDto);
        await this.handlePostInsertion(cCode, SocketEventEnum.CODE_COUPON_CREATED);

        return { message: 'Code coupon created successfully.' };
    }

    /**
     * Prepares and validates updates for a coupon code entities based on the provided DTO:
     * - Ensures uniqueness of the code and label if they are being updated.
     * - Validates the date pair (startDate and endDate) if provided.
     * - Validates and normalizes coupon values (freeTrialDays, discountValue) based on the coupon type.
     * - Constructs and returns a payload of validated updates for the coupon code.
     */
    async prepareCCodeUpdates(
        updateDto: CCodeUpdateDto,
        cCode: CCodeEntity,
    ): Promise<CCodeUpdatePayload> {
        const {
            label,
            startDate,
            endDate,
            code,
            subscriptionPeriod,
            couponType,
            freeTrialDays,
            discountValue,
        } = updateDto;

        const codeUpdates: CCodeUpdatePayload = {};

        if (label || code) {
            await this.preCCService.uniqueFieldsForCodeUpdate(code, label, cCode.id);
            codeUpdates.label = label;
            codeUpdates.code = code;
        }

        this.adsService.preAdsService.validateDatePair(startDate, endDate);
        if (couponType)
            this.preCCService.validateAndNormalizeCouponValues(couponType, {
                freeTrialDays,
                discountValue,
            });

        if (subscriptionPeriod !== undefined) codeUpdates.subscriptionPeriod = subscriptionPeriod;
        if (couponType !== undefined) codeUpdates.couponType = couponType;
        if (freeTrialDays !== undefined) codeUpdates.freeTrialDays = freeTrialDays;
        if (discountValue !== undefined) codeUpdates.discountValue = discountValue;

        if (startDate && endDate) {
            this.adsService.otherUtils.validateAdsDates(startDate, endDate);
            codeUpdates.startDate = startDate;
            codeUpdates.endDate = endDate;
        }

        return codeUpdates;
    }

    /**
     * Updates a coupon code with the provided ID using the data from the DTO:
     * - Retrieves the existing coupon code.
     * - Prepares and validates the updates.
     * - Applies the updates to the coupon code.
     * - Notifies clients and invalidates the cache after the update.
     * Returns a success message upon completion.
     */
    async updateCCode(id: string, updateDto: CCodeUpdateDto) {
        this.logger.info(
            `Update a coupon code with id: ${id} and data ${JSON.stringify(updateDto)}`,
        );

        const isCodeExist = await this.preCCService.retrieveCCodesByCriteria({
            id,
        });
        const updates = await this.prepareCCodeUpdates(updateDto, isCodeExist);

        await this.preCCService.updateCodeCoupon(isCodeExist, updates);

        const updatedData = await this.preCCService.retrieveCCodesByCriteria({
            id,
        });
        await this.handlePostInsertion(updatedData, SocketEventEnum.CODE_COUPON_UPDATED);

        return { message: 'Code coupon updated successfully.' };
    }

    /**
     * Deletes a coupon code with the provided ID:
     * - Retrieves the existing coupon code.
     * - Deletes the coupon code from the repository.
     * - Notifies clients and invalidates the cache after deletion.
     * Returns a success message upon completion.
     */
    async deleteCCode(id: string) {
        this.logger.info(`Delete a coupon code with id: ${id}`);

        const isCodeExist = await this.preCCService.retrieveCCodesByCriteria({
            id,
        });

        await this.cCodeRepo.delete({ id });
        if (isCodeExist.couponType === CouponTypeEnum.PRICE_DISCOUNT)
            await this.stripeService.deleteCoupon(isCodeExist.code);
        await this.handlePostInsertion(isCodeExist, SocketEventEnum.CODE_COUPON_UPDATED);

        return { message: 'Code coupon deleted successfully.' };
    }
}
