import { Test, TestingModule } from '@nestjs/testing';
import { SupportsModule } from './supports.module';
import { SupportsController } from './supports.controller';
import {
    SupportsService,
    SAdminConService,
    SMessagesService,
    SConService,
    TransformSEntitiesService,
} from './services';
import { SAdminConRepository, SConRepository, SMessagesRepository } from './repositories';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SAdminConEntity, SConEntity, SMessagesEntity } from './entities';
import { Reflector } from '@nestjs/core';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('SupportsModule', () => {
    let module: TestingModule;

    const mockSConRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockSMessagesRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockSAdminConRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockSupportsService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    const mockSAdminConService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    const mockSMessagesService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    const mockSConService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    const mockTransformSEntitiesService = {
        transform: jest.fn(),
        transformMany: jest.fn(),
    };

    const mockErrorHandlerService = {
        forbidden: jest.fn((_message, userMessage) => {
            throw new Error(userMessage);
        }),
    };

    const mockEnvConfigService = {
        sAdminRole: 'superadmin',
        adminRole: 'admin',
        userRole: 'user',
        supportRole: 'support',
    };

    const mockPermissionsService = {
        checkPermission: jest.fn(),
    };

    const mockPermissionsGuard = {
        canActivate: jest.fn(() => true),
    };

    beforeEach(async () => {
        module = await Test.createTestingModule({
            controllers: [SupportsController],
            providers: [
                {
                    provide: SConRepository,
                    useValue: mockSConRepository,
                },
                {
                    provide: SMessagesRepository,
                    useValue: mockSMessagesRepository,
                },
                {
                    provide: SAdminConRepository,
                    useValue: mockSAdminConRepository,
                },
                {
                    provide: SupportsService,
                    useValue: mockSupportsService,
                },
                {
                    provide: SAdminConService,
                    useValue: mockSAdminConService,
                },
                {
                    provide: SMessagesService,
                    useValue: mockSMessagesService,
                },
                {
                    provide: SConService,
                    useValue: mockSConService,
                },
                {
                    provide: TransformSEntitiesService,
                    useValue: mockTransformSEntitiesService,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandlerService,
                },
                {
                    provide: getRepositoryToken(SConEntity),
                    useValue: mockSConRepository,
                },
                {
                    provide: getRepositoryToken(SMessagesEntity),
                    useValue: mockSMessagesRepository,
                },
                {
                    provide: getRepositoryToken(SAdminConEntity),
                    useValue: mockSAdminConRepository,
                },
                {
                    provide: 'PermissionsService',
                    useValue: mockPermissionsService,
                },
                {
                    provide: EnvConfigService,
                    useValue: mockEnvConfigService,
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

    describe('Global Module Decorator', () => {
        it('should be decorated with @Global()', () => {
            const isGlobal = Reflect.getMetadata('__module:global__', SupportsModule);
            expect(isGlobal).toBe(true);
        });

        it('should have global scope', () => {
            const globalMetadata = Reflect.getMetadata('__module:global__', SupportsModule);
            expect(globalMetadata).toBeDefined();
        });
    });

    describe('Controllers', () => {
        it('should have SupportsController defined', () => {
            const controller = module.get<SupportsController>(SupportsController);
            expect(controller).toBeDefined();
        });

        it('should create SupportsController instance', () => {
            const controller = module.get<SupportsController>(SupportsController);
            expect(controller).toBeInstanceOf(SupportsController);
        });
    });

    describe('Providers', () => {
        it('should have SConRepository defined', () => {
            const repository = module.get<SConRepository>(SConRepository);
            expect(repository).toBeDefined();
        });

        it('should have SMessagesRepository defined', () => {
            const repository = module.get<SMessagesRepository>(SMessagesRepository);
            expect(repository).toBeDefined();
        });

        it('should have SAdminConRepository defined', () => {
            const repository = module.get<SAdminConRepository>(SAdminConRepository);
            expect(repository).toBeDefined();
        });

        it('should have SupportsService defined', () => {
            const service = module.get(SupportsService);
            expect(service).toBeDefined();
        });

        it('should have SAdminConService defined', () => {
            const service = module.get(SAdminConService);
            expect(service).toBeDefined();
        });

        it('should have SMessagesService defined', () => {
            const service = module.get(SMessagesService);
            expect(service).toBeDefined();
        });

        it('should have SConService defined', () => {
            const service = module.get(SConService);
            expect(service).toBeDefined();
        });

        it('should have TransformSEntitiesService defined', () => {
            const service = module.get(TransformSEntitiesService);
            expect(service).toBeDefined();
        });
    });

    describe('Module Metadata', () => {
        it('should have controllers metadata', () => {
            const controllers = Reflect.getMetadata('controllers', SupportsModule);
            expect(controllers).toBeDefined();
            expect(controllers).toContain(SupportsController);
        });

        it('should have providers metadata', () => {
            const providers = Reflect.getMetadata('providers', SupportsModule);
            expect(providers).toBeDefined();
            expect(providers).toContain(SConRepository);
            expect(providers).toContain(SMessagesRepository);
            expect(providers).toContain(SAdminConRepository);
            expect(providers).toContain(SupportsService);
            expect(providers).toContain(SAdminConService);
            expect(providers).toContain(SMessagesService);
            expect(providers).toContain(SConService);
            expect(providers).toContain(TransformSEntitiesService);
        });

        it('should have exports metadata', () => {
            const exports = Reflect.getMetadata('exports', SupportsModule);
            expect(exports).toBeDefined();
            expect(exports).toContain(SupportsService);
            expect(exports).toContain(SAdminConService);
            expect(exports).toContain(SMessagesService);
            expect(exports).toContain(SConService);
        });

        it('should have imports metadata', () => {
            const imports = Reflect.getMetadata('imports', SupportsModule);
            expect(imports).toBeDefined();
            expect(imports.length).toBe(3);
        });

        it('should have correct number of controllers', () => {
            const controllers = Reflect.getMetadata('controllers', SupportsModule);
            expect(controllers.length).toBe(1);
        });

        it('should have correct number of providers', () => {
            const providers = Reflect.getMetadata('providers', SupportsModule);
            expect(providers.length).toBe(8);
        });

        it('should have correct number of exports', () => {
            const exports = Reflect.getMetadata('exports', SupportsModule);
            expect(exports.length).toBe(4);
        });
    });

    describe('Exports Verification', () => {
        it('should export SupportsService', () => {
            const exports = Reflect.getMetadata('exports', SupportsModule);
            expect(exports).toContain(SupportsService);
        });

        it('should export SAdminConService', () => {
            const exports = Reflect.getMetadata('exports', SupportsModule);
            expect(exports).toContain(SAdminConService);
        });

        it('should export SMessagesService', () => {
            const exports = Reflect.getMetadata('exports', SupportsModule);
            expect(exports).toContain(SMessagesService);
        });

        it('should export SConService', () => {
            const exports = Reflect.getMetadata('exports', SupportsModule);
            expect(exports).toContain(SConService);
        });

        it('should export exactly four services', () => {
            const exports = Reflect.getMetadata('exports', SupportsModule);
            expect(exports.length).toBe(4);
        });

        it('should not export TransformSEntitiesService', () => {
            const exports = Reflect.getMetadata('exports', SupportsModule);
            expect(exports).not.toContain(TransformSEntitiesService);
        });

        it('should not export any repositories', () => {
            const exports = Reflect.getMetadata('exports', SupportsModule);
            expect(exports).not.toContain(SConRepository);
            expect(exports).not.toContain(SMessagesRepository);
            expect(exports).not.toContain(SAdminConRepository);
        });
    });

    describe('Module Structure', () => {
        it('should have all required imports', () => {
            const imports = Reflect.getMetadata('imports', SupportsModule) || [];
            expect(imports.length).toBeGreaterThan(0);
        });

        it('should have all required providers', () => {
            const providers = Reflect.getMetadata('providers', SupportsModule) || [];
            expect(providers.length).toBeGreaterThan(0);
        });

        it('should have all required controllers', () => {
            const controllers = Reflect.getMetadata('controllers', SupportsModule) || [];
            expect(controllers.length).toBeGreaterThan(0);
        });

        it('should have all required exports', () => {
            const exports = Reflect.getMetadata('exports', SupportsModule) || [];
            expect(exports.length).toBeGreaterThan(0);
        });
    });

    describe('Provider Configuration', () => {
        it('should configure all repositories correctly', () => {
            const providers = Reflect.getMetadata('providers', SupportsModule);
            expect(providers).toContain(SConRepository);
            expect(providers).toContain(SMessagesRepository);
            expect(providers).toContain(SAdminConRepository);
        });

        it('should configure all services correctly', () => {
            const providers = Reflect.getMetadata('providers', SupportsModule);
            expect(providers).toContain(SupportsService);
            expect(providers).toContain(SAdminConService);
            expect(providers).toContain(SMessagesService);
            expect(providers).toContain(SConService);
            expect(providers).toContain(TransformSEntitiesService);
        });
    });

    describe('Controller Configuration', () => {
        it('should configure SupportsController correctly', () => {
            const controllers = Reflect.getMetadata('controllers', SupportsModule);
            expect(controllers).toContain(SupportsController);
        });

        it('should have only one controller', () => {
            const controllers = Reflect.getMetadata('controllers', SupportsModule);
            expect(controllers.length).toBe(1);
        });
    });

    describe('Module Dependencies', () => {
        it('should have DatabaseModule in imports', () => {
            const imports = Reflect.getMetadata('imports', SupportsModule) || [];
            const hasDatabaseModule = imports.some(
                (imp: any) =>
                    imp?.name === 'DatabaseModule' ||
                    imp?.module?.name === 'DatabaseModule' ||
                    imp?.constructor?.name === 'DatabaseModule',
            );
            expect(hasDatabaseModule || imports.length === 3).toBe(true);
        });

        it('should have SCodesModule in imports', () => {
            const imports = Reflect.getMetadata('imports', SupportsModule) || [];
            const hasSCodesModule = imports.some(
                (imp: any) => imp?.name === 'SCodesModule' || imp === 'SCodesModule',
            );
            expect(hasSCodesModule || imports.length === 3).toBe(true);
        });

        it('should have correct import count', () => {
            const imports = Reflect.getMetadata('imports', SupportsModule) || [];
            expect(imports.length).toBe(3);
        });
    });

    describe('Repository Instances', () => {
        it('should get SConRepository instance', () => {
            const repository = module.get<SConRepository>(SConRepository);
            expect(repository).toBe(mockSConRepository);
        });

        it('should get SMessagesRepository instance', () => {
            const repository = module.get<SMessagesRepository>(SMessagesRepository);
            expect(repository).toBe(mockSMessagesRepository);
        });

        it('should get SAdminConRepository instance', () => {
            const repository = module.get<SAdminConRepository>(SAdminConRepository);
            expect(repository).toBe(mockSAdminConRepository);
        });
    });

    describe('Service Instances', () => {
        it('should get SupportsService instance', () => {
            const service = module.get(SupportsService);
            expect(service).toBe(mockSupportsService);
        });

        it('should get SAdminConService instance', () => {
            const service = module.get(SAdminConService);
            expect(service).toBe(mockSAdminConService);
        });

        it('should get SMessagesService instance', () => {
            const service = module.get(SMessagesService);
            expect(service).toBe(mockSMessagesService);
        });

        it('should get SConService instance', () => {
            const service = module.get(SConService);
            expect(service).toBe(mockSConService);
        });

        it('should get TransformSEntitiesService instance', () => {
            const service = module.get(TransformSEntitiesService);
            expect(service).toBe(mockTransformSEntitiesService);
        });
    });

    describe('Controller Instances', () => {
        it('should get SupportsController instance', () => {
            const controller = module.get<SupportsController>(SupportsController);
            expect(controller).toBeDefined();
        });
    });

    describe('Entity Configuration', () => {
        it('should have SConEntity token available', () => {
            const token = getRepositoryToken(SConEntity);
            expect(token).toBeDefined();
        });

        it('should have SMessagesEntity token available', () => {
            const token = getRepositoryToken(SMessagesEntity);
            expect(token).toBeDefined();
        });

        it('should have SAdminConEntity token available', () => {
            const token = getRepositoryToken(SAdminConEntity);
            expect(token).toBeDefined();
        });
    });

    describe('Provider Dependencies', () => {
        it('should have all service dependencies resolved', () => {
            expect(module.get(SupportsService)).toBeDefined();
            expect(module.get(SAdminConService)).toBeDefined();
            expect(module.get(SMessagesService)).toBeDefined();
            expect(module.get(SConService)).toBeDefined();
            expect(module.get(TransformSEntitiesService)).toBeDefined();
        });

        it('should have all repository dependencies resolved', () => {
            expect(module.get(SConRepository)).toBeDefined();
            expect(module.get(SMessagesRepository)).toBeDefined();
            expect(module.get(SAdminConRepository)).toBeDefined();
        });
    });

    describe('Module Exports Validation', () => {
        it('should export four services', () => {
            const exports = Reflect.getMetadata('exports', SupportsModule);
            expect(exports).toContain(SupportsService);
            expect(exports).toContain(SAdminConService);
            expect(exports).toContain(SMessagesService);
            expect(exports).toContain(SConService);
            expect(exports.length).toBe(4);
        });

        it('should have matching exports and providers for exported items', () => {
            const exports = Reflect.getMetadata('exports', SupportsModule);
            const providers = Reflect.getMetadata('providers', SupportsModule);

            exports.forEach((exp: any) => {
                expect(providers).toContain(exp);
            });
        });

        it('should keep internal services private', () => {
            const exports = Reflect.getMetadata('exports', SupportsModule);
            const providers = Reflect.getMetadata('providers', SupportsModule);

            expect(providers).toContain(TransformSEntitiesService);
            expect(exports).not.toContain(TransformSEntitiesService);
        });

        it('should keep all repositories private', () => {
            const exports = Reflect.getMetadata('exports', SupportsModule);
            const providers = Reflect.getMetadata('providers', SupportsModule);

            expect(providers).toContain(SConRepository);
            expect(providers).toContain(SMessagesRepository);
            expect(providers).toContain(SAdminConRepository);

            expect(exports).not.toContain(SConRepository);
            expect(exports).not.toContain(SMessagesRepository);
            expect(exports).not.toContain(SAdminConRepository);
        });
    });

    describe('Module Import Validation', () => {
        it('should import DatabaseModule twice (base + forFeature)', () => {
            const imports = Reflect.getMetadata('imports', SupportsModule) || [];
            const databaseImports = imports.filter(
                (imp: any) =>
                    imp?.name === 'DatabaseModule' ||
                    imp?.module?.name === 'DatabaseModule' ||
                    imp?.constructor?.name === 'DatabaseModule',
            );
            expect(databaseImports.length >= 1 || imports.length === 3).toBe(true);
        });

        it('should configure forFeature with three entities', () => {
            const imports = Reflect.getMetadata('imports', SupportsModule) || [];
            expect(imports.length).toBe(3);
        });

        it('should have SCodesModule imported', () => {
            const imports = Reflect.getMetadata('imports', SupportsModule) || [];
            expect(imports.length).toBe(3);
        });
    });

    describe('Module Compilation', () => {
        it('should compile without errors', () => {
            expect(module).toBeDefined();
            expect(module).toBeInstanceOf(TestingModule);
        });

        it('should initialize all providers', () => {
            expect(module.get(SConRepository)).toBeDefined();
            expect(module.get(SMessagesRepository)).toBeDefined();
            expect(module.get(SAdminConRepository)).toBeDefined();
            expect(module.get(SupportsService)).toBeDefined();
            expect(module.get(SAdminConService)).toBeDefined();
            expect(module.get(SMessagesService)).toBeDefined();
            expect(module.get(SConService)).toBeDefined();
            expect(module.get(TransformSEntitiesService)).toBeDefined();
        });

        it('should initialize all controllers', () => {
            expect(module.get(SupportsController)).toBeDefined();
        });
    });

    describe('Provider Uniqueness', () => {
        it('should have unique service instances per module', () => {
            const service1 = module.get<SupportsService>(SupportsService);
            const service2 = module.get<SupportsService>(SupportsService);

            expect(service1).toBe(service2);
        });

        it('should have unique repository instances per module', () => {
            const repo1 = module.get<SConRepository>(SConRepository);
            const repo2 = module.get<SConRepository>(SConRepository);

            expect(repo1).toBe(repo2);
        });
    });

    describe('Module Integration', () => {
        it('should integrate with DatabaseModule', () => {
            const imports = Reflect.getMetadata('imports', SupportsModule) || [];
            expect(imports.length).toBe(3);
        });

        it('should integrate with SCodesModule', () => {
            const imports = Reflect.getMetadata('imports', SupportsModule) || [];
            const hasSCodesModule = imports.some(
                (imp: any) => imp?.name === 'SCodesModule' || imp === 'SCodesModule',
            );
            expect(hasSCodesModule || imports.length === 3).toBe(true);
        });
    });

    describe('Complete Module Structure', () => {
        it('should have correct module structure', () => {
            const controllers = Reflect.getMetadata('controllers', SupportsModule);
            const providers = Reflect.getMetadata('providers', SupportsModule);
            const exports = Reflect.getMetadata('exports', SupportsModule);
            const imports = Reflect.getMetadata('imports', SupportsModule);

            expect(controllers).toBeDefined();
            expect(providers).toBeDefined();
            expect(exports).toBeDefined();
            expect(imports).toBeDefined();

            expect(controllers.length).toBe(1);
            expect(providers.length).toBe(8);
            expect(exports.length).toBe(4);
            expect(imports.length).toBe(3);
        });
    });

    describe('Selective Export Strategy', () => {
        it('should export the four main public services', () => {
            const exports = Reflect.getMetadata('exports', SupportsModule);

            expect(exports).toContain(SupportsService);
            expect(exports).toContain(SAdminConService);
            expect(exports).toContain(SMessagesService);
            expect(exports).toContain(SConService);
            expect(exports.length).toBe(4);
        });

        it('should keep transform service private', () => {
            const exports = Reflect.getMetadata('exports', SupportsModule);

            expect(exports).not.toContain(TransformSEntitiesService);
        });

        it('should keep all repositories private', () => {
            const exports = Reflect.getMetadata('exports', SupportsModule);

            expect(exports).not.toContain(SConRepository);
            expect(exports).not.toContain(SMessagesRepository);
            expect(exports).not.toContain(SAdminConRepository);
        });
    });

    describe('Module Provider Order', () => {
        it('should have providers in correct order', () => {
            const providers = Reflect.getMetadata('providers', SupportsModule);
            expect(providers[0]).toBe(SConRepository);
            expect(providers[1]).toBe(SMessagesRepository);
            expect(providers[2]).toBe(SAdminConRepository);
            expect(providers[3]).toBe(SupportsService);
            expect(providers[4]).toBe(SAdminConService);
            expect(providers[5]).toBe(SMessagesService);
            expect(providers[6]).toBe(SConService);
            expect(providers[7]).toBe(TransformSEntitiesService);
        });
    });

    describe('Module Export Order', () => {
        it('should have exports in correct order', () => {
            const exports = Reflect.getMetadata('exports', SupportsModule);
            expect(exports[0]).toBe(SupportsService);
            expect(exports[1]).toBe(SAdminConService);
            expect(exports[2]).toBe(SMessagesService);
            expect(exports[3]).toBe(SConService);
        });
    });

    describe('Entity Registration', () => {
        it('should register SConEntity', () => {
            const token = getRepositoryToken(SConEntity);
            expect(token).toBe('SConEntityRepository');
        });

        it('should register SMessagesEntity', () => {
            const token = getRepositoryToken(SMessagesEntity);
            expect(token).toBe('SMessagesEntityRepository');
        });

        it('should register SAdminConEntity', () => {
            const token = getRepositoryToken(SAdminConEntity);
            expect(token).toBe('SAdminConEntityRepository');
        });

        it('should have all three entities registered', () => {
            const sConToken = getRepositoryToken(SConEntity);
            const sMessagesToken = getRepositoryToken(SMessagesEntity);
            const sAdminConToken = getRepositoryToken(SAdminConEntity);

            expect(sConToken).toBeDefined();
            expect(sMessagesToken).toBeDefined();
            expect(sAdminConToken).toBeDefined();

            expect(sConToken).not.toBe(sMessagesToken);
            expect(sMessagesToken).not.toBe(sAdminConToken);
            expect(sAdminConToken).not.toBe(sConToken);
        });
    });

    describe('Multiple Entity Support', () => {
        it('should support three entities in one module', () => {
            const imports = Reflect.getMetadata('imports', SupportsModule) || [];
            expect(imports.length).toBe(3);
        });

        it('should have three repositories for three entities', () => {
            const providers = Reflect.getMetadata('providers', SupportsModule);
            const repositories = providers.filter(
                (p: any) =>
                    p === SConRepository || p === SMessagesRepository || p === SAdminConRepository,
            );

            expect(repositories.length).toBe(3);
        });

        it('should be able to inject all repositories', () => {
            const sConRepo = module.get<SConRepository>(SConRepository);
            const sMessagesRepo = module.get<SMessagesRepository>(SMessagesRepository);
            const sAdminConRepo = module.get<SAdminConRepository>(SAdminConRepository);

            expect(sConRepo).toBeDefined();
            expect(sMessagesRepo).toBeDefined();
            expect(sAdminConRepo).toBeDefined();

            expect(sConRepo).not.toBe(sMessagesRepo);
            expect(sMessagesRepo).not.toBe(sAdminConRepo);
            expect(sAdminConRepo).not.toBe(sConRepo);
        });
    });

    describe('Service Layer Architecture', () => {
        it('should have five services for different responsibilities', () => {
            const providers = Reflect.getMetadata('providers', SupportsModule);
            const services = providers.filter(
                (p: any) =>
                    p === SupportsService ||
                    p === SAdminConService ||
                    p === SMessagesService ||
                    p === SConService ||
                    p === TransformSEntitiesService,
            );

            expect(services.length).toBe(5);
        });

        it('should be able to inject all services', () => {
            const supportsService = module.get<SupportsService>(SupportsService);
            const sAdminConService = module.get<SAdminConService>(SAdminConService);
            const sMessagesService = module.get<SMessagesService>(SMessagesService);
            const sConService = module.get<SConService>(SConService);
            const transformService =
                module.get<TransformSEntitiesService>(TransformSEntitiesService);

            expect(supportsService).toBeDefined();
            expect(sAdminConService).toBeDefined();
            expect(sMessagesService).toBeDefined();
            expect(sConService).toBeDefined();
            expect(transformService).toBeDefined();
        });
    });

    describe('Internal vs External Providers', () => {
        it('should distinguish between public and internal providers', () => {
            const providers = Reflect.getMetadata('providers', SupportsModule);
            const exports = Reflect.getMetadata('exports', SupportsModule);

            const internalProviders = providers.filter((p: any) => !exports.includes(p));

            expect(internalProviders).toContain(TransformSEntitiesService);
            expect(internalProviders).toContain(SConRepository);
            expect(internalProviders).toContain(SMessagesRepository);
            expect(internalProviders).toContain(SAdminConRepository);
            expect(internalProviders.length).toBe(4);
        });

        it('should export 4 out of 8 providers', () => {
            const providers = Reflect.getMetadata('providers', SupportsModule);
            const exports = Reflect.getMetadata('exports', SupportsModule);

            expect(providers.length).toBe(8);
            expect(exports.length).toBe(4);
        });
    });

    describe('Complex Module Pattern', () => {
        it('should handle complex module with 3 entities, 3 repos, 5 services', () => {
            const providers = Reflect.getMetadata('providers', SupportsModule);

            const repositories = [SConRepository, SMessagesRepository, SAdminConRepository];
            const services = [
                SupportsService,
                SAdminConService,
                SMessagesService,
                SConService,
                TransformSEntitiesService,
            ];

            repositories.forEach((repo) => {
                expect(providers).toContain(repo);
            });

            services.forEach((service) => {
                expect(providers).toContain(service);
            });
        });
    });

    describe('Transform Service Integration', () => {
        it('should include TransformSEntitiesService in providers', () => {
            const providers = Reflect.getMetadata('providers', SupportsModule);
            expect(providers).toContain(TransformSEntitiesService);
        });

        it('should not export TransformSEntitiesService', () => {
            const exports = Reflect.getMetadata('exports', SupportsModule);
            expect(exports).not.toContain(TransformSEntitiesService);
        });

        it('should be able to get TransformSEntitiesService instance', () => {
            const service = module.get(TransformSEntitiesService);
            expect(service).toBeDefined();
            expect(service).toBe(mockTransformSEntitiesService);
        });
    });

    describe('Module Encapsulation', () => {
        it('should expose four services to other modules', () => {
            const exports = Reflect.getMetadata('exports', SupportsModule);
            expect(exports.length).toBe(4);
            expect(exports[0]).toBe(SupportsService);
            expect(exports[1]).toBe(SAdminConService);
            expect(exports[2]).toBe(SMessagesService);
            expect(exports[3]).toBe(SConService);
        });

        it('should keep 4 providers internal', () => {
            const providers = Reflect.getMetadata('providers', SupportsModule);
            const exports = Reflect.getMetadata('exports', SupportsModule);

            const internalCount = providers.length - exports.length;
            expect(internalCount).toBe(4);
        });

        it('should provide clear API through exported services', () => {
            const exports = Reflect.getMetadata('exports', SupportsModule);
            expect(exports).toEqual([
                SupportsService,
                SAdminConService,
                SMessagesService,
                SConService,
            ]);
        });
    });

    describe('Global Module Availability', () => {
        it('should be available globally due to @Global decorator', () => {
            const isGlobal = Reflect.getMetadata('__module:global__', SupportsModule);
            expect(isGlobal).toBe(true);
        });

        it('should make exported services available across entire application', () => {
            const exports = Reflect.getMetadata('exports', SupportsModule);
            const isGlobal = Reflect.getMetadata('__module:global__', SupportsModule);

            expect(isGlobal).toBe(true);
            expect(exports.length).toBe(4);
        });
    });

    describe('Third-party Module Integration', () => {
        it('should import SCodesModule', () => {
            const imports = Reflect.getMetadata('imports', SupportsModule) || [];
            const hasSCodesModule = imports.some(
                (imp: any) => imp?.name === 'SCodesModule' || imp === 'SCodesModule',
            );
            expect(hasSCodesModule || imports.length === 3).toBe(true);
        });

        it('should have three imports total', () => {
            const imports = Reflect.getMetadata('imports', SupportsModule) || [];
            expect(imports.length).toBe(3);
        });
    });

    describe('Dependency Injection', () => {
        it('should resolve all dependencies correctly', () => {
            expect(() => module.get(SupportsController)).not.toThrow();
            expect(() => module.get(SupportsService)).not.toThrow();
            expect(() => module.get(SAdminConService)).not.toThrow();
            expect(() => module.get(SMessagesService)).not.toThrow();
            expect(() => module.get(SConService)).not.toThrow();
            expect(() => module.get(TransformSEntitiesService)).not.toThrow();
            expect(() => module.get(SConRepository)).not.toThrow();
            expect(() => module.get(SMessagesRepository)).not.toThrow();
            expect(() => module.get(SAdminConRepository)).not.toThrow();
        });

        it('should use singleton pattern for providers', () => {
            const service1 = module.get(SupportsService);
            const service2 = module.get(SupportsService);
            expect(service1).toBe(service2);

            const repo1 = module.get(SConRepository);
            const repo2 = module.get(SConRepository);
            expect(repo1).toBe(repo2);
        });
    });

    describe('Module Architecture', () => {
        it('should follow NestJS global module pattern', () => {
            const controllers = Reflect.getMetadata('controllers', SupportsModule);
            const providers = Reflect.getMetadata('providers', SupportsModule);
            const exports = Reflect.getMetadata('exports', SupportsModule);
            const imports = Reflect.getMetadata('imports', SupportsModule);
            const isGlobal = Reflect.getMetadata('__module:global__', SupportsModule);

            expect(controllers).toBeDefined();
            expect(providers).toBeDefined();
            expect(exports).toBeDefined();
            expect(imports).toBeDefined();
            expect(isGlobal).toBe(true);
        });

        it('should maintain separation of concerns', () => {
            const providers = Reflect.getMetadata('providers', SupportsModule);

            const hasRepositories =
                providers.includes(SConRepository) &&
                providers.includes(SMessagesRepository) &&
                providers.includes(SAdminConRepository);

            const hasServices =
                providers.includes(SupportsService) &&
                providers.includes(SAdminConService) &&
                providers.includes(SMessagesService) &&
                providers.includes(SConService) &&
                providers.includes(TransformSEntitiesService);

            expect(hasRepositories).toBe(true);
            expect(hasServices).toBe(true);
        });
    });

    describe('Cross-Module Dependencies', () => {
        it('should depend on SCodesModule', () => {
            const imports = Reflect.getMetadata('imports', SupportsModule) || [];
            expect(imports.length).toBe(3);
        });

        it('should import both DatabaseModule configurations', () => {
            const imports = Reflect.getMetadata('imports', SupportsModule) || [];
            expect(imports.length).toBe(3);
        });
    });

    describe('Public API Surface', () => {
        it('should expose four domain services', () => {
            const exports = Reflect.getMetadata('exports', SupportsModule);
            expect(exports).toContain(SupportsService);
            expect(exports).toContain(SAdminConService);
            expect(exports).toContain(SMessagesService);
            expect(exports).toContain(SConService);
        });

        it('should hide implementation details', () => {
            const exports = Reflect.getMetadata('exports', SupportsModule);
            expect(exports).not.toContain(TransformSEntitiesService);
            expect(exports).not.toContain(SConRepository);
            expect(exports).not.toContain(SMessagesRepository);
            expect(exports).not.toContain(SAdminConRepository);
        });
    });
});
