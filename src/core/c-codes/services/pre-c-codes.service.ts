import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CCodesService } from './c-codes.service';
import { CCodeEntity } from '../entities';
import {
    CouponTypeEnum,
    InvoiceStatusEnum,
    SocketEventEnum,
    SubscriptionPeriodEnum,
} from '../../../common/enum';
import { SubscriptionInvoiceEntity } from '../../billings/entities';

@Injectable()
export class PreCCodesService {
    /**
     * Service responsible for handling coupon code pre operations
     */

    constructor(
        @Inject(forwardRef(() => CCodesService))
        readonly cCodeService: CCodesService,
    ) {}

    /**
     * Builds a query for coupon codes, filtering by a search term if provided.
     * Searches across label, code, subscriptions period, and coupon type fields.
     * Also supports numeric search for discount value and free trial days if the search term is numeric.
     * Excludes deleted coupon codes from the results.
     */
    buildCCodeQuery(filters: { searchTerm?: string }) {
        const { searchTerm } = filters;

        const query = this.cCodeService.cCodeRepo
            .getRepository()
            .createQueryBuilder('code')
            .andWhere('code.deleted = false')
            .loadRelationCountAndMap('code.usageCount', 'code.redemptions')
            .addSelect(
                (qb) =>
                    qb
                        .select('COALESCE(SUM(inv.amountPaid), 0)')
                        .from(SubscriptionInvoiceEntity, 'inv')
                        .where('inv.stripeCouponId = code.code')
                        .andWhere('inv.status = :paid', { paid: InvoiceStatusEnum.PAID }),
                'revenue',
            );

        if (searchTerm) {
            const likePattern = `%${searchTerm.toLowerCase()}%`;
            const isNumericSearch = !Number.isNaN(Number(searchTerm));

            query.andWhere(
                `
            (
                code.label ILIKE :searchTerm
                OR code.code ILIKE :searchTerm
                OR ("code"."subscriptionPeriod"::text) ILIKE :searchTerm
                OR ("code"."couponType"::text) ILIKE :searchTerm
                ${
                    isNumericSearch
                        ? `
                OR code.discountValue = :numericSearch
                OR code.freeTrialDays = :numericSearch
                `
                        : ''
                }
            )
            `,
                {
                    searchTerm: likePattern,
                    ...(isNumericSearch && {
                        numericSearch: Number(searchTerm),
                    }),
                },
            );
        }

        return query;
    }

    /**
     * Builds and returns a paginated query for retrieving coupon codes, applying an optional search term filter,
     * ordering results by update date (descending), and limiting the results by offset and limit.
     */
    retrieveCCodesQuery(
        offset: number,
        limit: number,
        filters: {
            searchTerm?: string;
        },
    ) {
        const queryBuilder = this.buildCCodeQuery(filters);

        queryBuilder.orderBy('code.updatedAt', 'DESC').skip(offset).take(limit);

        return queryBuilder;
    }

    /**
     * Retrieves a coupon code by specified criteria after formatting them.
     * Logs the search attempt and checks for an active coupon code matching the criteria.
     * Throws a "not found" error if no matching coupon code is found.
     */
    async retrieveCCodesByCriteria(criteria: Record<string, any>): Promise<CCodeEntity> {
        const entry = this.cCodeService.otherUtils.formatCriteria(criteria);
        this.cCodeService.logger.info(`Finding a coupon code by ${entry}`);

        const isCodeExist = await this.cCodeService.cCodeRepo.findActiveOne(
            this.cCodeService.cCodeRepo,
            criteria,
        );

        if (!isCodeExist)
            this.cCodeService.errorHandler.notFound(
                `Code coupon not found with entry ${entry}`,
                `Code coupon not found`,
            );

        return isCodeExist;
    }

    /**
     * Constructs and returns a new CCodeEntity by merging required fields (couponType, subscriptionPeriod, code, startDate, endDate)
     * with optional fields (label, discountValue, freeTrialDays) into a new entities instance.
     */
    buildNewLetterEntity(
        required: {
            couponType: CouponTypeEnum;
            subscriptionPeriod: SubscriptionPeriodEnum;
            code: string;
            startDate: Date;
            endDate: Date;
        },
        optional: {
            label?: string;
            discountValue?: number;
            freeTrialDays?: number;
        },
    ) {
        const cCode = new CCodeEntity();
        Object.assign(cCode, required, optional);
        return cCode;
    }

    /**
     * Updates a coupon code entities with provided partial updates, trimming string fields (label, code)
     * and applying non-string updates (couponType, subscriptionPeriod, startDate, endDate, discountValue, freeTrialDays) if provided.
     * Returns the result of the update operation. Skips if no updates are provided.
     */
    async updateCodeCoupon(
        cCode: CCodeEntity,
        cCUpdates?: Partial<{
            couponType?: CouponTypeEnum;
            subscriptionPeriod?: SubscriptionPeriodEnum;
            code?: string;
            startDate?: Date;
            endDate?: Date;
            label?: string;
            discountValue?: number;
            freeTrialDays?: number;
        }>,
    ) {
        if (!cCUpdates || Object.keys(cCUpdates).length === 0)
            return { message: 'No code coupon updates provided for ads' };

        const stringFields = ['label', 'code'] as const;

        const updatePayload: Partial<CCodeEntity> = {};

        stringFields.forEach((field) => {
            if (cCUpdates[field]?.trim()) updatePayload[field] = cCUpdates[field].trim();
        });

        const otherFields = [
            'couponType',
            'subscriptionPeriod',
            'startDate',
            'endDate',
            'discountValue',
            'freeTrialDays',
        ] as const;

        otherFields.forEach((field) => {
            if (cCUpdates[field] !== undefined) updatePayload[field] = cCUpdates[field] as any;
        });

        return await this.cCodeService.cCodeRepo.update({ id: cCode.id }, updatePayload);
    }

    /**
     * Ensures the uniqueness of a coupon code label by checking if another active coupon code (excluding the current one, if provided)
     * already uses the same label. Errors are recorded in the provided errors object.
     */
    async ensureLabelUniqueForCode(errors: Record<string, string>, label: string, id?: string) {
        await this.cCodeService.cCodeRepo.assertUniqueActive(
            this.cCodeService.cCodeRepo,
            errors,
            { label },
            'Code coupon',
            id,
        );
    }

    /**
     * Ensures the uniqueness of a coupon code by checking if another active coupon code (excluding the current one, if provided)
     * already uses the same code. Errors are recorded in the provided errors object.
     */
    async ensureCodeUniqueForCode(errors: Record<string, string>, code: string, id?: string) {
        await this.cCodeService.cCodeRepo.assertUniqueActive(
            this.cCodeService.cCodeRepo,
            errors,
            { code },
            'Code coupon',
            id,
        );
    }

    /**
     * Validates the uniqueness of a coupon code and optionally its label during creation.
     * Throws a validation error if either the code or label is not unique.
     */
    async uniqueFieldsForCodeCreation(code: string, label?: string) {
        const errors: Record<string, string> = {};

        await this.ensureCodeUniqueForCode(errors, code);
        if (label) await this.ensureLabelUniqueForCode(errors, label);

        if (Object.keys(errors).length > 0) throw this.cCodeService.errorHandler.validation(errors);
    }

    /**
     * Validates the uniqueness of a coupon code and/or label during an update.
     * Optionally checks the uniqueness of the code and label, excluding the current entities by ID.
     * Throws a validation error if either the code or label is not unique.
     */
    async uniqueFieldsForCodeUpdate(code?: string, label?: string, id?: string) {
        const errors: Record<string, string> = {};

        if (code) await this.ensureCodeUniqueForCode(errors, code, id);
        if (label) await this.ensureLabelUniqueForCode(errors, label, id);

        if (Object.keys(errors).length > 0) throw this.cCodeService.errorHandler.validation(errors);
    }

    /**
     * Schedules the invalidation of coupon code-related cache entries by deleting all keys with the 'code-coupon' base.
     */
    async scheduleInvalidateCodesCache() {
        await this.cCodeService.cacheService.deleteKeysByBase('code-coupon');
    }

    /**
     * Notifies clients about changes to a coupon code by sending the transformed coupon code data
     * via socket to the '/c-codes' route with the specified event type.
     */
    notifyCCodeChange(code: CCodeEntity, event: SocketEventEnum): void {
        this.cCodeService.socketService.sendDataToRoute('/c-codes', event, {
            payload: [this.cCodeService.transformCCode(code)],
        });
    }

    /**
     * Validates and normalizes coupon values based on the coupon type:
     * - For PRICE_DISCOUNT: Ensures discountValue is provided and positive, and sets freeTrialDays to null.
     * - For ADDITIONAL_FREE_TRIAL: Ensures freeTrialDays is provided and positive, and sets discountValue to null.
     * Throws a validation error for unsupported coupon types.
     */
    validateAndNormalizeCouponValues(
        couponType: CouponTypeEnum,
        payload: {
            discountValue?: number;
            freeTrialDays?: number;
        },
    ) {
        if (couponType === CouponTypeEnum.PRICE_DISCOUNT) {
            if (payload.discountValue === undefined || payload.discountValue <= 0)
                this.cCodeService.errorHandler.validation({
                    discountValue: 'discountValue is required for price discount coupon',
                });

            return {
                discountValue: payload.discountValue,
                freeTrialDays: null,
            };
        }

        if (couponType === CouponTypeEnum.ADDITIONAL_FREE_TRIAL) {
            if (payload.freeTrialDays === undefined || payload.freeTrialDays <= 0)
                this.cCodeService.errorHandler.validation({
                    freeTrialDays: 'freeTrialDays is required for additional free trial coupon',
                });

            return {
                discountValue: null,
                freeTrialDays: payload.freeTrialDays,
            };
        }

        throw this.cCodeService.errorHandler.validation({
            couponType: 'Unsupported coupon type',
        });
    }
}
