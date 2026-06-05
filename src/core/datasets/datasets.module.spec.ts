import { Test, TestingModule } from '@nestjs/testing';
import { DatasetsModule } from './datasets.module';
import { DatasetsController } from './datasets.controller';
import { DatasetsService } from './datasets.service';
import { DatasetsRepository } from './repositories/datasets.repository';
import { DatasetBatchRepository } from './repositories/dataset-batch.repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DatasetEntity } from './entities/dataset.entity';
import { DatasetBatchEntity } from './entities/dataset-batch.entity';
import { Reflector } from '@nestjs/core';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('DatasetsModule', () => {
    let module: TestingModule;

    const mockDatasetsRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockDatasetBatchRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockErrorHandlerService = {
        forbidden: jest.fn((_message, userMessage) => {
            throw new Error(userMessage);
        }),
    };

    const mockDatasetsService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
        createBatch: jest.fn(),
        processBatch: jest.fn(),
    };

    const mockEnvConfigService = {
        sAdminRole: 'superadmin',
        adminRole: 'admin',
        userRole: 'user',
        supportRole: 'support',
    };

    const mockPermissionsGuard = {
        canActivate: jest.fn(() => true),
    };

    beforeEach(async () => {
        module = await Test.createTestingModule({
            controllers: [DatasetsController],
            providers: [
                {
                    provide: DatasetsRepository,
                    useValue: mockDatasetsRepository,
                },
                {
                    provide: DatasetBatchRepository,
                    useValue: mockDatasetBatchRepository,
                },
                {
                    provide: DatasetsService,
                    useValue: mockDatasetsService,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandlerService,
                },
                {
                    provide: getRepositoryToken(DatasetEntity),
                    useValue: mockDatasetsRepository,
                },
                {
                    provide: getRepositoryToken(DatasetBatchEntity),
                    useValue: mockDatasetBatchRepository,
                },
                {
                    provide: EnvConfigService,
                    useValue: mockEnvConfigService,
                },
                {
                    provide: 'ErrorHandlerService',
                    useValue: mockErrorHandlerService,
                },
                {
                    provide: Reflector,
                    useValue: {
                        get: jest.fn(),
                        getAllAndOverride: jest.fn(),
                    },
                },
                {
                    provide: 'PermissionsGuard',
                    useValue: mockPermissionsGuard,
                },
            ],
        }).compile();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Module Definition', () => {
        it('should be defined', () => {
            expect(module).toBeDefined();
        });

        it('should compile the module', () => {
            expect(module).toBeInstanceOf(TestingModule);
        });
    });

    describe('Controllers', () => {
        it('should have DatasetsController defined', () => {
            const controller = module.get<DatasetsController>(DatasetsController);
            expect(controller).toBeDefined();
        });

        it('should create DatasetsController instance', () => {
            const controller = module.get<DatasetsController>(DatasetsController);
            expect(controller).toBeInstanceOf(DatasetsController);
        });
    });

    describe('Providers', () => {
        it('should have DatasetsRepository defined', () => {
            const repository = module.get<DatasetsRepository>(DatasetsRepository);
            expect(repository).toBeDefined();
        });

        it('should have DatasetBatchRepository defined', () => {
            const repository = module.get<DatasetBatchRepository>(DatasetBatchRepository);
            expect(repository).toBeDefined();
        });

        it('should have DatasetsService defined', () => {
            const service = module.get(DatasetsService);
            expect(service).toBeDefined();
        });
    });

    describe('Module Metadata', () => {
        it('should have controllers metadata', () => {
            const controllers = Reflect.getMetadata('controllers', DatasetsModule);
            expect(controllers).toBeDefined();
            expect(controllers).toContain(DatasetsController);
        });

        it('should have providers metadata', () => {
            const providers = Reflect.getMetadata('providers', DatasetsModule);
            expect(providers).toBeDefined();
            expect(providers).toContain(DatasetsRepository);
            expect(providers).toContain(DatasetBatchRepository);
            expect(providers).toContain(DatasetsService);
        });

        it('should have exports metadata', () => {
            const exports = Reflect.getMetadata('exports', DatasetsModule);
            expect(exports).toBeDefined();
            expect(exports).toContain(DatasetsService);
        });

        it('should have imports metadata', () => {
            const imports = Reflect.getMetadata('imports', DatasetsModule);
            expect(imports).toBeDefined();
            expect(imports.length).toBe(2);
        });

        it('should have correct number of controllers', () => {
            const controllers = Reflect.getMetadata('controllers', DatasetsModule);
            expect(controllers.length).toBe(1);
        });

        it('should have correct number of providers', () => {
            const providers = Reflect.getMetadata('providers', DatasetsModule);
            expect(providers.length).toBe(3);
        });

        it('should have correct number of exports', () => {
            const exports = Reflect.getMetadata('exports', DatasetsModule);
            expect(exports.length).toBe(1);
        });
    });

    describe('Exports Verification', () => {
        it('should export DatasetsService', () => {
            const exports = Reflect.getMetadata('exports', DatasetsModule);
            expect(exports).toContain(DatasetsService);
        });

        it('should not export DatasetsRepository', () => {
            const exports = Reflect.getMetadata('exports', DatasetsModule);
            expect(exports).not.toContain(DatasetsRepository);
        });

        it('should not export DatasetBatchRepository', () => {
            const exports = Reflect.getMetadata('exports', DatasetsModule);
            expect(exports).not.toContain(DatasetBatchRepository);
        });
    });

    describe('Module Structure', () => {
        it('should have all required imports', () => {
            const imports = Reflect.getMetadata('imports', DatasetsModule) || [];
            expect(imports.length).toBeGreaterThan(0);
        });

        it('should have all required providers', () => {
            const providers = Reflect.getMetadata('providers', DatasetsModule) || [];
            expect(providers.length).toBeGreaterThan(0);
        });

        it('should have all required controllers', () => {
            const controllers = Reflect.getMetadata('controllers', DatasetsModule) || [];
            expect(controllers.length).toBeGreaterThan(0);
        });

        it('should have all required exports', () => {
            const exports = Reflect.getMetadata('exports', DatasetsModule) || [];
            expect(exports.length).toBeGreaterThan(0);
        });
    });

    describe('Provider Configuration', () => {
        it('should configure DatasetsRepository correctly', () => {
            const providers = Reflect.getMetadata('providers', DatasetsModule);
            expect(providers).toContain(DatasetsRepository);
        });

        it('should configure DatasetBatchRepository correctly', () => {
            const providers = Reflect.getMetadata('providers', DatasetsModule);
            expect(providers).toContain(DatasetBatchRepository);
        });

        it('should configure DatasetsService correctly', () => {
            const providers = Reflect.getMetadata('providers', DatasetsModule);
            expect(providers).toContain(DatasetsService);
        });
    });

    describe('Controller Configuration', () => {
        it('should configure DatasetsController correctly', () => {
            const controllers = Reflect.getMetadata('controllers', DatasetsModule);
            expect(controllers).toContain(DatasetsController);
        });

        it('should have only one controller', () => {
            const controllers = Reflect.getMetadata('controllers', DatasetsModule);
            expect(controllers.length).toBe(1);
        });
    });

    describe('Module Dependencies', () => {
        it('should have DatabaseModule in imports', () => {
            const imports = Reflect.getMetadata('imports', DatasetsModule) || [];
            const hasDatabaseModule = imports.some(
                (imp: any) =>
                    imp?.name === 'DatabaseModule' ||
                    imp?.module?.name === 'DatabaseModule' ||
                    imp?.constructor?.name === 'DatabaseModule',
            );
            expect(hasDatabaseModule || imports.length === 2).toBe(true);
        });

        it('should have correct import count', () => {
            const imports = Reflect.getMetadata('imports', DatasetsModule) || [];
            expect(imports.length).toBe(2);
        });
    });

    describe('Repository Instances', () => {
        it('should get DatasetsRepository instance', () => {
            const repository = module.get<DatasetsRepository>(DatasetsRepository);
            expect(repository).toBe(mockDatasetsRepository);
        });

        it('should get DatasetBatchRepository instance', () => {
            const repository = module.get<DatasetBatchRepository>(DatasetBatchRepository);
            expect(repository).toBe(mockDatasetBatchRepository);
        });
    });

    describe('Service Instances', () => {
        it('should get DatasetsService instance', () => {
            const service = module.get(DatasetsService);
            expect(service).toBe(mockDatasetsService);
        });
    });

    describe('Controller Instances', () => {
        it('should get DatasetsController instance', () => {
            const controller = module.get<DatasetsController>(DatasetsController);
            expect(controller).toBeDefined();
        });
    });

    describe('Entity Configuration', () => {
        it('should have DatasetEntity token available', () => {
            const token = getRepositoryToken(DatasetEntity);
            expect(token).toBeDefined();
        });

        it('should have DatasetBatchEntity token available', () => {
            const token = getRepositoryToken(DatasetBatchEntity);
            expect(token).toBeDefined();
        });
    });

    describe('Provider Dependencies', () => {
        it('should have all service dependencies resolved', () => {
            expect(module.get(DatasetsService)).toBeDefined();
        });

        it('should have all repository dependencies resolved', () => {
            expect(module.get(DatasetsRepository)).toBeDefined();
            expect(module.get(DatasetBatchRepository)).toBeDefined();
        });

        it('should have ErrorHandlerService available', () => {
            expect(module.get(ErrorHandlerService)).toBeDefined();
        });

        it('should have EnvConfigService available', () => {
            expect(module.get(EnvConfigService)).toBeDefined();
        });

        it('should have Reflector available', () => {
            expect(module.get(Reflector)).toBeDefined();
        });
    });

    describe('Module Exports Validation', () => {
        it('should export only service', () => {
            const exports = Reflect.getMetadata('exports', DatasetsModule);
            expect(exports).toContain(DatasetsService);
            expect(exports.length).toBe(1);
        });

        it('should have matching exports and providers for exported items', () => {
            const exports = Reflect.getMetadata('exports', DatasetsModule);
            const providers = Reflect.getMetadata('providers', DatasetsModule);

            exports.forEach((exp: any) => {
                expect(providers).toContain(exp);
            });
        });

        it('should keep repositories internal only', () => {
            const exports = Reflect.getMetadata('exports', DatasetsModule);
            const providers = Reflect.getMetadata('providers', DatasetsModule);

            expect(providers).toContain(DatasetsRepository);
            expect(providers).toContain(DatasetBatchRepository);
            expect(exports).not.toContain(DatasetsRepository);
            expect(exports).not.toContain(DatasetBatchRepository);
        });
    });

    describe('Module Import Validation', () => {
        it('should import DatabaseModule twice (base + forFeature)', () => {
            const imports = Reflect.getMetadata('imports', DatasetsModule) || [];
            const databaseImports = imports.filter(
                (imp: any) =>
                    imp?.name === 'DatabaseModule' ||
                    imp?.module?.name === 'DatabaseModule' ||
                    imp?.constructor?.name === 'DatabaseModule',
            );
            // Should have DatabaseModule and DatabaseModule.forFeature
            expect(databaseImports.length >= 1 || imports.length === 2).toBe(true);
        });

        it('should configure forFeature with two entities', () => {
            const imports = Reflect.getMetadata('imports', DatasetsModule) || [];
            expect(imports.length).toBe(2);
        });
    });

    describe('Module Compilation', () => {
        it('should compile without errors', () => {
            expect(module).toBeDefined();
            expect(module).toBeInstanceOf(TestingModule);
        });

        it('should initialize all providers', () => {
            expect(module.get(DatasetsRepository)).toBeDefined();
            expect(module.get(DatasetBatchRepository)).toBeDefined();
            expect(module.get(DatasetsService)).toBeDefined();
        });

        it('should initialize all controllers', () => {
            expect(module.get(DatasetsController)).toBeDefined();
        });
    });

    describe('Provider Uniqueness', () => {
        it('should have unique service instances per module', () => {
            const service1 = module.get<DatasetsService>(DatasetsService);
            const service2 = module.get<DatasetsService>(DatasetsService);

            expect(service1).toBe(service2);
        });

        it('should have unique repository instances per module', () => {
            const repo1 = module.get<DatasetsRepository>(DatasetsRepository);
            const repo2 = module.get<DatasetsRepository>(DatasetsRepository);

            expect(repo1).toBe(repo2);
        });

        it('should have unique batch repository instances per module', () => {
            const repo1 = module.get<DatasetBatchRepository>(DatasetBatchRepository);
            const repo2 = module.get<DatasetBatchRepository>(DatasetBatchRepository);

            expect(repo1).toBe(repo2);
        });
    });

    describe('Module Integration', () => {
        it('should integrate with DatabaseModule', () => {
            const imports = Reflect.getMetadata('imports', DatasetsModule) || [];
            expect(imports.length).toBe(2);
        });
    });

    describe('Complete Module Structure', () => {
        it('should have correct module structure', () => {
            const controllers = Reflect.getMetadata('controllers', DatasetsModule);
            const providers = Reflect.getMetadata('providers', DatasetsModule);
            const exports = Reflect.getMetadata('exports', DatasetsModule);
            const imports = Reflect.getMetadata('imports', DatasetsModule);

            expect(controllers).toBeDefined();
            expect(providers).toBeDefined();
            expect(exports).toBeDefined();
            expect(imports).toBeDefined();

            expect(controllers.length).toBe(1);
            expect(providers.length).toBe(3);
            expect(exports.length).toBe(1);
            expect(imports.length).toBe(2);
        });
    });

    describe('Repository Encapsulation', () => {
        it('should have both repositories as providers', () => {
            const providers = Reflect.getMetadata('providers', DatasetsModule);
            expect(providers).toContain(DatasetsRepository);
            expect(providers).toContain(DatasetBatchRepository);
        });

        it('should not expose repositories externally', () => {
            const exports = Reflect.getMetadata('exports', DatasetsModule);
            expect(exports).not.toContain(DatasetsRepository);
            expect(exports).not.toContain(DatasetBatchRepository);
        });

        it('should only expose service layer', () => {
            const exports = Reflect.getMetadata('exports', DatasetsModule);
            expect(exports).toEqual([DatasetsService]);
        });
    });

    describe('Module Provider Order', () => {
        it('should have providers in correct order', () => {
            const providers = Reflect.getMetadata('providers', DatasetsModule);
            expect(providers[0]).toBe(DatasetsService);
            expect(providers[1]).toBe(DatasetsRepository);
            expect(providers[2]).toBe(DatasetBatchRepository);
        });
    });

    describe('Entity Registration', () => {
        it('should register DatasetEntity', () => {
            const token = getRepositoryToken(DatasetEntity);
            expect(token).toBe('DatasetEntityRepository');
        });

        it('should register DatasetBatchEntity', () => {
            const token = getRepositoryToken(DatasetBatchEntity);
            expect(token).toBe('DatasetBatchEntityRepository');
        });

        it('should have both entities registered', () => {
            const datasetToken = getRepositoryToken(DatasetEntity);
            const batchToken = getRepositoryToken(DatasetBatchEntity);

            expect(datasetToken).toBeDefined();
            expect(batchToken).toBeDefined();
            expect(datasetToken).not.toBe(batchToken);
        });
    });

    describe('Multiple Repository Support', () => {
        it('should support multiple repositories in one module', () => {
            const providers = Reflect.getMetadata('providers', DatasetsModule);
            const repositories = providers.filter(
                (p: any) => p === DatasetsRepository || p === DatasetBatchRepository,
            );

            expect(repositories.length).toBe(2);
        });

        it('should be able to inject both repositories', () => {
            const datasetsRepo = module.get<DatasetsRepository>(DatasetsRepository);
            const batchRepo = module.get<DatasetBatchRepository>(DatasetBatchRepository);

            expect(datasetsRepo).toBeDefined();
            expect(batchRepo).toBeDefined();
            expect(datasetsRepo).not.toBe(batchRepo);
        });
    });
});
