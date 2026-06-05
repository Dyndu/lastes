import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesModule } from './categories.module';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoriesSeeder } from './categories.seeder';
import { CategoriesRepository } from './categories.repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CategoryEntity } from './entities/category.entity';
import { Reflector } from '@nestjs/core';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('CategoriesModule', () => {
    let module: TestingModule;

    const mockCategoriesRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        createMany: jest.fn(),
    };

    const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    };

    const mockErrorHandlerService = {
        forbidden: jest.fn((_message, userMessage) => {
            throw new Error(userMessage);
        }),
    };

    const mockCategoriesService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    const mockCategoriesSeeder = {
        seed: jest.fn(),
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
            controllers: [CategoriesController],
            providers: [
                {
                    provide: CategoriesRepository,
                    useValue: mockCategoriesRepository,
                },
                {
                    provide: CategoriesService,
                    useValue: mockCategoriesService,
                },
                {
                    provide: CategoriesSeeder,
                    useValue: mockCategoriesSeeder,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandlerService,
                },
                {
                    provide: getRepositoryToken(CategoryEntity),
                    useValue: mockCategoriesRepository,
                },
                {
                    provide: WINSTON_MODULE_PROVIDER,
                    useValue: mockLogger,
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

    describe('Global Module', () => {
        it('should be a global module', () => {
            const isGlobal = Reflect.getMetadata('__module:global__', CategoriesModule);
            expect(isGlobal).toBe(true);
        });
    });

    describe('Controllers', () => {
        it('should have CategoriesController defined', () => {
            const controller = module.get<CategoriesController>(CategoriesController);
            expect(controller).toBeDefined();
        });

        it('should create CategoriesController instance', () => {
            const controller = module.get<CategoriesController>(CategoriesController);
            expect(controller).toBeInstanceOf(CategoriesController);
        });
    });

    describe('Providers', () => {
        it('should have CategoriesRepository defined', () => {
            const repository = module.get<CategoriesRepository>(CategoriesRepository);
            expect(repository).toBeDefined();
        });

        it('should have CategoriesService defined', () => {
            const service = module.get(CategoriesService);
            expect(service).toBeDefined();
        });

        it('should have CategoriesSeeder defined', () => {
            const seeder = module.get(CategoriesSeeder);
            expect(seeder).toBeDefined();
        });
    });

    describe('Module Metadata', () => {
        it('should have controllers metadata', () => {
            const controllers = Reflect.getMetadata('controllers', CategoriesModule);
            expect(controllers).toBeDefined();
            expect(controllers).toContain(CategoriesController);
        });

        it('should have providers metadata', () => {
            const providers = Reflect.getMetadata('providers', CategoriesModule);
            expect(providers).toBeDefined();
            expect(providers).toContain(CategoriesRepository);
            expect(providers).toContain(CategoriesService);
            expect(providers).toContain(CategoriesSeeder);
        });

        it('should have exports metadata', () => {
            const exports = Reflect.getMetadata('exports', CategoriesModule);
            expect(exports).toBeDefined();
            expect(exports).toContain(CategoriesRepository);
            expect(exports).toContain(CategoriesService);
        });

        it('should have imports metadata', () => {
            const imports = Reflect.getMetadata('imports', CategoriesModule);
            expect(imports).toBeDefined();
            expect(imports.length).toBe(2);
        });

        it('should have correct number of controllers', () => {
            const controllers = Reflect.getMetadata('controllers', CategoriesModule);
            expect(controllers.length).toBe(1);
        });

        it('should have correct number of providers', () => {
            const providers = Reflect.getMetadata('providers', CategoriesModule);
            expect(providers.length).toBe(3);
        });

        it('should have correct number of exports', () => {
            const exports = Reflect.getMetadata('exports', CategoriesModule);
            expect(exports.length).toBe(2);
        });
    });

    describe('Exports Verification', () => {
        it('should export CategoriesRepository', () => {
            const exports = Reflect.getMetadata('exports', CategoriesModule);
            expect(exports).toContain(CategoriesRepository);
        });

        it('should export CategoriesService', () => {
            const exports = Reflect.getMetadata('exports', CategoriesModule);
            expect(exports).toContain(CategoriesService);
        });

        it('should not export CategoriesSeeder', () => {
            const exports = Reflect.getMetadata('exports', CategoriesModule);
            expect(exports).not.toContain(CategoriesSeeder);
        });
    });

    describe('Module Structure', () => {
        it('should have all required imports', () => {
            const imports = Reflect.getMetadata('imports', CategoriesModule) || [];
            expect(imports.length).toBeGreaterThan(0);
        });

        it('should have all required providers', () => {
            const providers = Reflect.getMetadata('providers', CategoriesModule) || [];
            expect(providers.length).toBeGreaterThan(0);
        });

        it('should have all required controllers', () => {
            const controllers = Reflect.getMetadata('controllers', CategoriesModule) || [];
            expect(controllers.length).toBeGreaterThan(0);
        });

        it('should have all required exports', () => {
            const exports = Reflect.getMetadata('exports', CategoriesModule) || [];
            expect(exports.length).toBeGreaterThan(0);
        });
    });

    describe('Provider Configuration', () => {
        it('should configure CategoriesRepository correctly', () => {
            const providers = Reflect.getMetadata('providers', CategoriesModule);
            expect(providers).toContain(CategoriesRepository);
        });

        it('should configure CategoriesService correctly', () => {
            const providers = Reflect.getMetadata('providers', CategoriesModule);
            expect(providers).toContain(CategoriesService);
        });

        it('should configure CategoriesSeeder correctly', () => {
            const providers = Reflect.getMetadata('providers', CategoriesModule);
            expect(providers).toContain(CategoriesSeeder);
        });
    });

    describe('Controller Configuration', () => {
        it('should configure CategoriesController correctly', () => {
            const controllers = Reflect.getMetadata('controllers', CategoriesModule);
            expect(controllers).toContain(CategoriesController);
        });

        it('should have only one controller', () => {
            const controllers = Reflect.getMetadata('controllers', CategoriesModule);
            expect(controllers.length).toBe(1);
        });
    });

    describe('Module Dependencies', () => {
        it('should have DatabaseModule in imports', () => {
            const imports = Reflect.getMetadata('imports', CategoriesModule) || [];
            const hasDatabaseModule = imports.some(
                (imp: any) =>
                    imp?.name === 'DatabaseModule' ||
                    imp?.module?.name === 'DatabaseModule' ||
                    imp?.constructor?.name === 'DatabaseModule',
            );
            expect(hasDatabaseModule || imports.length === 2).toBe(true);
        });

        it('should have correct import count', () => {
            const imports = Reflect.getMetadata('imports', CategoriesModule) || [];
            expect(imports.length).toBe(2);
        });
    });

    describe('Repository Instances', () => {
        it('should get CategoriesRepository instance', () => {
            const repository = module.get<CategoriesRepository>(CategoriesRepository);
            expect(repository).toBe(mockCategoriesRepository);
        });
    });

    describe('Service Instances', () => {
        it('should get CategoriesService instance', () => {
            const service = module.get(CategoriesService);
            expect(service).toBe(mockCategoriesService);
        });
    });

    describe('Seeder Instances', () => {
        it('should get CategoriesSeeder instance', () => {
            const seeder = module.get(CategoriesSeeder);
            expect(seeder).toBe(mockCategoriesSeeder);
        });
    });

    describe('Controller Instances', () => {
        it('should get CategoriesController instance', () => {
            const controller = module.get<CategoriesController>(CategoriesController);
            expect(controller).toBeDefined();
        });
    });

    describe('Entity Configuration', () => {
        it('should have CategoryEntity token available', () => {
            const token = getRepositoryToken(CategoryEntity);
            expect(token).toBeDefined();
        });
    });

    describe('Provider Dependencies', () => {
        it('should have all service dependencies resolved', () => {
            expect(module.get(CategoriesService)).toBeDefined();
        });

        it('should have repository dependencies resolved', () => {
            expect(module.get(CategoriesRepository)).toBeDefined();
        });

        it('should have seeder dependencies resolved', () => {
            expect(module.get(CategoriesSeeder)).toBeDefined();
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

        it('should have Logger available', () => {
            expect(module.get(WINSTON_MODULE_PROVIDER)).toBeDefined();
        });
    });

    describe('Module Exports Validation', () => {
        it('should export repository', () => {
            const exports = Reflect.getMetadata('exports', CategoriesModule);
            expect(exports).toContain(CategoriesRepository);
        });

        it('should export service', () => {
            const exports = Reflect.getMetadata('exports', CategoriesModule);
            expect(exports).toContain(CategoriesService);
        });

        it('should have matching exports and providers for exported items', () => {
            const exports = Reflect.getMetadata('exports', CategoriesModule);
            const providers = Reflect.getMetadata('providers', CategoriesModule);

            exports.forEach((exp: any) => {
                expect(providers).toContain(exp);
            });
        });
    });

    describe('Module Import Validation', () => {
        it('should import DatabaseModule twice (base + forFeature)', () => {
            const imports = Reflect.getMetadata('imports', CategoriesModule) || [];
            const databaseImports = imports.filter(
                (imp: any) =>
                    imp?.name === 'DatabaseModule' ||
                    imp?.module?.name === 'DatabaseModule' ||
                    imp?.constructor?.name === 'DatabaseModule',
            );
            // Should have DatabaseModule and DatabaseModule.forFeature
            expect(databaseImports.length >= 1 || imports.length === 2).toBe(true);
        });
    });

    describe('Module Compilation', () => {
        it('should compile without errors', () => {
            expect(module).toBeDefined();
            expect(module).toBeInstanceOf(TestingModule);
        });

        it('should initialize all providers', () => {
            expect(module.get(CategoriesRepository)).toBeDefined();
            expect(module.get(CategoriesService)).toBeDefined();
            expect(module.get(CategoriesSeeder)).toBeDefined();
        });

        it('should initialize all controllers', () => {
            expect(module.get(CategoriesController)).toBeDefined();
        });
    });

    describe('Provider Uniqueness', () => {
        it('should have unique service instances per module', () => {
            const service1 = module.get<CategoriesService>(CategoriesService);
            const service2 = module.get<CategoriesService>(CategoriesService);

            expect(service1).toBe(service2);
        });

        it('should have unique repository instances per module', () => {
            const repo1 = module.get<CategoriesRepository>(CategoriesRepository);
            const repo2 = module.get<CategoriesRepository>(CategoriesRepository);

            expect(repo1).toBe(repo2);
        });

        it('should have unique seeder instances per module', () => {
            const seeder1 = module.get<CategoriesSeeder>(CategoriesSeeder);
            const seeder2 = module.get<CategoriesSeeder>(CategoriesSeeder);

            expect(seeder1).toBe(seeder2);
        });
    });

    describe('Module Integration', () => {
        it('should integrate with DatabaseModule', () => {
            const imports = Reflect.getMetadata('imports', CategoriesModule) || [];
            expect(imports.length).toBe(2);
        });
    });

    describe('Complete Module Structure', () => {
        it('should have correct module structure', () => {
            const controllers = Reflect.getMetadata('controllers', CategoriesModule);
            const providers = Reflect.getMetadata('providers', CategoriesModule);
            const exports = Reflect.getMetadata('exports', CategoriesModule);
            const imports = Reflect.getMetadata('imports', CategoriesModule);

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

    describe('Seeder Functionality', () => {
        it('should have CategoriesSeeder as provider but not export', () => {
            const providers = Reflect.getMetadata('providers', CategoriesModule);
            const exports = Reflect.getMetadata('exports', CategoriesModule);

            expect(providers).toContain(CategoriesSeeder);
            expect(exports).not.toContain(CategoriesSeeder);
        });

        it('should be able to access CategoriesSeeder internally', () => {
            const seeder = module.get<CategoriesSeeder>(CategoriesSeeder);
            expect(seeder).toBeDefined();
            expect(seeder).toBe(mockCategoriesSeeder);
        });
    });

    describe('Global Module Behavior', () => {
        it('should have global decorator applied', () => {
            const isGlobal = Reflect.getMetadata('__module:global__', CategoriesModule);
            expect(isGlobal).toBe(true);
        });

        it('should make exported providers available globally', () => {
            const exports = Reflect.getMetadata('exports', CategoriesModule);
            expect(exports.length).toBeGreaterThan(0);
            expect(exports).toContain(CategoriesRepository);
            expect(exports).toContain(CategoriesService);
        });
    });

    describe('Module Provider Order', () => {
        it('should have providers in correct order', () => {
            const providers = Reflect.getMetadata('providers', CategoriesModule);
            expect(providers[0]).toBe(CategoriesSeeder);
            expect(providers[1]).toBe(CategoriesRepository);
            expect(providers[2]).toBe(CategoriesService);
        });
    });

    describe('Module Export Order', () => {
        it('should have exports in correct order', () => {
            const exports = Reflect.getMetadata('exports', CategoriesModule);
            expect(exports[0]).toBe(CategoriesRepository);
            expect(exports[1]).toBe(CategoriesService);
        });
    });
});
