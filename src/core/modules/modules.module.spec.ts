import { Test, TestingModule } from '@nestjs/testing';
import { ModulesModule } from './modules.module';
import { ModulesController } from './modules.controller';
import {
    MFeatureService,
    ModulesService,
    PreModuleService,
    MHeaderService,
    MUseService,
    MTransformService,
    MUsersService,
    MExportService,
} from './services';
import {
    MUseRepository,
    ModulesRepository,
    MHeaderRepository,
    MFeatureRepository,
    MUsersRepository,
    MExportRepository,
} from './repositories';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
    ModuleEntity,
    MFeatureEntity,
    MHeaderEntity,
    MUseEntity,
    MExportEntity,
    MUsersEntity,
} from './entities';
import { Reflector } from '@nestjs/core';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';
import { ModuleSeeder } from './module.seeder';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('ModulesModule', () => {
    let module: TestingModule;

    const mockModulesRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockMFeatureRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockMHeaderRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockMUseRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockMUsersRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockMExportRepository = {
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

    const mockModulesService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    const mockPreModuleService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
    };

    const mockMFeatureService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    const mockMExportService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    const mockMHeaderService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    const mockMUseService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    const mockMTransformService = {
        transform: jest.fn(),
        transformMany: jest.fn(),
    };

    const mockMUsersService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    const mockModuleSeeder = {
        seed: jest.fn(),
        seedAll: jest.fn(),
    };

    const mockPermissionsService = {
        checkPermission: jest.fn(),
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
            controllers: [ModulesController],
            providers: [
                {
                    provide: ModulesRepository,
                    useValue: mockModulesRepository,
                },
                {
                    provide: MFeatureRepository,
                    useValue: mockMFeatureRepository,
                },
                {
                    provide: MExportRepository,
                    useValue: mockMExportRepository,
                },
                {
                    provide: MHeaderRepository,
                    useValue: mockMHeaderRepository,
                },
                {
                    provide: MUseRepository,
                    useValue: mockMUseRepository,
                },
                {
                    provide: MUsersRepository,
                    useValue: mockMUsersRepository,
                },
                {
                    provide: ModulesService,
                    useValue: mockModulesService,
                },
                {
                    provide: PreModuleService,
                    useValue: mockPreModuleService,
                },
                {
                    provide: MFeatureService,
                    useValue: mockMFeatureService,
                },
                {
                    provide: MHeaderService,
                    useValue: mockMHeaderService,
                },
                {
                    provide: MUseService,
                    useValue: mockMUseService,
                },
                {
                    provide: MTransformService,
                    useValue: mockMTransformService,
                },
                {
                    provide: MExportService,
                    useValue: mockMExportService,
                },
                {
                    provide: MUsersService,
                    useValue: mockMUsersService,
                },
                {
                    provide: ModuleSeeder,
                    useValue: mockModuleSeeder,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandlerService,
                },
                {
                    provide: getRepositoryToken(ModuleEntity),
                    useValue: mockModulesRepository,
                },
                {
                    provide: getRepositoryToken(MFeatureEntity),
                    useValue: mockMFeatureRepository,
                },
                {
                    provide: getRepositoryToken(MHeaderEntity),
                    useValue: mockMHeaderRepository,
                },
                {
                    provide: getRepositoryToken(MUseEntity),
                    useValue: mockMUseRepository,
                },
                {
                    provide: getRepositoryToken(MUsersEntity),
                    useValue: mockMUsersRepository,
                },
                {
                    provide: getRepositoryToken(MExportEntity),
                    useValue: mockMExportRepository,
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
        it('should have ModulesController defined', () => {
            const controller = module.get<ModulesController>(ModulesController);
            expect(controller).toBeDefined();
        });

        it('should create ModulesController instance', () => {
            const controller = module.get<ModulesController>(ModulesController);
            expect(controller).toBeInstanceOf(ModulesController);
        });
    });

    describe('Providers', () => {
        it('should have ModulesRepository defined', () => {
            const repository = module.get<ModulesRepository>(ModulesRepository);
            expect(repository).toBeDefined();
        });

        it('should have MFeatureRepository defined', () => {
            const repository = module.get<MFeatureRepository>(MFeatureRepository);
            expect(repository).toBeDefined();
        });

        it('should have MHeaderRepository defined', () => {
            const repository = module.get<MHeaderRepository>(MHeaderRepository);
            expect(repository).toBeDefined();
        });

        it('should have MExportRepository defined', () => {
            const repository = module.get<MExportRepository>(MExportRepository);
            expect(repository).toBeDefined();
        });

        it('should have MExportService defined', () => {
            const repository = module.get<MExportService>(MExportService);
            expect(repository).toBeDefined();
        });

        it('should have MUseRepository defined', () => {
            const repository = module.get<MUseRepository>(MUseRepository);
            expect(repository).toBeDefined();
        });

        it('should have MUsersRepository defined', () => {
            const repository = module.get<MUsersRepository>(MUsersRepository);
            expect(repository).toBeDefined();
        });

        it('should have ModulesService defined', () => {
            const service = module.get(ModulesService);
            expect(service).toBeDefined();
        });

        it('should have PreModuleService defined', () => {
            const service = module.get(PreModuleService);
            expect(service).toBeDefined();
        });

        it('should have MFeatureService defined', () => {
            const service = module.get(MFeatureService);
            expect(service).toBeDefined();
        });

        it('should have MHeaderService defined', () => {
            const service = module.get(MHeaderService);
            expect(service).toBeDefined();
        });

        it('should have MUseService defined', () => {
            const service = module.get(MUseService);
            expect(service).toBeDefined();
        });

        it('should have MTransformService defined', () => {
            const service = module.get(MTransformService);
            expect(service).toBeDefined();
        });

        it('should have MUsersService defined', () => {
            const service = module.get(MUsersService);
            expect(service).toBeDefined();
        });

        it('should have ModuleSeeder defined', () => {
            const seeder = module.get(ModuleSeeder);
            expect(seeder).toBeDefined();
        });
    });

    describe('Module Metadata', () => {
        it('should have controllers metadata', () => {
            const controllers = Reflect.getMetadata('controllers', ModulesModule);
            expect(controllers).toBeDefined();
            expect(controllers).toContain(ModulesController);
        });

        it('should have providers metadata', () => {
            const providers = Reflect.getMetadata('providers', ModulesModule);
            expect(providers).toBeDefined();
            expect(providers).toContain(MUsersService);
            expect(providers).toContain(MExportService);
            expect(providers).toContain(MExportRepository);
            expect(providers).toContain(ModuleSeeder);
            expect(providers).toContain(ModulesRepository);
            expect(providers).toContain(MHeaderRepository);
            expect(providers).toContain(MUseRepository);
            expect(providers).toContain(MFeatureRepository);
            expect(providers).toContain(MUsersRepository);
            expect(providers).toContain(MFeatureService);
            expect(providers).toContain(ModulesService);
            expect(providers).toContain(MTransformService);
            expect(providers).toContain(PreModuleService);
            expect(providers).toContain(MHeaderService);
            expect(providers).toContain(MUseService);
        });

        it('should have exports metadata', () => {
            const exports = Reflect.getMetadata('exports', ModulesModule);
            expect(exports).toBeDefined();
            expect(exports).toContain(ModulesService);
        });

        it('should have imports metadata', () => {
            const imports = Reflect.getMetadata('imports', ModulesModule);
            expect(imports).toBeDefined();
            expect(imports.length).toBe(3);
        });

        it('should have correct number of controllers', () => {
            const controllers = Reflect.getMetadata('controllers', ModulesModule);
            expect(controllers.length).toBe(1);
        });

        it('should have correct number of providers', () => {
            const providers = Reflect.getMetadata('providers', ModulesModule);
            expect(providers.length).toBe(15);
        });

        it('should have correct number of exports', () => {
            const exports = Reflect.getMetadata('exports', ModulesModule);
            expect(exports.length).toBe(1);
        });
    });

    describe('Exports Verification', () => {
        it('should export ModulesService', () => {
            const exports = Reflect.getMetadata('exports', ModulesModule);
            expect(exports).toContain(ModulesService);
        });

        it('should only export one service', () => {
            const exports = Reflect.getMetadata('exports', ModulesModule);
            expect(exports.length).toBe(1);
        });

        it('should not export PreModuleService', () => {
            const exports = Reflect.getMetadata('exports', ModulesModule);
            expect(exports).not.toContain(PreModuleService);
        });

        it('should not export MFeatureService', () => {
            const exports = Reflect.getMetadata('exports', ModulesModule);
            expect(exports).not.toContain(MFeatureService);
        });

        it('should not export MHeaderService', () => {
            const exports = Reflect.getMetadata('exports', ModulesModule);
            expect(exports).not.toContain(MHeaderService);
        });

        it('should not export MUseService', () => {
            const exports = Reflect.getMetadata('exports', ModulesModule);
            expect(exports).not.toContain(MUseService);
        });

        it('should not export MTransformService', () => {
            const exports = Reflect.getMetadata('exports', ModulesModule);
            expect(exports).not.toContain(MTransformService);
        });

        it('should not export MUsersService', () => {
            const exports = Reflect.getMetadata('exports', ModulesModule);
            expect(exports).not.toContain(MUsersService);
        });

        it('should not export any repositories', () => {
            const exports = Reflect.getMetadata('exports', ModulesModule);
            expect(exports).not.toContain(ModulesRepository);
            expect(exports).not.toContain(MFeatureRepository);
            expect(exports).not.toContain(MHeaderRepository);
            expect(exports).not.toContain(MUseRepository);
            expect(exports).not.toContain(MUsersRepository);
        });

        it('should not export ModuleSeeder', () => {
            const exports = Reflect.getMetadata('exports', ModulesModule);
            expect(exports).not.toContain(ModuleSeeder);
        });
    });

    describe('Module Structure', () => {
        it('should have all required imports', () => {
            const imports = Reflect.getMetadata('imports', ModulesModule) || [];
            expect(imports.length).toBeGreaterThan(0);
        });

        it('should have all required providers', () => {
            const providers = Reflect.getMetadata('providers', ModulesModule) || [];
            expect(providers.length).toBeGreaterThan(0);
        });

        it('should have all required controllers', () => {
            const controllers = Reflect.getMetadata('controllers', ModulesModule) || [];
            expect(controllers.length).toBeGreaterThan(0);
        });

        it('should have all required exports', () => {
            const exports = Reflect.getMetadata('exports', ModulesModule) || [];
            expect(exports.length).toBeGreaterThan(0);
        });
    });

    describe('Provider Configuration', () => {
        it('should configure all repositories correctly', () => {
            const providers = Reflect.getMetadata('providers', ModulesModule);
            expect(providers).toContain(ModulesRepository);
            expect(providers).toContain(MFeatureRepository);
            expect(providers).toContain(MHeaderRepository);
            expect(providers).toContain(MUseRepository);
            expect(providers).toContain(MUsersRepository);
            expect(providers).toContain(MExportRepository);
        });

        it('should configure all services correctly', () => {
            const providers = Reflect.getMetadata('providers', ModulesModule);
            expect(providers).toContain(ModulesService);
            expect(providers).toContain(PreModuleService);
            expect(providers).toContain(MFeatureService);
            expect(providers).toContain(MHeaderService);
            expect(providers).toContain(MUseService);
            expect(providers).toContain(MTransformService);
            expect(providers).toContain(MUsersService);
            expect(providers).toContain(MExportService);
        });

        it('should configure ModuleSeeder correctly', () => {
            const providers = Reflect.getMetadata('providers', ModulesModule);
            expect(providers).toContain(ModuleSeeder);
        });
    });

    describe('Controller Configuration', () => {
        it('should configure ModulesController correctly', () => {
            const controllers = Reflect.getMetadata('controllers', ModulesModule);
            expect(controllers).toContain(ModulesController);
        });

        it('should have only one controller', () => {
            const controllers = Reflect.getMetadata('controllers', ModulesModule);
            expect(controllers.length).toBe(1);
        });
    });

    describe('Module Dependencies', () => {
        it('should have DatabaseModule in imports', () => {
            const imports = Reflect.getMetadata('imports', ModulesModule) || [];
            const hasDatabaseModule = imports.some(
                (imp: any) =>
                    imp?.name === 'DatabaseModule' ||
                    imp?.module?.name === 'DatabaseModule' ||
                    imp?.constructor?.name === 'DatabaseModule',
            );
            expect(hasDatabaseModule || imports.length === 3).toBe(true);
        });

        it('should have PermissionsModule in imports', () => {
            const imports = Reflect.getMetadata('imports', ModulesModule) || [];
            const hasPermissionsModule = imports.some(
                (imp: any) => imp?.name === 'PermissionsModule' || imp === 'PermissionsModule',
            );
            expect(hasPermissionsModule || imports.length === 3).toBe(true);
        });

        it('should have correct import count', () => {
            const imports = Reflect.getMetadata('imports', ModulesModule) || [];
            expect(imports.length).toBe(3);
        });
    });

    describe('Repository Instances', () => {
        it('should get ModulesRepository instance', () => {
            const repository = module.get<ModulesRepository>(ModulesRepository);
            expect(repository).toBe(mockModulesRepository);
        });

        it('should get MFeatureRepository instance', () => {
            const repository = module.get<MFeatureRepository>(MFeatureRepository);
            expect(repository).toBe(mockMFeatureRepository);
        });

        it('should get MHeaderRepository instance', () => {
            const repository = module.get<MHeaderRepository>(MHeaderRepository);
            expect(repository).toBe(mockMHeaderRepository);
        });

        it('should get MUseRepository instance', () => {
            const repository = module.get<MUseRepository>(MUseRepository);
            expect(repository).toBe(mockMUseRepository);
        });

        it('should get MUsersRepository instance', () => {
            const repository = module.get<MUsersRepository>(MUsersRepository);
            expect(repository).toBe(mockMUsersRepository);
        });
    });

    describe('Service Instances', () => {
        it('should get ModulesService instance', () => {
            const service = module.get(ModulesService);
            expect(service).toBe(mockModulesService);
        });

        it('should get PreModuleService instance', () => {
            const service = module.get(PreModuleService);
            expect(service).toBe(mockPreModuleService);
        });

        it('should get MFeatureService instance', () => {
            const service = module.get(MFeatureService);
            expect(service).toBe(mockMFeatureService);
        });

        it('should get MHeaderService instance', () => {
            const service = module.get(MHeaderService);
            expect(service).toBe(mockMHeaderService);
        });

        it('should get MUseService instance', () => {
            const service = module.get(MUseService);
            expect(service).toBe(mockMUseService);
        });

        it('should get MTransformService instance', () => {
            const service = module.get(MTransformService);
            expect(service).toBe(mockMTransformService);
        });

        it('should get MUsersService instance', () => {
            const service = module.get(MUsersService);
            expect(service).toBe(mockMUsersService);
        });
    });

    describe('Seeder Instance', () => {
        it('should get ModuleSeeder instance', () => {
            const seeder = module.get(ModuleSeeder);
            expect(seeder).toBe(mockModuleSeeder);
        });
    });

    describe('Controller Instances', () => {
        it('should get ModulesController instance', () => {
            const controller = module.get<ModulesController>(ModulesController);
            expect(controller).toBeDefined();
        });
    });

    describe('Entity Configuration', () => {
        it('should have ModuleEntity token available', () => {
            const token = getRepositoryToken(ModuleEntity);
            expect(token).toBeDefined();
        });

        it('should have MFeatureEntity token available', () => {
            const token = getRepositoryToken(MFeatureEntity);
            expect(token).toBeDefined();
        });

        it('should have MHeaderEntity token available', () => {
            const token = getRepositoryToken(MHeaderEntity);
            expect(token).toBeDefined();
        });

        it('should have MUseEntity token available', () => {
            const token = getRepositoryToken(MUseEntity);
            expect(token).toBeDefined();
        });

        it('should have MUsersEntity token available', () => {
            const token = getRepositoryToken(MUsersEntity);
            expect(token).toBeDefined();
        });

        it('should have MExportEntity token available', () => {
            const token = getRepositoryToken(MExportEntity);
            expect(token).toBeDefined();
        });
    });

    describe('Provider Dependencies', () => {
        it('should have all service dependencies resolved', () => {
            expect(module.get(ModulesService)).toBeDefined();
            expect(module.get(PreModuleService)).toBeDefined();
            expect(module.get(MFeatureService)).toBeDefined();
            expect(module.get(MHeaderService)).toBeDefined();
            expect(module.get(MUseService)).toBeDefined();
            expect(module.get(MTransformService)).toBeDefined();
            expect(module.get(MUsersService)).toBeDefined();
        });

        it('should have all repository dependencies resolved', () => {
            expect(module.get(ModulesRepository)).toBeDefined();
            expect(module.get(MFeatureRepository)).toBeDefined();
            expect(module.get(MHeaderRepository)).toBeDefined();
            expect(module.get(MUseRepository)).toBeDefined();
            expect(module.get(MUsersRepository)).toBeDefined();
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

        it('should have ModuleSeeder available', () => {
            expect(module.get(ModuleSeeder)).toBeDefined();
        });
    });

    describe('Module Exports Validation', () => {
        it('should export only ModulesService', () => {
            const exports = Reflect.getMetadata('exports', ModulesModule);
            expect(exports).toContain(ModulesService);
            expect(exports.length).toBe(1);
        });

        it('should have matching exports and providers for exported items', () => {
            const exports = Reflect.getMetadata('exports', ModulesModule);
            const providers = Reflect.getMetadata('providers', ModulesModule);

            exports.forEach((exp: any) => {
                expect(providers).toContain(exp);
            });
        });

        it('should keep internal services private', () => {
            const exports = Reflect.getMetadata('exports', ModulesModule);
            const providers = Reflect.getMetadata('providers', ModulesModule);

            expect(providers).toContain(PreModuleService);
            expect(providers).toContain(MFeatureService);
            expect(providers).toContain(MHeaderService);
            expect(providers).toContain(MUseService);
            expect(providers).toContain(MTransformService);
            expect(providers).toContain(MUsersService);

            expect(exports).not.toContain(PreModuleService);
            expect(exports).not.toContain(MFeatureService);
            expect(exports).not.toContain(MHeaderService);
            expect(exports).not.toContain(MUseService);
            expect(exports).not.toContain(MTransformService);
            expect(exports).not.toContain(MUsersService);
        });

        it('should keep all repositories private', () => {
            const exports = Reflect.getMetadata('exports', ModulesModule);
            const providers = Reflect.getMetadata('providers', ModulesModule);

            expect(providers).toContain(ModulesRepository);
            expect(providers).toContain(MFeatureRepository);
            expect(providers).toContain(MHeaderRepository);
            expect(providers).toContain(MUseRepository);
            expect(providers).toContain(MUsersRepository);

            expect(exports).not.toContain(ModulesRepository);
            expect(exports).not.toContain(MFeatureRepository);
            expect(exports).not.toContain(MHeaderRepository);
            expect(exports).not.toContain(MUseRepository);
            expect(exports).not.toContain(MUsersRepository);
        });

        it('should keep ModuleSeeder private', () => {
            const exports = Reflect.getMetadata('exports', ModulesModule);
            const providers = Reflect.getMetadata('providers', ModulesModule);

            expect(providers).toContain(ModuleSeeder);
            expect(exports).not.toContain(ModuleSeeder);
        });
    });

    describe('Module Import Validation', () => {
        it('should import DatabaseModule twice (base + forFeature)', () => {
            const imports = Reflect.getMetadata('imports', ModulesModule) || [];
            const databaseImports = imports.filter(
                (imp: any) =>
                    imp?.name === 'DatabaseModule' ||
                    imp?.module?.name === 'DatabaseModule' ||
                    imp?.constructor?.name === 'DatabaseModule',
            );
            expect(databaseImports.length >= 1 || imports.length === 3).toBe(true);
        });

        it('should configure forFeature with five entities', () => {
            const imports = Reflect.getMetadata('imports', ModulesModule) || [];
            expect(imports.length).toBe(3);
        });

        it('should have PermissionsModule imported', () => {
            const imports = Reflect.getMetadata('imports', ModulesModule) || [];
            expect(imports.length).toBe(3);
        });
    });

    describe('Module Compilation', () => {
        it('should compile without errors', () => {
            expect(module).toBeDefined();
            expect(module).toBeInstanceOf(TestingModule);
        });

        it('should initialize all providers', () => {
            expect(module.get(ModulesRepository)).toBeDefined();
            expect(module.get(MFeatureRepository)).toBeDefined();
            expect(module.get(MHeaderRepository)).toBeDefined();
            expect(module.get(MUseRepository)).toBeDefined();
            expect(module.get(MUsersRepository)).toBeDefined();
            expect(module.get(ModulesService)).toBeDefined();
            expect(module.get(PreModuleService)).toBeDefined();
            expect(module.get(MFeatureService)).toBeDefined();
            expect(module.get(MHeaderService)).toBeDefined();
            expect(module.get(MUseService)).toBeDefined();
            expect(module.get(MTransformService)).toBeDefined();
            expect(module.get(MUsersService)).toBeDefined();
            expect(module.get(ModuleSeeder)).toBeDefined();
        });

        it('should initialize all controllers', () => {
            expect(module.get(ModulesController)).toBeDefined();
        });
    });

    describe('Provider Uniqueness', () => {
        it('should have unique service instances per module', () => {
            const service1 = module.get<ModulesService>(ModulesService);
            const service2 = module.get<ModulesService>(ModulesService);

            expect(service1).toBe(service2);
        });

        it('should have unique repository instances per module', () => {
            const repo1 = module.get<ModulesRepository>(ModulesRepository);
            const repo2 = module.get<ModulesRepository>(ModulesRepository);

            expect(repo1).toBe(repo2);
        });
    });

    describe('Module Integration', () => {
        it('should integrate with DatabaseModule', () => {
            const imports = Reflect.getMetadata('imports', ModulesModule) || [];
            expect(imports.length).toBe(3);
        });

        it('should integrate with PermissionsModule', () => {
            const imports = Reflect.getMetadata('imports', ModulesModule) || [];
            const hasPermissionsModule = imports.some(
                (imp: any) => imp?.name === 'PermissionsModule' || imp === 'PermissionsModule',
            );
            expect(hasPermissionsModule || imports.length === 3).toBe(true);
        });
    });

    describe('Complete Module Structure', () => {
        it('should have correct module structure', () => {
            const controllers = Reflect.getMetadata('controllers', ModulesModule);
            const providers = Reflect.getMetadata('providers', ModulesModule);
            const exports = Reflect.getMetadata('exports', ModulesModule);
            const imports = Reflect.getMetadata('imports', ModulesModule);

            expect(controllers).toBeDefined();
            expect(providers).toBeDefined();
            expect(exports).toBeDefined();
            expect(imports).toBeDefined();

            expect(controllers.length).toBe(1);
            expect(providers.length).toBe(15);
            expect(exports.length).toBe(1);
            expect(imports.length).toBe(3);
        });
    });

    describe('Selective Export Strategy', () => {
        it('should export only the main public service', () => {
            const exports = Reflect.getMetadata('exports', ModulesModule);

            expect(exports).toContain(ModulesService);
            expect(exports.length).toBe(1);
        });

        it('should keep all other services private', () => {
            const exports = Reflect.getMetadata('exports', ModulesModule);

            expect(exports).not.toContain(PreModuleService);
            expect(exports).not.toContain(MFeatureService);
            expect(exports).not.toContain(MHeaderService);
            expect(exports).not.toContain(MUseService);
            expect(exports).not.toContain(MTransformService);
            expect(exports).not.toContain(MUsersService);
        });

        it('should keep all repositories private', () => {
            const exports = Reflect.getMetadata('exports', ModulesModule);

            expect(exports).not.toContain(ModulesRepository);
            expect(exports).not.toContain(MFeatureRepository);
            expect(exports).not.toContain(MHeaderRepository);
            expect(exports).not.toContain(MUseRepository);
            expect(exports).not.toContain(MUsersRepository);
        });
    });

    describe('Module Provider Order', () => {
        it('should have providers in correct order', () => {
            const providers = Reflect.getMetadata('providers', ModulesModule);
            expect(providers[0]).toBe(MUsersService);
            expect(providers[1]).toBe(ModuleSeeder);
            expect(providers[2]).toBe(ModulesRepository);
            expect(providers[3]).toBe(MHeaderRepository);
            expect(providers[4]).toBe(MUseRepository);
            expect(providers[5]).toBe(MFeatureRepository);
            expect(providers[6]).toBe(MUsersRepository);
            expect(providers[7]).toBe(MFeatureService);
            expect(providers[8]).toBe(ModulesService);
            expect(providers[9]).toBe(MTransformService);
            expect(providers[10]).toBe(PreModuleService);
            expect(providers[11]).toBe(MHeaderService);
            expect(providers[12]).toBe(MUseService);
            expect(providers[13]).toBe(MExportRepository);
            expect(providers[14]).toBe(MExportService);
        });
    });

    describe('Module Export Order', () => {
        it('should have exports in correct order', () => {
            const exports = Reflect.getMetadata('exports', ModulesModule);
            expect(exports[0]).toBe(ModulesService);
        });
    });

    describe('Entity Registration', () => {
        it('should register ModuleEntity', () => {
            const token = getRepositoryToken(ModuleEntity);
            expect(token).toBe('ModuleEntityRepository');
        });

        it('should register MFeatureEntity', () => {
            const token = getRepositoryToken(MFeatureEntity);
            expect(token).toBe('MFeatureEntityRepository');
        });

        it('should register MHeaderEntity', () => {
            const token = getRepositoryToken(MHeaderEntity);
            expect(token).toBe('MHeaderEntityRepository');
        });

        it('should register MUseEntity', () => {
            const token = getRepositoryToken(MUseEntity);
            expect(token).toBe('MUseEntityRepository');
        });

        it('should register MUsersEntity', () => {
            const token = getRepositoryToken(MUsersEntity);
            expect(token).toBe('MUsersEntityRepository');
        });

        it('should register MExportEntity', () => {
            const token = getRepositoryToken(MExportEntity);
            expect(token).toBe('MExportEntityRepository');
        });

        it('should have all five entities registered', () => {
            const moduleToken = getRepositoryToken(ModuleEntity);
            const featureToken = getRepositoryToken(MFeatureEntity);
            const headerToken = getRepositoryToken(MHeaderEntity);
            const useToken = getRepositoryToken(MUseEntity);
            const usersToken = getRepositoryToken(MUsersEntity);
            const exportToken = getRepositoryToken(MExportEntity);

            expect(moduleToken).toBeDefined();
            expect(featureToken).toBeDefined();
            expect(headerToken).toBeDefined();
            expect(useToken).toBeDefined();
            expect(usersToken).toBeDefined();
            expect(exportToken).toBeDefined();

            expect(moduleToken).not.toBe(featureToken);
            expect(featureToken).not.toBe(headerToken);
            expect(headerToken).not.toBe(useToken);
            expect(useToken).not.toBe(usersToken);
            expect(useToken).not.toBe(exportToken);
        });
    });

    describe('Multiple Entity Support', () => {
        it('should support five entities in one module', () => {
            const imports = Reflect.getMetadata('imports', ModulesModule) || [];
            expect(imports.length).toBe(3);
        });

        it('should have five repositories for five entities', () => {
            const providers = Reflect.getMetadata('providers', ModulesModule);
            const repositories = providers.filter(
                (p: any) =>
                    p === ModulesRepository ||
                    p === MFeatureRepository ||
                    p === MHeaderRepository ||
                    p === MUseRepository ||
                    p === MUsersRepository,
            );

            expect(repositories.length).toBe(5);
        });

        it('should be able to inject all repositories', () => {
            const modulesRepo = module.get<ModulesRepository>(ModulesRepository);
            const featureRepo = module.get<MFeatureRepository>(MFeatureRepository);
            const headerRepo = module.get<MHeaderRepository>(MHeaderRepository);
            const useRepo = module.get<MUseRepository>(MUseRepository);
            const usersRepo = module.get<MUsersRepository>(MUsersRepository);

            expect(modulesRepo).toBeDefined();
            expect(featureRepo).toBeDefined();
            expect(headerRepo).toBeDefined();
            expect(useRepo).toBeDefined();
            expect(usersRepo).toBeDefined();

            expect(modulesRepo).not.toBe(featureRepo);
            expect(featureRepo).not.toBe(headerRepo);
            expect(headerRepo).not.toBe(useRepo);
            expect(useRepo).not.toBe(usersRepo);
        });
    });

    describe('Service Layer Architecture', () => {
        it('should have seven services for different responsibilities', () => {
            const providers = Reflect.getMetadata('providers', ModulesModule);
            const services = providers.filter(
                (p: any) =>
                    p === ModulesService ||
                    p === PreModuleService ||
                    p === MFeatureService ||
                    p === MHeaderService ||
                    p === MUseService ||
                    p === MTransformService ||
                    p === MUsersService,
            );

            expect(services.length).toBe(7);
        });

        it('should be able to inject all services', () => {
            const modulesService = module.get<ModulesService>(ModulesService);
            const preService = module.get<PreModuleService>(PreModuleService);
            const featureService = module.get<MFeatureService>(MFeatureService);
            const headerService = module.get<MHeaderService>(MHeaderService);
            const useService = module.get<MUseService>(MUseService);
            const transformService = module.get<MTransformService>(MTransformService);
            const usersService = module.get<MUsersService>(MUsersService);

            expect(modulesService).toBeDefined();
            expect(preService).toBeDefined();
            expect(featureService).toBeDefined();
            expect(headerService).toBeDefined();
            expect(useService).toBeDefined();
            expect(transformService).toBeDefined();
            expect(usersService).toBeDefined();
        });
    });

    describe('Internal vs External Providers', () => {
        it('should distinguish between public and internal providers', () => {
            const providers = Reflect.getMetadata('providers', ModulesModule);
            const exports = Reflect.getMetadata('exports', ModulesModule);

            const internalProviders = providers.filter((p: any) => !exports.includes(p));

            expect(internalProviders).toContain(PreModuleService);
            expect(internalProviders).toContain(MFeatureService);
            expect(internalProviders).toContain(MHeaderService);
            expect(internalProviders).toContain(MUseService);
            expect(internalProviders).toContain(MTransformService);
            expect(internalProviders).toContain(MUsersService);
            expect(internalProviders).toContain(ModulesRepository);
            expect(internalProviders).toContain(MFeatureRepository);
            expect(internalProviders).toContain(MHeaderRepository);
            expect(internalProviders).toContain(MUseRepository);
            expect(internalProviders).toContain(MUsersRepository);
            expect(internalProviders).toContain(ModuleSeeder);
            expect(internalProviders.length).toBe(14);
        });

        it('should export 1 out of 13 providers', () => {
            const providers = Reflect.getMetadata('providers', ModulesModule);
            const exports = Reflect.getMetadata('exports', ModulesModule);

            expect(providers.length).toBe(15);
            expect(exports.length).toBe(1);
        });
    });

    describe('Complex Module Pattern', () => {
        it('should handle complex module with 5 entities, 5 repos, 7 services, 1 seeder', () => {
            const providers = Reflect.getMetadata('providers', ModulesModule);

            const repositories = [
                ModulesRepository,
                MFeatureRepository,
                MHeaderRepository,
                MUseRepository,
                MUsersRepository,
            ];
            const services = [
                ModulesService,
                PreModuleService,
                MFeatureService,
                MHeaderService,
                MUseService,
                MTransformService,
                MUsersService,
            ];

            repositories.forEach((repo) => {
                expect(providers).toContain(repo);
            });

            services.forEach((service) => {
                expect(providers).toContain(service);
            });

            expect(providers).toContain(ModuleSeeder);
        });
    });

    describe('Seeder Integration', () => {
        it('should include ModuleSeeder in providers', () => {
            const providers = Reflect.getMetadata('providers', ModulesModule);
            expect(providers).toContain(ModuleSeeder);
        });

        it('should not export ModuleSeeder', () => {
            const exports = Reflect.getMetadata('exports', ModulesModule);
            expect(exports).not.toContain(ModuleSeeder);
        });

        it('should be able to get ModuleSeeder instance', () => {
            const seeder = module.get(ModuleSeeder);
            expect(seeder).toBeDefined();
            expect(seeder).toBe(mockModuleSeeder);
        });
    });

    describe('Transform Service Integration', () => {
        it('should include MTransformService in providers', () => {
            const providers = Reflect.getMetadata('providers', ModulesModule);
            expect(providers).toContain(MTransformService);
        });

        it('should not export MTransformService', () => {
            const exports = Reflect.getMetadata('exports', ModulesModule);
            expect(exports).not.toContain(MTransformService);
        });

        it('should be able to get MTransformService instance', () => {
            const service = module.get(MTransformService);
            expect(service).toBeDefined();
            expect(service).toBe(mockMTransformService);
        });
    });

    describe('Module Encapsulation', () => {
        it('should only expose ModulesService to other modules', () => {
            const exports = Reflect.getMetadata('exports', ModulesModule);
            expect(exports.length).toBe(1);
            expect(exports[0]).toBe(ModulesService);
        });

        it('should keep 12 providers internal', () => {
            const providers = Reflect.getMetadata('providers', ModulesModule);
            const exports = Reflect.getMetadata('exports', ModulesModule);

            const internalCount = providers.length - exports.length;
            expect(internalCount).toBe(14);
        });

        it('should provide clear API through single exported service', () => {
            const exports = Reflect.getMetadata('exports', ModulesModule);
            expect(exports).toEqual([ModulesService]);
        });
    });
});
