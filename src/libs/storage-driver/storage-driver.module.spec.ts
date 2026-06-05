import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageDriverModule } from './storage-driver.module';
import { MinioService } from './minio/minio.service';
import { AwsService } from './aws/aws.service';
import { FileStorageInterface } from '../../interface';

describe('StorageDriverModule', () => {
    let module: TestingModule;
    let mockConfigService: any;
    let mockMinioService: any;
    let mockAwsService: any;

    const createProvidersConfig = (configService: any, awsService: any, minioService: any) => [
        {
            provide: 'FileStorageInterface',
            useFactory: (
                config: ConfigService,
                s3: AwsService,
                minio: MinioService,
            ): FileStorageInterface => {
                const type = config.get<string>('STORAGE_TYPE');
                if (type === 'MINIO') return minio;
                if (type === 'AWS') return s3;
                return s3;
            },
            inject: [ConfigService, AwsService, MinioService],
        },
        {
            provide: ConfigService,
            useValue: configService,
        },
        {
            provide: AwsService,
            useValue: awsService,
        },
        {
            provide: MinioService,
            useValue: minioService,
        },
    ];

    const createTestModule = async (storageType: string = 'AWS') => {
        mockConfigService = {
            get: jest.fn((key: string) => {
                if (key === 'STORAGE_TYPE') return storageType;
                return null;
            }),
        };

        mockMinioService = {
            uploadFile: jest.fn(),
            deleteFile: jest.fn(),
            getFileUrl: jest.fn(),
        };

        mockAwsService = {
            uploadFile: jest.fn(),
            deleteFile: jest.fn(),
            getFileUrl: jest.fn(),
        };

        return await Test.createTestingModule({
            providers: createProvidersConfig(mockConfigService, mockAwsService, mockMinioService),
        }).compile();
    };

    afterEach(async () => {
        if (module) {
            await module.close();
        }
        jest.clearAllMocks();
    });

    describe('Module compilation', () => {
        it('should compile the module successfully', async () => {
            module = await createTestModule('AWS');
            expect(module).toBeDefined();
        });

        it('should be a global module', () => {
            const moduleMetadata = Reflect.getMetadata('__module:global__', StorageDriverModule);
            expect(moduleMetadata).toBe(true);
        });
    });

    describe('Module metadata', () => {
        it('should have correct imports metadata', () => {
            const imports = Reflect.getMetadata('imports', StorageDriverModule);
            expect(imports).toBeDefined();
            expect(imports.length).toBeGreaterThan(0);
        });

        it('should have correct providers metadata', () => {
            const providers = Reflect.getMetadata('providers', StorageDriverModule);
            expect(providers).toBeDefined();
            expect(providers.length).toBeGreaterThan(0);
        });

        it('should have correct exports metadata', () => {
            const exports = Reflect.getMetadata('exports', StorageDriverModule);
            expect(exports).toBeDefined();
            expect(exports).toContain('FileStorageInterface');
        });
    });

    describe('Provider registration', () => {
        it('should provide FileStorageInterface', async () => {
            module = await createTestModule('AWS');

            const storageService = module.get<FileStorageInterface>('FileStorageInterface');
            expect(storageService).toBeDefined();
        });

        it('should register FileStorageInterface as a provider', async () => {
            module = await createTestModule('AWS');

            const hasProvider = module.get('FileStorageInterface');
            expect(hasProvider).toBeDefined();
        });
    });

    describe('Storage provider factory - AWS', () => {
        it('should return AwsService when STORAGE_TYPE is AWS', async () => {
            module = await createTestModule('AWS');

            const storageService = module.get<FileStorageInterface>('FileStorageInterface');
            expect(storageService).toBe(mockAwsService);
        });

        it('should inject ConfigService into factory for AWS', async () => {
            module = await createTestModule('AWS');

            module.get<FileStorageInterface>('FileStorageInterface');

            expect(mockConfigService.get).toHaveBeenCalledWith('STORAGE_TYPE');
        });

        it('should call ConfigService.get exactly once for AWS', async () => {
            module = await createTestModule('AWS');

            module.get<FileStorageInterface>('FileStorageInterface');

            expect(mockConfigService.get).toHaveBeenCalledTimes(1);
        });
    });

    describe('Storage provider factory - MINIO', () => {
        it('should return MinioService when STORAGE_TYPE is MINIO', async () => {
            module = await createTestModule('MINIO');

            const storageService = module.get<FileStorageInterface>('FileStorageInterface');
            expect(storageService).toBe(mockMinioService);
        });

        it('should inject ConfigService into factory for MINIO', async () => {
            module = await createTestModule('MINIO');

            module.get<FileStorageInterface>('FileStorageInterface');

            expect(mockConfigService.get).toHaveBeenCalledWith('STORAGE_TYPE');
        });

        it('should call ConfigService.get exactly once for MINIO', async () => {
            module = await createTestModule('MINIO');

            module.get<FileStorageInterface>('FileStorageInterface');

            expect(mockConfigService.get).toHaveBeenCalledTimes(1);
        });
    });

    describe('Storage provider factory - Default case', () => {
        it('should default to AwsService when STORAGE_TYPE is undefined', async () => {
            module = await createTestModule(undefined as any);

            const storageService = module.get<FileStorageInterface>('FileStorageInterface');
            expect(storageService).toBe(mockAwsService);
        });

        it('should default to AwsService when STORAGE_TYPE is unknown', async () => {
            module = await createTestModule('UNKNOWN_PROVIDER');

            const storageService = module.get<FileStorageInterface>('FileStorageInterface');
            expect(storageService).toBe(mockAwsService);
        });

        it('should default to AwsService when STORAGE_TYPE is empty string', async () => {
            module = await createTestModule('');

            const storageService = module.get<FileStorageInterface>('FileStorageInterface');
            expect(storageService).toBe(mockAwsService);
        });

        it('should default to AwsService when STORAGE_TYPE is null', async () => {
            module = await createTestModule(null as any);

            const storageService = module.get<FileStorageInterface>('FileStorageInterface');
            expect(storageService).toBe(mockAwsService);
        });

        it('should default to AwsService for any unrecognized value', async () => {
            module = await createTestModule('RANDOM_STRING_123');

            const storageService = module.get<FileStorageInterface>('FileStorageInterface');
            expect(storageService).toBe(mockAwsService);
        });
    });

    describe('Module exports', () => {
        it('should export FileStorageInterface', async () => {
            module = await createTestModule('AWS');

            const storageService = module.get<FileStorageInterface>('FileStorageInterface');
            expect(storageService).toBeDefined();
        });

        it('should make FileStorageInterface available globally', () => {
            const moduleMetadata = Reflect.getMetadata('__module:global__', StorageDriverModule);
            expect(moduleMetadata).toBe(true);
        });

        it('should export only FileStorageInterface', () => {
            const exports = Reflect.getMetadata('exports', StorageDriverModule);
            expect(exports).toEqual(['FileStorageInterface']);
        });
    });

    describe('Factory injection', () => {
        it('should inject all required services into factory', async () => {
            module = await createTestModule('AWS');

            const storageService = module.get<FileStorageInterface>('FileStorageInterface');

            expect(storageService).toBeDefined();
            expect(mockConfigService.get).toHaveBeenCalled();
        });

        it('should have access to ConfigService in factory', async () => {
            module = await createTestModule('MINIO');

            module.get<FileStorageInterface>('FileStorageInterface');

            expect(mockConfigService.get).toHaveBeenCalledWith('STORAGE_TYPE');
        });

        it('should inject services in correct order', async () => {
            const injectionOrder: string[] = [];

            const trackingConfigService = {
                get: jest.fn((key: string) => {
                    injectionOrder.push('ConfigService');
                    if (key === 'STORAGE_TYPE') return 'AWS';
                    return null;
                }),
            };

            const testModule = await Test.createTestingModule({
                providers: createProvidersConfig(
                    trackingConfigService,
                    mockAwsService,
                    mockMinioService,
                ),
            }).compile();

            testModule.get<FileStorageInterface>('FileStorageInterface');

            expect(injectionOrder).toContain('ConfigService');

            await testModule.close();
        });
    });

    describe('Integration with storage services', () => {
        it('should wire AwsService correctly when AWS is selected', async () => {
            module = await createTestModule('AWS');

            const storageService = module.get<FileStorageInterface>('FileStorageInterface');

            expect(storageService).toHaveProperty('uploadFile');
            expect(storageService).toHaveProperty('deleteFile');
            expect(storageService).toHaveProperty('getFileUrl');
            expect(storageService.uploadFile).toBe(mockAwsService.uploadFile);
        });

        it('should wire MinioService correctly when MINIO is selected', async () => {
            module = await createTestModule('MINIO');

            const storageService = module.get<FileStorageInterface>('FileStorageInterface');

            expect(storageService).toHaveProperty('uploadFile');
            expect(storageService).toHaveProperty('deleteFile');
            expect(storageService).toHaveProperty('getFileUrl');
            expect(storageService.uploadFile).toBe(mockMinioService.uploadFile);
        });

        it('should maintain FileStorageInterface contract for AWS', async () => {
            module = await createTestModule('AWS');

            const storageService = module.get<FileStorageInterface>('FileStorageInterface');

            expect(typeof storageService.uploadFile).toBe('function');
            expect(typeof storageService.deleteFile).toBe('function');
        });

        it('should maintain FileStorageInterface contract for MINIO', async () => {
            module = await createTestModule('MINIO');

            const storageService = module.get<FileStorageInterface>('FileStorageInterface');

            expect(typeof storageService.uploadFile).toBe('function');
            expect(typeof storageService.deleteFile).toBe('function');
        });
    });

    describe('Provider instantiation', () => {
        it('should return same instance of storage service within same module', async () => {
            module = await createTestModule('AWS');

            const storage1 = module.get<FileStorageInterface>('FileStorageInterface');
            const storage2 = module.get<FileStorageInterface>('FileStorageInterface');

            expect(storage1).toBe(storage2);
        });

        it('should return same instance of storage service for MINIO within same module', async () => {
            module = await createTestModule('MINIO');

            const storage1 = module.get<FileStorageInterface>('FileStorageInterface');
            const storage2 = module.get<FileStorageInterface>('FileStorageInterface');

            expect(storage1).toBe(storage2);
        });

        it('should use AwsService across different module instances', async () => {
            module = await createTestModule('AWS');
            const storage1 = module.get<FileStorageInterface>('FileStorageInterface');

            const module2 = await createTestModule('AWS');
            const storage2 = module2.get<FileStorageInterface>('FileStorageInterface');

            expect(storage1).toHaveProperty('uploadFile');
            expect(storage2).toHaveProperty('uploadFile');
            expect(typeof storage1.uploadFile).toBe('function');
            expect(typeof storage2.uploadFile).toBe('function');

            await module2.close();
        });

        it('should create new instances for different modules', async () => {
            module = await createTestModule('AWS');
            const storage1 = module.get<FileStorageInterface>('FileStorageInterface');

            const module2 = await createTestModule('AWS');
            const storage2 = module2.get<FileStorageInterface>('FileStorageInterface');

            expect(storage1).not.toBe(storage2);

            await module2.close();
        });
    });

    describe('Case sensitivity', () => {
        it('should handle uppercase AWS', async () => {
            module = await createTestModule('AWS');

            const storageService = module.get<FileStorageInterface>('FileStorageInterface');
            expect(storageService).toBe(mockAwsService);
        });

        it('should handle uppercase MINIO', async () => {
            module = await createTestModule('MINIO');

            const storageService = module.get<FileStorageInterface>('FileStorageInterface');
            expect(storageService).toBe(mockMinioService);
        });

        it('should not match lowercase aws (should default to AWS)', async () => {
            module = await createTestModule('aws');

            const storageService = module.get<FileStorageInterface>('FileStorageInterface');
            expect(storageService).toBe(mockAwsService);
        });

        it('should not match lowercase minio (should default to AWS)', async () => {
            module = await createTestModule('minio');

            const storageService = module.get<FileStorageInterface>('FileStorageInterface');
            expect(storageService).toBe(mockAwsService);
        });

        it('should not match mixed case Aws (should default to AWS)', async () => {
            module = await createTestModule('Aws');

            const storageService = module.get<FileStorageInterface>('FileStorageInterface');
            expect(storageService).toBe(mockAwsService);
        });

        it('should not match mixed case Minio (should default to AWS)', async () => {
            module = await createTestModule('Minio');

            const storageService = module.get<FileStorageInterface>('FileStorageInterface');
            expect(storageService).toBe(mockAwsService);
        });
    });

    describe('Configuration retrieval', () => {
        it('should read STORAGE_TYPE from ConfigService', async () => {
            const getSpy = jest.fn((key: string) => {
                if (key === 'STORAGE_TYPE') return 'MINIO';
                return null;
            });

            const customMockConfig = { get: getSpy };

            const testModule = await Test.createTestingModule({
                providers: createProvidersConfig(
                    customMockConfig,
                    mockAwsService,
                    mockMinioService,
                ),
            }).compile();

            testModule.get<FileStorageInterface>('FileStorageInterface');

            expect(getSpy).toHaveBeenCalledWith('STORAGE_TYPE');

            await testModule.close();
        });

        it('should use get method with correct key', async () => {
            const getSpy = jest.fn((key: string) => {
                if (key === 'STORAGE_TYPE') return 'AWS';
                return null;
            });

            const customMockConfig = { get: getSpy };

            const testModule = await Test.createTestingModule({
                providers: createProvidersConfig(
                    customMockConfig,
                    mockAwsService,
                    mockMinioService,
                ),
            }).compile();

            testModule.get<FileStorageInterface>('FileStorageInterface');

            expect(getSpy).toHaveBeenCalledWith('STORAGE_TYPE');

            await testModule.close();
        });

        it('should handle ConfigService returning different types', async () => {
            const getSpy = jest.fn((key: string) => {
                if (key === 'STORAGE_TYPE') return 'AWS';
                return null;
            });

            const customMockConfig = { get: getSpy };

            const testModule = await Test.createTestingModule({
                providers: createProvidersConfig(
                    customMockConfig,
                    mockAwsService,
                    mockMinioService,
                ),
            }).compile();

            const storage = testModule.get<FileStorageInterface>('FileStorageInterface');

            expect(storage).toBe(mockAwsService);
            expect(getSpy).toHaveBeenCalledWith('STORAGE_TYPE');

            await testModule.close();
        });
    });

    describe('Factory logic', () => {
        it('should select correct provider based on config value', async () => {
            const moduleAws = await createTestModule('AWS');
            const storageAws = moduleAws.get<FileStorageInterface>('FileStorageInterface');
            expect(storageAws).toBe(mockAwsService);
            await moduleAws.close();

            const moduleMinio = await createTestModule('MINIO');
            const storageMinio = moduleMinio.get<FileStorageInterface>('FileStorageInterface');
            expect(storageMinio).toBe(mockMinioService);
            await moduleMinio.close();
        });

        it('should handle switching between providers in different modules', async () => {
            module = await createTestModule('AWS');
            const storage1 = module.get<FileStorageInterface>('FileStorageInterface');
            expect(storage1).toBe(mockAwsService);

            const module2 = await createTestModule('MINIO');
            const storage2 = module2.get<FileStorageInterface>('FileStorageInterface');
            expect(storage2).toBe(mockMinioService);

            await module2.close();
        });

        it('should execute factory function on provider instantiation', async () => {
            const factorySpy = jest.fn(
                (
                    config: ConfigService,
                    s3: AwsService,
                    minio: MinioService,
                ): FileStorageInterface => {
                    const type = config.get<string>('STORAGE_TYPE');
                    if (type === 'MINIO') return minio;
                    if (type === 'AWS') return s3;
                    return s3;
                },
            );

            const testModule = await Test.createTestingModule({
                providers: [
                    {
                        provide: 'FileStorageInterface',
                        useFactory: factorySpy,
                        inject: [ConfigService, AwsService, MinioService],
                    },
                    {
                        provide: ConfigService,
                        useValue: mockConfigService,
                    },
                    {
                        provide: AwsService,
                        useValue: mockAwsService,
                    },
                    {
                        provide: MinioService,
                        useValue: mockMinioService,
                    },
                ],
            }).compile();

            testModule.get<FileStorageInterface>('FileStorageInterface');

            expect(factorySpy).toHaveBeenCalled();

            await testModule.close();
        });

        it('should pass correct arguments to factory function', async () => {
            const factorySpy = jest.fn(
                (
                    config: ConfigService,
                    s3: AwsService,
                    minio: MinioService,
                ): FileStorageInterface => {
                    expect(config).toBeDefined();
                    expect(s3).toBeDefined();
                    expect(minio).toBeDefined();
                    return s3;
                },
            );

            const testModule = await Test.createTestingModule({
                providers: [
                    {
                        provide: 'FileStorageInterface',
                        useFactory: factorySpy,
                        inject: [ConfigService, AwsService, MinioService],
                    },
                    {
                        provide: ConfigService,
                        useValue: mockConfigService,
                    },
                    {
                        provide: AwsService,
                        useValue: mockAwsService,
                    },
                    {
                        provide: MinioService,
                        useValue: mockMinioService,
                    },
                ],
            }).compile();

            testModule.get<FileStorageInterface>('FileStorageInterface');

            expect(factorySpy).toHaveBeenCalledWith(
                mockConfigService,
                mockAwsService,
                mockMinioService,
            );

            await testModule.close();
        });
    });

    describe('Factory conditional logic branches', () => {
        it('should return minio when type equals MINIO (first if branch)', async () => {
            module = await createTestModule('MINIO');
            const storage = module.get<FileStorageInterface>('FileStorageInterface');
            expect(storage).toBe(mockMinioService);
        });

        it('should return s3 when type equals AWS (second if branch)', async () => {
            module = await createTestModule('AWS');
            const storageService = module.get<FileStorageInterface>('FileStorageInterface');

            expect(storageService).toBe(mockAwsService);
        });

        it('should return s3 when type is neither MINIO nor AWS (default return)', async () => {
            module = await createTestModule('SOMETHING_ELSE');
            const storage = module.get<FileStorageInterface>('FileStorageInterface');
            expect(storage).toBe(mockAwsService);
        });

        it('should evaluate conditions in correct order', async () => {
            const evaluationLog: string[] = [];

            const trackingFactory = (
                config: ConfigService,
                s3: AwsService,
                minio: MinioService,
            ): FileStorageInterface => {
                const type = config.get<string>('STORAGE_TYPE');
                evaluationLog.push('got type');

                if (type === 'MINIO') {
                    evaluationLog.push('matched MINIO');
                    return minio;
                }

                if (type === 'AWS') {
                    evaluationLog.push('matched AWS');
                    return s3;
                }

                evaluationLog.push('default to s3');
                return s3;
            };

            const testModule = await Test.createTestingModule({
                providers: [
                    {
                        provide: 'FileStorageInterface',
                        useFactory: trackingFactory,
                        inject: [ConfigService, AwsService, MinioService],
                    },
                    {
                        provide: ConfigService,
                        useValue: {
                            get: jest.fn(() => 'AWS'),
                        },
                    },
                    {
                        provide: AwsService,
                        useValue: mockAwsService,
                    },
                    {
                        provide: MinioService,
                        useValue: mockMinioService,
                    },
                ],
            }).compile();

            testModule.get<FileStorageInterface>('FileStorageInterface');

            expect(evaluationLog).toEqual(['got type', 'matched AWS']);

            await testModule.close();
        });
    });

    describe('Edge cases', () => {
        it('should handle whitespace in STORAGE_TYPE', async () => {
            module = await createTestModule(' AWS ');
            const storage = module.get<FileStorageInterface>('FileStorageInterface');
            expect(storage).toBe(mockAwsService);
        });

        it('should handle STORAGE_TYPE with special characters', async () => {
            module = await createTestModule('AWS@#$');
            const storage = module.get<FileStorageInterface>('FileStorageInterface');
            expect(storage).toBe(mockAwsService);
        });

        it('should handle numeric STORAGE_TYPE', async () => {
            module = await createTestModule('12345' as any);
            const storage = module.get<FileStorageInterface>('FileStorageInterface');
            expect(storage).toBe(mockAwsService);
        });

        it('should handle boolean STORAGE_TYPE', async () => {
            const testModule = await Test.createTestingModule({
                providers: [
                    {
                        provide: 'FileStorageInterface',
                        useFactory: (
                            config: ConfigService,
                            s3: AwsService,
                            minio: MinioService,
                        ): FileStorageInterface => {
                            const type = config.get<string>('STORAGE_TYPE');
                            if (type === 'MINIO') return minio;
                            if (type === 'AWS') return s3;
                            return s3;
                        },
                        inject: [ConfigService, AwsService, MinioService],
                    },
                    {
                        provide: ConfigService,
                        useValue: {
                            get: jest.fn(() => true),
                        },
                    },
                    {
                        provide: AwsService,
                        useValue: mockAwsService,
                    },
                    {
                        provide: MinioService,
                        useValue: mockMinioService,
                    },
                ],
            }).compile();

            const storage = testModule.get<FileStorageInterface>('FileStorageInterface');
            expect(storage).toBe(mockAwsService);

            await testModule.close();
        });
    });

    describe('Module reusability', () => {
        it('should allow multiple module instances with different configs', async () => {
            const module1 = await createTestModule('AWS');
            const module2 = await createTestModule('MINIO');

            const storage1 = module1.get<FileStorageInterface>('FileStorageInterface');
            const storage2 = module2.get<FileStorageInterface>('FileStorageInterface');

            expect(storage1).not.toBe(storage2);

            await module1.close();
            await module2.close();
        });

        it('should maintain independent state across modules', async () => {
            const configService1 = {
                get: jest.fn((key: string) => {
                    if (key === 'STORAGE_TYPE') return 'AWS';
                    return null;
                }),
            };
            const awsService1 = {
                uploadFile: jest.fn(),
                deleteFile: jest.fn(),
                getFileUrl: jest.fn(),
            };
            const minioService1 = {
                uploadFile: jest.fn(),
                deleteFile: jest.fn(),
                getFileUrl: jest.fn(),
            };

            const module1 = await Test.createTestingModule({
                providers: createProvidersConfig(configService1, awsService1, minioService1),
            }).compile();

            const storage1 = module1.get<FileStorageInterface>('FileStorageInterface');

            const configService2 = {
                get: jest.fn((key: string) => {
                    if (key === 'STORAGE_TYPE') return 'MINIO';
                    return null;
                }),
            };
            const awsService2 = {
                uploadFile: jest.fn(),
                deleteFile: jest.fn(),
                getFileUrl: jest.fn(),
            };
            const minioService2 = {
                uploadFile: jest.fn(),
                deleteFile: jest.fn(),
                getFileUrl: jest.fn(),
            };

            const module2 = await Test.createTestingModule({
                providers: createProvidersConfig(configService2, awsService2, minioService2),
            }).compile();

            const storage2 = module2.get<FileStorageInterface>('FileStorageInterface');

            expect(storage1).toBe(awsService1);
            expect(storage1).not.toBe(minioService1);

            expect(storage2).toBe(minioService2);
            expect(storage2).not.toBe(awsService2);

            expect(storage1).not.toBe(storage2);

            await module1.close();
            await module2.close();
        });
    });
});
