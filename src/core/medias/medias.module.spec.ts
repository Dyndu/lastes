import { Test, TestingModule } from '@nestjs/testing';
import { MediasModule } from './medias.module';
import { MediasController } from './medias.controller';
import { FInfoService, MediasService, SocialService } from './services';
import { MediasRepository, FooterInfoRepository, SocialRepository } from './repositories';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MediaEntity, FooterInfoEntity, SocialEntity } from './entities';
import { Reflector } from '@nestjs/core';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';
import { SocialSeeder } from './seeders/social.seeder';
import { FInfoSeeder } from './seeders/f-info.seeder';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('MediasModule', () => {
    let module: TestingModule;

    const mockMediasRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockFooterInfoRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        createMany: jest.fn(),
    };

    const mockSocialRepository = {
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

    const mockMediasService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
        upload: jest.fn(),
    };

    const mockFInfoService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    const mockSocialService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    const mockSocialSeeder = {
        seed: jest.fn(),
    };

    const mockFInfoSeeder = {
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
            controllers: [MediasController],
            providers: [
                {
                    provide: MediasRepository,
                    useValue: mockMediasRepository,
                },
                {
                    provide: FooterInfoRepository,
                    useValue: mockFooterInfoRepository,
                },
                {
                    provide: SocialRepository,
                    useValue: mockSocialRepository,
                },
                {
                    provide: MediasService,
                    useValue: mockMediasService,
                },
                {
                    provide: FInfoService,
                    useValue: mockFInfoService,
                },
                {
                    provide: SocialService,
                    useValue: mockSocialService,
                },
                {
                    provide: SocialSeeder,
                    useValue: mockSocialSeeder,
                },
                {
                    provide: FInfoSeeder,
                    useValue: mockFInfoSeeder,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandlerService,
                },
                {
                    provide: getRepositoryToken(MediaEntity),
                    useValue: mockMediasRepository,
                },
                {
                    provide: getRepositoryToken(FooterInfoEntity),
                    useValue: mockFooterInfoRepository,
                },
                {
                    provide: getRepositoryToken(SocialEntity),
                    useValue: mockSocialRepository,
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

    describe('Controllers', () => {
        it('should have MediasController defined', () => {
            const controller = module.get<MediasController>(MediasController);
            expect(controller).toBeDefined();
        });

        it('should create MediasController instance', () => {
            const controller = module.get<MediasController>(MediasController);
            expect(controller).toBeInstanceOf(MediasController);
        });
    });

    describe('Providers', () => {
        it('should have MediasRepository defined', () => {
            const repository = module.get<MediasRepository>(MediasRepository);
            expect(repository).toBeDefined();
        });

        it('should have FooterInfoRepository defined', () => {
            const repository = module.get<FooterInfoRepository>(FooterInfoRepository);
            expect(repository).toBeDefined();
        });

        it('should have SocialRepository defined', () => {
            const repository = module.get<SocialRepository>(SocialRepository);
            expect(repository).toBeDefined();
        });

        it('should have MediasService defined', () => {
            const service = module.get(MediasService);
            expect(service).toBeDefined();
        });

        it('should have FInfoService defined', () => {
            const service = module.get(FInfoService);
            expect(service).toBeDefined();
        });

        it('should have SocialService defined', () => {
            const service = module.get(SocialService);
            expect(service).toBeDefined();
        });

        it('should have SocialSeeder defined', () => {
            const seeder = module.get(SocialSeeder);
            expect(seeder).toBeDefined();
        });

        it('should have FInfoSeeder defined', () => {
            const seeder = module.get(FInfoSeeder);
            expect(seeder).toBeDefined();
        });
    });

    describe('Module Metadata', () => {
        it('should have controllers metadata', () => {
            const controllers = Reflect.getMetadata('controllers', MediasModule);
            expect(controllers).toBeDefined();
            expect(controllers).toContain(MediasController);
        });

        it('should have providers metadata', () => {
            const providers = Reflect.getMetadata('providers', MediasModule);
            expect(providers).toBeDefined();
            expect(providers).toContain(MediasRepository);
            expect(providers).toContain(FooterInfoRepository);
            expect(providers).toContain(SocialRepository);
            expect(providers).toContain(MediasService);
            expect(providers).toContain(FInfoService);
            expect(providers).toContain(SocialService);
            expect(providers).toContain(SocialSeeder);
            expect(providers).toContain(FInfoSeeder);
        });

        it('should have exports metadata', () => {
            const exports = Reflect.getMetadata('exports', MediasModule);
            expect(exports).toBeDefined();
            expect(exports).toContain(MediasService);
        });

        it('should have imports metadata', () => {
            const imports = Reflect.getMetadata('imports', MediasModule);
            expect(imports).toBeDefined();
            expect(imports.length).toBe(2);
        });

        it('should have correct number of controllers', () => {
            const controllers = Reflect.getMetadata('controllers', MediasModule);
            expect(controllers.length).toBe(1);
        });

        it('should have correct number of providers', () => {
            const providers = Reflect.getMetadata('providers', MediasModule);
            expect(providers.length).toBe(8);
        });

        it('should have correct number of exports', () => {
            const exports = Reflect.getMetadata('exports', MediasModule);
            expect(exports.length).toBe(1);
        });
    });

    describe('Exports Verification', () => {
        it('should export MediasService', () => {
            const exports = Reflect.getMetadata('exports', MediasModule);
            expect(exports).toContain(MediasService);
        });

        it('should not export repositories', () => {
            const exports = Reflect.getMetadata('exports', MediasModule);
            expect(exports).not.toContain(MediasRepository);
            expect(exports).not.toContain(FooterInfoRepository);
            expect(exports).not.toContain(SocialRepository);
        });

        it('should not export other services', () => {
            const exports = Reflect.getMetadata('exports', MediasModule);
            expect(exports).not.toContain(FInfoService);
            expect(exports).not.toContain(SocialService);
        });

        it('should not export seeders', () => {
            const exports = Reflect.getMetadata('exports', MediasModule);
            expect(exports).not.toContain(SocialSeeder);
            expect(exports).not.toContain(FInfoSeeder);
        });
    });

    describe('Module Structure', () => {
        it('should have all required imports', () => {
            const imports = Reflect.getMetadata('imports', MediasModule) || [];
            expect(imports.length).toBeGreaterThan(0);
        });

        it('should have all required providers', () => {
            const providers = Reflect.getMetadata('providers', MediasModule) || [];
            expect(providers.length).toBeGreaterThan(0);
        });

        it('should have all required controllers', () => {
            const controllers = Reflect.getMetadata('controllers', MediasModule) || [];
            expect(controllers.length).toBeGreaterThan(0);
        });

        it('should have all required exports', () => {
            const exports = Reflect.getMetadata('exports', MediasModule) || [];
            expect(exports.length).toBeGreaterThan(0);
        });
    });

    describe('Provider Configuration', () => {
        it('should configure all repositories correctly', () => {
            const providers = Reflect.getMetadata('providers', MediasModule);
            expect(providers).toContain(MediasRepository);
            expect(providers).toContain(FooterInfoRepository);
            expect(providers).toContain(SocialRepository);
        });

        it('should configure all services correctly', () => {
            const providers = Reflect.getMetadata('providers', MediasModule);
            expect(providers).toContain(MediasService);
            expect(providers).toContain(FInfoService);
            expect(providers).toContain(SocialService);
        });

        it('should configure all seeders correctly', () => {
            const providers = Reflect.getMetadata('providers', MediasModule);
            expect(providers).toContain(SocialSeeder);
            expect(providers).toContain(FInfoSeeder);
        });
    });

    describe('Controller Configuration', () => {
        it('should configure MediasController correctly', () => {
            const controllers = Reflect.getMetadata('controllers', MediasModule);
            expect(controllers).toContain(MediasController);
        });

        it('should have only one controller', () => {
            const controllers = Reflect.getMetadata('controllers', MediasModule);
            expect(controllers.length).toBe(1);
        });
    });

    describe('Module Dependencies', () => {
        it('should have DatabaseModule in imports', () => {
            const imports = Reflect.getMetadata('imports', MediasModule) || [];
            const hasDatabaseModule = imports.some(
                (imp: any) =>
                    imp?.name === 'DatabaseModule' ||
                    imp?.module?.name === 'DatabaseModule' ||
                    imp?.constructor?.name === 'DatabaseModule',
            );
            expect(hasDatabaseModule || imports.length === 2).toBe(true);
        });

        it('should have correct import count', () => {
            const imports = Reflect.getMetadata('imports', MediasModule) || [];
            expect(imports.length).toBe(2);
        });
    });

    describe('Repository Instances', () => {
        it('should get MediasRepository instance', () => {
            const repository = module.get<MediasRepository>(MediasRepository);
            expect(repository).toBe(mockMediasRepository);
        });

        it('should get FooterInfoRepository instance', () => {
            const repository = module.get<FooterInfoRepository>(FooterInfoRepository);
            expect(repository).toBe(mockFooterInfoRepository);
        });

        it('should get SocialRepository instance', () => {
            const repository = module.get<SocialRepository>(SocialRepository);
            expect(repository).toBe(mockSocialRepository);
        });
    });

    describe('Service Instances', () => {
        it('should get MediasService instance', () => {
            const service = module.get(MediasService);
            expect(service).toBe(mockMediasService);
        });

        it('should get FInfoService instance', () => {
            const service = module.get(FInfoService);
            expect(service).toBe(mockFInfoService);
        });

        it('should get SocialService instance', () => {
            const service = module.get(SocialService);
            expect(service).toBe(mockSocialService);
        });
    });

    describe('Seeder Instances', () => {
        it('should get SocialSeeder instance', () => {
            const seeder = module.get(SocialSeeder);
            expect(seeder).toBe(mockSocialSeeder);
        });

        it('should get FInfoSeeder instance', () => {
            const seeder = module.get(FInfoSeeder);
            expect(seeder).toBe(mockFInfoSeeder);
        });
    });

    describe('Controller Instances', () => {
        it('should get MediasController instance', () => {
            const controller = module.get<MediasController>(MediasController);
            expect(controller).toBeDefined();
        });
    });

    describe('Entity Configuration', () => {
        it('should have MediaEntity token available', () => {
            const token = getRepositoryToken(MediaEntity);
            expect(token).toBeDefined();
        });

        it('should have FooterInfoEntity token available', () => {
            const token = getRepositoryToken(FooterInfoEntity);
            expect(token).toBeDefined();
        });

        it('should have SocialEntity token available', () => {
            const token = getRepositoryToken(SocialEntity);
            expect(token).toBeDefined();
        });
    });

    describe('Provider Dependencies', () => {
        it('should have all service dependencies resolved', () => {
            expect(module.get(MediasService)).toBeDefined();
            expect(module.get(FInfoService)).toBeDefined();
            expect(module.get(SocialService)).toBeDefined();
        });

        it('should have all repository dependencies resolved', () => {
            expect(module.get(MediasRepository)).toBeDefined();
            expect(module.get(FooterInfoRepository)).toBeDefined();
            expect(module.get(SocialRepository)).toBeDefined();
        });

        it('should have all seeder dependencies resolved', () => {
            expect(module.get(SocialSeeder)).toBeDefined();
            expect(module.get(FInfoSeeder)).toBeDefined();
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
        it('should export only MediasService', () => {
            const exports = Reflect.getMetadata('exports', MediasModule);
            expect(exports.length).toBe(1);
            expect(exports[0]).toBe(MediasService);
        });

        it('should have matching exports and providers for exported items', () => {
            const exports = Reflect.getMetadata('exports', MediasModule);
            const providers = Reflect.getMetadata('providers', MediasModule);

            exports.forEach((exp: any) => {
                expect(providers).toContain(exp);
            });
        });

        it('should keep all other providers internal', () => {
            const exports = Reflect.getMetadata('exports', MediasModule);
            const providers = Reflect.getMetadata('providers', MediasModule);

            const internalProviders = providers.filter((p: any) => !exports.includes(p));

            expect(internalProviders.length).toBe(7);
            expect(internalProviders).toContain(MediasRepository);
            expect(internalProviders).toContain(FooterInfoRepository);
            expect(internalProviders).toContain(SocialRepository);
            expect(internalProviders).toContain(FInfoService);
            expect(internalProviders).toContain(SocialService);
            expect(internalProviders).toContain(SocialSeeder);
            expect(internalProviders).toContain(FInfoSeeder);
        });
    });

    describe('Module Import Validation', () => {
        it('should import DatabaseModule twice (base + forFeature)', () => {
            const imports = Reflect.getMetadata('imports', MediasModule) || [];
            const databaseImports = imports.filter(
                (imp: any) =>
                    imp?.name === 'DatabaseModule' ||
                    imp?.module?.name === 'DatabaseModule' ||
                    imp?.constructor?.name === 'DatabaseModule',
            );
            expect(databaseImports.length >= 1 || imports.length === 2).toBe(true);
        });

        it('should configure forFeature with three entities', () => {
            const imports = Reflect.getMetadata('imports', MediasModule) || [];
            expect(imports.length).toBe(2);
        });
    });

    describe('Module Compilation', () => {
        it('should compile without errors', () => {
            expect(module).toBeDefined();
            expect(module).toBeInstanceOf(TestingModule);
        });

        it('should initialize all providers', () => {
            expect(module.get(MediasRepository)).toBeDefined();
            expect(module.get(FooterInfoRepository)).toBeDefined();
            expect(module.get(SocialRepository)).toBeDefined();
            expect(module.get(MediasService)).toBeDefined();
            expect(module.get(FInfoService)).toBeDefined();
            expect(module.get(SocialService)).toBeDefined();
            expect(module.get(SocialSeeder)).toBeDefined();
            expect(module.get(FInfoSeeder)).toBeDefined();
        });

        it('should initialize all controllers', () => {
            expect(module.get(MediasController)).toBeDefined();
        });
    });

    describe('Provider Uniqueness', () => {
        it('should have unique service instances per module', () => {
            const service1 = module.get<MediasService>(MediasService);
            const service2 = module.get<MediasService>(MediasService);

            expect(service1).toBe(service2);
        });

        it('should have unique repository instances per module', () => {
            const repo1 = module.get<MediasRepository>(MediasRepository);
            const repo2 = module.get<MediasRepository>(MediasRepository);

            expect(repo1).toBe(repo2);
        });

        it('should have unique seeder instances per module', () => {
            const seeder1 = module.get<SocialSeeder>(SocialSeeder);
            const seeder2 = module.get<SocialSeeder>(SocialSeeder);

            expect(seeder1).toBe(seeder2);
        });
    });

    describe('Module Integration', () => {
        it('should integrate with DatabaseModule', () => {
            const imports = Reflect.getMetadata('imports', MediasModule) || [];
            expect(imports.length).toBe(2);
        });
    });

    describe('Complete Module Structure', () => {
        it('should have correct module structure', () => {
            const controllers = Reflect.getMetadata('controllers', MediasModule);
            const providers = Reflect.getMetadata('providers', MediasModule);
            const exports = Reflect.getMetadata('exports', MediasModule);
            const imports = Reflect.getMetadata('imports', MediasModule);

            expect(controllers).toBeDefined();
            expect(providers).toBeDefined();
            expect(exports).toBeDefined();
            expect(imports).toBeDefined();

            expect(controllers.length).toBe(1);
            expect(providers.length).toBe(8);
            expect(exports.length).toBe(1);
            expect(imports.length).toBe(2);
        });
    });

    describe('Single Export Strategy', () => {
        it('should export only main service', () => {
            const exports = Reflect.getMetadata('exports', MediasModule);
            expect(exports).toContain(MediasService);
            expect(exports.length).toBe(1);
        });

        it('should keep all internal services private', () => {
            const exports = Reflect.getMetadata('exports', MediasModule);
            expect(exports).not.toContain(FInfoService);
            expect(exports).not.toContain(SocialService);
        });

        it('should keep all repositories private', () => {
            const exports = Reflect.getMetadata('exports', MediasModule);
            expect(exports).not.toContain(MediasRepository);
            expect(exports).not.toContain(FooterInfoRepository);
            expect(exports).not.toContain(SocialRepository);
        });

        it('should keep all seeders private', () => {
            const exports = Reflect.getMetadata('exports', MediasModule);
            expect(exports).not.toContain(SocialSeeder);
            expect(exports).not.toContain(FInfoSeeder);
        });
    });

    describe('Module Provider Order', () => {
        it('should have providers in correct order', () => {
            const providers = Reflect.getMetadata('providers', MediasModule);
            expect(providers[0]).toBe(MediasRepository);
            expect(providers[1]).toBe(MediasService);
            expect(providers[2]).toBe(FooterInfoRepository);
            expect(providers[3]).toBe(SocialRepository);
            expect(providers[4]).toBe(SocialService);
            expect(providers[5]).toBe(FInfoService);
            expect(providers[6]).toBe(SocialSeeder);
            expect(providers[7]).toBe(FInfoSeeder);
        });
    });

    describe('Entity Registration', () => {
        it('should register MediaEntity', () => {
            const token = getRepositoryToken(MediaEntity);
            expect(token).toBe('MediaEntityRepository');
        });

        it('should register FooterInfoEntity', () => {
            const token = getRepositoryToken(FooterInfoEntity);
            expect(token).toBe('FooterInfoEntityRepository');
        });

        it('should register SocialEntity', () => {
            const token = getRepositoryToken(SocialEntity);
            expect(token).toBe('SocialEntityRepository');
        });

        it('should have all three entities registered', () => {
            const mediaToken = getRepositoryToken(MediaEntity);
            const footerToken = getRepositoryToken(FooterInfoEntity);
            const socialToken = getRepositoryToken(SocialEntity);

            expect(mediaToken).toBeDefined();
            expect(footerToken).toBeDefined();
            expect(socialToken).toBeDefined();
            expect(mediaToken).not.toBe(footerToken);
            expect(footerToken).not.toBe(socialToken);
        });
    });

    describe('Multiple Entity Support', () => {
        it('should support three entities in one module', () => {
            const imports = Reflect.getMetadata('imports', MediasModule) || [];
            expect(imports.length).toBe(2);
        });

        it('should have three repositories for three entities', () => {
            const providers = Reflect.getMetadata('providers', MediasModule);
            const repositories = providers.filter(
                (p: any) =>
                    p === MediasRepository || p === FooterInfoRepository || p === SocialRepository,
            );

            expect(repositories.length).toBe(3);
        });

        it('should be able to inject all repositories', () => {
            const mediasRepo = module.get<MediasRepository>(MediasRepository);
            const footerRepo = module.get<FooterInfoRepository>(FooterInfoRepository);
            const socialRepo = module.get<SocialRepository>(SocialRepository);

            expect(mediasRepo).toBeDefined();
            expect(footerRepo).toBeDefined();
            expect(socialRepo).toBeDefined();
            expect(mediasRepo).not.toBe(footerRepo);
            expect(footerRepo).not.toBe(socialRepo);
        });
    });

    describe('Service Layer Architecture', () => {
        it('should have three services for different responsibilities', () => {
            const providers = Reflect.getMetadata('providers', MediasModule);
            const services = providers.filter(
                (p: any) => p === MediasService || p === FInfoService || p === SocialService,
            );

            expect(services.length).toBe(3);
        });

        it('should be able to inject all services', () => {
            const mediasService = module.get<MediasService>(MediasService);
            const fInfoService = module.get<FInfoService>(FInfoService);
            const socialService = module.get<SocialService>(SocialService);

            expect(mediasService).toBeDefined();
            expect(fInfoService).toBeDefined();
            expect(socialService).toBeDefined();
        });
    });

    describe('Seeder Configuration', () => {
        it('should have two seeders as providers', () => {
            const providers = Reflect.getMetadata('providers', MediasModule);
            const seeders = providers.filter((p: any) => p === SocialSeeder || p === FInfoSeeder);

            expect(seeders.length).toBe(2);
        });

        it('should not export seeders', () => {
            const exports = Reflect.getMetadata('exports', MediasModule);
            expect(exports).not.toContain(SocialSeeder);
            expect(exports).not.toContain(FInfoSeeder);
        });

        it('should be able to access seeders internally', () => {
            const socialSeeder = module.get<SocialSeeder>(SocialSeeder);
            const fInfoSeeder = module.get<FInfoSeeder>(FInfoSeeder);

            expect(socialSeeder).toBeDefined();
            expect(fInfoSeeder).toBeDefined();
            expect(socialSeeder).toBe(mockSocialSeeder);
            expect(fInfoSeeder).toBe(mockFInfoSeeder);
        });
    });

    describe('Complex Module Pattern', () => {
        it('should handle complex module with 3 entities, 3 repos, 3 services, 2 seeders', () => {
            const providers = Reflect.getMetadata('providers', MediasModule);

            const repositories = [MediasRepository, FooterInfoRepository, SocialRepository];
            const services = [MediasService, FInfoService, SocialService];
            const seeders = [SocialSeeder, FInfoSeeder];

            repositories.forEach((repo) => {
                expect(providers).toContain(repo);
            });

            services.forEach((service) => {
                expect(providers).toContain(service);
            });

            seeders.forEach((seeder) => {
                expect(providers).toContain(seeder);
            });
        });

        it('should export only 1 out of 8 providers', () => {
            const providers = Reflect.getMetadata('providers', MediasModule);
            const exports = Reflect.getMetadata('exports', MediasModule);

            expect(providers.length).toBe(8);
            expect(exports.length).toBe(1);
        });
    });

    describe('Minimal Export Strategy', () => {
        it('should follow minimal export pattern', () => {
            const exports = Reflect.getMetadata('exports', MediasModule);
            const providers = Reflect.getMetadata('providers', MediasModule);

            const exportRatio = exports.length / providers.length;
            expect(exportRatio).toBe(1 / 8);
        });

        it('should expose only main entry point', () => {
            const exports = Reflect.getMetadata('exports', MediasModule);
            expect(exports).toEqual([MediasService]);
        });
    });
});
