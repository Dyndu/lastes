import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { CCodesService } from './c-codes.service';
import { PreCCodesService } from './pre-c-codes.service';
import { CRedemptionService } from './c-redemption.service';
import { CCodesRepository, CouponRedemptionRepository } from '../repositories';
import { OtherUtils } from '../../../utils/services/tools';
import { ErrorHandlerService } from '../../../common/response';
import { CacheService } from '../../../helpers/cache/cache.service';
import { SocketService } from '../../../helpers/socket/socket.service';
import { AdsService } from '../../ads/services';
import { StripeService } from '../../../libs/stripe/stripe.service';
import { CCodeCreateDto } from '../dto/c-code-create.dto';
import { CCodeUpdateDto } from '../dto/c-code-update.dto';
import { CCodeEntity } from '../entities';
import { CouponTypeEnum, SocketEventEnum, SubscriptionPeriodEnum } from '../../../common/enum';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const makeCCodeEntity = (overrides: Partial<CCodeEntity> = {}): CCodeEntity =>
    ({
        id: 'code-id-1',
        label: 'Summer Sale',
        code: 'SUMMER20',
        discountValue: 20,
        subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
        couponType: CouponTypeEnum.PRICE_DISCOUNT,
        freeTrialDays: 0,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        ...overrides,
    }) as CCodeEntity;

const makeCreateDto = (overrides: Partial<CCodeCreateDto> = {}): CCodeCreateDto => ({
    code: 'SUMMER20',
    label: 'Summer Sale',
    couponType: CouponTypeEnum.PRICE_DISCOUNT,
    discountValue: 20,
    freeTrialDays: 0,
    subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    ...overrides,
});

const makeUpdateDto = (overrides: Partial<CCodeUpdateDto> = {}): CCodeUpdateDto => ({
    label: 'Updated Label',
    code: 'UPDATED',
    ...overrides,
});

const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };

const mockPreCCService = {
    retrieveCCodesQuery: jest.fn(),
    retrieveCCodesByCriteria: jest.fn(),
    notifyCCodeChange: jest.fn(),
    scheduleInvalidateCodesCache: jest.fn(),
    validateAndNormalizeCouponValues: jest.fn(),
    uniqueFieldsForCodeCreation: jest.fn(),
    uniqueFieldsForCodeUpdate: jest.fn(),
    buildNewLetterEntity: jest.fn(),
    updateCodeCoupon: jest.fn(),
};

const mockCRedemptionService = {};

const mockCCodeRepo = {
    create: jest.fn(),
    delete: jest.fn(),
};

const mockCouponRedemptionRepository = {};

const mockOtherUtils = {
    validateAdsDates: jest.fn(),
};

const mockErrorHandler = {};

const mockCacheService = {
    generateRedisKey: jest.fn(),
    retrieveGenericPaginated: jest.fn(),
};

const mockSocketService = {};

const mockAdsService = {
    preAdsService: { validateDatePair: jest.fn() },
    otherUtils: { validateAdsDates: jest.fn() },
};

const mockStripeService = {
    createCoupon: jest.fn(),
    deleteCoupon: jest.fn(),
};

describe('CCodesService', () => {
    let service: CCodesService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CCodesService,
                { provide: WINSTON_MODULE_PROVIDER, useValue: mockLogger },
                { provide: PreCCodesService, useValue: mockPreCCService },
                { provide: CRedemptionService, useValue: mockCRedemptionService },
                { provide: CCodesRepository, useValue: mockCCodeRepo },
                { provide: CouponRedemptionRepository, useValue: mockCouponRedemptionRepository },
                { provide: OtherUtils, useValue: mockOtherUtils },
                { provide: ErrorHandlerService, useValue: mockErrorHandler },
                { provide: CacheService, useValue: mockCacheService },
                { provide: SocketService, useValue: mockSocketService },
                { provide: AdsService, useValue: mockAdsService },
                { provide: StripeService, useValue: mockStripeService },
            ],
        }).compile();

        service = module.get<CCodesService>(CCodesService);
    });

    describe('transformCCode', () => {
        it('should return a simplified coupon code object', () => {
            const entity = makeCCodeEntity();
            const result = service.transformCCode(entity);

            expect(result).toEqual({
                id: entity.id,
                label: entity.label,
                code: entity.code,
                discount: entity.discountValue,
                plan: entity.subscriptionPeriod,
                couponType: entity.couponType,
                discountValue: entity.discountValue,
                freeTrialDays: entity.freeTrialDays,
                startDate: entity.startDate,
                endDate: entity.endDate,
            });
        });
    });

    describe('transformCCodes', () => {
        it('should map an array of entities to simplified objects', () => {
            const entities = [
                makeCCodeEntity(),
                makeCCodeEntity({ id: 'code-id-2', code: 'XMAS10' }),
            ];
            const results = service.transformCCodes(entities);

            expect(results).toHaveLength(2);
            expect(results[0].id).toBe('code-id-1');
            expect(results[1].id).toBe('code-id-2');
        });

        it('should return an empty array when given an empty array', () => {
            expect(service.transformCCodes([])).toEqual([]);
        });
    });

    describe('allCouponCodes', () => {
        it('should generate a cache key without searchTerm and return paginated results', async () => {
            const paginatedResult = { items: [], total: 0 };
            mockCacheService.generateRedisKey.mockReturnValue('code-coupon:');
            mockCacheService.retrieveGenericPaginated.mockResolvedValue(paginatedResult);

            const result = await service.allCouponCodes(1, 10, {});

            expect(mockCacheService.generateRedisKey).toHaveBeenCalledWith('code-coupon', {});
            expect(mockCacheService.retrieveGenericPaginated).toHaveBeenCalled();
            expect(result).toBe(paginatedResult);
        });

        it('should include search in cache key when searchTerm is provided', async () => {
            mockCacheService.generateRedisKey.mockReturnValue('code-coupon:search=summer');
            mockCacheService.retrieveGenericPaginated.mockResolvedValue({ items: [], total: 0 });

            await service.allCouponCodes(1, 10, { searchTerm: 'Summer' });

            expect(mockCacheService.generateRedisKey).toHaveBeenCalledWith('code-coupon', {
                search: 'summer',
            });
        });

        it('should pass a query executor that calls retrieveCCodesQuery', async () => {
            mockCacheService.generateRedisKey.mockReturnValue('key');
            mockCacheService.retrieveGenericPaginated.mockImplementation(
                async (_key, _page, _limit, _filter, queryFn) => {
                    await queryFn(0, 10);
                    return { items: [], total: 0 };
                },
            );
            mockPreCCService.retrieveCCodesQuery.mockResolvedValue({ items: [], total: 0 });

            await service.allCouponCodes(1, 10, { searchTerm: 'test' });

            expect(mockPreCCService.retrieveCCodesQuery).toHaveBeenCalledWith(0, 10, {
                searchTerm: 'test',
            });
        });

        it('should pass a transform function that calls transformCCodes', async () => {
            const entities = [makeCCodeEntity()];
            mockCacheService.generateRedisKey.mockReturnValue('key');
            mockCacheService.retrieveGenericPaginated.mockImplementation(
                async (_key, _page, _limit, _filter, _queryFn, transformFn) => {
                    return transformFn(entities);
                },
            );

            const result = await service.allCouponCodes(1, 10, {});

            expect(result).toHaveLength(1);
            expect((result as any[])[0].id).toBe('code-id-1');
        });
    });

    describe('cCodeDetails', () => {
        it('should retrieve and return transformed coupon code details', async () => {
            const entity = makeCCodeEntity();
            mockPreCCService.retrieveCCodesByCriteria.mockResolvedValue(entity);

            const result = await service.cCodeDetails('code-id-1');

            expect(mockPreCCService.retrieveCCodesByCriteria).toHaveBeenCalledWith({
                id: 'code-id-1',
            });
            expect(result.id).toBe('code-id-1');
        });
    });

    describe('handlePostInsertion', () => {
        it('should call notifyCCodeChange and schedule cache invalidation', async () => {
            mockPreCCService.scheduleInvalidateCodesCache.mockResolvedValue(undefined);

            const entity = makeCCodeEntity();
            await service.handlePostInsertion(entity, SocketEventEnum.CODE_COUPON_CREATED);

            expect(mockPreCCService.notifyCCodeChange).toHaveBeenCalledWith(
                entity,
                SocketEventEnum.CODE_COUPON_CREATED,
            );

            await new Promise<void>((resolve) => setImmediate(resolve));

            expect(mockPreCCService.scheduleInvalidateCodesCache).toHaveBeenCalled();
        });
    });

    describe('resolveNormalizedValues', () => {
        it('should delegate to preCCService.validateAndNormalizeCouponValues', () => {
            const dto = makeCreateDto();
            const normalized = { discountValue: 20, freeTrialDays: 0 };
            mockPreCCService.validateAndNormalizeCouponValues.mockReturnValue(normalized);

            const result = service.resolveNormalizedValues(dto);

            expect(mockPreCCService.validateAndNormalizeCouponValues).toHaveBeenCalledWith(
                dto.couponType,
                { discountValue: dto.discountValue, freeTrialDays: dto.freeTrialDays },
            );
            expect(result).toBe(normalized);
        });
    });

    describe('validateCreationConstraints', () => {
        it('should validate dates and unique fields', async () => {
            const dto = makeCreateDto();
            mockOtherUtils.validateAdsDates.mockReturnValue(undefined);
            mockPreCCService.uniqueFieldsForCodeCreation.mockResolvedValue(undefined);

            await service.validateCreationConstraints(dto);

            expect(mockOtherUtils.validateAdsDates).toHaveBeenCalledWith(
                dto.startDate,
                dto.endDate,
            );
            expect(mockPreCCService.uniqueFieldsForCodeCreation).toHaveBeenCalledWith(
                dto.code,
                dto.label,
            );
        });
    });

    describe('persistCCode', () => {
        it('should build entity and create it via repository', async () => {
            const dto = makeCreateDto();
            const normalizedValues = { discountValue: 20, freeTrialDays: 0 };
            const builtEntity = makeCCodeEntity();

            mockPreCCService.buildNewLetterEntity.mockReturnValue(builtEntity);
            mockCCodeRepo.create.mockResolvedValue(builtEntity);

            const result = await service.persistCCode(dto, normalizedValues);

            expect(mockPreCCService.buildNewLetterEntity).toHaveBeenCalledWith(
                {
                    code: dto.code,
                    couponType: dto.couponType,
                    endDate: dto.endDate,
                    startDate: dto.startDate,
                    subscriptionPeriod: dto.subscriptionPeriod,
                },
                {
                    label: dto.label,
                    discountValue: normalizedValues.discountValue,
                    freeTrialDays: normalizedValues.freeTrialDays,
                },
            );
            expect(mockCCodeRepo.create).toHaveBeenCalledWith(builtEntity);
            expect(result).toBe(builtEntity);
        });
    });

    describe('syncWithStripeIfNeeded', () => {
        it('should create a Stripe coupon when couponType is PRICE_DISCOUNT', async () => {
            const dto = makeCreateDto({
                couponType: CouponTypeEnum.PRICE_DISCOUNT,
                discountValue: 20,
            });
            mockStripeService.createCoupon.mockResolvedValue(undefined);

            await service.syncWithStripeIfNeeded(dto, 'coupon-id');

            expect(mockStripeService.createCoupon).toHaveBeenCalledWith({
                id: 'coupon-id',
                name: dto.code,
                percentOff: dto.discountValue,
                redeemBy: Math.floor(new Date(dto.endDate).getTime() / 1000),
            });
        });

        it('should skip Stripe sync for non-PRICE_DISCOUNT coupon types', async () => {
            const dto = makeCreateDto({ couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL });

            await service.syncWithStripeIfNeeded(dto, 'coupon-id');

            expect(mockStripeService.createCoupon).not.toHaveBeenCalled();
        });
    });

    describe('createCCode', () => {
        it('should create a coupon code and return a success message', async () => {
            const dto = makeCreateDto();
            const entity = makeCCodeEntity();
            const normalized = { discountValue: 20, freeTrialDays: 0 };

            mockPreCCService.validateAndNormalizeCouponValues.mockReturnValue(normalized);
            mockOtherUtils.validateAdsDates.mockReturnValue(undefined);
            mockPreCCService.uniqueFieldsForCodeCreation.mockResolvedValue(undefined);
            mockPreCCService.buildNewLetterEntity.mockReturnValue(entity);
            mockCCodeRepo.create.mockResolvedValue(entity);
            mockStripeService.createCoupon.mockResolvedValue(undefined);
            mockPreCCService.notifyCCodeChange.mockReturnValue(undefined);
            mockPreCCService.scheduleInvalidateCodesCache.mockResolvedValue(undefined);

            const result = await service.createCCode(dto);

            expect(result).toEqual({ message: 'Code coupon created successfully.' });
            expect(mockCCodeRepo.create).toHaveBeenCalled();
            expect(mockStripeService.createCoupon).toHaveBeenCalled();
        });

        it('should skip Stripe for ADDITIONAL_FREE_TRIAL coupon type', async () => {
            const dto = makeCreateDto({
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                discountValue: undefined,
            });
            const entity = makeCCodeEntity({ couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL });
            const normalized = { discountValue: 0, freeTrialDays: 7 };

            mockPreCCService.validateAndNormalizeCouponValues.mockReturnValue(normalized);
            mockOtherUtils.validateAdsDates.mockReturnValue(undefined);
            mockPreCCService.uniqueFieldsForCodeCreation.mockResolvedValue(undefined);
            mockPreCCService.buildNewLetterEntity.mockReturnValue(entity);
            mockCCodeRepo.create.mockResolvedValue(entity);
            mockPreCCService.notifyCCodeChange.mockReturnValue(undefined);
            mockPreCCService.scheduleInvalidateCodesCache.mockResolvedValue(undefined);

            const result = await service.createCCode(dto);

            expect(result).toEqual({ message: 'Code coupon created successfully.' });
            expect(mockStripeService.createCoupon).not.toHaveBeenCalled();
        });
    });

    describe('prepareCCodeUpdates', () => {
        it('should update label and code when provided', async () => {
            const existingCode = makeCCodeEntity();
            const dto = makeUpdateDto({ label: 'New Label', code: 'NEWCODE' });
            mockPreCCService.uniqueFieldsForCodeUpdate.mockResolvedValue(undefined);
            mockAdsService.preAdsService.validateDatePair.mockReturnValue(undefined);

            const updates = await service.prepareCCodeUpdates(dto, existingCode);

            expect(mockPreCCService.uniqueFieldsForCodeUpdate).toHaveBeenCalledWith(
                'NEWCODE',
                'New Label',
                existingCode.id,
            );
            expect(updates.label).toBe('New Label');
            expect(updates.code).toBe('NEWCODE');
        });

        it('should not call uniqueFieldsForCodeUpdate when label and code are absent', async () => {
            const existingCode = makeCCodeEntity();
            const dto = makeUpdateDto({ label: undefined, code: undefined });
            mockAdsService.preAdsService.validateDatePair.mockReturnValue(undefined);

            const updates = await service.prepareCCodeUpdates(dto, existingCode);

            expect(mockPreCCService.uniqueFieldsForCodeUpdate).not.toHaveBeenCalled();
            expect(updates.label).toBeUndefined();
            expect(updates.code).toBeUndefined();
        });

        it('should validate and normalize coupon values when couponType is provided', async () => {
            const existingCode = makeCCodeEntity();
            const dto = makeUpdateDto({
                label: undefined,
                code: undefined,
                couponType: CouponTypeEnum.PRICE_DISCOUNT,
                discountValue: 15,
            });
            mockAdsService.preAdsService.validateDatePair.mockReturnValue(undefined);
            mockPreCCService.validateAndNormalizeCouponValues.mockReturnValue({
                discountValue: 15,
                freeTrialDays: 0,
            });

            const updates = await service.prepareCCodeUpdates(dto, existingCode);

            expect(mockPreCCService.validateAndNormalizeCouponValues).toHaveBeenCalledWith(
                CouponTypeEnum.PRICE_DISCOUNT,
                { freeTrialDays: undefined, discountValue: 15 },
            );
            expect(updates.couponType).toBe(CouponTypeEnum.PRICE_DISCOUNT);
            expect(updates.discountValue).toBe(15);
        });

        it('should set date updates when both startDate and endDate are provided', async () => {
            const existingCode = makeCCodeEntity();
            const startDate = new Date('2025-01-01');
            const endDate = new Date('2025-12-31');
            const dto = makeUpdateDto({ label: undefined, code: undefined, startDate, endDate });
            mockAdsService.preAdsService.validateDatePair.mockReturnValue(undefined);
            mockAdsService.otherUtils.validateAdsDates.mockReturnValue(undefined);

            const updates = await service.prepareCCodeUpdates(dto, existingCode);

            expect(mockAdsService.otherUtils.validateAdsDates).toHaveBeenCalledWith(
                startDate,
                endDate,
            );
            expect(updates.startDate).toBe(startDate);
            expect(updates.endDate).toBe(endDate);
        });

        it('should not set date updates when only startDate is provided', async () => {
            const existingCode = makeCCodeEntity();
            const dto = makeUpdateDto({
                label: undefined,
                code: undefined,
                startDate: new Date('2025-01-01'),
                endDate: undefined,
            });
            mockAdsService.preAdsService.validateDatePair.mockReturnValue(undefined);

            const updates = await service.prepareCCodeUpdates(dto, existingCode);

            expect(updates.startDate).toBeUndefined();
            expect(updates.endDate).toBeUndefined();
        });

        it('should include subscriptionPeriod in updates when defined', async () => {
            const existingCode = makeCCodeEntity();
            const dto = makeUpdateDto({
                label: undefined,
                code: undefined,
                subscriptionPeriod: SubscriptionPeriodEnum.YEARLY,
            });
            mockAdsService.preAdsService.validateDatePair.mockReturnValue(undefined);

            const updates = await service.prepareCCodeUpdates(dto, existingCode);

            expect(updates.subscriptionPeriod).toBe(SubscriptionPeriodEnum.YEARLY);
        });

        it('should include freeTrialDays in updates when defined', async () => {
            const existingCode = makeCCodeEntity();
            const dto = makeUpdateDto({ label: undefined, code: undefined, freeTrialDays: 14 });
            mockAdsService.preAdsService.validateDatePair.mockReturnValue(undefined);

            const updates = await service.prepareCCodeUpdates(dto, existingCode);

            expect(updates.freeTrialDays).toBe(14);
        });
    });

    describe('updateCCode', () => {
        it('should update a coupon code and return a success message', async () => {
            const existingCode = makeCCodeEntity();
            const updatedCode = makeCCodeEntity({ label: 'Updated Label' });
            const dto = makeUpdateDto();

            mockPreCCService.retrieveCCodesByCriteria
                .mockResolvedValueOnce(existingCode)
                .mockResolvedValueOnce(updatedCode);
            mockPreCCService.uniqueFieldsForCodeUpdate.mockResolvedValue(undefined);
            mockAdsService.preAdsService.validateDatePair.mockReturnValue(undefined);
            mockPreCCService.updateCodeCoupon.mockResolvedValue(undefined);
            mockPreCCService.notifyCCodeChange.mockReturnValue(undefined);
            mockPreCCService.scheduleInvalidateCodesCache.mockResolvedValue(undefined);

            const result = await service.updateCCode('code-id-1', dto);

            expect(mockPreCCService.retrieveCCodesByCriteria).toHaveBeenCalledTimes(2);
            expect(mockPreCCService.updateCodeCoupon).toHaveBeenCalledWith(
                existingCode,
                expect.any(Object),
            );
            expect(result).toEqual({ message: 'Code coupon updated successfully.' });
        });
    });

    describe('deleteCCode', () => {
        it('should delete a PRICE_DISCOUNT coupon and remove it from Stripe', async () => {
            const entity = makeCCodeEntity({ couponType: CouponTypeEnum.PRICE_DISCOUNT });
            mockPreCCService.retrieveCCodesByCriteria.mockResolvedValue(entity);
            mockCCodeRepo.delete.mockResolvedValue(undefined);
            mockStripeService.deleteCoupon.mockResolvedValue(undefined);
            mockPreCCService.notifyCCodeChange.mockReturnValue(undefined);
            mockPreCCService.scheduleInvalidateCodesCache.mockResolvedValue(undefined);

            const result = await service.deleteCCode('code-id-1');

            expect(mockCCodeRepo.delete).toHaveBeenCalledWith({ id: 'code-id-1' });
            expect(mockStripeService.deleteCoupon).toHaveBeenCalledWith('code-id-1');
            expect(result).toEqual({ message: 'Code coupon deleted successfully.' });
        });

        it('should delete a ADDITIONAL_FREE_TRIAL coupon without calling Stripe', async () => {
            const entity = makeCCodeEntity({ couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL });
            mockPreCCService.retrieveCCodesByCriteria.mockResolvedValue(entity);
            mockCCodeRepo.delete.mockResolvedValue(undefined);
            mockPreCCService.notifyCCodeChange.mockReturnValue(undefined);
            mockPreCCService.scheduleInvalidateCodesCache.mockResolvedValue(undefined);

            const result = await service.deleteCCode('code-id-1');

            expect(mockStripeService.deleteCoupon).not.toHaveBeenCalled();
            expect(result).toEqual({ message: 'Code coupon deleted successfully.' });
        });
    });
});
