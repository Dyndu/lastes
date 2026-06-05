import { Test, TestingModule } from '@nestjs/testing';
import { AdsService } from './ads.service';
import { PreAdsService } from './pre-ads.service';
import { AdsStatsService } from './ads-stats.service';
import { CacheService } from '../../../helpers/cache/cache.service';
import { SocketService } from '../../../helpers/socket/socket.service';
import { AdsRepository } from '../repositories/ads.repository';
import { ErrorHandlerService } from '../../../common/response';
import { FileLinksService } from '../../files/services/file-links.service';
import { OtherUtils } from '../../../utils/services/tools';
import { UsersEntityTransformService } from '../../users/services';
import { AdsStatusEnum, AdsTypeEnum } from '../../../common/enum';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('AdsService', () => {
    let service: AdsService;
    let preAdsService: PreAdsService;
    let adsStatsService: AdsStatsService;
    let cacheService: CacheService;
    let fileLinkService: FileLinksService;
    let errorHandler: ErrorHandlerService;
    let otherUtils: OtherUtils;
    let transformService: UsersEntityTransformService;
    let logger: any;

    const mockAdsEntity = {
        id: 'ads-123',
        label: 'Test Ad',
        companyName: 'Test Company',
        isActive: true,
        type: AdsTypeEnum.STANDARD,
        format: 'image/jpeg',
        status: AdsStatusEnum.RUNNING,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        amount: 1000,
        file: {
            id: 'file-123',
            file: {
                id: 'file-456',
                url: 'https://example.com/ad.jpg',
            },
        },
    };

    const mockTransformedFile = {
        id: 'file-456',
        url: 'https://example.com/ad.jpg',
    } as any;

    const mockStatsEntity = {
        total: 100,
        expired: 20,
        scheduled: 30,
        running: 50,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdsService,
                {
                    provide: WINSTON_MODULE_PROVIDER,
                    useValue: {
                        info: jest.fn(),
                        error: jest.fn(),
                        warn: jest.fn(),
                    },
                },
                {
                    provide: PreAdsService,
                    useValue: {
                        retrieveAddByCriteria: jest.fn(),
                        ensureUniqueAdsLabel: jest.fn(),
                        prepareAdsData: jest.fn(),
                        persistAds: jest.fn(),
                        handlePostAdsCreation: jest.fn(),
                        scheduleInvalidateAdsCache: jest.fn(),
                        prepareAdsUpdates: jest.fn(),
                        updateAdsDetails: jest.fn(),
                        handlePostAdsUpdate: jest.fn(),
                        retrieveAdsQuery: jest.fn(),
                        retrieveAdsByMonth: jest.fn(),
                        determineAdsStatus: jest.fn(),
                        ensureNoDateOverlap: jest.fn(),
                        findAdsByMonth: jest.fn(),
                        findRunningAdsForToday: jest.fn(),
                        findAdsForCurrentMonth: jest.fn(),
                    },
                },
                {
                    provide: AdsStatsService,
                    useValue: {
                        getSingleton: jest.fn(),
                    },
                },
                {
                    provide: CacheService,
                    useValue: {
                        generateRedisKey: jest.fn(),
                        retrieveGenericPaginated: jest.fn(),
                    },
                },
                {
                    provide: SocketService,
                    useValue: {},
                },
                {
                    provide: AdsRepository,
                    useValue: {},
                },
                {
                    provide: ErrorHandlerService,
                    useValue: {
                        forbidden: jest.fn(),
                    },
                },
                {
                    provide: FileLinksService,
                    useValue: {
                        unlinkAndCleanup: jest.fn(),
                    },
                },
                {
                    provide: OtherUtils,
                    useValue: {
                        validateAdsDates: jest.fn(),
                    },
                },
                {
                    provide: UsersEntityTransformService,
                    useValue: {
                        transformFiles: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<AdsService>(AdsService);
        preAdsService = module.get<PreAdsService>(PreAdsService);
        adsStatsService = module.get<AdsStatsService>(AdsStatsService);
        cacheService = module.get<CacheService>(CacheService);
        fileLinkService = module.get<FileLinksService>(FileLinksService);
        errorHandler = module.get<ErrorHandlerService>(ErrorHandlerService);
        otherUtils = module.get<OtherUtils>(OtherUtils);
        transformService = module.get<UsersEntityTransformService>(UsersEntityTransformService);
        logger = module.get(WINSTON_MODULE_PROVIDER);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('transformAd', () => {
        it('should transform a single ad entities correctly', () => {
            jest.spyOn(transformService, 'transformFiles').mockReturnValue(mockTransformedFile);

            const result = service.transformAd(mockAdsEntity as any);

            expect(result).toEqual({
                id: mockAdsEntity.id,
                label: mockAdsEntity.label,
                company: mockAdsEntity.companyName,
                isActive: mockAdsEntity.isActive,
                type: mockAdsEntity.type,
                format: mockAdsEntity.format,
                status: mockAdsEntity.status,
                startDate: mockAdsEntity.startDate,
                endDate: mockAdsEntity.endDate,
                amount: mockAdsEntity.amount,
                file: mockTransformedFile,
            });
            expect(transformService.transformFiles).toHaveBeenCalledWith(mockAdsEntity.file.file);
        });
    });

    describe('transformAds', () => {
        it('should transform an array of ad entities', () => {
            jest.spyOn(transformService, 'transformFiles').mockReturnValue(mockTransformedFile);

            const ads = [mockAdsEntity, { ...mockAdsEntity, id: 'ads-456' }];
            const result = service.transformAds(ads as any);

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('ads-123');
            expect(result[1].id).toBe('ads-456');
        });
    });

    describe('transformAdsCount', () => {
        it('should transform ads count correctly', () => {
            const result = service.transformAdsCount(mockStatsEntity as any);

            expect(result).toEqual({
                total: 100,
                expired: 20,
                scheduled: 30,
                running: 50,
            });
        });
    });

    describe('adsStats', () => {
        it('should retrieve and transform ads statistics', async () => {
            jest.spyOn(adsStatsService, 'getSingleton').mockResolvedValue(mockStatsEntity as any);

            const result = await service.adsStats();

            expect(result).toEqual({
                total: 100,
                expired: 20,
                scheduled: 30,
                running: 50,
            });
            expect(adsStatsService.getSingleton).toHaveBeenCalled();
        });
    });

    describe('allAds', () => {
        it('should retrieve paginated ads without filters', async () => {
            const mockPaginatedResult = {
                data: [mockAdsEntity],
                total: 1,
                page: 1,
                limit: 10,
            };

            jest.spyOn(cacheService, 'generateRedisKey').mockReturnValue('ads:key');
            jest.spyOn(cacheService, 'retrieveGenericPaginated').mockResolvedValue(
                mockPaginatedResult,
            );

            const result = await service.allAds(1, 10, {});

            expect(logger.info).toHaveBeenCalledWith('Retrieve ads from cache or database.');
            expect(cacheService.generateRedisKey).toHaveBeenCalledWith('ads', {});
            expect(cacheService.retrieveGenericPaginated).toHaveBeenCalled();
            expect(result).toEqual(mockPaginatedResult);
        });

        it('should retrieve paginated ads with status filter', async () => {
            const mockPaginatedResult = {
                data: [mockAdsEntity],
                total: 1,
                page: 1,
                limit: 10,
            };

            jest.spyOn(cacheService, 'generateRedisKey').mockReturnValue('ads:status:running');
            jest.spyOn(cacheService, 'retrieveGenericPaginated').mockResolvedValue(
                mockPaginatedResult,
            );

            const result = await service.allAds(1, 10, {
                status: AdsStatusEnum.RUNNING,
            });

            expect(cacheService.generateRedisKey).toHaveBeenCalledWith('ads', {
                status: AdsStatusEnum.RUNNING,
            });
            expect(result).toEqual(mockPaginatedResult);
        });

        it('should retrieve paginated ads with search term', async () => {
            const mockPaginatedResult = {
                data: [mockAdsEntity],
                total: 1,
                page: 1,
                limit: 10,
            };

            jest.spyOn(cacheService, 'generateRedisKey').mockReturnValue('ads:search:test');
            jest.spyOn(cacheService, 'retrieveGenericPaginated').mockResolvedValue(
                mockPaginatedResult,
            );

            const result = await service.allAds(1, 10, {
                searchTerm: 'Test',
            });

            expect(cacheService.generateRedisKey).toHaveBeenCalledWith('ads', {
                search: 'test',
            });
            expect(result).toEqual(mockPaginatedResult);
        });

        it('should retrieve paginated ads with both status and search term', async () => {
            const mockPaginatedResult = {
                data: [mockAdsEntity],
                total: 1,
                page: 1,
                limit: 10,
            };

            jest.spyOn(cacheService, 'generateRedisKey').mockReturnValue(
                'ads:status:running:search:company',
            );
            jest.spyOn(cacheService, 'retrieveGenericPaginated').mockResolvedValue(
                mockPaginatedResult,
            );

            const result = await service.allAds(1, 10, {
                status: AdsStatusEnum.RUNNING,
                searchTerm: 'Company',
            });

            expect(cacheService.generateRedisKey).toHaveBeenCalledWith('ads', {
                status: AdsStatusEnum.RUNNING,
                search: 'company',
            });
            expect(result).toEqual(mockPaginatedResult);
        });
    });

    describe('adsDetails', () => {
        it('should retrieve and transform ad details', async () => {
            jest.spyOn(preAdsService, 'retrieveAddByCriteria').mockResolvedValue(
                mockAdsEntity as any,
            );
            jest.spyOn(transformService, 'transformFiles').mockReturnValue(mockTransformedFile);

            const result = await service.adsDetails('ads-123');

            expect(logger.info).toHaveBeenCalledWith('Ads details for ads-123');
            expect(preAdsService.retrieveAddByCriteria).toHaveBeenCalledWith({
                id: 'ads-123',
            });
            expect(result.id).toBe('ads-123');
            expect(result.label).toBe('Test Ad');
        });
    });

    describe('createAds', () => {
        it('should create a new ad successfully', async () => {
            const createDto = {
                label: 'New Ad',
                companyName: 'New Company',
                fileId: 'file-123',
                type: AdsTypeEnum.STANDARD,
                format: 'image/jpeg',
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-12-31'),
                amount: 1000,
            };

            const preparedData = {
                ...createDto,
                status: AdsStatusEnum.SCHEDULED,
            };
            const newAds = { ...mockAdsEntity, ...preparedData };

            jest.spyOn(preAdsService, 'ensureUniqueAdsLabel').mockResolvedValue(undefined);
            jest.spyOn(preAdsService, 'prepareAdsData').mockResolvedValue(preparedData as any);
            jest.spyOn(preAdsService, 'persistAds').mockResolvedValue(newAds as any);
            jest.spyOn(preAdsService, 'handlePostAdsCreation').mockResolvedValue(undefined);
            jest.spyOn(preAdsService, 'scheduleInvalidateAdsCache').mockResolvedValue(undefined);

            const result = await service.createAds(createDto as any);

            expect(logger.info).toHaveBeenCalledWith(
                `Create a new Ads ${JSON.stringify(createDto)}`,
            );
            expect(preAdsService.ensureUniqueAdsLabel).toHaveBeenCalledWith(
                createDto.label,
                createDto.companyName,
            );
            expect(preAdsService.prepareAdsData).toHaveBeenCalledWith(createDto);
            expect(preAdsService.persistAds).toHaveBeenCalledWith(preparedData);
            expect(preAdsService.handlePostAdsCreation).toHaveBeenCalledWith(newAds, newAds.status);
            expect(result).toEqual({ message: 'Ads created successfully' });

            await new Promise((resolve) => setImmediate(resolve));
            expect(preAdsService.scheduleInvalidateAdsCache).toHaveBeenCalled();
        });
    });

    describe('updateAds', () => {
        it('should update an ad successfully without file change', async () => {
            const updateDto = {
                label: 'Updated Ad',
                amount: 2000,
            };

            const adsUpdates = { label: 'Updated Ad', amount: 2000 };
            const updatedAds = { ...mockAdsEntity, ...adsUpdates };

            jest.spyOn(preAdsService, 'retrieveAddByCriteria')
                .mockResolvedValueOnce(mockAdsEntity as any)
                .mockResolvedValueOnce(updatedAds as any);
            jest.spyOn(preAdsService, 'prepareAdsUpdates').mockResolvedValue(adsUpdates as any);
            jest.spyOn(preAdsService, 'updateAdsDetails').mockResolvedValue(undefined!);
            jest.spyOn(preAdsService, 'handlePostAdsUpdate').mockResolvedValue(undefined);
            jest.spyOn(preAdsService, 'scheduleInvalidateAdsCache').mockResolvedValue(undefined);

            const result = await service.updateAds('ads-123', updateDto as any);

            expect(logger.info).toHaveBeenCalledWith(
                `Update ads with id: ads-123 with data ${JSON.stringify(updateDto)}`,
            );
            expect(preAdsService.retrieveAddByCriteria).toHaveBeenCalledWith({
                id: 'ads-123',
            });
            expect(preAdsService.prepareAdsUpdates).toHaveBeenCalledWith(updateDto, mockAdsEntity);
            expect(preAdsService.updateAdsDetails).toHaveBeenCalledWith(mockAdsEntity, adsUpdates);
            expect(preAdsService.handlePostAdsUpdate).toHaveBeenCalledWith(
                updatedAds,
                AdsStatusEnum.RUNNING,
                AdsStatusEnum.RUNNING,
            );
            expect(result).toEqual({ message: 'Ads updated successfully' });

            await new Promise((resolve) => setImmediate(resolve));
            expect(fileLinkService.unlinkAndCleanup).not.toHaveBeenCalled();
            expect(preAdsService.scheduleInvalidateAdsCache).toHaveBeenCalled();
        });

        it('should update an ad and cleanup old file when fileId is provided', async () => {
            const updateDto = {
                label: 'Updated Ad',
                fileId: 'new-file-123',
            };

            const adsUpdates = { label: 'Updated Ad', fileId: 'new-file-123' };
            const updatedAd = { ...mockAdsEntity, ...adsUpdates };

            jest.spyOn(preAdsService, 'retrieveAddByCriteria')
                .mockResolvedValueOnce(mockAdsEntity as any)
                .mockResolvedValueOnce(updatedAd as any);
            jest.spyOn(preAdsService, 'prepareAdsUpdates').mockResolvedValue(adsUpdates as any);
            jest.spyOn(preAdsService, 'updateAdsDetails').mockResolvedValue(undefined!);
            jest.spyOn(preAdsService, 'handlePostAdsUpdate').mockResolvedValue(undefined);
            jest.spyOn(preAdsService, 'scheduleInvalidateAdsCache').mockResolvedValue(undefined);
            jest.spyOn(fileLinkService, 'unlinkAndCleanup').mockResolvedValue(undefined);

            const result = await service.updateAds('ads-123', updateDto as any);

            expect(result).toEqual({ message: 'Ads updated successfully' });

            await new Promise((resolve) => setImmediate(resolve));
            expect(fileLinkService.unlinkAndCleanup).toHaveBeenCalledWith('file-123');
            expect(preAdsService.scheduleInvalidateAdsCache).toHaveBeenCalled();
        });
    });

    describe('toggleAds', () => {
        it('should toggle ad active status from true to false', async () => {
            const inactiveAd = { ...mockAdsEntity, isActive: false };

            jest.spyOn(preAdsService, 'retrieveAddByCriteria')
                .mockResolvedValueOnce(mockAdsEntity as any)
                .mockResolvedValueOnce(inactiveAd as any);
            jest.spyOn(preAdsService, 'updateAdsDetails').mockResolvedValue(undefined!);
            jest.spyOn(preAdsService, 'handlePostAdsUpdate').mockResolvedValue(undefined);
            jest.spyOn(preAdsService, 'scheduleInvalidateAdsCache').mockResolvedValue(undefined);

            const result = await service.toggleAds('ads-123');

            expect(logger.info).toHaveBeenCalledWith('Toggle activeness of add with id: ads-123');
            expect(preAdsService.updateAdsDetails).toHaveBeenCalledWith(mockAdsEntity, {
                isActive: false,
            });
            expect(preAdsService.handlePostAdsUpdate).toHaveBeenCalledWith(
                inactiveAd,
                AdsStatusEnum.RUNNING,
                AdsStatusEnum.RUNNING,
            );
            expect(result).toEqual({ message: 'Ads updated successfully' });

            await new Promise((resolve) => setImmediate(resolve));
            expect(preAdsService.scheduleInvalidateAdsCache).toHaveBeenCalled();
        });

        it('should toggle ad active status from false to true', async () => {
            const inactiveAd = { ...mockAdsEntity, isActive: false };
            const activeAd = { ...mockAdsEntity, isActive: true };

            jest.spyOn(preAdsService, 'retrieveAddByCriteria')
                .mockResolvedValueOnce(inactiveAd as any)
                .mockResolvedValueOnce(activeAd as any);
            jest.spyOn(preAdsService, 'updateAdsDetails').mockResolvedValue(undefined!);
            jest.spyOn(preAdsService, 'handlePostAdsUpdate').mockResolvedValue(undefined);
            jest.spyOn(preAdsService, 'scheduleInvalidateAdsCache').mockResolvedValue(undefined);

            const result = await service.toggleAds('ads-123');

            expect(preAdsService.updateAdsDetails).toHaveBeenCalledWith(inactiveAd, {
                isActive: true,
            });
            expect(result).toEqual({ message: 'Ads updated successfully' });
        });
    });

    describe('reuseExpiredAd', () => {
        it('should reuse an expired ad successfully', async () => {
            const expiredAd = {
                ...mockAdsEntity,
                id: 'ads-123',
                type: AdsTypeEnum.STANDARD,
                status: AdsStatusEnum.EXPIRED,
            };
            const reuseDto = {
                startDate: new Date('2025-01-01'),
                endDate: new Date('2025-12-31'),
            };
            const reusedAd = {
                ...expiredAd,
                startDate: reuseDto.startDate,
                endDate: reuseDto.endDate,
                status: AdsStatusEnum.SCHEDULED,
            };

            jest.spyOn(preAdsService, 'retrieveAddByCriteria')
                .mockResolvedValueOnce(expiredAd as any)
                .mockResolvedValueOnce(reusedAd as any);
            jest.spyOn(otherUtils, 'validateAdsDates').mockReturnValue(undefined);
            jest.spyOn(preAdsService, 'ensureNoDateOverlap').mockResolvedValue(undefined);
            jest.spyOn(preAdsService, 'determineAdsStatus').mockReturnValue(
                AdsStatusEnum.SCHEDULED,
            );
            jest.spyOn(preAdsService, 'updateAdsDetails').mockResolvedValue(undefined!);
            jest.spyOn(preAdsService, 'handlePostAdsUpdate').mockResolvedValue(undefined);
            jest.spyOn(preAdsService, 'scheduleInvalidateAdsCache').mockResolvedValue(undefined);

            const result = await service.reuseExpiredAd('ads-123', reuseDto as any);

            expect(logger.info).toHaveBeenCalledWith(
                'Schedule an ads with id: ads-123 to a new date',
            );
            expect(otherUtils.validateAdsDates).toHaveBeenCalledWith(
                reuseDto.startDate,
                reuseDto.endDate,
            );
            expect(preAdsService.ensureNoDateOverlap).toHaveBeenCalledWith(
                reuseDto.startDate,
                reuseDto.endDate,
                AdsTypeEnum.STANDARD,
                'ads-123',
            );
            expect(preAdsService.determineAdsStatus).toHaveBeenCalledWith(reuseDto.startDate);
            expect(preAdsService.updateAdsDetails).toHaveBeenCalledWith(expiredAd, {
                startDate: reuseDto.startDate,
                endDate: reuseDto.endDate,
                status: AdsStatusEnum.SCHEDULED,
            });
            expect(preAdsService.handlePostAdsUpdate).toHaveBeenCalledWith(
                reusedAd,
                AdsStatusEnum.EXPIRED,
                AdsStatusEnum.SCHEDULED,
            );
            expect(result).toEqual({ message: 'Ads reused successfully' });

            await new Promise((resolve) => setImmediate(resolve));
            expect(preAdsService.scheduleInvalidateAdsCache).toHaveBeenCalled();
        });

        it('should throw error when trying to reuse a non-expired ad', async () => {
            const runningAd = {
                ...mockAdsEntity,
                status: AdsStatusEnum.RUNNING,
            };
            const reuseDto = {
                startDate: new Date('2025-01-01'),
                endDate: new Date('2025-12-31'),
            };

            jest.spyOn(preAdsService, 'retrieveAddByCriteria').mockResolvedValue(runningAd as any);
            jest.spyOn(errorHandler, 'forbidden').mockImplementation((msg, _detail) => {
                throw new Error(msg);
            });

            await expect(service.reuseExpiredAd('ads-123', reuseDto as any)).rejects.toThrow();

            expect(errorHandler.forbidden).toHaveBeenCalledWith(
                `Ads with id: ads-123 isn't expired, can't reuse`,
                `Ads has to be expired for reuse`,
            );
        });
    });

    describe('retrieveAdsGroupedByType', () => {
        it('should group ads by type correctly', async () => {
            const mockAds = [
                { ...mockAdsEntity, type: AdsTypeEnum.STANDARD, id: 'ads-1' },
                { ...mockAdsEntity, type: AdsTypeEnum.STANDARD, id: 'ads-2' },
                { ...mockAdsEntity, type: AdsTypeEnum.EXCLUSIVE, id: 'ads-3' },
            ];

            jest.spyOn(preAdsService, 'findAdsByMonth').mockResolvedValue(mockAds as any);

            const result = await service.retrieveAdsGroupedByType(new Date('2024-01-01'));

            expect(preAdsService.findAdsByMonth).toHaveBeenCalledWith(new Date('2024-01-01'));
            expect(result[AdsTypeEnum.STANDARD]).toHaveLength(2);
            expect(result[AdsTypeEnum.EXCLUSIVE]).toHaveLength(1);
            expect(result[AdsTypeEnum.STANDARD][0].id).toBe('ads-1');
            expect(result[AdsTypeEnum.EXCLUSIVE][0].id).toBe('ads-3');
        });

        it('should return empty object when no ads found', async () => {
            jest.spyOn(preAdsService, 'findAdsByMonth').mockResolvedValue([]);

            const result = await service.retrieveAdsGroupedByType(new Date('2024-01-01'));

            expect(result).toEqual({});
        });
    });

    describe('getRunningAdsForToday', () => {
        it('should retrieve and transform running ads for today', async () => {
            const mockRunningAds = [mockAdsEntity, { ...mockAdsEntity, id: 'ads-456' }];

            jest.spyOn(preAdsService, 'findRunningAdsForToday').mockResolvedValue(
                mockRunningAds as any,
            );
            jest.spyOn(transformService, 'transformFiles').mockReturnValue(mockTransformedFile);

            const result = await service.getRunningAdsForToday();

            expect(logger.info).toHaveBeenCalledWith('Retrieve running ads of the day');
            expect(preAdsService.findRunningAdsForToday).toHaveBeenCalled();
            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('ads-123');
            expect(result[1].id).toBe('ads-456');
        });
    });

    describe('getCurrentMonthAds', () => {
        it('should retrieve and transform current month ads', async () => {
            const mockMonthAds = [mockAdsEntity];

            jest.spyOn(preAdsService, 'findAdsForCurrentMonth').mockResolvedValue(
                mockMonthAds as any,
            );
            jest.spyOn(transformService, 'transformFiles').mockReturnValue(mockTransformedFile);

            const result = await service.getCurrentMonthAds();

            expect(logger.info).toHaveBeenCalledWith(
                'Retrieve current scheduled ads for the current month',
            );
            expect(preAdsService.findAdsForCurrentMonth).toHaveBeenCalled();
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('ads-123');
        });
    });
});
