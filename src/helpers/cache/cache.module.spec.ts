import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ErrorHandlerService } from '../../common/response';
import { EnvConfigService } from '../../utils/services/config';
import { OtherUtils } from '../../utils/services/tools';
import Redis from 'ioredis';

jest.mock('ioredis');

describe('CacheModule', () => {
    let module: TestingModule;

    const mockLogger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    };

    const mockErrorHandler = {
        fail: jest.fn((message: string) => {
            throw new Error(message);
        }),
    };

    const mockEnvConfig = {
        cacheMaxElement: 200,
        segmentSize: 50,
        defaultTTL: 300,
        shortTTL: 60,
    };

    const mockOtherUtils = {
        paginateResultsFromCache: jest.fn((data, total, page, limit) => ({
            data,
            total,
            page,
            limit,
        })),
    };

    const mockConfigService = {
        get: jest.fn((key: string) => {
            if (key === 'REDIS_URL') return 'redis://localhost:6379';
            return null;
        }),
        getOrThrow: jest.fn((key: string) => {
            const config = {
                REDIS_HOST: 'localhost',
                REDIS_PORT: '6379',
                REDIS_PASSWORD: 'password',
            };
            return config[key];
        }),
    };

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [
                CacheService,
                {
                    provide: WINSTON_MODULE_PROVIDER,
                    useValue: mockLogger,
                },
                {
                    provide: 'REDIS_CLIENT',
                    useFactory: () => new Redis('redis://localhost:6379'),
                },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandler,
                },
                {
                    provide: EnvConfigService,
                    useValue: mockEnvConfig,
                },
                {
                    provide: OtherUtils,
                    useValue: mockOtherUtils,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    it('should instantiate CacheService', () => {
        const cacheService = module.get<CacheService>(CacheService);
        expect(cacheService).toBeDefined();
    });

    it('should provide REDIS_CLIENT', () => {
        const redisClient = module.get('REDIS_CLIENT');
        expect(redisClient).toBeDefined();
    });

    it('should export CacheService', () => {
        const cacheService = module.get<CacheService>(CacheService);
        expect(cacheService).toBeInstanceOf(CacheService);
    });

    describe('Redis Client Factory', () => {
        it('should create Redis client with REDIS_URL when available', async () => {
            const testModule = await Test.createTestingModule({
                providers: [
                    {
                        provide: 'REDIS_CLIENT',
                        useFactory: (configService: ConfigService) => {
                            const redisUrl = configService.get<string>('REDIS_URL');
                            if (redisUrl) return new Redis(redisUrl);
                            return new Redis({
                                host: configService.getOrThrow<string>('REDIS_HOST'),
                                port: Number.parseInt(
                                    configService.getOrThrow<string>('REDIS_PORT'),
                                    10,
                                ),
                                password: configService.getOrThrow<string>('REDIS_PASSWORD'),
                            });
                        },
                        inject: [ConfigService],
                    },
                    {
                        provide: ConfigService,
                        useValue: mockConfigService,
                    },
                ],
            }).compile();

            const redisClient = testModule.get('REDIS_CLIENT');
            expect(redisClient).toBeDefined();
            expect(Redis).toHaveBeenCalledWith('redis://localhost:6379');
        });

        it('should create Redis client with individual config when REDIS_URL is not available', async () => {
            const configServiceWithoutUrl = {
                get: jest.fn(() => null),
                getOrThrow: jest.fn((key: string) => {
                    const config = {
                        REDIS_HOST: 'test-host',
                        REDIS_PORT: '6380',
                        REDIS_PASSWORD: 'test-password',
                    };
                    return config[key];
                }),
            };

            const testModule = await Test.createTestingModule({
                providers: [
                    {
                        provide: 'REDIS_CLIENT',
                        useFactory: (configService: ConfigService) => {
                            const redisUrl = configService.get<string>('REDIS_URL');
                            if (redisUrl) return new Redis(redisUrl);
                            return new Redis({
                                host: configService.getOrThrow<string>('REDIS_HOST'),
                                port: Number.parseInt(
                                    configService.getOrThrow<string>('REDIS_PORT'),
                                    10,
                                ),
                                password: configService.getOrThrow<string>('REDIS_PASSWORD'),
                            });
                        },
                        inject: [ConfigService],
                    },
                    {
                        provide: ConfigService,
                        useValue: configServiceWithoutUrl,
                    },
                ],
            }).compile();

            const redisClient = testModule.get('REDIS_CLIENT');
            expect(redisClient).toBeDefined();
            expect(Redis).toHaveBeenCalledWith({
                host: 'test-host',
                port: 6380,
                password: 'test-password',
            });
        });
    });
});
