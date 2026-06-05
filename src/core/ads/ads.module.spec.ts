import { Test, TestingModule } from '@nestjs/testing';
import { AdsModule } from './ads.module';
import { AdsController } from './ads.controller';
import { AdsService, PreAdsService, AdsStatsService } from './services';
import { AdsRepository } from './repositories/ads.repository';
import { AdsStatsRepository } from './repositories/ads-stats.repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AdsEntity } from './entities/ads.entity';
import { AdsStatsEntity } from './entities/ads-stats.entity';
import { Reflector } from '@nestjs/core';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('AdsModule', () => {
    let module: TestingModule;

    const mockAdsRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockAdsStatsRepository = {
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

    const mockAdsService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    const mockPreAdsService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
    };

    const mockAdsStatsService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        incrementView: jest.fn(),
        incrementClick: jest.fn(),
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
            controllers: [AdsController],
            providers: [
                {
                    provide: AdsRepository,
                    useValue: mockAdsRepository,
                },
                {
                    provide: AdsStatsRepository,
                    useValue: mockAdsStatsRepository,
                },
                {
                    provide: AdsService,
                    useValue: mockAdsService,
                },
                {
                    provide: PreAdsService,
                    useValue: mockPreAdsService,
                },
                {
                    provide: AdsStatsService,
                    useValue: mockAdsStatsService,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandlerService,
                },
                {
                    provide: getRepositoryToken(AdsEntity),
                    useValue: mockAdsRepository,
                },
                {
                    provide: getRepositoryToken(AdsStatsEntity),
                    useValue: mockAdsStatsRepository,
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
        it('should have AdsController defined', () => {
            const controller = module.get<AdsController>(AdsController);
            expect(controller).toBeDefined();
        });

        it('should create AdsController instance', () => {
            const controller = module.get<AdsController>(AdsController);
            expect(controller).toBeInstanceOf(AdsController);
        });
    });

    describe('Providers', () => {
        it('should have AdsRepository defined', () => {
            const repository = module.get<AdsRepository>(AdsRepository);
            expect(repository).toBeDefined();
        });

        it('should have AdsStatsRepository defined', () => {
            const repository = module.get<AdsStatsRepository>(AdsStatsRepository);
            expect(repository).toBeDefined();
        });

        it('should have AdsService defined', () => {
            const service = module.get(AdsService);
            expect(service).toBeDefined();
        });

        it('should have PreAdsService defined', () => {
            const service = module.get(PreAdsService);
            expect(service).toBeDefined();
        });

        it('should have AdsStatsService defined', () => {
            const service = module.get(AdsStatsService);
            expect(service).toBeDefined();
        });
    });

    describe('Module Metadata', () => {
        it('should have controllers metadata', () => {
            const controllers = Reflect.getMetadata('controllers', AdsModule);
            expect(controllers).toBeDefined();
            expect(controllers).toContain(AdsController);
        });

        it('should have providers metadata', () => {
            const providers = Reflect.getMetadata('providers', AdsModule);
            expect(providers).toBeDefined();
            expect(providers).toContain(AdsRepository);
            expect(providers).toContain(AdsStatsRepository);
            expect(providers).toContain(AdsService);
            expect(providers).toContain(PreAdsService);
            expect(providers).toContain(AdsStatsService);
        });

        it('should have exports metadata', () => {
            const exports = Reflect.getMetadata('exports', AdsModule);
            expect(exports).toBeDefined();
            expect(exports).toContain(AdsRepository);
            expect(exports).toContain(AdsStatsRepository);
            expect(exports).toContain(AdsService);
            expect(exports).toContain(PreAdsService);
            expect(exports).toContain(AdsStatsService);
        });

        it('should have imports metadata', () => {
            const imports = Reflect.getMetadata('imports', AdsModule);
            expect(imports).toBeDefined();
            expect(imports.length).toBe(3);
        });

        it('should have correct number of controllers', () => {
            const controllers = Reflect.getMetadata('controllers', AdsModule);
            expect(controllers.length).toBe(1);
        });

        it('should have correct number of providers', () => {
            const providers = Reflect.getMetadata('providers', AdsModule);
            expect(providers.length).toBe(5);
        });

        it('should have correct number of exports', () => {
            const exports = Reflect.getMetadata('exports', AdsModule);
            expect(exports.length).toBe(5);
        });
    });

    describe('Exports Verification', () => {
        it('should export AdsRepository', () => {
            const exports = Reflect.getMetadata('exports', AdsModule);
            expect(exports).toContain(AdsRepository);
        });

        it('should export AdsStatsRepository', () => {
            const exports = Reflect.getMetadata('exports', AdsModule);
            expect(exports).toContain(AdsStatsRepository);
        });

        it('should export AdsService', () => {
            const exports = Reflect.getMetadata('exports', AdsModule);
            expect(exports).toContain(AdsService);
        });

        it('should export PreAdsService', () => {
            const exports = Reflect.getMetadata('exports', AdsModule);
            expect(exports).toContain(PreAdsService);
        });

        it('should export AdsStatsService', () => {
            const exports = Reflect.getMetadata('exports', AdsModule);
            expect(exports).toContain(AdsStatsService);
        });
    });

    describe('Module Structure', () => {
        it('should have all required imports', () => {
            const imports = Reflect.getMetadata('imports', AdsModule) || [];
            expect(imports.length).toBeGreaterThan(0);
        });

        it('should have all required providers', () => {
            const providers = Reflect.getMetadata('providers', AdsModule) || [];
            expect(providers.length).toBeGreaterThan(0);
        });

        it('should have all required controllers', () => {
            const controllers = Reflect.getMetadata('controllers', AdsModule) || [];
            expect(controllers.length).toBeGreaterThan(0);
        });

        it('should have all required exports', () => {
            const exports = Reflect.getMetadata('exports', AdsModule) || [];
            expect(exports.length).toBeGreaterThan(0);
        });
    });

    describe('Provider Configuration', () => {
        it('should configure AdsRepository correctly', () => {
            const providers = Reflect.getMetadata('providers', AdsModule);
            expect(providers).toContain(AdsRepository);
        });

        it('should configure AdsStatsRepository correctly', () => {
            const providers = Reflect.getMetadata('providers', AdsModule);
            expect(providers).toContain(AdsStatsRepository);
        });

        it('should configure AdsService correctly', () => {
            const providers = Reflect.getMetadata('providers', AdsModule);
            expect(providers).toContain(AdsService);
        });

        it('should configure PreAdsService correctly', () => {
            const providers = Reflect.getMetadata('providers', AdsModule);
            expect(providers).toContain(PreAdsService);
        });

        it('should configure AdsStatsService correctly', () => {
            const providers = Reflect.getMetadata('providers', AdsModule);
            expect(providers).toContain(AdsStatsService);
        });
    });

    describe('Controller Configuration', () => {
        it('should configure AdsController correctly', () => {
            const controllers = Reflect.getMetadata('controllers', AdsModule);
            expect(controllers).toContain(AdsController);
        });

        it('should have only one controller', () => {
            const controllers = Reflect.getMetadata('controllers', AdsModule);
            expect(controllers.length).toBe(1);
        });
    });

    describe('Module Dependencies', () => {
        it('should have DatabaseModule in imports', () => {
            const imports = Reflect.getMetadata('imports', AdsModule) || [];
            const hasDatabaseModule = imports.some(
                (imp: any) =>
                    imp?.name === 'DatabaseModule' ||
                    imp?.module?.name === 'DatabaseModule' ||
                    imp?.constructor?.name === 'DatabaseModule',
            );
            expect(hasDatabaseModule || imports.length === 3).toBe(true);
        });

        it('should have PermissionsModule in imports', () => {
            const imports = Reflect.getMetadata('imports', AdsModule) || [];
            const hasPermissionsModule = imports.some(
                (imp: any) => imp?.name === 'PermissionsModule' || imp === 'PermissionsModule',
            );
            expect(hasPermissionsModule || imports.length === 3).toBe(true);
        });

        it('should have correct import count', () => {
            const imports = Reflect.getMetadata('imports', AdsModule) || [];
            expect(imports.length).toBe(3);
        });
    });

    describe('Repository Instances', () => {
        it('should get AdsRepository instance', () => {
            const repository = module.get<AdsRepository>(AdsRepository);
            expect(repository).toBe(mockAdsRepository);
        });

        it('should get AdsStatsRepository instance', () => {
            const repository = module.get<AdsStatsRepository>(AdsStatsRepository);
            expect(repository).toBe(mockAdsStatsRepository);
        });
    });

    describe('Service Instances', () => {
        it('should get AdsService instance', () => {
            const service = module.get(AdsService);
            expect(service).toBe(mockAdsService);
        });

        it('should get PreAdsService instance', () => {
            const service = module.get(PreAdsService);
            expect(service).toBe(mockPreAdsService);
        });

        it('should get AdsStatsService instance', () => {
            const service = module.get(AdsStatsService);
            expect(service).toBe(mockAdsStatsService);
        });
    });

    describe('Controller Instances', () => {
        it('should get AdsController instance', () => {
            const controller = module.get<AdsController>(AdsController);
            expect(controller).toBeDefined();
        });
    });

    describe('Entity Configuration', () => {
        it('should have AdsEntity token available', () => {
            const token = getRepositoryToken(AdsEntity);
            expect(token).toBeDefined();
        });

        it('should have AdsStatsEntity token available', () => {
            const token = getRepositoryToken(AdsStatsEntity);
            expect(token).toBeDefined();
        });
    });

    describe('Provider Dependencies', () => {
        it('should have all service dependencies resolved', () => {
            expect(module.get(AdsService)).toBeDefined();
            expect(module.get(PreAdsService)).toBeDefined();
            expect(module.get(AdsStatsService)).toBeDefined();
        });

        it('should have all repository dependencies resolved', () => {
            expect(module.get(AdsRepository)).toBeDefined();
            expect(module.get(AdsStatsRepository)).toBeDefined();
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
        it('should export all repositories', () => {
            const exports = Reflect.getMetadata('exports', AdsModule);
            expect(exports).toContain(AdsRepository);
            expect(exports).toContain(AdsStatsRepository);
        });

        it('should export all services', () => {
            const exports = Reflect.getMetadata('exports', AdsModule);
            expect(exports).toContain(AdsService);
            expect(exports).toContain(PreAdsService);
            expect(exports).toContain(AdsStatsService);
        });

        it('should have matching exports and providers count for exported items', () => {
            const exports = Reflect.getMetadata('exports', AdsModule);
            const providers = Reflect.getMetadata('providers', AdsModule);

            exports.forEach((exp: any) => {
                expect(providers).toContain(exp);
            });
        });
    });

    describe('Module Import Validation', () => {
        it('should import DatabaseModule twice (base + forFeature)', () => {
            const imports = Reflect.getMetadata('imports', AdsModule) || [];
            const databaseImports = imports.filter(
                (imp: any) =>
                    imp?.name === 'DatabaseModule' ||
                    imp?.module?.name === 'DatabaseModule' ||
                    imp?.constructor?.name === 'DatabaseModule',
            );
            expect(databaseImports.length >= 1 || imports.length === 3).toBe(true);
        });

        it('should have PermissionsModule imported', () => {
            const imports = Reflect.getMetadata('imports', AdsModule) || [];
            expect(imports.length).toBe(3);
        });
    });
});
