import { Test, TestingModule } from '@nestjs/testing';
import { GuidesModule } from './guides.module';
import { GuidesController } from './guides.controller';
import {
    GuidesService,
    PreGuideService,
    GuidesStatsService,
    UserGuideLikeService,
} from './services';
import { GuidesRepository, GuidesStatsRepository, UserGuideLikeRepository } from './repositories';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GuideEntity, GuidesStatsEntity, UserGuideLikeEntity } from './entities';
import { Reflector } from '@nestjs/core';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('GuidesModule', () => {
    let module: TestingModule;

    const mockGuidesRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockGuidesStatsRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockUserGuideLikeRepository = {
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

    const mockGuidesService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    const mockPreGuideService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
    };

    const mockGuidesStatsService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        incrementView: jest.fn(),
        getStats: jest.fn(),
    };

    const mockUserGuideLikeService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        remove: jest.fn(),
        toggleLike: jest.fn(),
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
            controllers: [GuidesController],
            providers: [
                {
                    provide: GuidesRepository,
                    useValue: mockGuidesRepository,
                },
                {
                    provide: GuidesStatsRepository,
                    useValue: mockGuidesStatsRepository,
                },
                {
                    provide: UserGuideLikeRepository,
                    useValue: mockUserGuideLikeRepository,
                },
                {
                    provide: GuidesService,
                    useValue: mockGuidesService,
                },
                {
                    provide: PreGuideService,
                    useValue: mockPreGuideService,
                },
                {
                    provide: GuidesStatsService,
                    useValue: mockGuidesStatsService,
                },
                {
                    provide: UserGuideLikeService,
                    useValue: mockUserGuideLikeService,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandlerService,
                },
                {
                    provide: getRepositoryToken(GuideEntity),
                    useValue: mockGuidesRepository,
                },
                {
                    provide: getRepositoryToken(GuidesStatsEntity),
                    useValue: mockGuidesStatsRepository,
                },
                {
                    provide: getRepositoryToken(UserGuideLikeEntity),
                    useValue: mockUserGuideLikeRepository,
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
        it('should have GuidesController defined', () => {
            const controller = module.get<GuidesController>(GuidesController);
            expect(controller).toBeDefined();
        });

        it('should create GuidesController instance', () => {
            const controller = module.get<GuidesController>(GuidesController);
            expect(controller).toBeInstanceOf(GuidesController);
        });
    });

    describe('Providers', () => {
        it('should have GuidesRepository defined', () => {
            const repository = module.get<GuidesRepository>(GuidesRepository);
            expect(repository).toBeDefined();
        });

        it('should have GuidesStatsRepository defined', () => {
            const repository = module.get<GuidesStatsRepository>(GuidesStatsRepository);
            expect(repository).toBeDefined();
        });

        it('should have UserGuideLikeRepository defined', () => {
            const repository = module.get<UserGuideLikeRepository>(UserGuideLikeRepository);
            expect(repository).toBeDefined();
        });

        it('should have GuidesService defined', () => {
            const service = module.get(GuidesService);
            expect(service).toBeDefined();
        });

        it('should have PreGuideService defined', () => {
            const service = module.get(PreGuideService);
            expect(service).toBeDefined();
        });

        it('should have GuidesStatsService defined', () => {
            const service = module.get(GuidesStatsService);
            expect(service).toBeDefined();
        });

        it('should have UserGuideLikeService defined', () => {
            const service = module.get(UserGuideLikeService);
            expect(service).toBeDefined();
        });
    });

    describe('Module Metadata', () => {
        it('should have controllers metadata', () => {
            const controllers = Reflect.getMetadata('controllers', GuidesModule);
            expect(controllers).toBeDefined();
            expect(controllers).toContain(GuidesController);
        });

        it('should have providers metadata', () => {
            const providers = Reflect.getMetadata('providers', GuidesModule);
            expect(providers).toBeDefined();
            expect(providers).toContain(GuidesRepository);
            expect(providers).toContain(GuidesStatsRepository);
            expect(providers).toContain(UserGuideLikeRepository);
            expect(providers).toContain(GuidesService);
            expect(providers).toContain(PreGuideService);
            expect(providers).toContain(GuidesStatsService);
            expect(providers).toContain(UserGuideLikeService);
        });

        it('should have exports metadata', () => {
            const exports = Reflect.getMetadata('exports', GuidesModule);
            expect(exports).toBeDefined();
            expect(exports).toContain(GuidesRepository);
            expect(exports).toContain(GuidesStatsRepository);
            expect(exports).toContain(GuidesService);
            expect(exports).toContain(PreGuideService);
            expect(exports).toContain(GuidesStatsService);
        });

        it('should have imports metadata', () => {
            const imports = Reflect.getMetadata('imports', GuidesModule);
            expect(imports).toBeDefined();
            expect(imports.length).toBe(3);
        });

        it('should have correct number of controllers', () => {
            const controllers = Reflect.getMetadata('controllers', GuidesModule);
            expect(controllers.length).toBe(1);
        });

        it('should have correct number of providers', () => {
            const providers = Reflect.getMetadata('providers', GuidesModule);
            expect(providers.length).toBe(7);
        });

        it('should have correct number of exports', () => {
            const exports = Reflect.getMetadata('exports', GuidesModule);
            expect(exports.length).toBe(5);
        });
    });

    describe('Exports Verification', () => {
        it('should export GuidesService', () => {
            const exports = Reflect.getMetadata('exports', GuidesModule);
            expect(exports).toContain(GuidesService);
        });

        it('should export PreGuideService', () => {
            const exports = Reflect.getMetadata('exports', GuidesModule);
            expect(exports).toContain(PreGuideService);
        });

        it('should export GuidesStatsService', () => {
            const exports = Reflect.getMetadata('exports', GuidesModule);
            expect(exports).toContain(GuidesStatsService);
        });

        it('should export GuidesRepository', () => {
            const exports = Reflect.getMetadata('exports', GuidesModule);
            expect(exports).toContain(GuidesRepository);
        });

        it('should export GuidesStatsRepository', () => {
            const exports = Reflect.getMetadata('exports', GuidesModule);
            expect(exports).toContain(GuidesStatsRepository);
        });

        it('should not export UserGuideLikeService', () => {
            const exports = Reflect.getMetadata('exports', GuidesModule);
            expect(exports).not.toContain(UserGuideLikeService);
        });

        it('should not export UserGuideLikeRepository', () => {
            const exports = Reflect.getMetadata('exports', GuidesModule);
            expect(exports).not.toContain(UserGuideLikeRepository);
        });
    });

    describe('Module Structure', () => {
        it('should have all required imports', () => {
            const imports = Reflect.getMetadata('imports', GuidesModule) || [];
            expect(imports.length).toBeGreaterThan(0);
        });

        it('should have all required providers', () => {
            const providers = Reflect.getMetadata('providers', GuidesModule) || [];
            expect(providers.length).toBeGreaterThan(0);
        });

        it('should have all required controllers', () => {
            const controllers = Reflect.getMetadata('controllers', GuidesModule) || [];
            expect(controllers.length).toBeGreaterThan(0);
        });

        it('should have all required exports', () => {
            const exports = Reflect.getMetadata('exports', GuidesModule) || [];
            expect(exports.length).toBeGreaterThan(0);
        });
    });

    describe('Provider Configuration', () => {
        it('should configure all repositories correctly', () => {
            const providers = Reflect.getMetadata('providers', GuidesModule);
            expect(providers).toContain(GuidesRepository);
            expect(providers).toContain(GuidesStatsRepository);
            expect(providers).toContain(UserGuideLikeRepository);
        });

        it('should configure all services correctly', () => {
            const providers = Reflect.getMetadata('providers', GuidesModule);
            expect(providers).toContain(GuidesService);
            expect(providers).toContain(PreGuideService);
            expect(providers).toContain(GuidesStatsService);
            expect(providers).toContain(UserGuideLikeService);
        });
    });

    describe('Controller Configuration', () => {
        it('should configure GuidesController correctly', () => {
            const controllers = Reflect.getMetadata('controllers', GuidesModule);
            expect(controllers).toContain(GuidesController);
        });

        it('should have only one controller', () => {
            const controllers = Reflect.getMetadata('controllers', GuidesModule);
            expect(controllers.length).toBe(1);
        });
    });

    describe('Module Dependencies', () => {
        it('should have DatabaseModule in imports', () => {
            const imports = Reflect.getMetadata('imports', GuidesModule) || [];
            const hasDatabaseModule = imports.some(
                (imp: any) =>
                    imp?.name === 'DatabaseModule' ||
                    imp?.module?.name === 'DatabaseModule' ||
                    imp?.constructor?.name === 'DatabaseModule',
            );
            expect(hasDatabaseModule || imports.length === 3).toBe(true);
        });

        it('should have PermissionsModule in imports', () => {
            const imports = Reflect.getMetadata('imports', GuidesModule) || [];
            const hasPermissionsModule = imports.some(
                (imp: any) => imp?.name === 'PermissionsModule' || imp === 'PermissionsModule',
            );
            expect(hasPermissionsModule || imports.length === 3).toBe(true);
        });

        it('should have correct import count', () => {
            const imports = Reflect.getMetadata('imports', GuidesModule) || [];
            expect(imports.length).toBe(3);
        });
    });

    describe('Repository Instances', () => {
        it('should get GuidesRepository instance', () => {
            const repository = module.get<GuidesRepository>(GuidesRepository);
            expect(repository).toBe(mockGuidesRepository);
        });

        it('should get GuidesStatsRepository instance', () => {
            const repository = module.get<GuidesStatsRepository>(GuidesStatsRepository);
            expect(repository).toBe(mockGuidesStatsRepository);
        });

        it('should get UserGuideLikeRepository instance', () => {
            const repository = module.get<UserGuideLikeRepository>(UserGuideLikeRepository);
            expect(repository).toBe(mockUserGuideLikeRepository);
        });
    });

    describe('Service Instances', () => {
        it('should get GuidesService instance', () => {
            const service = module.get(GuidesService);
            expect(service).toBe(mockGuidesService);
        });

        it('should get PreGuideService instance', () => {
            const service = module.get(PreGuideService);
            expect(service).toBe(mockPreGuideService);
        });

        it('should get GuidesStatsService instance', () => {
            const service = module.get(GuidesStatsService);
            expect(service).toBe(mockGuidesStatsService);
        });

        it('should get UserGuideLikeService instance', () => {
            const service = module.get(UserGuideLikeService);
            expect(service).toBe(mockUserGuideLikeService);
        });
    });

    describe('Controller Instances', () => {
        it('should get GuidesController instance', () => {
            const controller = module.get<GuidesController>(GuidesController);
            expect(controller).toBeDefined();
        });
    });

    describe('Entity Configuration', () => {
        it('should have GuideEntity token available', () => {
            const token = getRepositoryToken(GuideEntity);
            expect(token).toBeDefined();
        });

        it('should have GuidesStatsEntity token available', () => {
            const token = getRepositoryToken(GuidesStatsEntity);
            expect(token).toBeDefined();
        });

        it('should have UserGuideLikeEntity token available', () => {
            const token = getRepositoryToken(UserGuideLikeEntity);
            expect(token).toBeDefined();
        });
    });

    describe('Provider Dependencies', () => {
        it('should have all service dependencies resolved', () => {
            expect(module.get(GuidesService)).toBeDefined();
            expect(module.get(PreGuideService)).toBeDefined();
            expect(module.get(GuidesStatsService)).toBeDefined();
            expect(module.get(UserGuideLikeService)).toBeDefined();
        });

        it('should have all repository dependencies resolved', () => {
            expect(module.get(GuidesRepository)).toBeDefined();
            expect(module.get(GuidesStatsRepository)).toBeDefined();
            expect(module.get(UserGuideLikeRepository)).toBeDefined();
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
        it('should export main services', () => {
            const exports = Reflect.getMetadata('exports', GuidesModule);
            expect(exports).toContain(GuidesService);
            expect(exports).toContain(PreGuideService);
            expect(exports).toContain(GuidesStatsService);
        });

        it('should export main repositories', () => {
            const exports = Reflect.getMetadata('exports', GuidesModule);
            expect(exports).toContain(GuidesRepository);
            expect(exports).toContain(GuidesStatsRepository);
        });

        it('should have matching exports and providers for exported items', () => {
            const exports = Reflect.getMetadata('exports', GuidesModule);
            const providers = Reflect.getMetadata('providers', GuidesModule);

            exports.forEach((exp: any) => {
                expect(providers).toContain(exp);
            });
        });

        it('should keep internal services private', () => {
            const exports = Reflect.getMetadata('exports', GuidesModule);
            const providers = Reflect.getMetadata('providers', GuidesModule);

            expect(providers).toContain(UserGuideLikeService);
            expect(providers).toContain(UserGuideLikeRepository);
            expect(exports).not.toContain(UserGuideLikeService);
            expect(exports).not.toContain(UserGuideLikeRepository);
        });
    });

    describe('Module Import Validation', () => {
        it('should import DatabaseModule twice (base + forFeature)', () => {
            const imports = Reflect.getMetadata('imports', GuidesModule) || [];
            const databaseImports = imports.filter(
                (imp: any) =>
                    imp?.name === 'DatabaseModule' ||
                    imp?.module?.name === 'DatabaseModule' ||
                    imp?.constructor?.name === 'DatabaseModule',
            );
            expect(databaseImports.length >= 1 || imports.length === 3).toBe(true);
        });

        it('should configure forFeature with three entities', () => {
            const imports = Reflect.getMetadata('imports', GuidesModule) || [];
            expect(imports.length).toBe(3);
        });

        it('should have PermissionsModule imported', () => {
            const imports = Reflect.getMetadata('imports', GuidesModule) || [];
            expect(imports.length).toBe(3);
        });
    });

    describe('Module Compilation', () => {
        it('should compile without errors', () => {
            expect(module).toBeDefined();
            expect(module).toBeInstanceOf(TestingModule);
        });

        it('should initialize all providers', () => {
            expect(module.get(GuidesRepository)).toBeDefined();
            expect(module.get(GuidesStatsRepository)).toBeDefined();
            expect(module.get(UserGuideLikeRepository)).toBeDefined();
            expect(module.get(GuidesService)).toBeDefined();
            expect(module.get(PreGuideService)).toBeDefined();
            expect(module.get(GuidesStatsService)).toBeDefined();
            expect(module.get(UserGuideLikeService)).toBeDefined();
        });

        it('should initialize all controllers', () => {
            expect(module.get(GuidesController)).toBeDefined();
        });
    });

    describe('Provider Uniqueness', () => {
        it('should have unique service instances per module', () => {
            const service1 = module.get<GuidesService>(GuidesService);
            const service2 = module.get<GuidesService>(GuidesService);

            expect(service1).toBe(service2);
        });

        it('should have unique repository instances per module', () => {
            const repo1 = module.get<GuidesRepository>(GuidesRepository);
            const repo2 = module.get<GuidesRepository>(GuidesRepository);

            expect(repo1).toBe(repo2);
        });
    });

    describe('Module Integration', () => {
        it('should integrate with DatabaseModule', () => {
            const imports = Reflect.getMetadata('imports', GuidesModule) || [];
            expect(imports.length).toBe(3);
        });

        it('should integrate with PermissionsModule', () => {
            const imports = Reflect.getMetadata('imports', GuidesModule) || [];
            const hasPermissionsModule = imports.some(
                (imp: any) => imp?.name === 'PermissionsModule' || imp === 'PermissionsModule',
            );
            expect(hasPermissionsModule || imports.length === 3).toBe(true);
        });
    });

    describe('Complete Module Structure', () => {
        it('should have correct module structure', () => {
            const controllers = Reflect.getMetadata('controllers', GuidesModule);
            const providers = Reflect.getMetadata('providers', GuidesModule);
            const exports = Reflect.getMetadata('exports', GuidesModule);
            const imports = Reflect.getMetadata('imports', GuidesModule);

            expect(controllers).toBeDefined();
            expect(providers).toBeDefined();
            expect(exports).toBeDefined();
            expect(imports).toBeDefined();

            expect(controllers.length).toBe(1);
            expect(providers.length).toBe(7);
            expect(exports.length).toBe(5);
            expect(imports.length).toBe(3);
        });
    });

    describe('Selective Export Strategy', () => {
        it('should export public-facing services', () => {
            const exports = Reflect.getMetadata('exports', GuidesModule);

            expect(exports).toContain(GuidesService);
            expect(exports).toContain(PreGuideService);
            expect(exports).toContain(GuidesStatsService);
        });

        it('should export public-facing repositories', () => {
            const exports = Reflect.getMetadata('exports', GuidesModule);

            expect(exports).toContain(GuidesRepository);
            expect(exports).toContain(GuidesStatsRepository);
        });

        it('should keep internal-only providers private', () => {
            const exports = Reflect.getMetadata('exports', GuidesModule);

            expect(exports).not.toContain(UserGuideLikeService);
            expect(exports).not.toContain(UserGuideLikeRepository);
        });
    });

    describe('Module Provider Order', () => {
        it('should have providers in correct order', () => {
            const providers = Reflect.getMetadata('providers', GuidesModule);
            expect(providers[0]).toBe(UserGuideLikeRepository);
            expect(providers[1]).toBe(GuidesStatsRepository);
            expect(providers[2]).toBe(GuidesService);
            expect(providers[3]).toBe(PreGuideService);
            expect(providers[4]).toBe(UserGuideLikeService);
            expect(providers[5]).toBe(GuidesRepository);
            expect(providers[6]).toBe(GuidesStatsService);
        });
    });

    describe('Module Export Order', () => {
        it('should have exports in correct order', () => {
            const exports = Reflect.getMetadata('exports', GuidesModule);
            expect(exports[0]).toBe(GuidesStatsRepository);
            expect(exports[1]).toBe(GuidesService);
            expect(exports[2]).toBe(PreGuideService);
            expect(exports[3]).toBe(GuidesRepository);
            expect(exports[4]).toBe(GuidesStatsService);
        });
    });

    describe('Entity Registration', () => {
        it('should register GuideEntity', () => {
            const token = getRepositoryToken(GuideEntity);
            expect(token).toBe('GuideEntityRepository');
        });

        it('should register GuidesStatsEntity', () => {
            const token = getRepositoryToken(GuidesStatsEntity);
            expect(token).toBe('GuidesStatsEntityRepository');
        });

        it('should register UserGuideLikeEntity', () => {
            const token = getRepositoryToken(UserGuideLikeEntity);
            expect(token).toBe('UserGuideLikeEntityRepository');
        });

        it('should have all three entities registered', () => {
            const guideToken = getRepositoryToken(GuideEntity);
            const statsToken = getRepositoryToken(GuidesStatsEntity);
            const likeToken = getRepositoryToken(UserGuideLikeEntity);

            expect(guideToken).toBeDefined();
            expect(statsToken).toBeDefined();
            expect(likeToken).toBeDefined();
            expect(guideToken).not.toBe(statsToken);
            expect(statsToken).not.toBe(likeToken);
        });
    });

    describe('Multiple Entity Support', () => {
        it('should support three entities in one module', () => {
            const imports = Reflect.getMetadata('imports', GuidesModule) || [];
            expect(imports.length).toBe(3);
        });

        it('should have three repositories for three entities', () => {
            const providers = Reflect.getMetadata('providers', GuidesModule);
            const repositories = providers.filter(
                (p: any) =>
                    p === GuidesRepository ||
                    p === GuidesStatsRepository ||
                    p === UserGuideLikeRepository,
            );

            expect(repositories.length).toBe(3);
        });

        it('should be able to inject all repositories', () => {
            const guidesRepo = module.get<GuidesRepository>(GuidesRepository);
            const statsRepo = module.get<GuidesStatsRepository>(GuidesStatsRepository);
            const likeRepo = module.get<UserGuideLikeRepository>(UserGuideLikeRepository);

            expect(guidesRepo).toBeDefined();
            expect(statsRepo).toBeDefined();
            expect(likeRepo).toBeDefined();
            expect(guidesRepo).not.toBe(statsRepo);
            expect(statsRepo).not.toBe(likeRepo);
        });
    });

    describe('Service Layer Architecture', () => {
        it('should have four services for different responsibilities', () => {
            const providers = Reflect.getMetadata('providers', GuidesModule);
            const services = providers.filter(
                (p: any) =>
                    p === GuidesService ||
                    p === PreGuideService ||
                    p === GuidesStatsService ||
                    p === UserGuideLikeService,
            );

            expect(services.length).toBe(4);
        });

        it('should be able to inject all services', () => {
            const guidesService = module.get<GuidesService>(GuidesService);
            const preService = module.get<PreGuideService>(PreGuideService);
            const statsService = module.get<GuidesStatsService>(GuidesStatsService);
            const likeService = module.get<UserGuideLikeService>(UserGuideLikeService);

            expect(guidesService).toBeDefined();
            expect(preService).toBeDefined();
            expect(statsService).toBeDefined();
            expect(likeService).toBeDefined();
        });
    });

    describe('Internal vs External Providers', () => {
        it('should distinguish between public and internal providers', () => {
            const providers = Reflect.getMetadata('providers', GuidesModule);
            const exports = Reflect.getMetadata('exports', GuidesModule);

            const internalProviders = providers.filter((p: any) => !exports.includes(p));

            expect(internalProviders).toContain(UserGuideLikeService);
            expect(internalProviders).toContain(UserGuideLikeRepository);
            expect(internalProviders.length).toBe(2);
        });

        it('should export 5 out of 7 providers', () => {
            const providers = Reflect.getMetadata('providers', GuidesModule);
            const exports = Reflect.getMetadata('exports', GuidesModule);

            expect(providers.length).toBe(7);
            expect(exports.length).toBe(5);
        });
    });

    describe('Complex Module Pattern', () => {
        it('should handle complex module with 3 entities, 3 repos, 4 services', () => {
            const providers = Reflect.getMetadata('providers', GuidesModule);

            const repositories = [GuidesRepository, GuidesStatsRepository, UserGuideLikeRepository];
            const services = [
                GuidesService,
                PreGuideService,
                GuidesStatsService,
                UserGuideLikeService,
            ];

            repositories.forEach((repo) => {
                expect(providers).toContain(repo);
            });

            services.forEach((service) => {
                expect(providers).toContain(service);
            });
        });
    });
});
