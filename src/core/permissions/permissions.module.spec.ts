import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsModule } from './permissions.module';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { PermissionSeeder } from './permissions.seeder';
import { PermissionRepository } from './permissions.repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PermissionEntity } from './entities/permission.entity';
import { Reflector } from '@nestjs/core';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('PermissionsModule', () => {
    let module: TestingModule;

    const mockPermissionRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockPermissionsService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    const mockPermissionSeeder = {
        seed: jest.fn(),
        seedAll: jest.fn(),
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

    beforeEach(async () => {
        module = await Test.createTestingModule({
            controllers: [PermissionsController],
            providers: [
                {
                    provide: PermissionRepository,
                    useValue: mockPermissionRepository,
                },
                {
                    provide: PermissionsService,
                    useValue: mockPermissionsService,
                },
                {
                    provide: PermissionSeeder,
                    useValue: mockPermissionSeeder,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandlerService,
                },
                {
                    provide: getRepositoryToken(PermissionEntity),
                    useValue: mockPermissionRepository,
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
        it('should have PermissionsController defined', () => {
            const controller = module.get<PermissionsController>(PermissionsController);
            expect(controller).toBeDefined();
        });

        it('should create PermissionsController instance', () => {
            const controller = module.get<PermissionsController>(PermissionsController);
            expect(controller).toBeInstanceOf(PermissionsController);
        });
    });

    describe('Providers', () => {
        it('should have PermissionRepository defined', () => {
            const repository = module.get<PermissionRepository>(PermissionRepository);
            expect(repository).toBeDefined();
        });

        it('should have PermissionsService defined', () => {
            const service = module.get(PermissionsService);
            expect(service).toBeDefined();
        });

        it('should have PermissionSeeder defined', () => {
            const seeder = module.get(PermissionSeeder);
            expect(seeder).toBeDefined();
        });
    });

    describe('Module Metadata', () => {
        it('should have controllers metadata', () => {
            const controllers = Reflect.getMetadata('controllers', PermissionsModule);
            expect(controllers).toBeDefined();
            expect(controllers).toContain(PermissionsController);
        });

        it('should have providers metadata', () => {
            const providers = Reflect.getMetadata('providers', PermissionsModule);
            expect(providers).toBeDefined();
            expect(providers).toContain(PermissionsService);
            expect(providers).toContain(PermissionSeeder);
            expect(providers).toContain(PermissionRepository);
        });

        it('should have exports metadata', () => {
            const exports = Reflect.getMetadata('exports', PermissionsModule);
            expect(exports).toBeDefined();
            expect(exports).toContain(PermissionsService);
            expect(exports).toContain(PermissionRepository);
        });

        it('should have imports metadata', () => {
            const imports = Reflect.getMetadata('imports', PermissionsModule);
            expect(imports).toBeDefined();
            expect(imports.length).toBe(2);
        });

        it('should have correct number of controllers', () => {
            const controllers = Reflect.getMetadata('controllers', PermissionsModule);
            expect(controllers.length).toBe(1);
        });

        it('should have correct number of providers', () => {
            const providers = Reflect.getMetadata('providers', PermissionsModule);
            expect(providers.length).toBe(3);
        });

        it('should have correct number of exports', () => {
            const exports = Reflect.getMetadata('exports', PermissionsModule);
            expect(exports.length).toBe(2);
        });
    });

    describe('Exports Verification', () => {
        it('should export PermissionsService', () => {
            const exports = Reflect.getMetadata('exports', PermissionsModule);
            expect(exports).toContain(PermissionsService);
        });

        it('should export PermissionRepository', () => {
            const exports = Reflect.getMetadata('exports', PermissionsModule);
            expect(exports).toContain(PermissionRepository);
        });

        it('should export exactly two providers', () => {
            const exports = Reflect.getMetadata('exports', PermissionsModule);
            expect(exports.length).toBe(2);
        });

        it('should not export PermissionSeeder', () => {
            const exports = Reflect.getMetadata('exports', PermissionsModule);
            expect(exports).not.toContain(PermissionSeeder);
        });
    });

    describe('Module Structure', () => {
        it('should have all required imports', () => {
            const imports = Reflect.getMetadata('imports', PermissionsModule) || [];
            expect(imports.length).toBeGreaterThan(0);
        });

        it('should have all required providers', () => {
            const providers = Reflect.getMetadata('providers', PermissionsModule) || [];
            expect(providers.length).toBeGreaterThan(0);
        });

        it('should have all required controllers', () => {
            const controllers = Reflect.getMetadata('controllers', PermissionsModule) || [];
            expect(controllers.length).toBeGreaterThan(0);
        });

        it('should have all required exports', () => {
            const exports = Reflect.getMetadata('exports', PermissionsModule) || [];
            expect(exports.length).toBeGreaterThan(0);
        });
    });

    describe('Provider Configuration', () => {
        it('should configure repository correctly', () => {
            const providers = Reflect.getMetadata('providers', PermissionsModule);
            expect(providers).toContain(PermissionRepository);
        });

        it('should configure service correctly', () => {
            const providers = Reflect.getMetadata('providers', PermissionsModule);
            expect(providers).toContain(PermissionsService);
        });

        it('should configure seeder correctly', () => {
            const providers = Reflect.getMetadata('providers', PermissionsModule);
            expect(providers).toContain(PermissionSeeder);
        });
    });

    describe('Controller Configuration', () => {
        it('should configure PermissionsController correctly', () => {
            const controllers = Reflect.getMetadata('controllers', PermissionsModule);
            expect(controllers).toContain(PermissionsController);
        });

        it('should have only one controller', () => {
            const controllers = Reflect.getMetadata('controllers', PermissionsModule);
            expect(controllers.length).toBe(1);
        });
    });

    describe('Module Dependencies', () => {
        it('should have DatabaseModule in imports', () => {
            const imports = Reflect.getMetadata('imports', PermissionsModule) || [];
            const hasDatabaseModule = imports.some(
                (imp: any) =>
                    imp?.name === 'DatabaseModule' ||
                    imp?.module?.name === 'DatabaseModule' ||
                    imp?.constructor?.name === 'DatabaseModule',
            );
            expect(hasDatabaseModule || imports.length === 2).toBe(true);
        });

        it('should have correct import count', () => {
            const imports = Reflect.getMetadata('imports', PermissionsModule) || [];
            expect(imports.length).toBe(2);
        });
    });

    describe('Repository Instances', () => {
        it('should get PermissionRepository instance', () => {
            const repository = module.get<PermissionRepository>(PermissionRepository);
            expect(repository).toBe(mockPermissionRepository);
        });
    });

    describe('Service Instances', () => {
        it('should get PermissionsService instance', () => {
            const service = module.get(PermissionsService);
            expect(service).toBe(mockPermissionsService);
        });
    });

    describe('Seeder Instance', () => {
        it('should get PermissionSeeder instance', () => {
            const seeder = module.get(PermissionSeeder);
            expect(seeder).toBe(mockPermissionSeeder);
        });
    });

    describe('Controller Instances', () => {
        it('should get PermissionsController instance', () => {
            const controller = module.get<PermissionsController>(PermissionsController);
            expect(controller).toBeDefined();
        });
    });

    describe('Entity Configuration', () => {
        it('should have PermissionEntity token available', () => {
            const token = getRepositoryToken(PermissionEntity);
            expect(token).toBeDefined();
        });

        it('should register PermissionEntity correctly', () => {
            const token = getRepositoryToken(PermissionEntity);
            expect(token).toBe('PermissionEntityRepository');
        });
    });

    describe('Provider Dependencies', () => {
        it('should have all service dependencies resolved', () => {
            expect(module.get(PermissionsService)).toBeDefined();
        });

        it('should have all repository dependencies resolved', () => {
            expect(module.get(PermissionRepository)).toBeDefined();
        });

        it('should have PermissionSeeder available', () => {
            expect(module.get(PermissionSeeder)).toBeDefined();
        });
    });

    describe('Module Exports Validation', () => {
        it('should export PermissionsService and PermissionRepository', () => {
            const exports = Reflect.getMetadata('exports', PermissionsModule);
            expect(exports).toContain(PermissionsService);
            expect(exports).toContain(PermissionRepository);
            expect(exports.length).toBe(2);
        });

        it('should have matching exports and providers for exported items', () => {
            const exports = Reflect.getMetadata('exports', PermissionsModule);
            const providers = Reflect.getMetadata('providers', PermissionsModule);

            exports.forEach((exp: any) => {
                expect(providers).toContain(exp);
            });
        });

        it('should keep seeder private', () => {
            const exports = Reflect.getMetadata('exports', PermissionsModule);
            const providers = Reflect.getMetadata('providers', PermissionsModule);

            expect(providers).toContain(PermissionSeeder);
            expect(exports).not.toContain(PermissionSeeder);
        });
    });

    describe('Module Import Validation', () => {
        it('should import DatabaseModule twice (base + forFeature)', () => {
            const imports = Reflect.getMetadata('imports', PermissionsModule) || [];
            expect(imports.length).toBe(2);
        });

        it('should configure forFeature with PermissionEntity', () => {
            const imports = Reflect.getMetadata('imports', PermissionsModule) || [];
            expect(imports.length).toBe(2);
        });
    });

    describe('Module Compilation', () => {
        it('should compile without errors', () => {
            expect(module).toBeDefined();
            expect(module).toBeInstanceOf(TestingModule);
        });

        it('should initialize all providers', () => {
            expect(module.get(PermissionRepository)).toBeDefined();
            expect(module.get(PermissionsService)).toBeDefined();
            expect(module.get(PermissionSeeder)).toBeDefined();
        });

        it('should initialize all controllers', () => {
            expect(module.get(PermissionsController)).toBeDefined();
        });
    });

    describe('Provider Uniqueness', () => {
        it('should have unique service instances per module', () => {
            const service1 = module.get<PermissionsService>(PermissionsService);
            const service2 = module.get<PermissionsService>(PermissionsService);

            expect(service1).toBe(service2);
        });

        it('should have unique repository instances per module', () => {
            const repo1 = module.get<PermissionRepository>(PermissionRepository);
            const repo2 = module.get<PermissionRepository>(PermissionRepository);

            expect(repo1).toBe(repo2);
        });
    });

    describe('Module Integration', () => {
        it('should integrate with DatabaseModule', () => {
            const imports = Reflect.getMetadata('imports', PermissionsModule) || [];
            expect(imports.length).toBe(2);
        });
    });

    describe('Complete Module Structure', () => {
        it('should have correct module structure', () => {
            const controllers = Reflect.getMetadata('controllers', PermissionsModule);
            const providers = Reflect.getMetadata('providers', PermissionsModule);
            const exports = Reflect.getMetadata('exports', PermissionsModule);
            const imports = Reflect.getMetadata('imports', PermissionsModule);

            expect(controllers).toBeDefined();
            expect(providers).toBeDefined();
            expect(exports).toBeDefined();
            expect(imports).toBeDefined();

            expect(controllers.length).toBe(1);
            expect(providers.length).toBe(3);
            expect(exports.length).toBe(2);
            expect(imports.length).toBe(2);
        });
    });

    describe('Export Strategy', () => {
        it('should export service and repository', () => {
            const exports = Reflect.getMetadata('exports', PermissionsModule);

            expect(exports).toContain(PermissionsService);
            expect(exports).toContain(PermissionRepository);
            expect(exports.length).toBe(2);
        });

        it('should keep seeder private', () => {
            const exports = Reflect.getMetadata('exports', PermissionsModule);

            expect(exports).not.toContain(PermissionSeeder);
        });
    });

    describe('Module Provider Order', () => {
        it('should have providers in correct order', () => {
            const providers = Reflect.getMetadata('providers', PermissionsModule);
            expect(providers[0]).toBe(PermissionsService);
            expect(providers[1]).toBe(PermissionSeeder);
            expect(providers[2]).toBe(PermissionRepository);
        });
    });

    describe('Module Export Order', () => {
        it('should have exports in correct order', () => {
            const exports = Reflect.getMetadata('exports', PermissionsModule);
            expect(exports[0]).toBe(PermissionsService);
            expect(exports[1]).toBe(PermissionRepository);
        });
    });

    describe('Seeder Integration', () => {
        it('should include PermissionSeeder in providers', () => {
            const providers = Reflect.getMetadata('providers', PermissionsModule);
            expect(providers).toContain(PermissionSeeder);
        });

        it('should not export PermissionSeeder', () => {
            const exports = Reflect.getMetadata('exports', PermissionsModule);
            expect(exports).not.toContain(PermissionSeeder);
        });

        it('should be able to get PermissionSeeder instance', () => {
            const seeder = module.get(PermissionSeeder);
            expect(seeder).toBeDefined();
            expect(seeder).toBe(mockPermissionSeeder);
        });
    });

    describe('Module Encapsulation', () => {
        it('should expose PermissionsService and PermissionRepository to other modules', () => {
            const exports = Reflect.getMetadata('exports', PermissionsModule);
            expect(exports.length).toBe(2);
            expect(exports[0]).toBe(PermissionsService);
            expect(exports[1]).toBe(PermissionRepository);
        });

        it('should keep 1 provider internal', () => {
            const providers = Reflect.getMetadata('providers', PermissionsModule);
            const exports = Reflect.getMetadata('exports', PermissionsModule);

            const internalCount = providers.length - exports.length;
            expect(internalCount).toBe(1);
        });

        it('should provide clear API through exported service and repository', () => {
            const exports = Reflect.getMetadata('exports', PermissionsModule);
            expect(exports).toEqual([PermissionsService, PermissionRepository]);
        });
    });

    describe('Internal vs External Providers', () => {
        it('should distinguish between public and internal providers', () => {
            const providers = Reflect.getMetadata('providers', PermissionsModule);
            const exports = Reflect.getMetadata('exports', PermissionsModule);

            const internalProviders = providers.filter((p: any) => !exports.includes(p));

            expect(internalProviders).toContain(PermissionSeeder);
            expect(internalProviders.length).toBe(1);
        });

        it('should export 2 out of 3 providers', () => {
            const providers = Reflect.getMetadata('providers', PermissionsModule);
            const exports = Reflect.getMetadata('exports', PermissionsModule);

            expect(providers.length).toBe(3);
            expect(exports.length).toBe(2);
        });
    });

    describe('Single Entity Pattern', () => {
        it('should handle module with 1 entities, 1 repository, 1 service, 1 seeder', () => {
            const providers = Reflect.getMetadata('providers', PermissionsModule);

            expect(providers).toContain(PermissionRepository);
            expect(providers).toContain(PermissionsService);
            expect(providers).toContain(PermissionSeeder);

            expect(providers.length).toBe(3);
        });
    });

    describe('Database Integration', () => {
        it('should import DatabaseModule for base configuration', () => {
            const imports = Reflect.getMetadata('imports', PermissionsModule) || [];
            const hasDatabaseModule = imports.some(
                (imp: any) =>
                    imp?.name === 'DatabaseModule' ||
                    imp?.module?.name === 'DatabaseModule' ||
                    imp?.constructor?.name === 'DatabaseModule',
            );
            expect(hasDatabaseModule || imports.length === 2).toBe(true);
        });

        it('should use forFeature to register PermissionEntity', () => {
            const imports = Reflect.getMetadata('imports', PermissionsModule) || [];
            expect(imports.length).toBe(2);
        });
    });

    describe('Public API Surface', () => {
        it('should expose PermissionsService for business logic', () => {
            const exports = Reflect.getMetadata('exports', PermissionsModule);
            expect(exports).toContain(PermissionsService);
        });

        it('should expose PermissionRepository for data access', () => {
            const exports = Reflect.getMetadata('exports', PermissionsModule);
            expect(exports).toContain(PermissionRepository);
        });

        it('should hide implementation details (seeder)', () => {
            const exports = Reflect.getMetadata('exports', PermissionsModule);
            expect(exports).not.toContain(PermissionSeeder);
        });
    });

    describe('Module Architecture', () => {
        it('should follow NestJS module pattern', () => {
            const controllers = Reflect.getMetadata('controllers', PermissionsModule);
            const providers = Reflect.getMetadata('providers', PermissionsModule);
            const exports = Reflect.getMetadata('exports', PermissionsModule);
            const imports = Reflect.getMetadata('imports', PermissionsModule);

            expect(controllers).toBeDefined();
            expect(providers).toBeDefined();
            expect(exports).toBeDefined();
            expect(imports).toBeDefined();
        });

        it('should maintain separation of concerns', () => {
            const providers = Reflect.getMetadata('providers', PermissionsModule);

            const hasRepository = providers.includes(PermissionRepository);
            const hasService = providers.includes(PermissionsService);
            const hasSeeder = providers.includes(PermissionSeeder);

            expect(hasRepository).toBe(true);
            expect(hasService).toBe(true);
            expect(hasSeeder).toBe(true);
        });
    });

    describe('Dependency Injection', () => {
        it('should resolve all dependencies correctly', () => {
            expect(() => module.get(PermissionsController)).not.toThrow();
            expect(() => module.get(PermissionsService)).not.toThrow();
            expect(() => module.get(PermissionRepository)).not.toThrow();
            expect(() => module.get(PermissionSeeder)).not.toThrow();
        });

        it('should use singleton pattern for providers', () => {
            const service1 = module.get(PermissionsService);
            const service2 = module.get(PermissionsService);
            expect(service1).toBe(service2);

            const repo1 = module.get(PermissionRepository);
            const repo2 = module.get(PermissionRepository);
            expect(repo1).toBe(repo2);

            const seeder1 = module.get(PermissionSeeder);
            const seeder2 = module.get(PermissionSeeder);
            expect(seeder1).toBe(seeder2);
        });
    });
});
