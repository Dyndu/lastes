import { Test, TestingModule } from '@nestjs/testing';
import { PreCCodesService } from './pre-c-codes.service';
import { CCodesService } from './c-codes.service';
import { CCodeEntity } from '../entities';
import { CouponTypeEnum, SocketEventEnum, SubscriptionPeriodEnum } from '../../../common/enum';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('PreCCodesService', () => {
    let service: PreCCodesService;
    let cCodesService: jest.Mocked<CCodesService>;

    const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
    };

    const mockRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const mockCCodeRepo = {
        getRepository: jest.fn().mockReturnValue(mockRepository),
        findActiveOne: jest.fn(),
        assertUniqueActive: jest.fn(),
        update: jest.fn(),
    };

    const mockOtherUtils = {
        formatCriteria: jest.fn(),
    };

    const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    };

    const mockErrorHandler = {
        notFound: jest.fn(),
        validation: jest.fn(),
    };

    const mockCacheService = {
        deleteKeysByBase: jest.fn(),
    };

    const mockSocketService = {
        sendDataToRoute: jest.fn(),
    };

    const mockCCodesService = {
        cCodeRepo: mockCCodeRepo,
        otherUtils: mockOtherUtils,
        logger: mockLogger,
        errorHandler: mockErrorHandler,
        cacheService: mockCacheService,
        socketService: mockSocketService,
        transformCCode: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PreCCodesService,
                {
                    provide: CCodesService,
                    useValue: mockCCodesService,
                },
            ],
        }).compile();

        service = module.get<PreCCodesService>(PreCCodesService);
        cCodesService = module.get(CCodesService) as jest.Mocked<CCodesService>;

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('buildCCodeQuery', () => {
        it('should build query without search term', () => {
            const filters = {};

            const result = service.buildCCodeQuery(filters);

            expect(mockCCodeRepo.getRepository).toHaveBeenCalled();
            expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('code');
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('code.deleted = false');
            expect(result).toBe(mockQueryBuilder);
        });

        it('should build query with non-numeric search term', () => {
            const filters = { searchTerm: 'test' };

            service.buildCCodeQuery(filters);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(2);
            expect(mockQueryBuilder.andWhere).toHaveBeenNthCalledWith(
                2,
                expect.stringContaining('code.label ILIKE :searchTerm'),
                expect.objectContaining({
                    searchTerm: '%test%',
                }),
            );
        });

        it('should build query with numeric search term', () => {
            const filters = { searchTerm: '100' };

            service.buildCCodeQuery(filters);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(2);
            expect(mockQueryBuilder.andWhere).toHaveBeenNthCalledWith(
                2,
                expect.stringContaining('code.discountValue = :numericSearch'),
                expect.objectContaining({
                    searchTerm: '%100%',
                    numericSearch: 100,
                }),
            );
        });

        it('should handle search term with mixed case', () => {
            const filters = { searchTerm: 'TeSt' };

            service.buildCCodeQuery(filters);

            expect(mockQueryBuilder.andWhere).toHaveBeenNthCalledWith(
                2,
                expect.any(String),
                expect.objectContaining({
                    searchTerm: '%test%',
                }),
            );
        });
    });

    describe('retrieveCCodesQuery', () => {
        it('should build paginated query with offset and limit', () => {
            const offset = 10;
            const limit = 20;
            const filters = { searchTerm: 'test' };

            const result = service.retrieveCCodesQuery(offset, limit, filters);

            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('code.updatedAt', 'DESC');
            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(offset);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(limit);
            expect(result).toBe(mockQueryBuilder);
        });

        it('should build paginated query without search term', () => {
            const offset = 0;
            const limit = 10;
            const filters = {};

            service.retrieveCCodesQuery(offset, limit, filters);

            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('code.updatedAt', 'DESC');
            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(offset);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(limit);
        });
    });

    describe('retrieveCCodesByCriteria', () => {
        it('should retrieve coupon code successfully', async () => {
            const criteria = { code: 'TEST123' };
            const formattedEntry = 'code: TEST123';
            const mockCCode = new CCodeEntity();

            mockOtherUtils.formatCriteria.mockReturnValue(formattedEntry);
            mockCCodeRepo.findActiveOne.mockResolvedValue(mockCCode);

            const result = await service.retrieveCCodesByCriteria(criteria);

            expect(mockOtherUtils.formatCriteria).toHaveBeenCalledWith(criteria);
            expect(mockLogger.info).toHaveBeenCalledWith(
                `Finding a coupon code by ${formattedEntry}`,
            );
            expect(mockCCodeRepo.findActiveOne).toHaveBeenCalledWith(mockCCodeRepo, criteria);
            expect(result).toBe(mockCCode);
        });

        it('should throw not found error when code does not exist', async () => {
            const criteria = { code: 'NOTFOUND' };
            const formattedEntry = 'code: NOTFOUND';

            mockOtherUtils.formatCriteria.mockReturnValue(formattedEntry);
            mockCCodeRepo.findActiveOne.mockResolvedValue(null);

            await service.retrieveCCodesByCriteria(criteria);

            expect(mockErrorHandler.notFound).toHaveBeenCalledWith(
                `Code coupon not found with entry ${formattedEntry}`,
                `Code coupon not found`,
            );
        });
    });

    describe('buildNewLetterEntity', () => {
        it('should build entities with required fields only', () => {
            const required = {
                couponType: CouponTypeEnum.PRICE_DISCOUNT,
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
                code: 'TEST123',
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-12-31'),
            };
            const optional = {};

            const result = service.buildNewLetterEntity(required, optional);

            expect(result).toBeInstanceOf(CCodeEntity);
            expect(result.couponType).toBe(required.couponType);
            expect(result.subscriptionPeriod).toBe(required.subscriptionPeriod);
            expect(result.code).toBe(required.code);
            expect(result.startDate).toBe(required.startDate);
            expect(result.endDate).toBe(required.endDate);
        });

        it('should build entities with all fields including optional', () => {
            const required = {
                couponType: CouponTypeEnum.PRICE_DISCOUNT,
                subscriptionPeriod: SubscriptionPeriodEnum.YEARLY,
                code: 'PREMIUM2024',
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-12-31'),
            };
            const optional = {
                label: 'Premium Discount',
                discountValue: 50,
                freeTrialDays: 30,
            };

            const result = service.buildNewLetterEntity(required, optional);

            expect(result).toBeInstanceOf(CCodeEntity);
            expect(result.label).toBe(optional.label);
            expect(result.discountValue).toBe(optional.discountValue);
            expect(result.freeTrialDays).toBe(optional.freeTrialDays);
        });
    });

    describe('updateCodeCoupon', () => {
        let mockCCode: CCodeEntity;

        beforeEach(() => {
            mockCCode = new CCodeEntity();
            mockCCode.id = 'test-id';
        });

        it('should return message when no updates provided', async () => {
            const result = await service.updateCodeCoupon(mockCCode);

            expect(result).toEqual({
                message: 'No code coupon updates provided for ads',
            });
            expect(mockCCodeRepo.update).not.toHaveBeenCalled();
        });

        it('should return message when empty updates object provided', async () => {
            const result = await service.updateCodeCoupon(mockCCode, {});

            expect(result).toEqual({
                message: 'No code coupon updates provided for ads',
            });
            expect(mockCCodeRepo.update).not.toHaveBeenCalled();
        });

        it('should update string fields by trimming them', async () => {
            const updates = {
                label: '  New Label  ',
                code: '  NEWCODE  ',
            };

            await service.updateCodeCoupon(mockCCode, updates);

            expect(mockCCodeRepo.update).toHaveBeenCalledWith(
                { id: mockCCode.id },
                {
                    label: 'New Label',
                    code: 'NEWCODE',
                },
            );
        });

        it('should skip empty string fields after trimming', async () => {
            const updates = {
                label: '   ',
                code: 'VALIDCODE',
            };

            await service.updateCodeCoupon(mockCCode, updates);

            expect(mockCCodeRepo.update).toHaveBeenCalledWith(
                { id: mockCCode.id },
                {
                    code: 'VALIDCODE',
                },
            );
        });

        it('should update all non-string fields', async () => {
            const updates = {
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.YEARLY,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-12-31'),
                discountValue: 100,
                freeTrialDays: 60,
            };

            await service.updateCodeCoupon(mockCCode, updates);

            expect(mockCCodeRepo.update).toHaveBeenCalledWith({ id: mockCCode.id }, updates);
        });

        it('should update mixed string and non-string fields', async () => {
            const updates = {
                label: '  Updated Label  ',
                discountValue: 75,
                startDate: new Date('2024-06-01'),
            };

            await service.updateCodeCoupon(mockCCode, updates);

            expect(mockCCodeRepo.update).toHaveBeenCalledWith(
                { id: mockCCode.id },
                {
                    label: 'Updated Label',
                    discountValue: 75,
                    startDate: updates.startDate,
                },
            );
        });

        it('should handle undefined values for non-string fields', async () => {
            const updates = {
                discountValue: undefined,
                freeTrialDays: 30,
            };

            await service.updateCodeCoupon(mockCCode, updates);

            expect(mockCCodeRepo.update).toHaveBeenCalledWith(
                { id: mockCCode.id },
                {
                    freeTrialDays: 30,
                },
            );
        });
    });

    describe('ensureLabelUniqueForCode', () => {
        it('should call assertUniqueActive without id', async () => {
            const errors = {};
            const label = 'Unique Label';

            await service.ensureLabelUniqueForCode(errors, label);

            expect(mockCCodeRepo.assertUniqueActive).toHaveBeenCalledWith(
                mockCCodeRepo,
                errors,
                { label },
                'Code coupon',
                undefined,
            );
        });

        it('should call assertUniqueActive with id', async () => {
            const errors = {};
            const label = 'Unique Label';
            const id = 'test-id';

            await service.ensureLabelUniqueForCode(errors, label, id);

            expect(mockCCodeRepo.assertUniqueActive).toHaveBeenCalledWith(
                mockCCodeRepo,
                errors,
                { label },
                'Code coupon',
                id,
            );
        });
    });

    describe('ensureCodeUniqueForCode', () => {
        it('should call assertUniqueActive without id', async () => {
            const errors = {};
            const code = 'UNIQUECODE';

            await service.ensureCodeUniqueForCode(errors, code);

            expect(mockCCodeRepo.assertUniqueActive).toHaveBeenCalledWith(
                mockCCodeRepo,
                errors,
                { code },
                'Code coupon',
                undefined,
            );
        });

        it('should call assertUniqueActive with id', async () => {
            const errors = {};
            const code = 'UNIQUECODE';
            const id = 'test-id';

            await service.ensureCodeUniqueForCode(errors, code, id);

            expect(mockCCodeRepo.assertUniqueActive).toHaveBeenCalledWith(
                mockCCodeRepo,
                errors,
                { code },
                'Code coupon',
                id,
            );
        });
    });

    describe('uniqueFieldsForCodeCreation', () => {
        it('should validate code uniqueness without label', async () => {
            const code = 'NEWCODE';

            await service.uniqueFieldsForCodeCreation(code);

            expect(mockCCodeRepo.assertUniqueActive).toHaveBeenCalledTimes(1);
            expect(mockCCodeRepo.assertUniqueActive).toHaveBeenCalledWith(
                mockCCodeRepo,
                {},
                { code },
                'Code coupon',
                undefined,
            );
        });

        it('should validate both code and label uniqueness', async () => {
            const code = 'NEWCODE';
            const label = 'New Label';

            await service.uniqueFieldsForCodeCreation(code, label);

            expect(mockCCodeRepo.assertUniqueActive).toHaveBeenCalledTimes(2);
            expect(mockCCodeRepo.assertUniqueActive).toHaveBeenNthCalledWith(
                1,
                mockCCodeRepo,
                {},
                { code },
                'Code coupon',
                undefined,
            );
            expect(mockCCodeRepo.assertUniqueActive).toHaveBeenNthCalledWith(
                2,
                mockCCodeRepo,
                {},
                { label },
                'Code coupon',
                undefined,
            );
        });

        it('should throw validation error when errors exist', async () => {
            const code = 'DUPLICATE';
            const validationError = new Error('Validation failed');

            mockCCodeRepo.assertUniqueActive.mockImplementation((_repo, errors) => {
                errors.code = 'Code already exists';
            });
            mockErrorHandler.validation.mockReturnValue(validationError);

            try {
                await service.uniqueFieldsForCodeCreation(code);
            } catch (error) {
                expect(error).toBe(validationError);
            }

            expect(mockErrorHandler.validation).toHaveBeenCalledWith({
                code: 'Code already exists',
            });
        });

        it('should throw validation error when multiple errors exist', async () => {
            const code = 'DUPLICATE';
            const label = 'Duplicate Label';
            const validationError = new Error('Validation failed');

            mockCCodeRepo.assertUniqueActive.mockImplementation((_repo, errors, criteria) => {
                if (criteria.code) errors.code = 'Code already exists';
                if (criteria.label) errors.label = 'Label already exists';
            });
            mockErrorHandler.validation.mockReturnValue(validationError);

            try {
                await service.uniqueFieldsForCodeCreation(code, label);
            } catch (error) {
                expect(error).toBe(validationError);
            }

            expect(mockErrorHandler.validation).toHaveBeenCalledWith({
                code: 'Code already exists',
                label: 'Label already exists',
            });
        });
    });

    describe('uniqueFieldsForCodeUpdate', () => {
        it('should not validate when no fields provided', async () => {
            await service.uniqueFieldsForCodeUpdate();

            expect(mockCCodeRepo.assertUniqueActive).not.toHaveBeenCalled();
        });

        it('should throw validation error when errors exist', async () => {
            const code = 'DUPLICATE';
            const validationError = new Error('Validation failed');

            mockCCodeRepo.assertUniqueActive.mockImplementation((_repo, errors) => {
                errors.code = 'Code already exists';
            });
            mockErrorHandler.validation.mockReturnValue(validationError);

            try {
                await service.uniqueFieldsForCodeUpdate(code, undefined, 'test-id');
            } catch (error) {
                expect(error).toBe(validationError);
            }

            expect(mockErrorHandler.validation).toHaveBeenCalledWith({
                code: 'Code already exists',
            });
        });
    });

    describe('scheduleInvalidateCodesCache', () => {
        it('should delete cache keys with code-coupon base', async () => {
            await service.scheduleInvalidateCodesCache();

            expect(mockCacheService.deleteKeysByBase).toHaveBeenCalledWith('code-coupon');
        });
    });

    describe('notifyCCodeChange', () => {
        it('should send socket notification with transformed code', () => {
            const mockCCode = new CCodeEntity();
            mockCCode.code = 'TEST123';
            const transformedCode = { id: '1', code: 'TEST123' };

            mockCCodesService.transformCCode.mockReturnValue(transformedCode);

            service.notifyCCodeChange(mockCCode, SocketEventEnum.CODE_COUPON_CREATED);

            expect(mockCCodesService.transformCCode).toHaveBeenCalledWith(mockCCode);
            expect(mockSocketService.sendDataToRoute).toHaveBeenCalledWith(
                '/c-codes',
                SocketEventEnum.CODE_COUPON_CREATED,
                {
                    payload: [transformedCode],
                },
            );
        });

        it('should send socket notification for update event', () => {
            const mockCCode = new CCodeEntity();
            const transformedCode = { id: '1', code: 'UPDATED' };

            mockCCodesService.transformCCode.mockReturnValue(transformedCode);

            service.notifyCCodeChange(mockCCode, SocketEventEnum.CODE_COUPON_UPDATED);

            expect(mockSocketService.sendDataToRoute).toHaveBeenCalledWith(
                '/c-codes',
                SocketEventEnum.CODE_COUPON_UPDATED,
                {
                    payload: [transformedCode],
                },
            );
        });

        it('should send socket notification for delete event', () => {
            const mockCCode = new CCodeEntity();
            const transformedCode = { id: '1', code: 'DELETED' };

            mockCCodesService.transformCCode.mockReturnValue(transformedCode);

            service.notifyCCodeChange(mockCCode, SocketEventEnum.CODE_COUPON_DELETED);

            expect(mockSocketService.sendDataToRoute).toHaveBeenCalledWith(
                '/c-codes',
                SocketEventEnum.CODE_COUPON_DELETED,
                {
                    payload: [transformedCode],
                },
            );
        });
    });

    describe('validateAndNormalizeCouponValues', () => {
        describe('PRICE_DISCOUNT coupon type', () => {
            it('should validate and normalize with valid discountValue', () => {
                const payload = { discountValue: 50 };

                const result = service.validateAndNormalizeCouponValues(
                    CouponTypeEnum.PRICE_DISCOUNT,
                    payload,
                );

                expect(result).toEqual({
                    discountValue: 50,
                    freeTrialDays: null,
                });
            });

            it('should throw error when discountValue is undefined', () => {
                const payload = {};

                service.validateAndNormalizeCouponValues(CouponTypeEnum.PRICE_DISCOUNT, payload);

                expect(mockErrorHandler.validation).toHaveBeenCalledWith({
                    discountValue: 'discountValue is required for price discount coupon',
                });
            });

            it('should throw error when discountValue is zero', () => {
                const payload = { discountValue: 0 };

                service.validateAndNormalizeCouponValues(CouponTypeEnum.PRICE_DISCOUNT, payload);

                expect(mockErrorHandler.validation).toHaveBeenCalledWith({
                    discountValue: 'discountValue is required for price discount coupon',
                });
            });

            it('should throw error when discountValue is negative', () => {
                const payload = { discountValue: -10 };

                service.validateAndNormalizeCouponValues(CouponTypeEnum.PRICE_DISCOUNT, payload);

                expect(mockErrorHandler.validation).toHaveBeenCalledWith({
                    discountValue: 'discountValue is required for price discount coupon',
                });
            });

            it('should set freeTrialDays to null even if provided', () => {
                const payload = { discountValue: 100, freeTrialDays: 30 };

                const result = service.validateAndNormalizeCouponValues(
                    CouponTypeEnum.PRICE_DISCOUNT,
                    payload,
                );

                expect(result).toEqual({
                    discountValue: 100,
                    freeTrialDays: null,
                });
            });
        });

        describe('ADDITIONAL_FREE_TRIAL coupon type', () => {
            it('should validate and normalize with valid freeTrialDays', () => {
                const payload = { freeTrialDays: 30 };

                const result = service.validateAndNormalizeCouponValues(
                    CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                    payload,
                );

                expect(result).toEqual({
                    discountValue: null,
                    freeTrialDays: 30,
                });
            });

            it('should throw error when freeTrialDays is undefined', () => {
                const payload = {};

                service.validateAndNormalizeCouponValues(
                    CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                    payload,
                );

                expect(mockErrorHandler.validation).toHaveBeenCalledWith({
                    freeTrialDays: 'freeTrialDays is required for additional free trial coupon',
                });
            });

            it('should throw error when freeTrialDays is zero', () => {
                const payload = { freeTrialDays: 0 };

                service.validateAndNormalizeCouponValues(
                    CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                    payload,
                );

                expect(mockErrorHandler.validation).toHaveBeenCalledWith({
                    freeTrialDays: 'freeTrialDays is required for additional free trial coupon',
                });
            });

            it('should throw error when freeTrialDays is negative', () => {
                const payload = { freeTrialDays: -5 };

                service.validateAndNormalizeCouponValues(
                    CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                    payload,
                );

                expect(mockErrorHandler.validation).toHaveBeenCalledWith({
                    freeTrialDays: 'freeTrialDays is required for additional free trial coupon',
                });
            });

            it('should set discountValue to null even if provided', () => {
                const payload = { freeTrialDays: 60, discountValue: 50 };

                const result = service.validateAndNormalizeCouponValues(
                    CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                    payload,
                );

                expect(result).toEqual({
                    discountValue: null,
                    freeTrialDays: 60,
                });
            });
        });

        describe('Unsupported coupon type', () => {
            it('should throw error for unsupported coupon type', () => {
                const payload = { discountValue: 50 };
                const validationError = new Error('Unsupported coupon type');

                mockErrorHandler.validation.mockReturnValue(validationError);

                expect(() => {
                    service.validateAndNormalizeCouponValues(
                        'INVALID_TYPE' as CouponTypeEnum,
                        payload,
                    );
                }).toThrow(validationError);

                expect(mockErrorHandler.validation).toHaveBeenCalledWith({
                    couponType: 'Unsupported coupon type',
                });
            });
        });
    });
});
