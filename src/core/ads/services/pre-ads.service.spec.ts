import { Test, TestingModule } from '@nestjs/testing';
import { PreAdsService } from './pre-ads.service';
import { AdsService } from './ads.service';
import {
    AdsFormatEnum,
    AdsStatusEnum,
    AdsTypeEnum,
    FileUsageEnum,
    SocketEventEnum,
} from '../../../common/enum';
import { AdsEntity } from '../entities/ads.entity';
import { CreateAdsDto, UpdateAdsDto } from '../dto';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const makeAds = (overrides: Partial<AdsEntity> = {}): AdsEntity =>
    ({
        id: 'ads-1',
        label: 'My Ad',
        companyName: 'Acme Corp',
        status: AdsStatusEnum.SCHEDULED,
        type: AdsTypeEnum.STANDARD,
        format: AdsFormatEnum.HORIZONTAL,
        amount: 100,
        isActive: false,
        startDate: new Date('2099-01-01'),
        endDate: new Date('2099-01-31'),
        file: null,
        ...overrides,
    }) as AdsEntity;

const makeQueryBuilder = (overrides: Partial<Record<string, jest.Mock>> = {}) => {
    const qb: any = {
        andWhere: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        ...overrides,
    };
    return qb;
};

const buildAdsServiceMock = () => {
    const qb = makeQueryBuilder();

    return {
        _qb: qb,
        adsRepository: {
            getRepository: jest.fn().mockReturnValue({
                createQueryBuilder: jest.fn().mockReturnValue(qb),
            }),
            findActiveOne: jest.fn(),
            assertUniqueActive: jest.fn(),
            update: jest.fn().mockResolvedValue({ affected: 1 }),
            create: jest.fn(),
        },
        logger: { info: jest.fn() },
        errorHandler: {
            notFound: jest.fn().mockImplementation((msg) => {
                throw new Error(msg);
            }),
            badRequest: jest.fn().mockImplementation((msg) => {
                throw new Error(msg);
            }),
            validation: jest.fn().mockImplementation((errors) => new Error(JSON.stringify(errors))),
        },
        otherUtils: {
            formatCriteria: jest.fn().mockReturnValue('formatted'),
            validateAdsDates: jest.fn(),
        },
        fileLinkService: {
            linkFileToEntity: jest.fn().mockResolvedValue({ id: 'fl-1' }),
        },
        socketService: {
            sendDataToRoute: jest.fn(),
        },
        adsStatsService: {
            onCreate: jest.fn().mockResolvedValue({ total: 1 }),
            onStatusChange: jest.fn().mockResolvedValue({ total: 2 }),
        },
        cacheService: {
            deleteKeysByBase: jest.fn().mockResolvedValue(undefined),
        },
        transformAd: jest.fn().mockReturnValue({ id: 'ads-1' }),
        transformAdsCount: jest.fn().mockReturnValue({ count: 1 }),
    };
};

describe('PreAdsService', () => {
    let service: PreAdsService;
    let adsService: ReturnType<typeof buildAdsServiceMock>;

    beforeEach(async () => {
        adsService = buildAdsServiceMock();

        const module: TestingModule = await Test.createTestingModule({
            providers: [PreAdsService, { provide: AdsService, useValue: adsService }],
        }).compile();

        service = module.get<PreAdsService>(PreAdsService);
    });

    afterEach(() => jest.clearAllMocks());

    describe('buildAdsQuery', () => {
        it('should build a base query with no filters', () => {
            const qb = service.buildAdsQuery({});
            expect(
                adsService.adsRepository.getRepository().createQueryBuilder,
            ).toHaveBeenCalledWith('ads');
            expect(qb.andWhere).toHaveBeenCalledWith('ads.deleted = false');
            expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('ads.file', 'fileLinks');
            expect(qb.leftJoinAndSelect).toHaveBeenCalledWith('fileLinks.file', 'file');
        });

        it('should add status filter when provided', () => {
            service.buildAdsQuery({ status: AdsStatusEnum.RUNNING });
            expect(adsService._qb.andWhere).toHaveBeenCalledWith('ads.status = :status', {
                status: AdsStatusEnum.RUNNING,
            });
        });

        it('should add searchTerm ILIKE filter when provided', () => {
            service.buildAdsQuery({ searchTerm: 'abc' });
            expect(adsService._qb.andWhere).toHaveBeenCalledWith(
                expect.stringContaining('ads.label ILIKE :searchTerm'),
                expect.objectContaining({ searchTerm: expect.stringContaining('%') }),
            );
        });

        it('should apply both status and searchTerm filters when both are provided', () => {
            service.buildAdsQuery({ status: AdsStatusEnum.SCHEDULED, searchTerm: 'promo' });
            const calls = adsService._qb.andWhere.mock.calls.map((c: any[]) => c[0]);
            expect(calls.some((c: string) => c.includes('ads.status = :status'))).toBe(true);
            expect(calls.some((c: string) => c.includes('ads.label ILIKE'))).toBe(true);
        });
    });

    describe('retrieveAdsQuery', () => {
        it('should apply orderBy, skip and take on top of base query', () => {
            service.retrieveAdsQuery(10, 5, {});
            expect(adsService._qb.orderBy).toHaveBeenCalledWith('ads.updatedAt', 'DESC');
            expect(adsService._qb.skip).toHaveBeenCalledWith(10);
            expect(adsService._qb.take).toHaveBeenCalledWith(5);
        });
    });

    describe('buildAdsQueryForMonth', () => {
        it('should build a query filtering ads for the given month', () => {
            const date = new Date('2024-03-15');
            service.buildAdsQueryForMonth(date);

            expect(adsService._qb.where).toHaveBeenCalledWith('ads.deleted = false');
            expect(adsService._qb.andWhere).toHaveBeenCalledWith(
                expect.stringContaining('ads.startDate <= :lastDay'),
                expect.objectContaining({
                    firstDay: new Date(2024, 2, 1),
                    lastDay: new Date(2024, 3, 0),
                }),
            );
            expect(adsService._qb.orderBy).toHaveBeenCalledWith('ads.startDate', 'ASC');
        });
    });

    describe('findAdsByMonth', () => {
        it('should select specific fields and call getMany', async () => {
            const ads = [makeAds()];
            adsService._qb.getMany.mockResolvedValue(ads);

            const result = await service.findAdsByMonth(new Date('2024-03-01'));

            expect(adsService._qb.select).toHaveBeenCalledWith([
                'ads.id',
                'ads.startDate',
                'ads.endDate',
                'ads.type',
            ]);
            expect(result).toBe(ads);
        });
    });

    describe('findAdsForCurrentMonth', () => {
        it('should filter by SCHEDULED status and call getMany', async () => {
            const ads = [makeAds()];
            adsService._qb.getMany.mockResolvedValue(ads);

            const result = await service.findAdsForCurrentMonth();

            expect(adsService._qb.andWhere).toHaveBeenCalledWith('ads.status = :status', {
                status: AdsStatusEnum.SCHEDULED,
            });
            expect(result).toBe(ads);
        });
    });

    describe('findRunningAdsForToday', () => {
        it('should log, apply filters, and return running ads', async () => {
            const ads = [makeAds({ status: AdsStatusEnum.RUNNING, isActive: true })];
            adsService._qb.getMany.mockResolvedValue(ads);

            const result = await service.findRunningAdsForToday();

            expect(adsService.logger.info).toHaveBeenCalled();
            expect(adsService._qb.andWhere).toHaveBeenCalledWith('ads.isActive = :isActive', {
                isActive: true,
            });
            expect(adsService._qb.andWhere).toHaveBeenCalledWith('ads.status = :status', {
                status: AdsStatusEnum.RUNNING,
            });
            expect(result).toBe(ads);
        });
    });

    describe('retrieveAddByCriteria', () => {
        it('should return the ad when found', async () => {
            const ads = makeAds();
            adsService.adsRepository.findActiveOne.mockResolvedValue(ads);

            const result = await service.retrieveAddByCriteria({ id: 'ads-1' });

            expect(adsService.otherUtils.formatCriteria).toHaveBeenCalledWith({ id: 'ads-1' });
            expect(adsService.logger.info).toHaveBeenCalled();
            expect(result).toBe(ads);
        });

        it('should throw notFound when ad does not exist', async () => {
            adsService.adsRepository.findActiveOne.mockResolvedValue(null);

            await expect(service.retrieveAddByCriteria({ id: 'missing' })).rejects.toThrow();
            expect(adsService.errorHandler.notFound).toHaveBeenCalled();
        });
    });

    describe('ensureNoDateOverlap', () => {
        const start = new Date('2024-01-01');
        const end = new Date('2024-01-31');

        it('should not throw when no overlapping ads exist (EXCLUSIVE type)', async () => {
            adsService._qb.getMany.mockResolvedValue([]);
            await expect(
                service.ensureNoDateOverlap(start, end, AdsTypeEnum.EXCLUSIVE),
            ).resolves.not.toThrow();
        });

        it('should throw badRequest when overlapping ad exists (EXCLUSIVE type)', async () => {
            adsService._qb.getMany.mockResolvedValue([
                makeAds({ label: 'Conflict', type: AdsTypeEnum.STANDARD }),
            ]);

            await expect(
                service.ensureNoDateOverlap(start, end, AdsTypeEnum.EXCLUSIVE),
            ).rejects.toThrow();
            expect(adsService.errorHandler.badRequest).toHaveBeenCalled();
        });

        it('should not throw when no exclusive overlapping ads (STANDARD type)', async () => {
            adsService._qb.getMany.mockResolvedValue([]);
            await expect(
                service.ensureNoDateOverlap(start, end, AdsTypeEnum.STANDARD),
            ).resolves.not.toThrow();
        });

        it('should throw badRequest when exclusive ad conflicts with STANDARD type', async () => {
            adsService._qb.getMany.mockResolvedValue([
                makeAds({ label: 'Exclusive Conflict', type: AdsTypeEnum.EXCLUSIVE }),
            ]);

            await expect(
                service.ensureNoDateOverlap(start, end, AdsTypeEnum.STANDARD),
            ).rejects.toThrow();
            expect(adsService.errorHandler.badRequest).toHaveBeenCalled();
        });

        it('should apply excludeAdsId filter when provided', async () => {
            adsService._qb.getMany.mockResolvedValue([]);
            await service.ensureNoDateOverlap(start, end, AdsTypeEnum.EXCLUSIVE, 'ads-exclude');

            expect(adsService._qb.andWhere).toHaveBeenCalledWith('ads.id != :excludeAdsId', {
                excludeAdsId: 'ads-exclude',
            });
        });
    });

    describe('buildAddEntity', () => {
        it('should return an AdsEntity with all required fields assigned', () => {
            const file = { id: 'fl-1' } as any;
            const result = service.buildAddEntity({
                label: 'Test',
                companyName: 'Corp',
                status: AdsStatusEnum.SCHEDULED,
                type: AdsTypeEnum.STANDARD,
                format: AdsFormatEnum.HORIZONTAL,
                file,
                amount: 200,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31'),
            });

            expect(result).toBeInstanceOf(AdsEntity);
            expect(result.label).toBe('Test');
            expect(result.file).toBe(file);
        });
    });

    describe('updateAdsDetails', () => {
        it('should return early message when no updates provided (undefined)', async () => {
            const result = await service.updateAdsDetails(makeAds(), undefined);
            expect(result).toEqual({ message: 'No updates provided for ads' });
        });

        it('should return early message when updates is an empty object', async () => {
            const result = await service.updateAdsDetails(makeAds(), {});
            expect(result).toEqual({ message: 'No updates provided for ads' });
        });

        it('should trim string fields (label, companyName) before updating', async () => {
            await service.updateAdsDetails(makeAds(), {
                label: '  New Label  ',
                companyName: '  Corp  ',
            });

            expect(adsService.adsRepository.update).toHaveBeenCalledWith(
                { id: 'ads-1' },
                expect.objectContaining({ label: 'New Label', companyName: 'Corp' }),
            );
        });

        it('should ignore string fields that are empty or whitespace-only', async () => {
            await service.updateAdsDetails(makeAds(), { label: '   ' });

            const payload = adsService.adsRepository.update.mock.calls[0][1];
            expect(payload.label).toBeUndefined();
        });

        it('should include all other fields (status, type, format, amount, dates, isActive)', async () => {
            const startDate = new Date('2024-03-01');
            const endDate = new Date('2024-03-31');

            await service.updateAdsDetails(makeAds(), {
                status: AdsStatusEnum.RUNNING,
                type: AdsTypeEnum.EXCLUSIVE,
                format: AdsFormatEnum.HORIZONTAL,
                amount: 500,
                startDate,
                endDate,
                isActive: true,
            });

            expect(adsService.adsRepository.update).toHaveBeenCalledWith(
                { id: 'ads-1' },
                expect.objectContaining({
                    status: AdsStatusEnum.RUNNING,
                    type: AdsTypeEnum.EXCLUSIVE,
                    format: AdsFormatEnum.HORIZONTAL,
                    amount: 500,
                    startDate,
                    endDate,
                    isActive: true,
                }),
            );
        });

        it('should include file entity field when provided', async () => {
            const file = { id: 'fl-2' } as any;
            await service.updateAdsDetails(makeAds(), { file });

            expect(adsService.adsRepository.update).toHaveBeenCalledWith(
                { id: 'ads-1' },
                expect.objectContaining({ file }),
            );
        });

        it('should skip other fields that are undefined', async () => {
            await service.updateAdsDetails(makeAds(), { status: undefined, amount: 300 });

            const payload = adsService.adsRepository.update.mock.calls[0][1];
            expect(payload.status).toBeUndefined();
            expect(payload.amount).toBe(300);
        });
    });

    describe('ensureUniqueAdsLabel', () => {
        it('should not throw when no errors from assertUniqueActive', async () => {
            adsService.adsRepository.assertUniqueActive.mockImplementation(
                async (_repo: any, _errors: Record<string, string>) => {},
            );
            await expect(service.ensureUniqueAdsLabel('Label', 'Corp')).resolves.not.toThrow();
        });

        it('should throw validation error when duplicate found', async () => {
            adsService.adsRepository.assertUniqueActive.mockImplementation(
                async (_repo: any, errors: Record<string, string>) => {
                    errors['label'] = 'Already exists';
                },
            );

            await expect(service.ensureUniqueAdsLabel('Label', 'Corp')).rejects.toThrow();
            expect(adsService.errorHandler.validation).toHaveBeenCalled();
        });
    });

    describe('ensureUniqueAdsLabelForUpdate', () => {
        it('should not throw when no errors', async () => {
            adsService.adsRepository.assertUniqueActive.mockImplementation(async () => {});
            await expect(
                service.ensureUniqueAdsLabelForUpdate('Label', 'Corp', makeAds()),
            ).resolves.not.toThrow();
        });

        it('should pass ads.id as excludeId and throw when duplicate found', async () => {
            adsService.adsRepository.assertUniqueActive.mockImplementation(
                async (_repo: any, errors: Record<string, string>) => {
                    errors['label'] = 'Already exists';
                },
            );

            const ads = makeAds({ id: 'ads-99' });
            await expect(
                service.ensureUniqueAdsLabelForUpdate('Label', 'Corp', ads),
            ).rejects.toThrow();

            expect(adsService.adsRepository.assertUniqueActive).toHaveBeenCalledWith(
                expect.anything(),
                expect.anything(),
                { label: 'Label', companyName: 'Corp' },
                'Ads',
                'ads-99',
            );
        });
    });

    describe('determineAdsStatus', () => {
        it('should return RUNNING when startDate is today', () => {
            const today = new Date();
            expect(service.determineAdsStatus(today)).toBe(AdsStatusEnum.RUNNING);
        });

        it('should return RUNNING when startDate is in the past', () => {
            expect(service.determineAdsStatus(new Date('2000-01-01'))).toBe(AdsStatusEnum.RUNNING);
        });

        it('should return SCHEDULED when startDate is in the future', () => {
            expect(service.determineAdsStatus(new Date('2099-12-31'))).toBe(
                AdsStatusEnum.SCHEDULED,
            );
        });
    });

    describe('prepareAdsData', () => {
        const makeCreateDto = (): CreateAdsDto =>
            ({
                label: '  Promo  ',
                companyName: '  Acme  ',
                startDate: new Date('2099-01-01'),
                endDate: new Date('2099-01-31'),
                format: AdsFormatEnum.HORIZONTAL,
                amount: 150,
                type: AdsTypeEnum.STANDARD,
                fileId: 'file-1',
            }) as any;

        it('should validate dates, check overlaps, link file, and return structured data', async () => {
            adsService._qb.getMany.mockResolvedValue([]);

            const result = await service.prepareAdsData(makeCreateDto());

            expect(adsService.otherUtils.validateAdsDates).toHaveBeenCalled();
            expect(adsService.fileLinkService.linkFileToEntity).toHaveBeenCalledWith(
                'file-1',
                FileUsageEnum.ADS,
            );
            expect(result.label).toBe('Promo');
            expect(result.companyName).toBe('Acme');
            expect(result.file).toEqual({ id: 'fl-1' });
        });
    });

    describe('persistAds', () => {
        it('should build entity and call repository.create', async () => {
            const created = makeAds();
            adsService.adsRepository.create.mockResolvedValue(created);

            const adsData = {
                label: 'Test',
                companyName: 'Corp',
                status: AdsStatusEnum.SCHEDULED,
                startDate: new Date(),
                endDate: new Date(),
                format: AdsFormatEnum.HORIZONTAL,
                type: AdsTypeEnum.STANDARD,
                file: { id: 'fl-1' },
                amount: 100,
            };

            const result = await service.persistAds(adsData);

            expect(adsService.adsRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({ label: 'Test', companyName: 'Corp' }),
            );
            expect(result).toBe(created);
        });
    });

    describe('validateDatePair', () => {
        it('should not throw when both dates are provided', () => {
            expect(() => service.validateDatePair(new Date(), new Date())).not.toThrow();
        });

        it('should not throw when both dates are undefined', () => {
            expect(() => service.validateDatePair(undefined, undefined)).not.toThrow();
        });

        it('should throw badRequest when only startDate is provided', () => {
            expect(() => service.validateDatePair(new Date(), undefined)).toThrow();
            expect(adsService.errorHandler.badRequest).toHaveBeenCalled();
        });

        it('should throw badRequest when only endDate is provided', () => {
            expect(() => service.validateDatePair(undefined, new Date())).toThrow();
            expect(adsService.errorHandler.badRequest).toHaveBeenCalled();
        });
    });

    describe('prepareAdsUpdates', () => {
        const makeUpdateDto = (overrides: Partial<UpdateAdsDto> = {}): UpdateAdsDto =>
            ({
                label: undefined,
                companyName: undefined,
                fileId: undefined,
                startDate: undefined,
                endDate: undefined,
                format: undefined,
                amount: undefined,
                type: undefined,
                ...overrides,
            }) as any;

        it('should return empty payload when dto has no fields', async () => {
            const result = await service.prepareAdsUpdates(makeUpdateDto(), makeAds());
            expect(result).toEqual({});
        });

        it('should update label and companyName when both are provided', async () => {
            adsService.adsRepository.assertUniqueActive.mockImplementation(async () => {});

            const result = await service.prepareAdsUpdates(
                makeUpdateDto({ label: 'New Label', companyName: 'New Corp' }),
                makeAds(),
            );

            expect(result.label).toBe('New Label');
            expect(result.companyName).toBe('New Corp');
        });

        it('should assign type when type is provided', async () => {
            const result = await service.prepareAdsUpdates(
                makeUpdateDto({ type: AdsTypeEnum.EXCLUSIVE }),
                makeAds(),
            );
            expect(result.type).toBe(AdsTypeEnum.EXCLUSIVE);
        });

        it('should fallback to ads.type when type is null/undefined in dto', async () => {
            const ads = makeAds({ type: AdsTypeEnum.STANDARD });
            const result = await service.prepareAdsUpdates(
                makeUpdateDto({ type: null as any }),
                ads,
            );
            expect(result.type).toBe(AdsTypeEnum.STANDARD);
        });

        it('should assign format and amount when provided', async () => {
            const result = await service.prepareAdsUpdates(
                makeUpdateDto({ format: AdsFormatEnum.HORIZONTAL, amount: 999 }),
                makeAds(),
            );
            expect(result.format).toBe(AdsFormatEnum.HORIZONTAL);
            expect(result.amount).toBe(999);
        });

        it('should process dates: validate, overlap check, determine status', async () => {
            adsService._qb.getMany.mockResolvedValue([]);

            const startDate = new Date('2099-02-01');
            const endDate = new Date('2099-02-28');

            const result = await service.prepareAdsUpdates(
                makeUpdateDto({ startDate, endDate, type: AdsTypeEnum.STANDARD }),
                makeAds(),
            );

            expect(adsService.otherUtils.validateAdsDates).toHaveBeenCalledWith(startDate, endDate);
            expect(result.startDate).toBe(startDate);
            expect(result.endDate).toBe(endDate);
            expect(result.status).toBe(AdsStatusEnum.SCHEDULED);
        });

        it('should link file when fileId is provided', async () => {
            const result = await service.prepareAdsUpdates(
                makeUpdateDto({ fileId: 'new-file-1' }),
                makeAds(),
            );

            expect(adsService.fileLinkService.linkFileToEntity).toHaveBeenCalledWith(
                'new-file-1',
                FileUsageEnum.ADS,
            );
            expect(result.file).toEqual({ id: 'fl-1' });
        });
    });

    describe('notifyAdsChange', () => {
        it('should send to /ads route', () => {
            service.notifyAdsChange(makeAds(), SocketEventEnum.NEW_ADS_CREATED);

            expect(adsService.socketService.sendDataToRoute).toHaveBeenCalledWith(
                '/ads',
                SocketEventEnum.NEW_ADS_CREATED,
                { payload: [{ id: 'ads-1' }] },
            );
        });

        it('should also send to /ads-running when ad is RUNNING and isActive', () => {
            const ads = makeAds({ status: AdsStatusEnum.RUNNING, isActive: true });
            service.notifyAdsChange(ads, SocketEventEnum.ADS_UPDATED);

            expect(adsService.socketService.sendDataToRoute).toHaveBeenCalledWith(
                '/ads-running',
                SocketEventEnum.ADS_UPDATED,
                { payload: [{ id: 'ads-1' }] },
            );
        });

        it('should NOT send to /ads-running when ad is RUNNING but not isActive', () => {
            const ads = makeAds({ status: AdsStatusEnum.RUNNING, isActive: false });
            service.notifyAdsChange(ads, SocketEventEnum.ADS_UPDATED);

            const routes = adsService.socketService.sendDataToRoute.mock.calls.map(
                (c: any[]) => c[0],
            );
            expect(routes).not.toContain('/ads-running');
        });

        it('should NOT send to /ads-running when isActive but status is SCHEDULED', () => {
            const ads = makeAds({ status: AdsStatusEnum.SCHEDULED, isActive: true });
            service.notifyAdsChange(ads, SocketEventEnum.ADS_UPDATED);

            const routes = adsService.socketService.sendDataToRoute.mock.calls.map(
                (c: any[]) => c[0],
            );
            expect(routes).not.toContain('/ads-running');
        });
    });

    describe('notifyAdsStatsUpdated', () => {
        it('should send transformed stats to /ads/badge-count with ADS_BADGE_COUNT event', () => {
            service.notifyAdsStatsUpdated({ total: 5 });

            expect(adsService.socketService.sendDataToRoute).toHaveBeenCalledWith(
                '/ads/badge-count',
                SocketEventEnum.ADS_BADGE_COUNT,
                { payload: { count: 1 } },
            );
        });
    });

    describe('scheduleInvalidateAdsCache', () => {
        it('should call cacheService.deleteKeysByBase with "ads"', async () => {
            await service.scheduleInvalidateAdsCache();
            expect(adsService.cacheService.deleteKeysByBase).toHaveBeenCalledWith('ads');
        });
    });

    describe('handlePostAdsCreation', () => {
        it('should call onCreate, notifyAdsChange, and notifyAdsStatsUpdated', async () => {
            const ads = makeAds();
            await service.handlePostAdsCreation(ads, AdsStatusEnum.SCHEDULED);

            expect(adsService.adsStatsService.onCreate).toHaveBeenCalledWith(
                AdsStatusEnum.SCHEDULED,
            );
            expect(adsService.socketService.sendDataToRoute).toHaveBeenCalledWith(
                '/ads',
                SocketEventEnum.NEW_ADS_CREATED,
                expect.anything(),
            );
            expect(adsService.socketService.sendDataToRoute).toHaveBeenCalledWith(
                '/ads/badge-count',
                SocketEventEnum.ADS_BADGE_COUNT,
                expect.anything(),
            );
        });
    });

    describe('handlePostAdsUpdate', () => {
        it('should call onStatusChange, notifyAdsChange, and notifyAdsStatsUpdated', async () => {
            const ads = makeAds();
            await service.handlePostAdsUpdate(ads, AdsStatusEnum.SCHEDULED, AdsStatusEnum.RUNNING);

            expect(adsService.adsStatsService.onStatusChange).toHaveBeenCalledWith(
                AdsStatusEnum.SCHEDULED,
                AdsStatusEnum.RUNNING,
            );
            expect(adsService.socketService.sendDataToRoute).toHaveBeenCalledWith(
                '/ads',
                SocketEventEnum.ADS_UPDATED,
                expect.anything(),
            );
        });

        it('should work without passing new status (undefined)', async () => {
            const ads = makeAds();
            await service.handlePostAdsUpdate(ads, AdsStatusEnum.RUNNING);

            expect(adsService.adsStatsService.onStatusChange).toHaveBeenCalledWith(
                AdsStatusEnum.RUNNING,
                undefined,
            );
        });
    });
});
