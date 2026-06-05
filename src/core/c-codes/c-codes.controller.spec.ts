import { Test, TestingModule } from '@nestjs/testing';
import { CCodesService } from './services/c-codes.service';
import { PaginationDto } from '../../common/dto';
import { CCodeCreateDto } from './dto/c-code-create.dto';
import { CCodeUpdateDto } from './dto/c-code-update.dto';
import { CouponTypeEnum, SubscriptionPeriodEnum } from '../../common/enum';
import { CCodesController } from './c-codes.controller';
import { Reflector } from '@nestjs/core';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';
import { PermissionsGuard, JwtAuthGuard } from '../../common/guard';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('CCodesController', () => {
    let controller: CCodesController;
    let service: CCodesService;

    const mockCCodesService = {
        allCouponCodes: jest.fn(),
        cCodeDetails: jest.fn(),
        createCCode: jest.fn(),
        updateCCode: jest.fn(),
        deleteCCode: jest.fn(),
    };

    const mockEnvConfigService = {
        sAdminRole: 'superadmin',
        adminRole: 'admin',
        userRole: 'user',
        supportRole: 'support',
    };

    const mockErrorHandlerService = {
        forbidden: jest.fn((_message, userMessage) => {
            throw new Error(userMessage);
        }),
    };

    const mockReflector = {
        get: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CCodesController],
            providers: [
                {
                    provide: CCodesService,
                    useValue: mockCCodesService,
                },
                {
                    provide: EnvConfigService,
                    useValue: mockEnvConfigService,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandlerService,
                },
                {
                    provide: Reflector,
                    useValue: mockReflector,
                },
                {
                    provide: JwtAuthGuard,
                    useValue: { canActivate: jest.fn(() => true) },
                },
                {
                    provide: PermissionsGuard,
                    useValue: { canActivate: jest.fn(() => true) },
                },
            ],
        }).compile();

        controller = module.get<CCodesController>(CCodesController);
        service = module.get<CCodesService>(CCodesService);

        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Controller Initialization', () => {
        it('should be defined', () => {
            expect(controller).toBeDefined();
        });

        it('should have cCodeService injected', () => {
            expect(controller['cCodeService']).toBeDefined();
            expect(controller['cCodeService']).toBe(service);
        });
    });

    describe('nonDeletedCCodes - GET /', () => {
        it('should return paginated coupon codes without search term', async () => {
            const pagination = new PaginationDto();
            pagination.page = 1;
            pagination.limit = 10;

            const mockResult = {
                data: [
                    {
                        id: '1',
                        label: 'Test Coupon',
                        discount: 50,
                        plan: SubscriptionPeriodEnum.MONTHLY,
                        discountValue: 50,
                        freeTrialDays: 30,
                        startDate: new Date('2026-01-01'),
                        endDate: new Date('2026-12-31'),
                    },
                ],
                total: 1,
                page: 1,
                limit: 10,
            };

            mockCCodesService.allCouponCodes.mockResolvedValue(mockResult);

            const result = await controller.nonDeletedCCodes(pagination);

            expect(service.allCouponCodes).toHaveBeenCalledWith(1, 10, {
                searchTerm: undefined,
            });
            expect(result).toEqual(mockResult);
        });

        it('should return paginated coupon codes with search term', async () => {
            const pagination = new PaginationDto();
            pagination.page = 2;
            pagination.limit = 20;

            const mockResult = {
                data: [
                    {
                        id: '2',
                        label: 'Search Result',
                        discount: 25,
                        plan: SubscriptionPeriodEnum.YEARLY,
                        discountValue: 25,
                        freeTrialDays: 15,
                        startDate: new Date('2026-01-01'),
                        endDate: new Date('2026-12-31'),
                    },
                ],
                total: 1,
                page: 2,
                limit: 20,
            };

            mockCCodesService.allCouponCodes.mockResolvedValue(mockResult);

            const result = await controller.nonDeletedCCodes(pagination, 'search-term');

            expect(service.allCouponCodes).toHaveBeenCalledWith(2, 20, {
                searchTerm: 'search-term',
            });
            expect(result).toEqual(mockResult);
        });

        it('should handle empty search string', async () => {
            const pagination = new PaginationDto();
            pagination.page = 1;
            pagination.limit = 10;

            const mockResult = {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
            };

            mockCCodesService.allCouponCodes.mockResolvedValue(mockResult);

            const result = await controller.nonDeletedCCodes(pagination, '');

            expect(service.allCouponCodes).toHaveBeenCalledWith(1, 10, {
                searchTerm: '',
            });
            expect(result).toEqual(mockResult);
        });

        it('should use pagination getPage and getLimit methods', async () => {
            const pagination = new PaginationDto();
            pagination.page = 5;
            pagination.limit = 50;

            const getPageSpy = jest.spyOn(pagination, 'getPage');
            const getLimitSpy = jest.spyOn(pagination, 'getLimit');

            mockCCodesService.allCouponCodes.mockResolvedValue({
                data: [],
                total: 0,
                page: 5,
                limit: 50,
            });

            await controller.nonDeletedCCodes(pagination, 'test');

            expect(getPageSpy).toHaveBeenCalled();
            expect(getLimitSpy).toHaveBeenCalled();
            expect(service.allCouponCodes).toHaveBeenCalledWith(5, 50, {
                searchTerm: 'test',
            });
        });

        it('should handle different pagination values', async () => {
            const pagination = new PaginationDto();
            pagination.page = 3;
            pagination.limit = 25;

            mockCCodesService.allCouponCodes.mockResolvedValue({
                data: [],
                total: 100,
                page: 3,
                limit: 25,
            });

            await controller.nonDeletedCCodes(pagination);

            expect(service.allCouponCodes).toHaveBeenCalledWith(3, 25, {
                searchTerm: undefined,
            });
        });
    });

    describe('findOne - GET /:id', () => {
        it('should return coupon code details by id', async () => {
            const mockId = '123e4567-e89b-12d3-a456-426614174000';
            const mockResult = {
                id: mockId,
                label: 'Test Coupon',
                discount: 50,
                plan: SubscriptionPeriodEnum.MONTHLY,
                discountValue: 50,
                freeTrialDays: 30,
                startDate: new Date('2026-01-01'),
                endDate: new Date('2026-12-31'),
            };

            mockCCodesService.cCodeDetails.mockResolvedValue(mockResult);

            const result = await controller.findOne(mockId);

            expect(service.cCodeDetails).toHaveBeenCalledWith(mockId);
            expect(result).toEqual(mockResult);
        });

        it('should handle different UUID formats', async () => {
            const mockId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
            const mockResult = {
                id: mockId,
                label: 'Another Coupon',
                discount: 75,
                plan: SubscriptionPeriodEnum.YEARLY,
                discountValue: 75,
                freeTrialDays: 60,
                startDate: new Date('2026-01-01'),
                endDate: new Date('2026-12-31'),
            };

            mockCCodesService.cCodeDetails.mockResolvedValue(mockResult);

            const result = await controller.findOne(mockId);

            expect(service.cCodeDetails).toHaveBeenCalledWith(mockId);
            expect(result).toEqual(mockResult);
        });

        it('should call service with exact id parameter', async () => {
            const mockId = '30ac88d4-7ffe-418c-9551-66eeec2e6783';

            mockCCodesService.cCodeDetails.mockResolvedValue({
                id: mockId,
                label: 'Test',
            });

            await controller.findOne(mockId);

            expect(service.cCodeDetails).toHaveBeenCalledTimes(1);
            expect(service.cCodeDetails).toHaveBeenCalledWith(mockId);
        });
    });

    describe('createCCoupon - POST /', () => {
        const createDto: CCodeCreateDto = {
            code: 'ABC12345',
            label: 'New Coupon',
            couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
            subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-12-31'),
            discountValue: 50,
            freeTrialDays: 30,
        };

        it('should create a new coupon code successfully', async () => {
            const mockResult = {
                message: 'Code coupon created successfully.',
            };

            mockCCodesService.createCCode.mockResolvedValue(mockResult);

            const result = await controller.createCCoupon(createDto);

            expect(service.createCCode).toHaveBeenCalledWith(createDto);
            expect(result).toEqual(mockResult);
        });

        it('should create coupon with minimal required fields', async () => {
            const minimalDto: CCodeCreateDto = {
                code: 'MIN12345',
                label: 'Minimal',
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.YEARLY,
                startDate: new Date('2026-01-01'),
                endDate: new Date('2026-12-31'),
            } as CCodeCreateDto;

            const mockResult = {
                message: 'Code coupon created successfully.',
            };

            mockCCodesService.createCCode.mockResolvedValue(mockResult);

            const result = await controller.createCCoupon(minimalDto);

            expect(service.createCCode).toHaveBeenCalledWith(minimalDto);
            expect(result).toEqual(mockResult);
        });

        it('should create coupon with all optional fields', async () => {
            const fullDto: CCodeCreateDto = {
                code: 'FULL1234',
                label: 'Full Coupon',
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
                startDate: new Date('2026-01-01'),
                endDate: new Date('2026-12-31'),
                discountValue: 100,
                freeTrialDays: 90,
            };

            const mockResult = {
                message: 'Code coupon created successfully.',
            };

            mockCCodesService.createCCode.mockResolvedValue(mockResult);

            const result = await controller.createCCoupon(fullDto);

            expect(service.createCCode).toHaveBeenCalledWith(fullDto);
            expect(result).toEqual(mockResult);
        });

        it('should pass DTO exactly as received to service', async () => {
            mockCCodesService.createCCode.mockResolvedValue({
                message: 'Code coupon created successfully.',
            });

            await controller.createCCoupon(createDto);

            expect(service.createCCode).toHaveBeenCalledTimes(1);
            const calledWith = mockCCodesService.createCCode.mock.calls[0][0];
            expect(calledWith).toBe(createDto);
        });
    });

    describe('updateCCode - PATCH /update/:id', () => {
        const mockId = '123e4567-e89b-12d3-a456-426614174000';

        it('should update a coupon code successfully with all fields', async () => {
            const updateDto: CCodeUpdateDto = {
                code: 'UPD12345',
                label: 'Updated Coupon',
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.YEARLY,
                startDate: new Date('2026-07-01'),
                endDate: new Date('2026-12-31'),
                discountValue: 75,
                freeTrialDays: 60,
            };

            const mockResult = {
                message: 'Code coupon updated successfully.',
            };

            mockCCodesService.updateCCode.mockResolvedValue(mockResult);

            const result = await controller.updateCCode(mockId, updateDto);

            expect(service.updateCCode).toHaveBeenCalledWith(mockId, updateDto);
            expect(result).toEqual(mockResult);
        });

        it('should update coupon with partial data (only label)', async () => {
            const updateDto: CCodeUpdateDto = {
                label: 'Only Label Update',
            };

            const mockResult = {
                message: 'Code coupon updated successfully.',
            };

            mockCCodesService.updateCCode.mockResolvedValue(mockResult);

            const result = await controller.updateCCode(mockId, updateDto);

            expect(service.updateCCode).toHaveBeenCalledWith(mockId, updateDto);
            expect(result).toEqual(mockResult);
        });

        it('should update coupon with partial data (only code)', async () => {
            const updateDto: CCodeUpdateDto = {
                code: 'CODE1234',
            };

            const mockResult = {
                message: 'Code coupon updated successfully.',
            };

            mockCCodesService.updateCCode.mockResolvedValue(mockResult);

            const result = await controller.updateCCode(mockId, updateDto);

            expect(service.updateCCode).toHaveBeenCalledWith(mockId, updateDto);
            expect(result).toEqual(mockResult);
        });

        it('should update coupon with partial data (dates only)', async () => {
            const updateDto: CCodeUpdateDto = {
                startDate: new Date('2026-08-01'),
                endDate: new Date('2026-11-30'),
            };

            const mockResult = {
                message: 'Code coupon updated successfully.',
            };

            mockCCodesService.updateCCode.mockResolvedValue(mockResult);

            const result = await controller.updateCCode(mockId, updateDto);

            expect(service.updateCCode).toHaveBeenCalledWith(mockId, updateDto);
            expect(result).toEqual(mockResult);
        });

        it('should update coupon with partial data (discount value only)', async () => {
            const updateDto: CCodeUpdateDto = {
                discountValue: 90,
            };

            const mockResult = {
                message: 'Code coupon updated successfully.',
            };

            mockCCodesService.updateCCode.mockResolvedValue(mockResult);

            const result = await controller.updateCCode(mockId, updateDto);

            expect(service.updateCCode).toHaveBeenCalledWith(mockId, updateDto);
            expect(result).toEqual(mockResult);
        });

        it('should update coupon with partial data (free trial days only)', async () => {
            const updateDto: CCodeUpdateDto = {
                freeTrialDays: 45,
            };

            const mockResult = {
                message: 'Code coupon updated successfully.',
            };

            mockCCodesService.updateCCode.mockResolvedValue(mockResult);

            const result = await controller.updateCCode(mockId, updateDto);

            expect(service.updateCCode).toHaveBeenCalledWith(mockId, updateDto);
            expect(result).toEqual(mockResult);
        });

        it('should update coupon with empty DTO', async () => {
            const updateDto: CCodeUpdateDto = {};

            const mockResult = {
                message: 'Code coupon updated successfully.',
            };

            mockCCodesService.updateCCode.mockResolvedValue(mockResult);

            const result = await controller.updateCCode(mockId, updateDto);

            expect(service.updateCCode).toHaveBeenCalledWith(mockId, updateDto);
            expect(result).toEqual(mockResult);
        });

        it('should handle different UUID for update', async () => {
            const differentId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
            const updateDto: CCodeUpdateDto = {
                label: 'Different ID Update',
            };

            mockCCodesService.updateCCode.mockResolvedValue({
                message: 'Code coupon updated successfully.',
            });

            await controller.updateCCode(differentId, updateDto);

            expect(service.updateCCode).toHaveBeenCalledWith(differentId, updateDto);
        });

        it('should pass both id and DTO to service', async () => {
            const updateDto: CCodeUpdateDto = {
                code: 'TEST1234',
            };

            mockCCodesService.updateCCode.mockResolvedValue({
                message: 'Code coupon updated successfully.',
            });

            await controller.updateCCode(mockId, updateDto);

            expect(service.updateCCode).toHaveBeenCalledTimes(1);
            expect(service.updateCCode).toHaveBeenCalledWith(mockId, updateDto);
        });
    });

    describe('deleteCCode - DELETE /:id', () => {
        it('should delete a coupon code successfully', async () => {
            const mockId = '123e4567-e89b-12d3-a456-426614174000';
            const mockResult = {
                message: 'Code coupon deleted successfully.',
            };

            mockCCodesService.deleteCCode.mockResolvedValue(mockResult);

            const result = await controller.deleteCCode(mockId);

            expect(service.deleteCCode).toHaveBeenCalledWith(mockId);
            expect(result).toEqual(mockResult);
        });

        it('should delete coupon with different UUID', async () => {
            const mockId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
            const mockResult = {
                message: 'Code coupon deleted successfully.',
            };

            mockCCodesService.deleteCCode.mockResolvedValue(mockResult);

            const result = await controller.deleteCCode(mockId);

            expect(service.deleteCCode).toHaveBeenCalledWith(mockId);
            expect(result).toEqual(mockResult);
        });

        it('should call service delete method only once', async () => {
            const mockId = '30ac88d4-7ffe-418c-9551-66eeec2e6783';

            mockCCodesService.deleteCCode.mockResolvedValue({
                message: 'Code coupon deleted successfully.',
            });

            await controller.deleteCCode(mockId);

            expect(service.deleteCCode).toHaveBeenCalledTimes(1);
            expect(service.deleteCCode).toHaveBeenCalledWith(mockId);
        });

        it('should handle delete with exact id parameter', async () => {
            const mockId = 'xyz12345-abcd-4321-wxyz-098765432100';

            mockCCodesService.deleteCCode.mockResolvedValue({
                message: 'Code coupon deleted successfully.',
            });

            await controller.deleteCCode(mockId);

            const calledWith = mockCCodesService.deleteCCode.mock.calls[0][0];
            expect(calledWith).toBe(mockId);
        });
    });

    describe('Error Handling', () => {
        it('should propagate service errors on getAllCouponCodes', async () => {
            const pagination = new PaginationDto();
            pagination.page = 1;
            pagination.limit = 10;

            mockCCodesService.allCouponCodes.mockRejectedValue(new Error('Service error'));

            await expect(controller.nonDeletedCCodes(pagination)).rejects.toThrow('Service error');
        });

        it('should propagate service errors on findOne', async () => {
            const mockId = '123e4567-e89b-12d3-a456-426614174000';

            mockCCodesService.cCodeDetails.mockRejectedValue(new Error('Not found'));

            await expect(controller.findOne(mockId)).rejects.toThrow('Not found');
        });

        it('should propagate service errors on create', async () => {
            const createDto: CCodeCreateDto = {
                code: 'ERR12345',
                label: 'Error',
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
                startDate: new Date('2026-01-01'),
                endDate: new Date('2026-12-31'),
            } as CCodeCreateDto;

            mockCCodesService.createCCode.mockRejectedValue(new Error('Creation failed'));

            await expect(controller.createCCoupon(createDto)).rejects.toThrow('Creation failed');
        });

        it('should propagate service errors on update', async () => {
            const mockId = '123e4567-e89b-12d3-a456-426614174000';
            const updateDto: CCodeUpdateDto = {
                label: 'Error',
            };

            mockCCodesService.updateCCode.mockRejectedValue(new Error('Update failed'));

            await expect(controller.updateCCode(mockId, updateDto)).rejects.toThrow(
                'Update failed',
            );
        });

        it('should propagate service errors on delete', async () => {
            const mockId = '123e4567-e89b-12d3-a456-426614174000';

            mockCCodesService.deleteCCode.mockRejectedValue(new Error('Delete failed'));

            await expect(controller.deleteCCode(mockId)).rejects.toThrow('Delete failed');
        });
    });

    describe('Service Method Calls', () => {
        it('should call allCouponCodes with correct parameters', async () => {
            const pagination = new PaginationDto();
            pagination.page = 1;
            pagination.limit = 10;

            mockCCodesService.allCouponCodes.mockResolvedValue({
                data: [],
                total: 0,
                page: 1,
                limit: 10,
            });

            await controller.nonDeletedCCodes(pagination, 'search');

            expect(service.allCouponCodes).toHaveBeenCalledWith(1, 10, {
                searchTerm: 'search',
            });
        });

        it('should call cCodeDetails with correct id', async () => {
            const mockId = '123e4567-e89b-12d3-a456-426614174000';

            mockCCodesService.cCodeDetails.mockResolvedValue({
                id: mockId,
                label: 'Test',
            });

            await controller.findOne(mockId);

            expect(service.cCodeDetails).toHaveBeenCalledWith(mockId);
        });

        it('should call createCCode with correct DTO', async () => {
            const createDto: CCodeCreateDto = {
                code: 'TEST1234',
                label: 'Test',
                couponType: CouponTypeEnum.ADDITIONAL_FREE_TRIAL,
                subscriptionPeriod: SubscriptionPeriodEnum.MONTHLY,
                startDate: new Date('2026-01-01'),
                endDate: new Date('2026-12-31'),
            } as CCodeCreateDto;

            mockCCodesService.createCCode.mockResolvedValue({
                message: 'Code coupon created successfully.',
            });

            await controller.createCCoupon(createDto);

            expect(service.createCCode).toHaveBeenCalledWith(createDto);
        });

        it('should call updateCCode with correct id and DTO', async () => {
            const mockId = '123e4567-e89b-12d3-a456-426614174000';
            const updateDto: CCodeUpdateDto = {
                label: 'Updated',
            };

            mockCCodesService.updateCCode.mockResolvedValue({
                message: 'Code coupon updated successfully.',
            });

            await controller.updateCCode(mockId, updateDto);

            expect(service.updateCCode).toHaveBeenCalledWith(mockId, updateDto);
        });

        it('should call deleteCCode with correct id', async () => {
            const mockId = '123e4567-e89b-12d3-a456-426614174000';

            mockCCodesService.deleteCCode.mockResolvedValue({
                message: 'Code coupon deleted successfully.',
            });

            await controller.deleteCCode(mockId);

            expect(service.deleteCCode).toHaveBeenCalledWith(mockId);
        });
    });
});
