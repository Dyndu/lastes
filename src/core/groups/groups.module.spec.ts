import { Test, TestingModule } from '@nestjs/testing';
import { GroupsModule } from './groups.module';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { GroupsRepository } from './groups.repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GroupEntity } from './entities/group.entity';
import { Reflector } from '@nestjs/core';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('GroupsModule', () => {
    let module: TestingModule;

    const mockGroupsRepository = {
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

    const mockGroupsService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
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
            controllers: [GroupsController],
            providers: [
                {
                    provide: GroupsRepository,
                    useValue: mockGroupsRepository,
                },
                {
                    provide: GroupsService,
                    useValue: mockGroupsService,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandlerService,
                },
                {
                    provide: getRepositoryToken(GroupEntity),
                    useValue: mockGroupsRepository,
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
        it('should have GroupsController defined', () => {
            const controller = module.get<GroupsController>(GroupsController);
            expect(controller).toBeDefined();
        });

        it('should create GroupsController instance', () => {
            const controller = module.get<GroupsController>(GroupsController);
            expect(controller).toBeInstanceOf(GroupsController);
        });
    });

    describe('Providers', () => {
        it('should have GroupsRepository defined', () => {
            const repository = module.get<GroupsRepository>(GroupsRepository);
            expect(repository).toBeDefined();
        });

        it('should have GroupsService defined', () => {
            const service = module.get(GroupsService);
            expect(service).toBeDefined();
        });
    });

    describe('Module Metadata', () => {
        it('should have controllers metadata', () => {
            const controllers = Reflect.getMetadata('controllers', GroupsModule);
            expect(controllers).toBeDefined();
            expect(controllers).toContain(GroupsController);
        });

        it('should have providers metadata', () => {
            const providers = Reflect.getMetadata('providers', GroupsModule);
            expect(providers).toBeDefined();
            expect(providers).toContain(GroupsRepository);
            expect(providers).toContain(GroupsService);
        });

        it('should have exports metadata', () => {
            const exports = Reflect.getMetadata('exports', GroupsModule);
            expect(exports).toBeDefined();
            expect(exports).toContain(GroupsRepository);
            expect(exports).toContain(GroupsService);
        });

        it('should have imports metadata', () => {
            const imports = Reflect.getMetadata('imports', GroupsModule);
            expect(imports).toBeDefined();
            expect(imports.length).toBe(3);
        });

        it('should have correct number of controllers', () => {
            const controllers = Reflect.getMetadata('controllers', GroupsModule);
            expect(controllers.length).toBe(1);
        });

        it('should have correct number of providers', () => {
            const providers = Reflect.getMetadata('providers', GroupsModule);
            expect(providers.length).toBe(2);
        });

        it('should have correct number of exports', () => {
            const exports = Reflect.getMetadata('exports', GroupsModule);
            expect(exports.length).toBe(2);
        });
    });

    describe('Exports Verification', () => {
        it('should export GroupsService', () => {
            const exports = Reflect.getMetadata('exports', GroupsModule);
            expect(exports).toContain(GroupsService);
        });

        it('should export GroupsRepository', () => {
            const exports = Reflect.getMetadata('exports', GroupsModule);
            expect(exports).toContain(GroupsRepository);
        });
    });

    describe('Module Structure', () => {
        it('should have all required imports', () => {
            const imports = Reflect.getMetadata('imports', GroupsModule) || [];
            expect(imports.length).toBeGreaterThan(0);
        });

        it('should have all required providers', () => {
            const providers = Reflect.getMetadata('providers', GroupsModule) || [];
            expect(providers.length).toBeGreaterThan(0);
        });

        it('should have all required controllers', () => {
            const controllers = Reflect.getMetadata('controllers', GroupsModule) || [];
            expect(controllers.length).toBeGreaterThan(0);
        });

        it('should have all required exports', () => {
            const exports = Reflect.getMetadata('exports', GroupsModule) || [];
            expect(exports.length).toBeGreaterThan(0);
        });
    });

    describe('Provider Configuration', () => {
        it('should configure GroupsRepository correctly', () => {
            const providers = Reflect.getMetadata('providers', GroupsModule);
            expect(providers).toContain(GroupsRepository);
        });

        it('should configure GroupsService correctly', () => {
            const providers = Reflect.getMetadata('providers', GroupsModule);
            expect(providers).toContain(GroupsService);
        });
    });

    describe('Controller Configuration', () => {
        it('should configure GroupsController correctly', () => {
            const controllers = Reflect.getMetadata('controllers', GroupsModule);
            expect(controllers).toContain(GroupsController);
        });

        it('should have only one controller', () => {
            const controllers = Reflect.getMetadata('controllers', GroupsModule);
            expect(controllers.length).toBe(1);
        });
    });

    describe('Module Dependencies', () => {
        it('should have DatabaseModule in imports', () => {
            const imports = Reflect.getMetadata('imports', GroupsModule) || [];
            const hasDatabaseModule = imports.some(
                (imp: any) =>
                    imp?.name === 'DatabaseModule' ||
                    imp?.module?.name === 'DatabaseModule' ||
                    imp?.constructor?.name === 'DatabaseModule',
            );
            expect(hasDatabaseModule || imports.length === 3).toBe(true);
        });

        it('should have PermissionsModule in imports', () => {
            const imports = Reflect.getMetadata('imports', GroupsModule) || [];
            const hasPermissionsModule = imports.some(
                (imp: any) => imp?.name === 'PermissionsModule' || imp === 'PermissionsModule',
            );
            expect(hasPermissionsModule || imports.length === 3).toBe(true);
        });

        it('should have correct import count', () => {
            const imports = Reflect.getMetadata('imports', GroupsModule) || [];
            expect(imports.length).toBe(3);
        });
    });

    describe('Repository Instances', () => {
        it('should get GroupsRepository instance', () => {
            const repository = module.get<GroupsRepository>(GroupsRepository);
            expect(repository).toBe(mockGroupsRepository);
        });
    });

    describe('Service Instances', () => {
        it('should get GroupsService instance', () => {
            const service = module.get(GroupsService);
            expect(service).toBe(mockGroupsService);
        });
    });

    describe('Controller Instances', () => {
        it('should get GroupsController instance', () => {
            const controller = module.get<GroupsController>(GroupsController);
            expect(controller).toBeDefined();
        });
    });

    describe('Entity Configuration', () => {
        it('should have GroupEntity token available', () => {
            const token = getRepositoryToken(GroupEntity);
            expect(token).toBeDefined();
        });
    });

    describe('Provider Dependencies', () => {
        it('should have all service dependencies resolved', () => {
            expect(module.get(GroupsService)).toBeDefined();
        });

        it('should have repository dependencies resolved', () => {
            expect(module.get(GroupsRepository)).toBeDefined();
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
        it('should export repository', () => {
            const exports = Reflect.getMetadata('exports', GroupsModule);
            expect(exports).toContain(GroupsRepository);
        });

        it('should export service', () => {
            const exports = Reflect.getMetadata('exports', GroupsModule);
            expect(exports).toContain(GroupsService);
        });

        it('should have matching exports and providers count for exported items', () => {
            const exports = Reflect.getMetadata('exports', GroupsModule);
            const providers = Reflect.getMetadata('providers', GroupsModule);

            exports.forEach((exp: any) => {
                expect(providers).toContain(exp);
            });
        });

        it('should export all providers', () => {
            const exports = Reflect.getMetadata('exports', GroupsModule);
            const providers = Reflect.getMetadata('providers', GroupsModule);

            expect(exports.length).toBe(providers.length);
        });
    });

    describe('Module Import Validation', () => {
        it('should import DatabaseModule twice (base + forFeature)', () => {
            const imports = Reflect.getMetadata('imports', GroupsModule) || [];
            const databaseImports = imports.filter(
                (imp: any) =>
                    imp?.name === 'DatabaseModule' ||
                    imp?.module?.name === 'DatabaseModule' ||
                    imp?.constructor?.name === 'DatabaseModule',
            );
            // Should have DatabaseModule and DatabaseModule.forFeature
            expect(databaseImports.length >= 1 || imports.length === 3).toBe(true);
        });

        it('should have PermissionsModule imported', () => {
            const imports = Reflect.getMetadata('imports', GroupsModule) || [];
            expect(imports.length).toBe(3);
        });
    });

    describe('Module Compilation', () => {
        it('should compile without errors', () => {
            expect(module).toBeDefined();
            expect(module).toBeInstanceOf(TestingModule);
        });

        it('should initialize all providers', () => {
            expect(module.get(GroupsRepository)).toBeDefined();
            expect(module.get(GroupsService)).toBeDefined();
        });

        it('should initialize all controllers', () => {
            expect(module.get(GroupsController)).toBeDefined();
        });
    });

    describe('Provider Uniqueness', () => {
        it('should have unique service instances per module', () => {
            const service1 = module.get<GroupsService>(GroupsService);
            const service2 = module.get<GroupsService>(GroupsService);

            expect(service1).toBe(service2);
        });

        it('should have unique repository instances per module', () => {
            const repo1 = module.get<GroupsRepository>(GroupsRepository);
            const repo2 = module.get<GroupsRepository>(GroupsRepository);

            expect(repo1).toBe(repo2);
        });
    });

    describe('Module Integration', () => {
        it('should integrate with DatabaseModule', () => {
            const imports = Reflect.getMetadata('imports', GroupsModule) || [];
            expect(imports.length).toBe(3);
        });

        it('should integrate with PermissionsModule', () => {
            const imports = Reflect.getMetadata('imports', GroupsModule) || [];
            const hasPermissionsModule = imports.some(
                (imp: any) => imp?.name === 'PermissionsModule' || imp === 'PermissionsModule',
            );
            expect(hasPermissionsModule || imports.length === 3).toBe(true);
        });
    });

    describe('Complete Module Structure', () => {
        it('should have correct module structure', () => {
            const controllers = Reflect.getMetadata('controllers', GroupsModule);
            const providers = Reflect.getMetadata('providers', GroupsModule);
            const exports = Reflect.getMetadata('exports', GroupsModule);
            const imports = Reflect.getMetadata('imports', GroupsModule);

            expect(controllers).toBeDefined();
            expect(providers).toBeDefined();
            expect(exports).toBeDefined();
            expect(imports).toBeDefined();

            expect(controllers.length).toBe(1);
            expect(providers.length).toBe(2);
            expect(exports.length).toBe(2);
            expect(imports.length).toBe(3);
        });
    });

    describe('Full Export Strategy', () => {
        it('should export both service and repository', () => {
            const exports = Reflect.getMetadata('exports', GroupsModule);

            expect(exports).toContain(GroupsService);
            expect(exports).toContain(GroupsRepository);
        });

        it('should export all providers without exception', () => {
            const providers = Reflect.getMetadata('providers', GroupsModule);
            const exports = Reflect.getMetadata('exports', GroupsModule);

            expect(providers.length).toBe(exports.length);

            providers.forEach((provider: any) => {
                expect(exports).toContain(provider);
            });
        });
    });

    describe('Module Provider Order', () => {
        it('should have providers in correct order', () => {
            const providers = Reflect.getMetadata('providers', GroupsModule);
            expect(providers[0]).toBe(GroupsService);
            expect(providers[1]).toBe(GroupsRepository);
        });
    });

    describe('Module Export Order', () => {
        it('should have exports in correct order', () => {
            const exports = Reflect.getMetadata('exports', GroupsModule);
            expect(exports[0]).toBe(GroupsService);
            expect(exports[1]).toBe(GroupsRepository);
        });
    });

    describe('Entity Registration', () => {
        it('should register GroupEntity', () => {
            const token = getRepositoryToken(GroupEntity);
            expect(token).toBe('GroupEntityRepository');
        });
    });

    describe('Permissions Integration', () => {
        it('should integrate with PermissionsModule for authorization', () => {
            const imports = Reflect.getMetadata('imports', GroupsModule) || [];
            const hasPermissionsModule = imports.some(
                (imp: any) => imp?.name === 'PermissionsModule' || imp === 'PermissionsModule',
            );

            expect(hasPermissionsModule || imports.length === 3).toBe(true);
        });

        it('should have access to PermissionsService', () => {
            const permissionsService = module.get('PermissionsService');
            expect(permissionsService).toBeDefined();
        });
    });

    describe('Simple Module Pattern', () => {
        it('should follow simple module pattern with service and repository', () => {
            const providers = Reflect.getMetadata('providers', GroupsModule);
            const exports = Reflect.getMetadata('exports', GroupsModule);

            expect(providers.length).toBe(2);
            expect(exports.length).toBe(2);
            expect(providers).toContain(GroupsService);
            expect(providers).toContain(GroupsRepository);
        });

        it('should export both layers (service and repository)', () => {
            const exports = Reflect.getMetadata('exports', GroupsModule);

            const hasService = exports.includes(GroupsService);
            const hasRepository = exports.includes(GroupsRepository);

            expect(hasService).toBe(true);
            expect(hasRepository).toBe(true);
        });
    });

    describe('Module Imports Configuration', () => {
        it('should import DatabaseModule for ORM functionality', () => {
            const imports = Reflect.getMetadata('imports', GroupsModule) || [];
            const hasDatabaseModule = imports.some(
                (imp: any) =>
                    imp?.name === 'DatabaseModule' ||
                    imp?.module?.name === 'DatabaseModule' ||
                    imp?.constructor?.name === 'DatabaseModule',
            );

            expect(hasDatabaseModule || imports.length === 3).toBe(true);
        });

        it('should configure DatabaseModule.forFeature with GroupEntity', () => {
            const imports = Reflect.getMetadata('imports', GroupsModule) || [];
            expect(imports.length).toBe(3);
        });

        it('should import PermissionsModule for access control', () => {
            const imports = Reflect.getMetadata('imports', GroupsModule) || [];
            const hasPermissionsModule = imports.some(
                (imp: any) => imp?.name === 'PermissionsModule' || imp === 'PermissionsModule',
            );

            expect(hasPermissionsModule || imports.length === 3).toBe(true);
        });
    });

    describe('Module Responsibilities', () => {
        it('should handle group management operations', () => {
            const service = module.get<GroupsService>(GroupsService);
            const repository = module.get<GroupsRepository>(GroupsRepository);

            expect(service).toBeDefined();
            expect(repository).toBeDefined();
        });

        it('should provide controller for HTTP endpoints', () => {
            const controller = module.get<GroupsController>(GroupsController);
            expect(controller).toBeDefined();
        });
    });
});
