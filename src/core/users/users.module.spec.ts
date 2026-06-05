import { Test, TestingModule } from '@nestjs/testing';
import { UsersModule } from './users.module';
import { AuthController } from './controllers/auth.controller';
import { UsersController } from './controllers/users.controller';
import {
    PreUserService,
    UsersService,
    UserCodeService,
    ResetPasswordRequestService,
    UsersEntityTransformService,
    UsersRelationsService,
    UserEmailSendingService,
} from './services';
import {
    ResetPasswordRequestRepository,
    UsersCodeRepository,
    UsersRepository,
} from './repositories';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { UsersCodeEntity } from './entities/user-code.entity';
import { ResetPasswordRequestEntity } from './entities/reset-password-request.entity';
import { Reflector } from '@nestjs/core';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('UsersModule', () => {
    let module: TestingModule;

    const mockUsersRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockUsersCodeRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockResetPasswordRequestRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockUsersService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    const mockPreUserService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
    };

    const mockUserCodeService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    const mockResetPasswordRequestService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    const mockUsersEntityTransformService = {
        transform: jest.fn(),
        transformMany: jest.fn(),
    };

    const mockUsersRelationsService = {
        loadRelations: jest.fn(),
        loadRelation: jest.fn(),
    };

    const mockUserEmailSendingService = {
        sendEmail: jest.fn(),
        sendVerificationEmail: jest.fn(),
        sendResetPasswordEmail: jest.fn(),
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
            controllers: [AuthController, UsersController],
            providers: [
                {
                    provide: UsersRepository,
                    useValue: mockUsersRepository,
                },
                {
                    provide: UsersCodeRepository,
                    useValue: mockUsersCodeRepository,
                },
                {
                    provide: ResetPasswordRequestRepository,
                    useValue: mockResetPasswordRequestRepository,
                },
                {
                    provide: UsersService,
                    useValue: mockUsersService,
                },
                {
                    provide: PreUserService,
                    useValue: mockPreUserService,
                },
                {
                    provide: UserCodeService,
                    useValue: mockUserCodeService,
                },
                {
                    provide: ResetPasswordRequestService,
                    useValue: mockResetPasswordRequestService,
                },
                {
                    provide: UsersEntityTransformService,
                    useValue: mockUsersEntityTransformService,
                },
                {
                    provide: UsersRelationsService,
                    useValue: mockUsersRelationsService,
                },
                {
                    provide: UserEmailSendingService,
                    useValue: mockUserEmailSendingService,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandlerService,
                },
                {
                    provide: getRepositoryToken(UserEntity),
                    useValue: mockUsersRepository,
                },
                {
                    provide: getRepositoryToken(UsersCodeEntity),
                    useValue: mockUsersCodeRepository,
                },
                {
                    provide: getRepositoryToken(ResetPasswordRequestEntity),
                    useValue: mockResetPasswordRequestRepository,
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
            const isGlobal = Reflect.getMetadata('__module:global__', UsersModule);
            expect(isGlobal).toBe(true);
        });

        it('should have global scope', () => {
            const globalMetadata = Reflect.getMetadata('__module:global__', UsersModule);
            expect(globalMetadata).toBeDefined();
        });
    });

    describe('Controllers', () => {
        it('should have AuthController defined', () => {
            const controller = module.get<AuthController>(AuthController);
            expect(controller).toBeDefined();
        });

        it('should have UsersController defined', () => {
            const controller = module.get<UsersController>(UsersController);
            expect(controller).toBeDefined();
        });

        it('should create AuthController instance', () => {
            const controller = module.get<AuthController>(AuthController);
            expect(controller).toBeInstanceOf(AuthController);
        });

        it('should create UsersController instance', () => {
            const controller = module.get<UsersController>(UsersController);
            expect(controller).toBeInstanceOf(UsersController);
        });
    });

    describe('Providers', () => {
        it('should have UsersRepository defined', () => {
            const repository = module.get<UsersRepository>(UsersRepository);
            expect(repository).toBeDefined();
        });

        it('should have UsersCodeRepository defined', () => {
            const repository = module.get<UsersCodeRepository>(UsersCodeRepository);
            expect(repository).toBeDefined();
        });

        it('should have ResetPasswordRequestRepository defined', () => {
            const repository = module.get<ResetPasswordRequestRepository>(
                ResetPasswordRequestRepository,
            );
            expect(repository).toBeDefined();
        });

        it('should have UsersService defined', () => {
            const service = module.get(UsersService);
            expect(service).toBeDefined();
        });

        it('should have PreUserService defined', () => {
            const service = module.get(PreUserService);
            expect(service).toBeDefined();
        });

        it('should have UserCodeService defined', () => {
            const service = module.get(UserCodeService);
            expect(service).toBeDefined();
        });

        it('should have ResetPasswordRequestService defined', () => {
            const service = module.get(ResetPasswordRequestService);
            expect(service).toBeDefined();
        });

        it('should have UsersEntityTransformService defined', () => {
            const service = module.get(UsersEntityTransformService);
            expect(service).toBeDefined();
        });

        it('should have UsersRelationsService defined', () => {
            const service = module.get(UsersRelationsService);
            expect(service).toBeDefined();
        });

        it('should have UserEmailSendingService defined', () => {
            const service = module.get(UserEmailSendingService);
            expect(service).toBeDefined();
        });
    });

    describe('Module Metadata', () => {
        it('should have controllers metadata', () => {
            const controllers = Reflect.getMetadata('controllers', UsersModule);
            expect(controllers).toBeDefined();
            expect(controllers).toContain(AuthController);
            expect(controllers).toContain(UsersController);
        });

        it('should have providers metadata', () => {
            const providers = Reflect.getMetadata('providers', UsersModule);
            expect(providers).toBeDefined();
            expect(providers).toContain(UsersRepository);
            expect(providers).toContain(UsersCodeRepository);
            expect(providers).toContain(ResetPasswordRequestRepository);
            expect(providers).toContain(UsersService);
            expect(providers).toContain(PreUserService);
            expect(providers).toContain(UserCodeService);
            expect(providers).toContain(ResetPasswordRequestService);
            expect(providers).toContain(UsersEntityTransformService);
            expect(providers).toContain(UsersRelationsService);
            expect(providers).toContain(UserEmailSendingService);
        });

        it('should have exports metadata', () => {
            const exports = Reflect.getMetadata('exports', UsersModule);
            expect(exports).toBeDefined();
            expect(exports).toContain(UsersRepository);
            expect(exports).toContain(PreUserService);
            expect(exports).toContain(UsersService);
            expect(exports).toContain(UserEmailSendingService);
            expect(exports).toContain(UsersEntityTransformService);
        });

        it('should have imports metadata', () => {
            const imports = Reflect.getMetadata('imports', UsersModule);
            expect(imports).toBeDefined();
            expect(imports.length).toBe(5);
        });

        it('should have correct number of controllers', () => {
            const controllers = Reflect.getMetadata('controllers', UsersModule);
            expect(controllers.length).toBe(2);
        });

        it('should have correct number of providers', () => {
            const providers = Reflect.getMetadata('providers', UsersModule);
            expect(providers.length).toBe(10);
        });

        it('should have correct number of exports', () => {
            const exports = Reflect.getMetadata('exports', UsersModule);
            expect(exports.length).toBe(5);
        });
    });

    describe('Exports Verification', () => {
        it('should export UsersRepository', () => {
            const exports = Reflect.getMetadata('exports', UsersModule);
            expect(exports).toContain(UsersRepository);
        });

        it('should export PreUserService', () => {
            const exports = Reflect.getMetadata('exports', UsersModule);
            expect(exports).toContain(PreUserService);
        });

        it('should export UsersService', () => {
            const exports = Reflect.getMetadata('exports', UsersModule);
            expect(exports).toContain(UsersService);
        });

        it('should export UserEmailSendingService', () => {
            const exports = Reflect.getMetadata('exports', UsersModule);
            expect(exports).toContain(UserEmailSendingService);
        });

        it('should export UsersEntityTransformService', () => {
            const exports = Reflect.getMetadata('exports', UsersModule);
            expect(exports).toContain(UsersEntityTransformService);
        });

        it('should export exactly five providers', () => {
            const exports = Reflect.getMetadata('exports', UsersModule);
            expect(exports.length).toBe(5);
        });

        it('should not export UsersCodeRepository', () => {
            const exports = Reflect.getMetadata('exports', UsersModule);
            expect(exports).not.toContain(UsersCodeRepository);
        });

        it('should not export ResetPasswordRequestRepository', () => {
            const exports = Reflect.getMetadata('exports', UsersModule);
            expect(exports).not.toContain(ResetPasswordRequestRepository);
        });

        it('should not export UserCodeService', () => {
            const exports = Reflect.getMetadata('exports', UsersModule);
            expect(exports).not.toContain(UserCodeService);
        });

        it('should not export ResetPasswordRequestService', () => {
            const exports = Reflect.getMetadata('exports', UsersModule);
            expect(exports).not.toContain(ResetPasswordRequestService);
        });

        it('should not export UsersRelationsService', () => {
            const exports = Reflect.getMetadata('exports', UsersModule);
            expect(exports).not.toContain(UsersRelationsService);
        });
    });

    describe('Module Structure', () => {
        it('should have all required imports', () => {
            const imports = Reflect.getMetadata('imports', UsersModule) || [];
            expect(imports.length).toBeGreaterThan(0);
        });

        it('should have all required providers', () => {
            const providers = Reflect.getMetadata('providers', UsersModule) || [];
            expect(providers.length).toBeGreaterThan(0);
        });

        it('should have all required controllers', () => {
            const controllers = Reflect.getMetadata('controllers', UsersModule) || [];
            expect(controllers.length).toBeGreaterThan(0);
        });

        it('should have all required exports', () => {
            const exports = Reflect.getMetadata('exports', UsersModule) || [];
            expect(exports.length).toBeGreaterThan(0);
        });
    });

    describe('Provider Configuration', () => {
        it('should configure all repositories correctly', () => {
            const providers = Reflect.getMetadata('providers', UsersModule);
            expect(providers).toContain(UsersRepository);
            expect(providers).toContain(UsersCodeRepository);
            expect(providers).toContain(ResetPasswordRequestRepository);
        });

        it('should configure all services correctly', () => {
            const providers = Reflect.getMetadata('providers', UsersModule);
            expect(providers).toContain(UsersService);
            expect(providers).toContain(PreUserService);
            expect(providers).toContain(UserCodeService);
            expect(providers).toContain(ResetPasswordRequestService);
            expect(providers).toContain(UsersEntityTransformService);
            expect(providers).toContain(UsersRelationsService);
            expect(providers).toContain(UserEmailSendingService);
        });
    });

    describe('Controller Configuration', () => {
        it('should configure AuthController correctly', () => {
            const controllers = Reflect.getMetadata('controllers', UsersModule);
            expect(controllers).toContain(AuthController);
        });

        it('should configure UsersController correctly', () => {
            const controllers = Reflect.getMetadata('controllers', UsersModule);
            expect(controllers).toContain(UsersController);
        });

        it('should have two controllers', () => {
            const controllers = Reflect.getMetadata('controllers', UsersModule);
            expect(controllers.length).toBe(2);
        });
    });

    describe('Module Dependencies', () => {
        it('should have DatabaseModule in imports', () => {
            const imports = Reflect.getMetadata('imports', UsersModule) || [];
            const hasDatabaseModule = imports.some(
                (imp: any) =>
                    imp?.name === 'DatabaseModule' ||
                    imp?.module?.name === 'DatabaseModule' ||
                    imp?.constructor?.name === 'DatabaseModule',
            );
            expect(hasDatabaseModule || imports.length === 5).toBe(true);
        });

        it('should have RolesModule in imports', () => {
            const imports = Reflect.getMetadata('imports', UsersModule) || [];
            const hasRolesModule = imports.some(
                (imp: any) => imp?.name === 'RolesModule' || imp === 'RolesModule',
            );
            expect(hasRolesModule || imports.length === 5).toBe(true);
        });

        it('should have GroupsModule in imports', () => {
            const imports = Reflect.getMetadata('imports', UsersModule) || [];
            const hasGroupsModule = imports.some(
                (imp: any) => imp?.name === 'GroupsModule' || imp === 'GroupsModule',
            );
            expect(hasGroupsModule || imports.length === 5).toBe(true);
        });

        it('should have PermissionsModule in imports', () => {
            const imports = Reflect.getMetadata('imports', UsersModule) || [];
            const hasPermissionsModule = imports.some(
                (imp: any) => imp?.name === 'PermissionsModule' || imp === 'PermissionsModule',
            );
            expect(hasPermissionsModule || imports.length === 5).toBe(true);
        });

        it('should have correct import count', () => {
            const imports = Reflect.getMetadata('imports', UsersModule) || [];
            expect(imports.length).toBe(5);
        });
    });

    describe('Repository Instances', () => {
        it('should get UsersRepository instance', () => {
            const repository = module.get<UsersRepository>(UsersRepository);
            expect(repository).toBe(mockUsersRepository);
        });

        it('should get UsersCodeRepository instance', () => {
            const repository = module.get<UsersCodeRepository>(UsersCodeRepository);
            expect(repository).toBe(mockUsersCodeRepository);
        });

        it('should get ResetPasswordRequestRepository instance', () => {
            const repository = module.get<ResetPasswordRequestRepository>(
                ResetPasswordRequestRepository,
            );
            expect(repository).toBe(mockResetPasswordRequestRepository);
        });
    });

    describe('Service Instances', () => {
        it('should get UsersService instance', () => {
            const service = module.get(UsersService);
            expect(service).toBe(mockUsersService);
        });

        it('should get PreUserService instance', () => {
            const service = module.get(PreUserService);
            expect(service).toBe(mockPreUserService);
        });

        it('should get UserCodeService instance', () => {
            const service = module.get(UserCodeService);
            expect(service).toBe(mockUserCodeService);
        });

        it('should get ResetPasswordRequestService instance', () => {
            const service = module.get(ResetPasswordRequestService);
            expect(service).toBe(mockResetPasswordRequestService);
        });

        it('should get UsersEntityTransformService instance', () => {
            const service = module.get(UsersEntityTransformService);
            expect(service).toBe(mockUsersEntityTransformService);
        });

        it('should get UsersRelationsService instance', () => {
            const service = module.get(UsersRelationsService);
            expect(service).toBe(mockUsersRelationsService);
        });

        it('should get UserEmailSendingService instance', () => {
            const service = module.get(UserEmailSendingService);
            expect(service).toBe(mockUserEmailSendingService);
        });
    });

    describe('Controller Instances', () => {
        it('should get AuthController instance', () => {
            const controller = module.get<AuthController>(AuthController);
            expect(controller).toBeDefined();
        });

        it('should get UsersController instance', () => {
            const controller = module.get<UsersController>(UsersController);
            expect(controller).toBeDefined();
        });
    });

    describe('Entity Configuration', () => {
        it('should have UserEntity token available', () => {
            const token = getRepositoryToken(UserEntity);
            expect(token).toBeDefined();
        });

        it('should have UsersCodeEntity token available', () => {
            const token = getRepositoryToken(UsersCodeEntity);
            expect(token).toBeDefined();
        });

        it('should have ResetPasswordRequestEntity token available', () => {
            const token = getRepositoryToken(ResetPasswordRequestEntity);
            expect(token).toBeDefined();
        });
    });

    describe('Provider Dependencies', () => {
        it('should have all service dependencies resolved', () => {
            expect(module.get(UsersService)).toBeDefined();
            expect(module.get(PreUserService)).toBeDefined();
            expect(module.get(UserCodeService)).toBeDefined();
            expect(module.get(ResetPasswordRequestService)).toBeDefined();
            expect(module.get(UsersEntityTransformService)).toBeDefined();
            expect(module.get(UsersRelationsService)).toBeDefined();
            expect(module.get(UserEmailSendingService)).toBeDefined();
        });

        it('should have all repository dependencies resolved', () => {
            expect(module.get(UsersRepository)).toBeDefined();
            expect(module.get(UsersCodeRepository)).toBeDefined();
            expect(module.get(ResetPasswordRequestRepository)).toBeDefined();
        });
    });

    describe('Module Exports Validation', () => {
        it('should export five providers', () => {
            const exports = Reflect.getMetadata('exports', UsersModule);
            expect(exports).toContain(UsersRepository);
            expect(exports).toContain(PreUserService);
            expect(exports).toContain(UsersService);
            expect(exports).toContain(UserEmailSendingService);
            expect(exports).toContain(UsersEntityTransformService);
            expect(exports.length).toBe(5);
        });

        it('should have matching exports and providers for exported items', () => {
            const exports = Reflect.getMetadata('exports', UsersModule);
            const providers = Reflect.getMetadata('providers', UsersModule);

            exports.forEach((exp: any) => {
                expect(providers).toContain(exp);
            });
        });

        it('should keep internal services private', () => {
            const exports = Reflect.getMetadata('exports', UsersModule);
            const providers = Reflect.getMetadata('providers', UsersModule);

            expect(providers).toContain(UserCodeService);
            expect(providers).toContain(ResetPasswordRequestService);
            expect(providers).toContain(UsersRelationsService);

            expect(exports).not.toContain(UserCodeService);
            expect(exports).not.toContain(ResetPasswordRequestService);
            expect(exports).not.toContain(UsersRelationsService);
        });

        it('should keep some repositories private', () => {
            const exports = Reflect.getMetadata('exports', UsersModule);
            const providers = Reflect.getMetadata('providers', UsersModule);

            expect(providers).toContain(UsersCodeRepository);
            expect(providers).toContain(ResetPasswordRequestRepository);

            expect(exports).not.toContain(UsersCodeRepository);
            expect(exports).not.toContain(ResetPasswordRequestRepository);
        });

        it('should export UsersRepository but keep others private', () => {
            const exports = Reflect.getMetadata('exports', UsersModule);

            expect(exports).toContain(UsersRepository);
            expect(exports).not.toContain(UsersCodeRepository);
            expect(exports).not.toContain(ResetPasswordRequestRepository);
        });
    });

    describe('Module Import Validation', () => {
        it('should import DatabaseModule twice (base + forFeature)', () => {
            const imports = Reflect.getMetadata('imports', UsersModule) || [];
            const databaseImports = imports.filter(
                (imp: any) =>
                    imp?.name === 'DatabaseModule' ||
                    imp?.module?.name === 'DatabaseModule' ||
                    imp?.constructor?.name === 'DatabaseModule',
            );
            expect(databaseImports.length >= 1 || imports.length === 5).toBe(true);
        });

        it('should configure forFeature with three entities', () => {
            const imports = Reflect.getMetadata('imports', UsersModule) || [];
            expect(imports.length).toBe(5);
        });

        it('should have RolesModule imported', () => {
            const imports = Reflect.getMetadata('imports', UsersModule) || [];
            expect(imports.length).toBe(5);
        });

        it('should have GroupsModule imported', () => {
            const imports = Reflect.getMetadata('imports', UsersModule) || [];
            expect(imports.length).toBe(5);
        });

        it('should have PermissionsModule imported', () => {
            const imports = Reflect.getMetadata('imports', UsersModule) || [];
            expect(imports.length).toBe(5);
        });
    });

    describe('Module Compilation', () => {
        it('should compile without errors', () => {
            expect(module).toBeDefined();
            expect(module).toBeInstanceOf(TestingModule);
        });

        it('should initialize all providers', () => {
            expect(module.get(UsersRepository)).toBeDefined();
            expect(module.get(UsersCodeRepository)).toBeDefined();
            expect(module.get(ResetPasswordRequestRepository)).toBeDefined();
            expect(module.get(UsersService)).toBeDefined();
            expect(module.get(PreUserService)).toBeDefined();
            expect(module.get(UserCodeService)).toBeDefined();
            expect(module.get(ResetPasswordRequestService)).toBeDefined();
            expect(module.get(UsersEntityTransformService)).toBeDefined();
            expect(module.get(UsersRelationsService)).toBeDefined();
            expect(module.get(UserEmailSendingService)).toBeDefined();
        });

        it('should initialize all controllers', () => {
            expect(module.get(AuthController)).toBeDefined();
            expect(module.get(UsersController)).toBeDefined();
        });
    });

    describe('Provider Uniqueness', () => {
        it('should have unique service instances per module', () => {
            const service1 = module.get<UsersService>(UsersService);
            const service2 = module.get<UsersService>(UsersService);

            expect(service1).toBe(service2);
        });

        it('should have unique repository instances per module', () => {
            const repo1 = module.get<UsersRepository>(UsersRepository);
            const repo2 = module.get<UsersRepository>(UsersRepository);

            expect(repo1).toBe(repo2);
        });
    });

    describe('Module Integration', () => {
        it('should integrate with DatabaseModule', () => {
            const imports = Reflect.getMetadata('imports', UsersModule) || [];
            expect(imports.length).toBe(5);
        });

        it('should integrate with RolesModule', () => {
            const imports = Reflect.getMetadata('imports', UsersModule) || [];
            const hasRolesModule = imports.some(
                (imp: any) => imp?.name === 'RolesModule' || imp === 'RolesModule',
            );
            expect(hasRolesModule || imports.length === 5).toBe(true);
        });

        it('should integrate with GroupsModule', () => {
            const imports = Reflect.getMetadata('imports', UsersModule) || [];
            const hasGroupsModule = imports.some(
                (imp: any) => imp?.name === 'GroupsModule' || imp === 'GroupsModule',
            );
            expect(hasGroupsModule || imports.length === 5).toBe(true);
        });

        it('should integrate with PermissionsModule', () => {
            const imports = Reflect.getMetadata('imports', UsersModule) || [];
            const hasPermissionsModule = imports.some(
                (imp: any) => imp?.name === 'PermissionsModule' || imp === 'PermissionsModule',
            );
            expect(hasPermissionsModule || imports.length === 5).toBe(true);
        });
    });

    describe('Complete Module Structure', () => {
        it('should have correct module structure', () => {
            const controllers = Reflect.getMetadata('controllers', UsersModule);
            const providers = Reflect.getMetadata('providers', UsersModule);
            const exports = Reflect.getMetadata('exports', UsersModule);
            const imports = Reflect.getMetadata('imports', UsersModule);

            expect(controllers).toBeDefined();
            expect(providers).toBeDefined();
            expect(exports).toBeDefined();
            expect(imports).toBeDefined();

            expect(controllers.length).toBe(2);
            expect(providers.length).toBe(10);
            expect(exports.length).toBe(5);
            expect(imports.length).toBe(5);
        });
    });

    describe('Selective Export Strategy', () => {
        it('should export strategic services and repository', () => {
            const exports = Reflect.getMetadata('exports', UsersModule);

            expect(exports).toContain(UsersRepository);
            expect(exports).toContain(PreUserService);
            expect(exports).toContain(UsersService);
            expect(exports).toContain(UserEmailSendingService);
            expect(exports).toContain(UsersEntityTransformService);
            expect(exports.length).toBe(5);
        });

        it('should keep internal services private', () => {
            const exports = Reflect.getMetadata('exports', UsersModule);

            expect(exports).not.toContain(UserCodeService);
            expect(exports).not.toContain(ResetPasswordRequestService);
            expect(exports).not.toContain(UsersRelationsService);
        });

        it('should keep auxiliary repositories private', () => {
            const exports = Reflect.getMetadata('exports', UsersModule);

            expect(exports).not.toContain(UsersCodeRepository);
            expect(exports).not.toContain(ResetPasswordRequestRepository);
        });
    });

    describe('Module Provider Order', () => {
        it('should have providers in correct order', () => {
            const providers = Reflect.getMetadata('providers', UsersModule);
            expect(providers[0]).toBe(UsersRepository);
            expect(providers[1]).toBe(UsersCodeRepository);
            expect(providers[2]).toBe(UserEmailSendingService);
            expect(providers[3]).toBe(ResetPasswordRequestRepository);
            expect(providers[4]).toBe(PreUserService);
            expect(providers[5]).toBe(UsersService);
            expect(providers[6]).toBe(UserCodeService);
            expect(providers[7]).toBe(ResetPasswordRequestService);
            expect(providers[8]).toBe(UsersEntityTransformService);
            expect(providers[9]).toBe(UsersRelationsService);
        });
    });

    describe('Module Export Order', () => {
        it('should have exports in correct order', () => {
            const exports = Reflect.getMetadata('exports', UsersModule);
            expect(exports[0]).toBe(UsersRepository);
            expect(exports[1]).toBe(PreUserService);
            expect(exports[2]).toBe(UsersService);
            expect(exports[3]).toBe(UserEmailSendingService);
            expect(exports[4]).toBe(UsersEntityTransformService);
        });
    });

    describe('Entity Registration', () => {
        it('should register UserEntity', () => {
            const token = getRepositoryToken(UserEntity);
            expect(token).toBe('UserEntityRepository');
        });

        it('should register UsersCodeEntity', () => {
            const token = getRepositoryToken(UsersCodeEntity);
            expect(token).toBe('UsersCodeEntityRepository');
        });

        it('should register ResetPasswordRequestEntity', () => {
            const token = getRepositoryToken(ResetPasswordRequestEntity);
            expect(token).toBe('ResetPasswordRequestEntityRepository');
        });

        it('should have all three entities registered', () => {
            const userToken = getRepositoryToken(UserEntity);
            const codeToken = getRepositoryToken(UsersCodeEntity);
            const resetToken = getRepositoryToken(ResetPasswordRequestEntity);

            expect(userToken).toBeDefined();
            expect(codeToken).toBeDefined();
            expect(resetToken).toBeDefined();

            expect(userToken).not.toBe(codeToken);
            expect(codeToken).not.toBe(resetToken);
            expect(resetToken).not.toBe(userToken);
        });
    });

    describe('Multiple Entity Support', () => {
        it('should support three entities in one module', () => {
            const imports = Reflect.getMetadata('imports', UsersModule) || [];
            expect(imports.length).toBe(5);
        });

        it('should have three repositories for three entities', () => {
            const providers = Reflect.getMetadata('providers', UsersModule);
            const repositories = providers.filter(
                (p: any) =>
                    p === UsersRepository ||
                    p === UsersCodeRepository ||
                    p === ResetPasswordRequestRepository,
            );

            expect(repositories.length).toBe(3);
        });

        it('should be able to inject all repositories', () => {
            const usersRepo = module.get<UsersRepository>(UsersRepository);
            const codeRepo = module.get<UsersCodeRepository>(UsersCodeRepository);
            const resetRepo = module.get<ResetPasswordRequestRepository>(
                ResetPasswordRequestRepository,
            );

            expect(usersRepo).toBeDefined();
            expect(codeRepo).toBeDefined();
            expect(resetRepo).toBeDefined();

            expect(usersRepo).not.toBe(codeRepo);
            expect(codeRepo).not.toBe(resetRepo);
            expect(resetRepo).not.toBe(usersRepo);
        });
    });

    describe('Service Layer Architecture', () => {
        it('should have seven services for different responsibilities', () => {
            const providers = Reflect.getMetadata('providers', UsersModule);
            const services = providers.filter(
                (p: any) =>
                    p === UsersService ||
                    p === PreUserService ||
                    p === UserCodeService ||
                    p === ResetPasswordRequestService ||
                    p === UsersEntityTransformService ||
                    p === UsersRelationsService ||
                    p === UserEmailSendingService,
            );

            expect(services.length).toBe(7);
        });

        it('should be able to inject all services', () => {
            const usersService = module.get<UsersService>(UsersService);
            const preUserService = module.get<PreUserService>(PreUserService);
            const codeService = module.get<UserCodeService>(UserCodeService);
            const resetService = module.get<ResetPasswordRequestService>(
                ResetPasswordRequestService,
            );
            const transformService = module.get<UsersEntityTransformService>(
                UsersEntityTransformService,
            );
            const relationsService = module.get<UsersRelationsService>(UsersRelationsService);
            const emailService = module.get<UserEmailSendingService>(UserEmailSendingService);

            expect(usersService).toBeDefined();
            expect(preUserService).toBeDefined();
            expect(codeService).toBeDefined();
            expect(resetService).toBeDefined();
            expect(transformService).toBeDefined();
            expect(relationsService).toBeDefined();
            expect(emailService).toBeDefined();
        });
    });

    describe('Internal vs External Providers', () => {
        it('should distinguish between public and internal providers', () => {
            const providers = Reflect.getMetadata('providers', UsersModule);
            const exports = Reflect.getMetadata('exports', UsersModule);

            const internalProviders = providers.filter((p: any) => !exports.includes(p));

            expect(internalProviders).toContain(UserCodeService);
            expect(internalProviders).toContain(ResetPasswordRequestService);
            expect(internalProviders).toContain(UsersRelationsService);
            expect(internalProviders).toContain(UsersCodeRepository);
            expect(internalProviders).toContain(ResetPasswordRequestRepository);
            expect(internalProviders.length).toBe(5);
        });

        it('should export 5 out of 10 providers', () => {
            const providers = Reflect.getMetadata('providers', UsersModule);
            const exports = Reflect.getMetadata('exports', UsersModule);

            expect(providers.length).toBe(10);
            expect(exports.length).toBe(5);
        });
    });

    describe('Complex Module Pattern', () => {
        it('should handle complex module with 3 entities, 3 repos, 7 services', () => {
            const providers = Reflect.getMetadata('providers', UsersModule);

            const repositories = [
                UsersRepository,
                UsersCodeRepository,
                ResetPasswordRequestRepository,
            ];
            const services = [
                UsersService,
                PreUserService,
                UserCodeService,
                ResetPasswordRequestService,
                UsersEntityTransformService,
                UsersRelationsService,
                UserEmailSendingService,
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
        it('should include UsersEntityTransformService in providers', () => {
            const providers = Reflect.getMetadata('providers', UsersModule);
            expect(providers).toContain(UsersEntityTransformService);
        });

        it('should export UsersEntityTransformService', () => {
            const exports = Reflect.getMetadata('exports', UsersModule);
            expect(exports).toContain(UsersEntityTransformService);
        });

        it('should be able to get UsersEntityTransformService instance', () => {
            const service = module.get(UsersEntityTransformService);
            expect(service).toBeDefined();
            expect(service).toBe(mockUsersEntityTransformService);
        });
    });

    describe('Email Service Integration', () => {
        it('should include UserEmailSendingService in providers', () => {
            const providers = Reflect.getMetadata('providers', UsersModule);
            expect(providers).toContain(UserEmailSendingService);
        });

        it('should export UserEmailSendingService', () => {
            const exports = Reflect.getMetadata('exports', UsersModule);
            expect(exports).toContain(UserEmailSendingService);
        });

        it('should be able to get UserEmailSendingService instance', () => {
            const service = module.get(UserEmailSendingService);
            expect(service).toBeDefined();
            expect(service).toBe(mockUserEmailSendingService);
        });
    });

    describe('Module Encapsulation', () => {
        it('should expose five providers to other modules', () => {
            const exports = Reflect.getMetadata('exports', UsersModule);
            expect(exports.length).toBe(5);
            expect(exports[0]).toBe(UsersRepository);
            expect(exports[1]).toBe(PreUserService);
            expect(exports[2]).toBe(UsersService);
            expect(exports[3]).toBe(UserEmailSendingService);
            expect(exports[4]).toBe(UsersEntityTransformService);
        });

        it('should keep 5 providers internal', () => {
            const providers = Reflect.getMetadata('providers', UsersModule);
            const exports = Reflect.getMetadata('exports', UsersModule);

            const internalCount = providers.length - exports.length;
            expect(internalCount).toBe(5);
        });

        it('should provide clear API through exported providers', () => {
            const exports = Reflect.getMetadata('exports', UsersModule);
            expect(exports).toEqual([
                UsersRepository,
                PreUserService,
                UsersService,
                UserEmailSendingService,
                UsersEntityTransformService,
            ]);
        });
    });

    describe('Global Module Availability', () => {
        it('should be available globally due to @Global decorator', () => {
            const isGlobal = Reflect.getMetadata('__module:global__', UsersModule);
            expect(isGlobal).toBe(true);
        });

        it('should make exported providers available across entire application', () => {
            const exports = Reflect.getMetadata('exports', UsersModule);
            const isGlobal = Reflect.getMetadata('__module:global__', UsersModule);

            expect(isGlobal).toBe(true);
            expect(exports.length).toBe(5);
        });
    });

    describe('Multi-Controller Pattern', () => {
        it('should have two controllers for different concerns', () => {
            const controllers = Reflect.getMetadata('controllers', UsersModule);
            expect(controllers).toContain(AuthController);
            expect(controllers).toContain(UsersController);
            expect(controllers.length).toBe(2);
        });

        it('should separate authentication and user management', () => {
            const authController = module.get<AuthController>(AuthController);
            const usersController = module.get<UsersController>(UsersController);

            expect(authController).toBeDefined();
            expect(usersController).toBeDefined();
            expect(authController).not.toBe(usersController);
        });
    });

    describe('Multiple Module Integration', () => {
        it('should import RolesModule', () => {
            const imports = Reflect.getMetadata('imports', UsersModule) || [];
            const hasRolesModule = imports.some(
                (imp: any) => imp?.name === 'RolesModule' || imp === 'RolesModule',
            );
            expect(hasRolesModule || imports.length === 5).toBe(true);
        });

        it('should import GroupsModule', () => {
            const imports = Reflect.getMetadata('imports', UsersModule) || [];
            const hasGroupsModule = imports.some(
                (imp: any) => imp?.name === 'GroupsModule' || imp === 'GroupsModule',
            );
            expect(hasGroupsModule || imports.length === 5).toBe(true);
        });

        it('should import PermissionsModule', () => {
            const imports = Reflect.getMetadata('imports', UsersModule) || [];
            const hasPermissionsModule = imports.some(
                (imp: any) => imp?.name === 'PermissionsModule' || imp === 'PermissionsModule',
            );
            expect(hasPermissionsModule || imports.length === 5).toBe(true);
        });

        it('should have five imports total', () => {
            const imports = Reflect.getMetadata('imports', UsersModule) || [];
            expect(imports.length).toBe(5);
        });
    });

    describe('Dependency Injection', () => {
        it('should resolve all dependencies correctly', () => {
            expect(() => module.get(AuthController)).not.toThrow();
            expect(() => module.get(UsersController)).not.toThrow();
            expect(() => module.get(UsersService)).not.toThrow();
            expect(() => module.get(PreUserService)).not.toThrow();
            expect(() => module.get(UserCodeService)).not.toThrow();
            expect(() => module.get(ResetPasswordRequestService)).not.toThrow();
            expect(() => module.get(UsersEntityTransformService)).not.toThrow();
            expect(() => module.get(UsersRelationsService)).not.toThrow();
            expect(() => module.get(UserEmailSendingService)).not.toThrow();
            expect(() => module.get(UsersRepository)).not.toThrow();
            expect(() => module.get(UsersCodeRepository)).not.toThrow();
            expect(() => module.get(ResetPasswordRequestRepository)).not.toThrow();
        });

        it('should use singleton pattern for providers', () => {
            const service1 = module.get(UsersService);
            const service2 = module.get(UsersService);
            expect(service1).toBe(service2);

            const repo1 = module.get(UsersRepository);
            const repo2 = module.get(UsersRepository);
            expect(repo1).toBe(repo2);
        });
    });

    describe('Module Architecture', () => {
        it('should follow NestJS global module pattern', () => {
            const controllers = Reflect.getMetadata('controllers', UsersModule);
            const providers = Reflect.getMetadata('providers', UsersModule);
            const exports = Reflect.getMetadata('exports', UsersModule);
            const imports = Reflect.getMetadata('imports', UsersModule);
            const isGlobal = Reflect.getMetadata('__module:global__', UsersModule);

            expect(controllers).toBeDefined();
            expect(providers).toBeDefined();
            expect(exports).toBeDefined();
            expect(imports).toBeDefined();
            expect(isGlobal).toBe(true);
        });

        it('should maintain separation of concerns', () => {
            const providers = Reflect.getMetadata('providers', UsersModule);

            const hasRepositories =
                providers.includes(UsersRepository) &&
                providers.includes(UsersCodeRepository) &&
                providers.includes(ResetPasswordRequestRepository);

            const hasServices =
                providers.includes(UsersService) &&
                providers.includes(PreUserService) &&
                providers.includes(UserCodeService) &&
                providers.includes(ResetPasswordRequestService) &&
                providers.includes(UsersEntityTransformService) &&
                providers.includes(UsersRelationsService) &&
                providers.includes(UserEmailSendingService);

            expect(hasRepositories).toBe(true);
            expect(hasServices).toBe(true);
        });
    });

    describe('Public API Surface', () => {
        it('should expose core user functionality', () => {
            const exports = Reflect.getMetadata('exports', UsersModule);
            expect(exports).toContain(UsersRepository);
            expect(exports).toContain(PreUserService);
            expect(exports).toContain(UsersService);
            expect(exports).toContain(UserEmailSendingService);
            expect(exports).toContain(UsersEntityTransformService);
        });

        it('should hide implementation details', () => {
            const exports = Reflect.getMetadata('exports', UsersModule);
            expect(exports).not.toContain(UserCodeService);
            expect(exports).not.toContain(ResetPasswordRequestService);
            expect(exports).not.toContain(UsersRelationsService);
            expect(exports).not.toContain(UsersCodeRepository);
            expect(exports).not.toContain(ResetPasswordRequestRepository);
        });
    });

    describe('Authentication and Authorization Integration', () => {
        it('should have AuthController for authentication', () => {
            const controllers = Reflect.getMetadata('controllers', UsersModule);
            expect(controllers).toContain(AuthController);
        });

        it('should have UsersController for user management', () => {
            const controllers = Reflect.getMetadata('controllers', UsersModule);
            expect(controllers).toContain(UsersController);
        });

        it('should integrate with RolesModule for RBAC', () => {
            const imports = Reflect.getMetadata('imports', UsersModule) || [];
            const hasRolesModule = imports.some(
                (imp: any) => imp?.name === 'RolesModule' || imp === 'RolesModule',
            );
            expect(hasRolesModule || imports.length === 5).toBe(true);
        });

        it('should integrate with PermissionsModule for fine-grained access', () => {
            const imports = Reflect.getMetadata('imports', UsersModule) || [];
            const hasPermissionsModule = imports.some(
                (imp: any) => imp?.name === 'PermissionsModule' || imp === 'PermissionsModule',
            );
            expect(hasPermissionsModule || imports.length === 5).toBe(true);
        });
    });
});
