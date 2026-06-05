import { Test, TestingModule } from '@nestjs/testing';
import { AdsController } from './ads.controller';
import { AdsService } from './services';
import { AdsStatusEnum, AdsTypeEnum } from '../../common/enum';
import { PaginationDto } from '../../common/dto';
import { EnvConfigService } from '../../utils/services/config';
import { CalendarAdsDto, CreateAdsDto, ReuseAdsDto, UpdateAdsDto } from './dto';
import { PermissionsGuard, JwtAuthGuard } from '../../common/guard';
import { ErrorHandlerService } from '../../common/response';
import { Reflector } from '@nestjs/core';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('AdsController', () => {
    let controller: AdsController;
    let adsService: jest.Mocked<AdsService>;

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

    const mockAdsService = {
        adsStats: jest.fn(),
        getRunningAdsForToday: jest.fn(),
        getCurrentMonthAds: jest.fn(),
        allAds: jest.fn(),
        adsDetails: jest.fn(),
        retrieveAdsGroupedByType: jest.fn(),
        createAds: jest.fn(),
        updateAds: jest.fn(),
        reuseExpiredAd: jest.fn(),
        toggleAds: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AdsController],
            providers: [
                {
                    provide: AdsService,
                    useValue: mockAdsService,
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

        controller = module.get<AdsController>(AdsController);
        adsService = module.get(AdsService) as jest.Mocked<AdsService>;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('badgeCount', () => {
        it('should return ads statistics', async () => {
            const mockStats = {
                total: 100,
                expired: 20,
                scheduled: 30,
                running: 50,
            };

            mockAdsService.adsStats.mockResolvedValue(mockStats);

            const result = await controller.badgeCount();

            expect(adsService.adsStats).toHaveBeenCalled();
            expect(result).toEqual(mockStats);
        });

        it('should call adsStats without parameters', async () => {
            await controller.badgeCount();

            expect(adsService.adsStats).toHaveBeenCalledWith();
        });
    });

    describe('getTodayRunningAds', () => {
        it('should return running ads for today', async () => {
            const mockRunningAds = [
                {
                    id: 'ads-1',
                    label: 'Running Ad 1',
                    status: AdsStatusEnum.RUNNING,
                },
                {
                    id: 'ads-2',
                    label: 'Running Ad 2',
                    status: AdsStatusEnum.RUNNING,
                },
            ];

            mockAdsService.getRunningAdsForToday.mockResolvedValue(mockRunningAds);

            const result = await controller.getTodayRunningAds();

            expect(adsService.getRunningAdsForToday).toHaveBeenCalled();
            expect(result).toEqual(mockRunningAds);
        });

        it('should return empty array when no running ads', async () => {
            mockAdsService.getRunningAdsForToday.mockResolvedValue([]);

            const result = await controller.getTodayRunningAds();

            expect(result).toEqual([]);
        });
    });

    describe('getCurrentMonthAds', () => {
        it('should return ads for current month', async () => {
            const mockMonthAds = [
                {
                    id: 'ads-1',
                    label: 'Month Ad 1',
                    status: AdsStatusEnum.SCHEDULED,
                },
                {
                    id: 'ads-2',
                    label: 'Month Ad 2',
                    status: AdsStatusEnum.RUNNING,
                },
            ];

            mockAdsService.getCurrentMonthAds.mockResolvedValue(mockMonthAds);

            const result = await controller.getCurrentMonthAds();

            expect(adsService.getCurrentMonthAds).toHaveBeenCalled();
            expect(result).toEqual(mockMonthAds);
        });

        it('should call getCurrentMonthAds without parameters', async () => {
            mockAdsService.getCurrentMonthAds.mockResolvedValue([]);

            await controller.getCurrentMonthAds();

            expect(adsService.getCurrentMonthAds).toHaveBeenCalledWith();
        });
    });

    describe('nonDeletedAds', () => {
        let mockPagination: PaginationDto;

        beforeEach(() => {
            mockPagination = new PaginationDto();
            mockPagination.page = 1;
            mockPagination.limit = 10;
        });

        it('should return paginated ads without filters', async () => {
            const mockPaginatedResult = {
                data: [
                    { id: 'ads-1', label: 'Ad 1' },
                    { id: 'ads-2', label: 'Ad 2' },
                ],
                total: 2,
                page: 1,
                limit: 10,
            };

            mockAdsService.allAds.mockResolvedValue(mockPaginatedResult);

            const result = await controller.nonDeletedAds(mockPagination);

            expect(adsService.allAds).toHaveBeenCalledWith(1, 10, {
                status: undefined,
                searchTerm: undefined,
            });
            expect(result).toEqual(mockPaginatedResult);
        });

        it('should return paginated ads with status filter', async () => {
            const mockPaginatedResult = {
                data: [{ id: 'ads-1', label: 'Running Ad' }],
                total: 1,
                page: 1,
                limit: 10,
            };

            mockAdsService.allAds.mockResolvedValue(mockPaginatedResult);

            const result = await controller.nonDeletedAds(mockPagination, AdsStatusEnum.RUNNING);

            expect(adsService.allAds).toHaveBeenCalledWith(1, 10, {
                status: AdsStatusEnum.RUNNING,
                searchTerm: undefined,
            });
            expect(result).toEqual(mockPaginatedResult);
        });

        it('should return paginated ads with search term', async () => {
            const mockPaginatedResult = {
                data: [{ id: 'ads-1', label: 'Test Ad' }],
                total: 1,
                page: 1,
                limit: 10,
            };

            mockAdsService.allAds.mockResolvedValue(mockPaginatedResult);

            const result = await controller.nonDeletedAds(mockPagination, undefined, 'test');

            expect(adsService.allAds).toHaveBeenCalledWith(1, 10, {
                status: undefined,
                searchTerm: 'test',
            });
            expect(result).toEqual(mockPaginatedResult);
        });

        it('should return paginated ads with both status and search filters', async () => {
            const mockPaginatedResult = {
                data: [{ id: 'ads-1', label: 'Scheduled Test Ad' }],
                total: 1,
                page: 1,
                limit: 10,
            };

            mockAdsService.allAds.mockResolvedValue(mockPaginatedResult);

            const result = await controller.nonDeletedAds(
                mockPagination,
                AdsStatusEnum.SCHEDULED,
                'test',
            );

            expect(adsService.allAds).toHaveBeenCalledWith(1, 10, {
                status: AdsStatusEnum.SCHEDULED,
                searchTerm: 'test',
            });
            expect(result).toEqual(mockPaginatedResult);
        });

        it('should handle different page and limit values', async () => {
            mockPagination.page = 3;
            mockPagination.limit = 25;

            const mockPaginatedResult = {
                data: [],
                total: 0,
                page: 3,
                limit: 25,
            };

            mockAdsService.allAds.mockResolvedValue(mockPaginatedResult);

            await controller.nonDeletedAds(mockPagination);

            expect(adsService.allAds).toHaveBeenCalledWith(3, 25, {
                status: undefined,
                searchTerm: undefined,
            });
        });

        it('should handle expired status filter', async () => {
            const mockPaginatedResult = {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
            };

            mockAdsService.allAds.mockResolvedValue(mockPaginatedResult);

            await controller.nonDeletedAds(mockPagination, AdsStatusEnum.EXPIRED);

            expect(adsService.allAds).toHaveBeenCalledWith(1, 10, {
                status: AdsStatusEnum.EXPIRED,
                searchTerm: undefined,
            });
        });
    });

    describe('findOne', () => {
        it('should return ad details by id', async () => {
            const mockAd = {
                id: 'ads-123',
                label: 'Test Ad',
                company: 'Test Company',
                status: AdsStatusEnum.RUNNING,
            };

            mockAdsService.adsDetails.mockResolvedValue(mockAd);

            const result = await controller.findOne('ads-123');

            expect(adsService.adsDetails).toHaveBeenCalledWith('ads-123');
            expect(result).toEqual(mockAd);
        });

        it('should call adsDetails with the provided UUID', async () => {
            const uuid = '550e8400-e29b-41d4-a716-446655440000';
            mockAdsService.adsDetails.mockResolvedValue({} as any);

            await controller.findOne(uuid);

            expect(adsService.adsDetails).toHaveBeenCalledWith(uuid);
        });
    });

    describe('calendar', () => {
        it('should return ads grouped by type for given date', async () => {
            const calendarDto: CalendarAdsDto = {
                date: new Date('2024-03-15'),
            };

            const mockGroupedAds = {
                [AdsTypeEnum.STANDARD]: [{ id: 'ads-1', type: AdsTypeEnum.STANDARD }],
                [AdsTypeEnum.EXCLUSIVE]: [{ id: 'ads-2', type: AdsTypeEnum.EXCLUSIVE }],
            };

            mockAdsService.retrieveAdsGroupedByType.mockResolvedValue(mockGroupedAds);

            const result = await controller.calendar(calendarDto);

            expect(adsService.retrieveAdsGroupedByType).toHaveBeenCalledWith(calendarDto.date);
            expect(result).toEqual(mockGroupedAds);
        });

        it('should handle different dates', async () => {
            const calendarDto: CalendarAdsDto = {
                date: new Date('2025-12-01'),
            };

            mockAdsService.retrieveAdsGroupedByType.mockResolvedValue({});

            await controller.calendar(calendarDto);

            expect(adsService.retrieveAdsGroupedByType).toHaveBeenCalledWith(calendarDto.date);
        });

        it('should return empty object when no ads found', async () => {
            const calendarDto: CalendarAdsDto = {
                date: new Date('2024-06-01'),
            };

            mockAdsService.retrieveAdsGroupedByType.mockResolvedValue({});

            const result = await controller.calendar(calendarDto);

            expect(result).toEqual({});
        });
    });

    describe('createA', () => {
        it('should create a new ad successfully', async () => {
            const createDto: CreateAdsDto = {
                label: 'New Ad',
                companyName: 'New Company',
                fileId: 'file-123',
                type: AdsTypeEnum.STANDARD,
                format: 'image/jpeg' as any,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-12-31'),
                amount: 1000,
            };

            const mockResponse = { message: 'Ads created successfully' };

            mockAdsService.createAds.mockResolvedValue(mockResponse);

            const result = await controller.createA(createDto);

            expect(adsService.createAds).toHaveBeenCalledWith(createDto);
            expect(result).toEqual(mockResponse);
        });

        it('should handle creation with all fields', async () => {
            const createDto: CreateAdsDto = {
                label: 'Complete Ad',
                companyName: 'Complete Company',
                fileId: 'file-456',
                type: AdsTypeEnum.EXCLUSIVE,
                format: 'image/png' as any,
                startDate: new Date('2024-02-01'),
                endDate: new Date('2024-11-30'),
                amount: 5000,
            };

            mockAdsService.createAds.mockResolvedValue({
                message: 'Ads created successfully',
            });

            await controller.createA(createDto);

            expect(adsService.createAds).toHaveBeenCalledWith(createDto);
        });
    });

    describe('updateA', () => {
        it('should update an ad successfully', async () => {
            const updateDto: UpdateAdsDto = {
                label: 'Updated Ad',
                amount: 2000,
            };

            const mockResponse = { message: 'Ads updated successfully' };

            mockAdsService.updateAds.mockResolvedValue(mockResponse);

            const result = await controller.updateA('ads-123', updateDto);

            expect(adsService.updateAds).toHaveBeenCalledWith('ads-123', updateDto);
            expect(result).toEqual(mockResponse);
        });

        it('should update with multiple fields', async () => {
            const updateDto: UpdateAdsDto = {
                label: 'Updated Label',
                companyName: 'Updated Company',
                fileId: 'new-file-123',
                amount: 3000,
            };

            mockAdsService.updateAds.mockResolvedValue({
                message: 'Ads updated successfully',
            });

            await controller.updateA('ads-456', updateDto);

            expect(adsService.updateAds).toHaveBeenCalledWith('ads-456', updateDto);
        });

        it('should update with date changes', async () => {
            const updateDto: UpdateAdsDto = {
                startDate: new Date('2024-05-01'),
                endDate: new Date('2024-12-31'),
            };

            mockAdsService.updateAds.mockResolvedValue({
                message: 'Ads updated successfully',
            });

            await controller.updateA('ads-789', updateDto);

            expect(adsService.updateAds).toHaveBeenCalledWith('ads-789', updateDto);
        });
    });

    describe('reusedA', () => {
        it('should reuse an expired ad successfully', async () => {
            const reuseDto: ReuseAdsDto = {
                startDate: new Date('2025-01-01'),
                endDate: new Date('2025-12-31'),
            };

            const mockResponse = { message: 'Ads reused successfully' };

            mockAdsService.reuseExpiredAd.mockResolvedValue(mockResponse);

            const result = await controller.reusedA('ads-123', reuseDto);

            expect(adsService.reuseExpiredAd).toHaveBeenCalledWith('ads-123', reuseDto);
            expect(result).toEqual(mockResponse);
        });

        it('should call reuseExpiredAd with correct parameters', async () => {
            const uuid = '550e8400-e29b-41d4-a716-446655440000';
            const reuseDto: ReuseAdsDto = {
                startDate: new Date('2025-06-01'),
                endDate: new Date('2025-12-31'),
            };

            mockAdsService.reuseExpiredAd.mockResolvedValue({
                message: 'Ads reused successfully',
            });

            await controller.reusedA(uuid, reuseDto);

            expect(adsService.reuseExpiredAd).toHaveBeenCalledWith(uuid, reuseDto);
        });
    });

    describe('toggleAD', () => {
        it('should toggle ad active status successfully', async () => {
            const mockResponse = { message: 'Ads updated successfully' };

            mockAdsService.toggleAds.mockResolvedValue(mockResponse);

            const result = await controller.toggleAD('ads-123');

            expect(adsService.toggleAds).toHaveBeenCalledWith('ads-123');
            expect(result).toEqual(mockResponse);
        });

        it('should call toggleAds with the provided UUID', async () => {
            const uuid = '550e8400-e29b-41d4-a716-446655440000';

            mockAdsService.toggleAds.mockResolvedValue({
                message: 'Ads updated successfully',
            });

            await controller.toggleAD(uuid);

            expect(adsService.toggleAds).toHaveBeenCalledWith(uuid);
        });

        it('should return the service response', async () => {
            const expectedResponse = {
                message: 'Ads updated successfully',
                id: 'ads-456',
            };

            mockAdsService.toggleAds.mockResolvedValue(expectedResponse);

            const result = await controller.toggleAD('ads-456');

            expect(result).toEqual(expectedResponse);
        });
    });
});
