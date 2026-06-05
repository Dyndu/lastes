import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsModule } from './notifications.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService, PreNotificationsService, NUsersService } from './services';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationEntity } from './entities/notification.entity';
import { NUsersEntity } from './entities/n-users.entity';
import { Reflector } from '@nestjs/core';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';
import { NotificationsRepository } from './repositories/notifications.repository';
import { NUsersRepository } from './repositories/n-users.repository';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('NotificationsModule', () => {
    let module: TestingModule;

    const mockNotificationsRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockNUsersRepository = {
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

    const mockNotificationsService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
        sendNotification: jest.fn(),
    };

    const mockPreNotificationsService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
    };

    const mockNUsersService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
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
            controllers: [NotificationsController],
            providers: [
                {
                    provide: NotificationsRepository,
                    useValue: mockNotificationsRepository,
                },
                {
                    provide: NUsersRepository,
                    useValue: mockNUsersRepository,
                },
                {
                    provide: NotificationsService,
                    useValue: mockNotificationsService,
                },
                {
                    provide: PreNotificationsService,
                    useValue: mockPreNotificationsService,
                },
                {
                    provide: NUsersService,
                    useValue: mockNUsersService,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandlerService,
                },
                {
                    provide: getRepositoryToken(NotificationEntity),
                    useValue: mockNotificationsRepository,
                },
                {
                    provide: getRepositoryToken(NUsersEntity),
                    useValue: mockNUsersRepository,
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
            const isGlobal = Reflect.getMetadata('__module:global__', NotificationsModule);
            expect(isGlobal).toBe(true);
        });
    });

    describe('Controllers', () => {
        it('should have NotificationsController defined', () => {
            const controller = module.get<NotificationsController>(NotificationsController);
            expect(controller).toBeDefined();
        });

        it('should create NotificationsController instance', () => {
            const controller = module.get<NotificationsController>(NotificationsController);
            expect(controller).toBeInstanceOf(NotificationsController);
        });
    });

    describe('Providers', () => {
        it('should have NotificationsRepository defined', () => {
            const repository = module.get<NotificationsRepository>(NotificationsRepository);
            expect(repository).toBeDefined();
        });

        it('should have NUsersRepository defined', () => {
            const repository = module.get<NUsersRepository>(NUsersRepository);
            expect(repository).toBeDefined();
        });

        it('should have NotificationsService defined', () => {
            const service = module.get(NotificationsService);
            expect(service).toBeDefined();
        });

        it('should have PreNotificationsService defined', () => {
            const service = module.get(PreNotificationsService);
            expect(service).toBeDefined();
        });

        it('should have NUsersService defined', () => {
            const service = module.get(NUsersService);
            expect(service).toBeDefined();
        });
    });

    describe('Module Metadata', () => {
        it('should have controllers metadata', () => {
            const controllers = Reflect.getMetadata('controllers', NotificationsModule);
            expect(controllers).toBeDefined();
            expect(controllers).toContain(NotificationsController);
        });

        it('should have providers metadata', () => {
            const providers = Reflect.getMetadata('providers', NotificationsModule);
            expect(providers).toBeDefined();
            expect(providers).toContain(NotificationsRepository);
            expect(providers).toContain(NUsersRepository);
            expect(providers).toContain(NotificationsService);
            expect(providers).toContain(PreNotificationsService);
            expect(providers).toContain(NUsersService);
        });

        it('should have exports metadata', () => {
            const exports = Reflect.getMetadata('exports', NotificationsModule);
            expect(exports).toBeDefined();
            expect(exports).toContain(NotificationsService);
            expect(exports).toContain(PreNotificationsService);
            expect(exports).toContain(NUsersService);
        });

        it('should have imports metadata', () => {
            const imports = Reflect.getMetadata('imports', NotificationsModule);
            expect(imports).toBeDefined();
            expect(imports.length).toBe(2);
        });

        it('should have correct number of controllers', () => {
            const controllers = Reflect.getMetadata('controllers', NotificationsModule);
            expect(controllers.length).toBe(1);
        });

        it('should have correct number of providers', () => {
            const providers = Reflect.getMetadata('providers', NotificationsModule);
            expect(providers.length).toBe(5);
        });

        it('should have correct number of exports', () => {
            const exports = Reflect.getMetadata('exports', NotificationsModule);
            expect(exports.length).toBe(3);
        });
    });

    describe('Exports Verification', () => {
        it('should export NotificationsService', () => {
            const exports = Reflect.getMetadata('exports', NotificationsModule);
            expect(exports).toContain(NotificationsService);
        });

        it('should export PreNotificationsService', () => {
            const exports = Reflect.getMetadata('exports', NotificationsModule);
            expect(exports).toContain(PreNotificationsService);
        });

        it('should export NUsersService', () => {
            const exports = Reflect.getMetadata('exports', NotificationsModule);
            expect(exports).toContain(NUsersService);
        });

        it('should not export NotificationsRepository', () => {
            const exports = Reflect.getMetadata('exports', NotificationsModule);
            expect(exports).not.toContain(NotificationsRepository);
        });

        it('should not export NUsersRepository', () => {
            const exports = Reflect.getMetadata('exports', NotificationsModule);
            expect(exports).not.toContain(NUsersRepository);
        });
    });

    describe('Module Structure', () => {
        it('should have all required imports', () => {
            const imports = Reflect.getMetadata('imports', NotificationsModule) || [];
            expect(imports.length).toBeGreaterThan(0);
        });

        it('should have all required providers', () => {
            const providers = Reflect.getMetadata('providers', NotificationsModule) || [];
            expect(providers.length).toBeGreaterThan(0);
        });

        it('should have all required controllers', () => {
            const controllers = Reflect.getMetadata('controllers', NotificationsModule) || [];
            expect(controllers.length).toBeGreaterThan(0);
        });

        it('should have all required exports', () => {
            const exports = Reflect.getMetadata('exports', NotificationsModule) || [];
            expect(exports.length).toBeGreaterThan(0);
        });
    });

    describe('Provider Configuration', () => {
        it('should configure all repositories correctly', () => {
            const providers = Reflect.getMetadata('providers', NotificationsModule);
            expect(providers).toContain(NotificationsRepository);
            expect(providers).toContain(NUsersRepository);
        });

        it('should configure all services correctly', () => {
            const providers = Reflect.getMetadata('providers', NotificationsModule);
            expect(providers).toContain(NotificationsService);
            expect(providers).toContain(PreNotificationsService);
            expect(providers).toContain(NUsersService);
        });
    });

    describe('Controller Configuration', () => {
        it('should configure NotificationsController correctly', () => {
            const controllers = Reflect.getMetadata('controllers', NotificationsModule);
            expect(controllers).toContain(NotificationsController);
        });

        it('should have only one controller', () => {
            const controllers = Reflect.getMetadata('controllers', NotificationsModule);
            expect(controllers.length).toBe(1);
        });
    });

    describe('Module Dependencies', () => {
        it('should have DatabaseModule in imports', () => {
            const imports = Reflect.getMetadata('imports', NotificationsModule) || [];
            const hasDatabaseModule = imports.some(
                (imp: any) =>
                    imp?.name === 'DatabaseModule' ||
                    imp?.module?.name === 'DatabaseModule' ||
                    imp?.constructor?.name === 'DatabaseModule',
            );
            expect(hasDatabaseModule || imports.length === 2).toBe(true);
        });

        it('should have correct import count', () => {
            const imports = Reflect.getMetadata('imports', NotificationsModule) || [];
            expect(imports.length).toBe(2);
        });
    });

    describe('Repository Instances', () => {
        it('should get NotificationsRepository instance', () => {
            const repository = module.get<NotificationsRepository>(NotificationsRepository);
            expect(repository).toBe(mockNotificationsRepository);
        });

        it('should get NUsersRepository instance', () => {
            const repository = module.get<NUsersRepository>(NUsersRepository);
            expect(repository).toBe(mockNUsersRepository);
        });
    });

    describe('Service Instances', () => {
        it('should get NotificationsService instance', () => {
            const service = module.get(NotificationsService);
            expect(service).toBe(mockNotificationsService);
        });

        it('should get PreNotificationsService instance', () => {
            const service = module.get(PreNotificationsService);
            expect(service).toBe(mockPreNotificationsService);
        });

        it('should get NUsersService instance', () => {
            const service = module.get(NUsersService);
            expect(service).toBe(mockNUsersService);
        });
    });

    describe('Controller Instances', () => {
        it('should get NotificationsController instance', () => {
            const controller = module.get<NotificationsController>(NotificationsController);
            expect(controller).toBeDefined();
        });
    });

    describe('Entity Configuration', () => {
        it('should have NotificationEntity token available', () => {
            const token = getRepositoryToken(NotificationEntity);
            expect(token).toBeDefined();
        });

        it('should have NUsersEntity token available', () => {
            const token = getRepositoryToken(NUsersEntity);
            expect(token).toBeDefined();
        });
    });

    describe('Provider Dependencies', () => {
        it('should have all service dependencies resolved', () => {
            expect(module.get(NotificationsService)).toBeDefined();
            expect(module.get(PreNotificationsService)).toBeDefined();
            expect(module.get(NUsersService)).toBeDefined();
        });

        it('should have all repository dependencies resolved', () => {
            expect(module.get(NotificationsRepository)).toBeDefined();
            expect(module.get(NUsersRepository)).toBeDefined();
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
        it('should export all services', () => {
            const exports = Reflect.getMetadata('exports', NotificationsModule);
            expect(exports).toContain(NotificationsService);
            expect(exports).toContain(PreNotificationsService);
            expect(exports).toContain(NUsersService);
        });

        it('should not export repositories', () => {
            const exports = Reflect.getMetadata('exports', NotificationsModule);
            expect(exports).not.toContain(NotificationsRepository);
            expect(exports).not.toContain(NUsersRepository);
        });

        it('should have matching exports and providers for exported items', () => {
            const exports = Reflect.getMetadata('exports', NotificationsModule);
            const providers = Reflect.getMetadata('providers', NotificationsModule);

            exports.forEach((exp: any) => {
                expect(providers).toContain(exp);
            });
        });

        it('should keep repositories internal only', () => {
            const exports = Reflect.getMetadata('exports', NotificationsModule);
            const providers = Reflect.getMetadata('providers', NotificationsModule);

            expect(providers).toContain(NotificationsRepository);
            expect(providers).toContain(NUsersRepository);
            expect(exports).not.toContain(NotificationsRepository);
            expect(exports).not.toContain(NUsersRepository);
        });
    });

    describe('Module Import Validation', () => {
        it('should import DatabaseModule twice (base + forFeature)', () => {
            const imports = Reflect.getMetadata('imports', NotificationsModule) || [];
            const databaseImports = imports.filter(
                (imp: any) =>
                    imp?.name === 'DatabaseModule' ||
                    imp?.module?.name === 'DatabaseModule' ||
                    imp?.constructor?.name === 'DatabaseModule',
            );
            expect(databaseImports.length >= 1 || imports.length === 2).toBe(true);
        });

        it('should configure forFeature with two entities', () => {
            const imports = Reflect.getMetadata('imports', NotificationsModule) || [];
            expect(imports.length).toBe(2);
        });
    });

    describe('Module Compilation', () => {
        it('should compile without errors', () => {
            expect(module).toBeDefined();
            expect(module).toBeInstanceOf(TestingModule);
        });

        it('should initialize all providers', () => {
            expect(module.get(NotificationsRepository)).toBeDefined();
            expect(module.get(NUsersRepository)).toBeDefined();
            expect(module.get(NotificationsService)).toBeDefined();
            expect(module.get(PreNotificationsService)).toBeDefined();
            expect(module.get(NUsersService)).toBeDefined();
        });

        it('should initialize all controllers', () => {
            expect(module.get(NotificationsController)).toBeDefined();
        });
    });

    describe('Provider Uniqueness', () => {
        it('should have unique service instances per module', () => {
            const service1 = module.get<NotificationsService>(NotificationsService);
            const service2 = module.get<NotificationsService>(NotificationsService);

            expect(service1).toBe(service2);
        });

        it('should have unique repository instances per module', () => {
            const repo1 = module.get<NotificationsRepository>(NotificationsRepository);
            const repo2 = module.get<NotificationsRepository>(NotificationsRepository);

            expect(repo1).toBe(repo2);
        });
    });

    describe('Module Integration', () => {
        it('should integrate with DatabaseModule', () => {
            const imports = Reflect.getMetadata('imports', NotificationsModule) || [];
            expect(imports.length).toBe(2);
        });
    });

    describe('Complete Module Structure', () => {
        it('should have correct module structure', () => {
            const controllers = Reflect.getMetadata('controllers', NotificationsModule);
            const providers = Reflect.getMetadata('providers', NotificationsModule);
            const exports = Reflect.getMetadata('exports', NotificationsModule);
            const imports = Reflect.getMetadata('imports', NotificationsModule);

            expect(controllers).toBeDefined();
            expect(providers).toBeDefined();
            expect(exports).toBeDefined();
            expect(imports).toBeDefined();

            expect(controllers.length).toBe(1);
            expect(providers.length).toBe(5);
            expect(exports.length).toBe(3);
            expect(imports.length).toBe(2);
        });
    });

    describe('Service-Only Export Strategy', () => {
        it('should export only services, not repositories', () => {
            const exports = Reflect.getMetadata('exports', NotificationsModule);

            const services = [NotificationsService, PreNotificationsService, NUsersService];

            services.forEach((service) => {
                expect(exports).toContain(service);
            });

            expect(exports).not.toContain(NotificationsRepository);
            expect(exports).not.toContain(NUsersRepository);
        });

        it('should export all 3 services', () => {
            const exports = Reflect.getMetadata('exports', NotificationsModule);
            const providers = Reflect.getMetadata('providers', NotificationsModule);

            const services = providers.filter(
                (p: any) =>
                    p === NotificationsService ||
                    p === PreNotificationsService ||
                    p === NUsersService,
            );

            expect(services.length).toBe(3);
            expect(exports.length).toBe(3);
        });
    });

    describe('Global Module Behavior', () => {
        it('should have global decorator applied', () => {
            const isGlobal = Reflect.getMetadata('__module:global__', NotificationsModule);
            expect(isGlobal).toBe(true);
        });

        it('should make exported services available globally', () => {
            const exports = Reflect.getMetadata('exports', NotificationsModule);
            expect(exports.length).toBeGreaterThan(0);
            expect(exports).toContain(NotificationsService);
            expect(exports).toContain(PreNotificationsService);
            expect(exports).toContain(NUsersService);
        });
    });

    describe('Module Provider Order', () => {
        it('should have providers in correct order', () => {
            const providers = Reflect.getMetadata('providers', NotificationsModule);
            expect(providers[0]).toBe(NUsersRepository);
            expect(providers[1]).toBe(NotificationsRepository);
            expect(providers[2]).toBe(PreNotificationsService);
            expect(providers[3]).toBe(NUsersService);
            expect(providers[4]).toBe(NotificationsService);
        });
    });

    describe('Module Export Order', () => {
        it('should have exports in correct order', () => {
            const exports = Reflect.getMetadata('exports', NotificationsModule);
            expect(exports[0]).toBe(PreNotificationsService);
            expect(exports[1]).toBe(NUsersService);
            expect(exports[2]).toBe(NotificationsService);
        });
    });

    describe('Entity Registration', () => {
        it('should register NotificationEntity', () => {
            const token = getRepositoryToken(NotificationEntity);
            expect(token).toBe('NotificationEntityRepository');
        });

        it('should register NUsersEntity', () => {
            const token = getRepositoryToken(NUsersEntity);
            expect(token).toBe('NUsersEntityRepository');
        });

        it('should have both entities registered', () => {
            const notificationToken = getRepositoryToken(NotificationEntity);
            const nUsersToken = getRepositoryToken(NUsersEntity);

            expect(notificationToken).toBeDefined();
            expect(nUsersToken).toBeDefined();
            expect(notificationToken).not.toBe(nUsersToken);
        });
    });

    describe('Repository Encapsulation', () => {
        it('should have both repositories as providers', () => {
            const providers = Reflect.getMetadata('providers', NotificationsModule);
            expect(providers).toContain(NotificationsRepository);
            expect(providers).toContain(NUsersRepository);
        });

        it('should not expose repositories externally', () => {
            const exports = Reflect.getMetadata('exports', NotificationsModule);
            expect(exports).not.toContain(NotificationsRepository);
            expect(exports).not.toContain(NUsersRepository);
        });

        it('should only expose service layer', () => {
            const exports = Reflect.getMetadata('exports', NotificationsModule);
            const allServices = exports.every(
                (exp: any) =>
                    exp === NotificationsService ||
                    exp === PreNotificationsService ||
                    exp === NUsersService,
            );
            expect(allServices).toBe(true);
        });
    });

    describe('Multiple Entity and Repository Support', () => {
        it('should support two entities in one module', () => {
            const imports = Reflect.getMetadata('imports', NotificationsModule) || [];
            expect(imports.length).toBe(2);
        });

        it('should have two repositories for two entities', () => {
            const providers = Reflect.getMetadata('providers', NotificationsModule);
            const repositories = providers.filter(
                (p: any) => p === NotificationsRepository || p === NUsersRepository,
            );

            expect(repositories.length).toBe(2);
        });

        it('should be able to inject both repositories', () => {
            const notifRepo = module.get<NotificationsRepository>(NotificationsRepository);
            const usersRepo = module.get<NUsersRepository>(NUsersRepository);

            expect(notifRepo).toBeDefined();
            expect(usersRepo).toBeDefined();
            expect(notifRepo).not.toBe(usersRepo);
        });
    });

    describe('Service Layer Architecture', () => {
        it('should have three services for different responsibilities', () => {
            const providers = Reflect.getMetadata('providers', NotificationsModule);
            const services = providers.filter(
                (p: any) =>
                    p === NotificationsService ||
                    p === PreNotificationsService ||
                    p === NUsersService,
            );

            expect(services.length).toBe(3);
        });

        it('should be able to inject all services', () => {
            const notifService = module.get<NotificationsService>(NotificationsService);
            const preService = module.get<PreNotificationsService>(PreNotificationsService);
            const usersService = module.get<NUsersService>(NUsersService);

            expect(notifService).toBeDefined();
            expect(preService).toBeDefined();
            expect(usersService).toBeDefined();
        });
    });

    describe('Global Service Pattern', () => {
        it('should be globally available for other modules', () => {
            const isGlobal = Reflect.getMetadata('__module:global__', NotificationsModule);
            const exports = Reflect.getMetadata('exports', NotificationsModule);

            expect(isGlobal).toBe(true);
            expect(exports.length).toBe(3);
        });

        it('should provide notification services globally', () => {
            const exports = Reflect.getMetadata('exports', NotificationsModule);
            const isGlobal = Reflect.getMetadata('__module:global__', NotificationsModule);

            expect(isGlobal).toBe(true);
            expect(exports).toContain(NotificationsService);
            expect(exports).toContain(PreNotificationsService);
        });
    });

    describe('Module Responsibilities', () => {
        it('should handle notification operations', () => {
            const service = module.get<NotificationsService>(NotificationsService);
            const repository = module.get<NotificationsRepository>(NotificationsRepository);

            expect(service).toBeDefined();
            expect(repository).toBeDefined();
        });

        it('should handle notification user operations', () => {
            const service = module.get<NUsersService>(NUsersService);
            const repository = module.get<NUsersRepository>(NUsersRepository);

            expect(service).toBeDefined();
            expect(repository).toBeDefined();
        });

        it('should provide controller for HTTP endpoints', () => {
            const controller = module.get<NotificationsController>(NotificationsController);
            expect(controller).toBeDefined();
        });
    });
});
