import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ErrorHandlerService } from '../../common/response';
import { EnvConfigService } from '../../utils/services/config';
import { OtherUtils } from '../../utils/services/tools';

describe('CacheService', () => {
    let service: CacheService;
    let redisClient: any;
    let logger: any;
    let errorHandlerService: any;
    let configService: any;
    let otherUtils: any;

    beforeEach(async () => {
        logger = {
            info: jest.fn(),
            warn: jest.fn(),
        };

        redisClient = {
            exists: jest.fn(),
            get: jest.fn(),
            set: jest.fn(),
            quit: jest.fn(),
            scanStream: jest.fn(),
            pipeline: jest.fn(),
        };

        errorHandlerService = {
            fail: jest.fn((message: string) => {
                throw new Error(message);
            }),
        };

        configService = {
            cacheMaxElement: 200,
            segmentSize: 50,
            defaultTTL: 300,
            shortTTL: 60,
        };

        otherUtils = {
            paginateResultsFromCache: jest.fn((data, total, page, limit) => ({
                data,
                total,
                page,
                limit,
            })),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CacheService,
                { provide: WINSTON_MODULE_PROVIDER, useValue: logger },
                { provide: 'REDIS_CLIENT', useValue: redisClient },
                {
                    provide: ErrorHandlerService,
                    useValue: errorHandlerService,
                },
                { provide: EnvConfigService, useValue: configService },
                { provide: OtherUtils, useValue: otherUtils },
            ],
        }).compile();

        service = module.get<CacheService>(CacheService);
        jest.clearAllMocks();
    });

    describe('generateRedisKey', () => {
        it('should generate a redis key from base and filters', () => {
            const key = service.generateRedisKey('testKey', {
                foo: 'bar',
                id: 1,
            });
            expect(key).toBe('testKey:foo=bar:id=1');
        });

        it('should handle empty filters', () => {
            const key = service.generateRedisKey('testKey', {});
            expect(key).toBe('testKey:');
        });

        it('should handle boolean values', () => {
            const key = service.generateRedisKey('testKey', {
                active: true,
                deleted: false,
            });
            expect(key).toBe('testKey:active=true:deleted=false');
        });

        it('should handle numeric values', () => {
            const key = service.generateRedisKey('testKey', {
                page: 1,
                limit: 10,
            });
            expect(key).toBe('testKey:page=1:limit=10');
        });
    });

    describe('isKeyExist', () => {
        it('should return true if key exists', async () => {
            redisClient.exists.mockResolvedValue(1);
            const result = await service.isKeyExist('someKey');
            expect(result).toBe(true);
            expect(logger.info).toHaveBeenCalledWith(
                'Checking if key someKey exists in the cache.',
            );
        });

        it('should return false if key does not exist', async () => {
            redisClient.exists.mockResolvedValue(0);
            const result = await service.isKeyExist('someKey');
            expect(result).toBe(false);
        });

        it('should call error handler on error', async () => {
            const error = new Error('Redis error');
            redisClient.exists.mockRejectedValue(error);

            await expect(service.isKeyExist('badKey')).rejects.toThrow(
                'IS_KEY_EXIST : Redis error',
            );
            expect(errorHandlerService.fail).toHaveBeenCalledWith(
                `IS_KEY_EXIST : ${error.message}`,
                `IS_KEY_EXIST : ${error.message}`,
            );
        });
    });

    describe('getItemsFromCacheByRange', () => {
        it('should return sliced items from single cache page', async () => {
            const mockDataPage1 = JSON.stringify(['item1', 'item2', 'item3', 'item4', 'item5']);
            redisClient.get.mockResolvedValue(mockDataPage1);

            const result = await service.getItemsFromCacheByRange('baseKey', 1, 2);
            expect(result).toEqual(['item2', 'item3']);
        });

        it('should return items from multiple cache pages', async () => {
            const page1Data = Array.from({ length: 50 }, (_, i) => `item${i + 1}`);
            const page2Data = Array.from({ length: 50 }, (_, i) => `item${i + 51}`);

            redisClient.get
                .mockResolvedValueOnce(JSON.stringify(page1Data))
                .mockResolvedValueOnce(JSON.stringify(page2Data));

            const result = await service.getItemsFromCacheByRange('baseKey', 40, 20);
            expect(result).toHaveLength(20);
            expect(result[0]).toBe('item41');
        });

        it('should log a warning if a cache page is missing', async () => {
            redisClient.get.mockResolvedValue(null);
            const result = await service.getItemsFromCacheByRange('baseKey', 0, 2);
            expect(logger.warn).toHaveBeenCalledWith('Redis cache missing for baseKey:page=1');
            expect(result).toEqual([]);
        });

        it('should handle empty cache gracefully', async () => {
            redisClient.get.mockResolvedValue(null);
            const result = await service.getItemsFromCacheByRange('baseKey', 0, 10);
            expect(result).toEqual([]);
        });
    });

    describe('getAndCacheFreshSegmentedData', () => {
        it('should fetch, transform, and paginate data', async () => {
            const mockData = Array.from({ length: 100 }, (_, i) => ({
                id: i + 1,
            }));
            const fetchFn = jest.fn().mockResolvedValue(mockData);
            const transformFn = jest.fn((items) =>
                items.map((i: any) => ({ ...i, transformed: true })),
            );

            redisClient.set.mockResolvedValue('OK');

            await service.getAndCacheFreshSegmentedData(
                'baseKey',
                {
                    startIndex: 10,
                    trancheStart: 0,
                    limit: 10,
                    realTotal: 100,
                    trancheTTL: 60,
                },
                fetchFn,
                transformFn,
            );

            expect(fetchFn).toHaveBeenCalled();
            expect(transformFn).toHaveBeenCalled();
            expect(otherUtils.paginateResultsFromCache).toHaveBeenCalledWith(
                expect.any(Array),
                100,
                2,
                10,
            );
        });

        it('should initiate background caching', async () => {
            const mockData = Array.from({ length: 50 }, (_, i) => ({
                id: i + 1,
            }));
            const fetchFn = jest.fn().mockResolvedValue(mockData);
            const transformFn = jest.fn((items) => items);

            redisClient.set.mockResolvedValue('OK');
            jest.spyOn(service, 'cacheSegmentedResults').mockResolvedValue();

            await service.getAndCacheFreshSegmentedData(
                'baseKey',
                {
                    startIndex: 0,
                    trancheStart: 0,
                    limit: 10,
                    realTotal: 50,
                    trancheTTL: 60,
                },
                fetchFn,
                transformFn,
            );

            // Wait for setImmediate
            await new Promise((resolve) => setImmediate(resolve));

            expect(service.cacheSegmentedResults).toHaveBeenCalledWith('baseKey', mockData, 60);
        });
    });

    describe('getSmartPaginatedResult', () => {
        const setupMocksForSmartPagination = () => {
            redisClient.exists.mockResolvedValue(0);
            redisClient.set.mockResolvedValue('OK');

            const mockData = Array.from({ length: 50 }, (_, i) => ({
                id: i + 1,
            }));
            const fetchFn = jest.fn().mockResolvedValue(mockData);
            const transformFn = jest.fn((items) => items);

            jest.spyOn(service, 'getAndCacheFreshSegmentedData');

            return { mockData, fetchFn, transformFn };
        };

        it('should fetch fresh data when cache does not exist', async () => {
            redisClient.exists.mockResolvedValue(0);
            redisClient.set.mockResolvedValue('OK');

            const mockData = Array.from({ length: 100 }, (_, i) => ({
                id: i + 1,
            }));
            const fetchFn = jest.fn().mockResolvedValue(mockData);
            const transformFn = jest.fn((items) => items);

            await service.getSmartPaginatedResult('baseKey', 100, 0, 10, fetchFn, transformFn);

            expect(redisClient.exists).toHaveBeenCalled();
            expect(fetchFn).toHaveBeenCalled();
        });

        it('should use cached data when cache exists', async () => {
            redisClient.exists.mockResolvedValue(1);
            const mockCachedData = JSON.stringify(
                Array.from({ length: 10 }, (_, i) => ({ id: i + 1 })),
            );
            redisClient.get.mockResolvedValue(mockCachedData);

            const fetchFn = jest.fn();
            const transformFn = jest.fn((items) => items);

            await service.getSmartPaginatedResult('baseKey', 100, 0, 10, fetchFn, transformFn);

            expect(redisClient.exists).toHaveBeenCalled();
            expect(fetchFn).not.toHaveBeenCalled();
            expect(redisClient.get).toHaveBeenCalled();
        });

        it('should use defaultTTL for first tranche', async () => {
            const { fetchFn, transformFn } = setupMocksForSmartPagination();

            await service.getSmartPaginatedResult('baseKey', 100, 0, 10, fetchFn, transformFn);

            expect(service.getAndCacheFreshSegmentedData).toHaveBeenCalledWith(
                'baseKey:tranche=0',
                expect.objectContaining({
                    trancheTTL: 300, // defaultTTL
                }),
                fetchFn,
                transformFn,
            );
        });

        it('should use shortTTL for non-first tranches', async () => {
            const { fetchFn, transformFn } = setupMocksForSmartPagination();

            await service.getSmartPaginatedResult(
                'baseKey',
                500,
                250, // Will be in tranche 1
                10,
                fetchFn,
                transformFn,
            );

            expect(service.getAndCacheFreshSegmentedData).toHaveBeenCalledWith(
                'baseKey:tranche=1',
                expect.objectContaining({
                    trancheTTL: 60, // shortTTL
                }),
                fetchFn,
                transformFn,
            );
        });
    });

    describe('cacheSegmentedResults', () => {
        it('should cache segmented data with TTL', async () => {
            const data = Array.from({ length: 120 }, (_, i) => `item${i + 1}`);
            redisClient.set.mockResolvedValue('OK');

            await service.cacheSegmentedResults('myKey', data, 100);

            expect(logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Caching 120 items across 3 pages'),
            );
            expect(redisClient.set).toHaveBeenCalledTimes(3);
        });

        it('should use default TTL when ttlInSeconds is not provided', async () => {
            const data = Array.from({ length: 10 }, (_, i) => `item${i}`);
            redisClient.set.mockResolvedValue('OK');

            await service.cacheSegmentedResults('myKey', data);

            expect(redisClient.set).toHaveBeenCalledWith(
                'myKey:page=1',
                expect.any(String),
                'EX',
                60, // shortTTL
            );
        });

        it('should limit caching to cacheMaxElement items', async () => {
            const data = Array.from({ length: 500 }, (_, i) => `item${i + 1}`);
            redisClient.set.mockResolvedValue('OK');

            await service.cacheSegmentedResults('myKey', data, 100);

            expect(logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Caching 200 items'), // Limited to cacheMaxElement
            );
        });

        it('should log a warning if Redis set fails', async () => {
            redisClient.set.mockRejectedValue(new Error('Set failed'));
            const data = Array.from({ length: 10 }, (_, i) => `item${i}`);
            await service.cacheSegmentedResults('failKey', data, 100);
            expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Failed to cache'));
        });

        it('should handle invalid TTL by using shortTTL', async () => {
            const data = Array.from({ length: 10 }, (_, i) => `item${i}`);
            redisClient.set.mockResolvedValue('OK');

            await service.cacheSegmentedResults('myKey', data, -1);

            expect(redisClient.set).toHaveBeenCalledWith(
                'myKey:page=1',
                expect.any(String),
                'EX',
                60, // shortTTL
            );
        });

        it('should cache each segment correctly', async () => {
            const data = Array.from({ length: 100 }, (_, i) => `item${i + 1}`);
            redisClient.set.mockResolvedValue('OK');

            await service.cacheSegmentedResults('myKey', data, 100);

            expect(redisClient.set).toHaveBeenCalledWith(
                'myKey:page=1',
                expect.stringContaining('item1'),
                'EX',
                100,
            );
            expect(redisClient.set).toHaveBeenCalledWith(
                'myKey:page=2',
                expect.stringContaining('item51'),
                'EX',
                100,
            );
        });
    });

    describe('retrieveGenericPaginated', () => {
        it('should retrieve and paginate data using query function', async () => {
            const mockQueryBuilder = {
                clone: jest.fn().mockReturnThis(),
                getCount: jest.fn().mockResolvedValue(100),
                getMany: jest
                    .fn()
                    .mockResolvedValue(Array.from({ length: 50 }, (_, i) => ({ id: i + 1 }))),
            };

            const queryFn = jest.fn().mockReturnValue(mockQueryBuilder);
            const transformFn = jest.fn((items) => items);

            redisClient.exists.mockResolvedValue(0);
            redisClient.set.mockResolvedValue('OK');

            await service.retrieveGenericPaginated(
                'baseKey',
                1,
                10,
                { status: 'active' },
                queryFn,
                transformFn,
            );

            expect(queryFn).toHaveBeenCalledWith(0, 200, { status: 'active' });
            expect(mockQueryBuilder.getCount).toHaveBeenCalled();
            expect(mockQueryBuilder.getMany).toHaveBeenCalled();
        });

        it('should calculate correct offset for second page', async () => {
            const mockQueryBuilder = {
                clone: jest.fn().mockReturnThis(),
                getCount: jest.fn().mockResolvedValue(100),
                getMany: jest.fn().mockResolvedValue([]),
            };

            const queryFn = jest.fn().mockReturnValue(mockQueryBuilder);
            const transformFn = jest.fn((items) => items);

            redisClient.exists.mockResolvedValue(0);
            redisClient.set.mockResolvedValue('OK');

            await service.retrieveGenericPaginated('baseKey', 2, 10, {}, queryFn, transformFn);

            expect(queryFn).toHaveBeenCalledWith(0, 200, {});
        });
    });

    describe('deleteKeysByBase', () => {
        it('should delete all keys matching the pattern', async () => {
            const mockKeys = ['baseKey:page=1', 'baseKey:page=2'];
            const mockPipeline = {
                del: jest.fn(),
                exec: jest.fn().mockResolvedValue([]),
            };

            const mockStream = {
                on: jest.fn((event, callback) => {
                    if (event === 'data') {
                        callback(mockKeys);
                    } else if (event === 'end') {
                        setImmediate(callback);
                    }
                    return mockStream;
                }),
            };

            redisClient.scanStream.mockReturnValue(mockStream);
            redisClient.pipeline.mockReturnValue(mockPipeline);

            await service.deleteKeysByBase('baseKey');

            expect(redisClient.scanStream).toHaveBeenCalledWith({
                match: 'baseKey:*',
                count: 100,
            });
            expect(logger.info).toHaveBeenCalledWith('Deleting 2 keys matching pattern: baseKey:*');
            expect(logger.info).toHaveBeenCalledWith(
                'Completed deletion of keys matching: baseKey:*',
            );
        });

        it('should handle errors during key deletion', async () => {
            const mockPipeline = {
                del: jest.fn(),
                exec: jest.fn().mockRejectedValue(new Error('Delete failed')),
            };

            const mockStream = {
                on: jest.fn((event, callback) => {
                    if (event === 'data') {
                        callback(['key1']);
                    } else if (event === 'end') {
                        setImmediate(callback);
                    }
                    return mockStream;
                }),
            };

            redisClient.scanStream.mockReturnValue(mockStream);
            redisClient.pipeline.mockReturnValue(mockPipeline);

            await service.deleteKeysByBase('baseKey');

            expect(logger.warn).toHaveBeenCalledWith('Failed to delete keys: Delete failed');
        });

        it('should handle scan stream errors', async () => {
            const mockStream = {
                on: jest.fn((event, callback) => {
                    if (event === 'error') {
                        callback(new Error('Scan failed'));
                    }
                    return mockStream;
                }),
            };

            redisClient.scanStream.mockReturnValue(mockStream);

            await expect(service.deleteKeysByBase('baseKey')).rejects.toThrow('Scan failed');
            expect(logger.warn).toHaveBeenCalledWith('Error while scanning keys: Scan failed');
        });

        it('should handle empty results', async () => {
            const mockStream = {
                on: jest.fn((event, callback) => {
                    if (event === 'data') {
                        callback([]);
                    } else if (event === 'end') {
                        setImmediate(callback);
                    }
                    return mockStream;
                }),
            };

            redisClient.scanStream.mockReturnValue(mockStream);

            await service.deleteKeysByBase('baseKey');

            expect(logger.info).toHaveBeenCalledWith(
                'Completed deletion of keys matching: baseKey:*',
            );
        });
    });

    describe('onModuleDestroy', () => {
        it('should quit redis connection', async () => {
            redisClient.quit.mockResolvedValue('OK');
            await service.onModuleDestroy();
            expect(redisClient.quit).toHaveBeenCalled();
        });
    });
});
