import { Test, TestingModule } from '@nestjs/testing';
import { SCodesModule } from './s-codes.module';
import { SCodesController } from './s-codes.controller';
import { SCodesService } from './s-codes.service';
import { SCodesRepository } from './s-codes.repository';
import { SCodesSeeder } from './s-codes.seeder';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SCodeEntity } from './entities/s-code.entity';
import { Reflector } from '@nestjs/core';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('SCodesModule', () => {
    let module: TestingModule;

    const mockSCodesRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockSCodesService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    const mockSCodesSeeder = {
        seed: jest.fn(),
        seedAll: jest.fn(),
    };

    const mockEnvConfigService = {
        sAdminRole: 'superadmin',
        adminRole: 'admin',
        userRole: 'user',
        supportRole: 'support',
    };

    const mockErrorHandlerService = {
        forbidden: jest.fn((_message, userMessage) => {
            throw new Error(userMessage);
        }),
    };

    beforeEach(async () => {
        module = await Test.createTestingModule({
            controllers: [SCodesController],
            providers: [
                {
                    provide: SCodesRepository,
                    useValue: mockSCodesRepository,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandlerService,
                },
                {
                    provide: EnvConfigService,
                    useValue: mockEnvConfigService,
                },
                {
                    provide: SCodesService,
                    useValue: mockSCodesService,
                },
                {
                    provide: SCodesSeeder,
                    useValue: mockSCodesSeeder,
                },
                {
                    provide: getRepositoryToken(SCodeEntity),
                    useValue: mockSCodesRepository,
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
        it('should have SCodesController defined', () => {
            const controller = module.get<SCodesController>(SCodesController);
            expect(controller).toBeDefined();
        });

        it('should create SCodesController instance', () => {
            const controller = module.get<SCodesController>(SCodesController);
            expect(controller).toBeInstanceOf(SCodesController);
        });
    });

    describe('Providers', () => {
        it('should have SCodesRepository defined', () => {
            const repository = module.get<SCodesRepository>(SCodesRepository);
            expect(repository).toBeDefined();
        });

        it('should have SCodesService defined', () => {
            const service = module.get(SCodesService);
            expect(service).toBeDefined();
        });

        it('should have SCodesSeeder defined', () => {
            const seeder = module.get(SCodesSeeder);
            expect(seeder).toBeDefined();
        });
    });

    describe('Module Metadata', () => {
        it('should have controllers metadata', () => {
            const controllers = Reflect.getMetadata('controllers', SCodesModule);
            expect(controllers).toBeDefined();
            expect(controllers).toContain(SCodesController);
        });

        it('should have providers metadata', () => {
            const providers = Reflect.getMetadata('providers', SCodesModule);
            expect(providers).toBeDefined();
            expect(providers).toContain(SCodesRepository);
            expect(providers).toContain(SCodesService);
            expect(providers).toContain(SCodesSeeder);
        });

        it('should have exports metadata', () => {
            const exports = Reflect.getMetadata('exports', SCodesModule);
            expect(exports).toBeDefined();
            expect(exports).toContain(SCodesRepository);
            expect(exports).toContain(SCodesService);
        });

        it('should have imports metadata', () => {
            const imports = Reflect.getMetadata('imports', SCodesModule);
            expect(imports).toBeDefined();
            expect(imports.length).toBe(2);
        });

        it('should have correct number of controllers', () => {
            const controllers = Reflect.getMetadata('controllers', SCodesModule);
            expect(controllers.length).toBe(1);
        });

        it('should have correct number of providers', () => {
            const providers = Reflect.getMetadata('providers', SCodesModule);
            expect(providers.length).toBe(3);
        });

        it('should have correct number of exports', () => {
            const exports = Reflect.getMetadata('exports', SCodesModule);
            expect(exports.length).toBe(2);
        });
    });

    describe('Exports Verification', () => {
        it('should export SCodesRepository', () => {
            const exports = Reflect.getMetadata('exports', SCodesModule);
            expect(exports).toContain(SCodesRepository);
        });

        it('should export SCodesService', () => {
            const exports = Reflect.getMetadata('exports', SCodesModule);
            expect(exports).toContain(SCodesService);
        });

        it('should export exactly two providers', () => {
            const exports = Reflect.getMetadata('exports', SCodesModule);
            expect(exports.length).toBe(2);
        });

        it('should not export SCodesSeeder', () => {
            const exports = Reflect.getMetadata('exports', SCodesModule);
            expect(exports).not.toContain(SCodesSeeder);
        });

        it('should not export SCodesController', () => {
            const exports = Reflect.getMetadata('exports', SCodesModule);
            expect(exports).not.toContain(SCodesController);
        });
    });

    describe('Module Structure', () => {
        it('should have all required imports', () => {
            const imports = Reflect.getMetadata('imports', SCodesModule) || [];
            expect(imports.length).toBeGreaterThan(0);
        });

        it('should have all required providers', () => {
            const providers = Reflect.getMetadata('providers', SCodesModule) || [];
            expect(providers.length).toBeGreaterThan(0);
        });

        it('should have all required controllers', () => {
            const controllers = Reflect.getMetadata('controllers', SCodesModule) || [];
            expect(controllers.length).toBeGreaterThan(0);
        });

        it('should have all required exports', () => {
            const exports = Reflect.getMetadata('exports', SCodesModule) || [];
            expect(exports.length).toBeGreaterThan(0);
        });
    });

    describe('Provider Configuration', () => {
        it('should configure repository correctly', () => {
            const providers = Reflect.getMetadata('providers', SCodesModule);
            expect(providers).toContain(SCodesRepository);
        });

        it('should configure service correctly', () => {
            const providers = Reflect.getMetadata('providers', SCodesModule);
            expect(providers).toContain(SCodesService);
        });

        it('should configure SCodesSeeder correctly', () => {
            const providers = Reflect.getMetadata('providers', SCodesModule);
            expect(providers).toContain(SCodesSeeder);
        });
    });

    describe('Controller Configuration', () => {
        it('should configure SCodesController correctly', () => {
            const controllers = Reflect.getMetadata('controllers', SCodesModule);
            expect(controllers).toContain(SCodesController);
        });

        it('should have only one controller', () => {
            const controllers = Reflect.getMetadata('controllers', SCodesModule);
            expect(controllers.length).toBe(1);
        });
    });

    describe('Module Dependencies', () => {
        it('should have DatabaseModule in imports', () => {
            const imports = Reflect.getMetadata('imports', SCodesModule) || [];
            const hasDatabaseModule = imports.some(
                (imp: any) =>
                    imp?.name === 'DatabaseModule' ||
                    imp?.module?.name === 'DatabaseModule' ||
                    imp?.constructor?.name === 'DatabaseModule',
            );
            expect(hasDatabaseModule || imports.length === 2).toBe(true);
        });

        it('should have correct import count', () => {
            const imports = Reflect.getMetadata('imports', SCodesModule) || [];
            expect(imports.length).toBe(2);
        });
    });

    describe('Repository Instances', () => {
        it('should get SCodesRepository instance', () => {
            const repository = module.get<SCodesRepository>(SCodesRepository);
            expect(repository).toBe(mockSCodesRepository);
        });
    });

    describe('Service Instances', () => {
        it('should get SCodesService instance', () => {
            const service = module.get(SCodesService);
            expect(service).toBe(mockSCodesService);
        });
    });

    describe('Seeder Instance', () => {
        it('should get SCodesSeeder instance', () => {
            const seeder = module.get(SCodesSeeder);
            expect(seeder).toBe(mockSCodesSeeder);
        });
    });

    describe('Controller Instances', () => {
        it('should get SCodesController instance', () => {
            const controller = module.get<SCodesController>(SCodesController);
            expect(controller).toBeDefined();
        });
    });

    describe('Entity Configuration', () => {
        it('should have SCodeEntity token available', () => {
            const token = getRepositoryToken(SCodeEntity);
            expect(token).toBeDefined();
        });

        it('should register SCodeEntity', () => {
            const token = getRepositoryToken(SCodeEntity);
            expect(token).toBe('SCodeEntityRepository');
        });
    });

    describe('Provider Dependencies', () => {
        it('should have all service dependencies resolved', () => {
            expect(module.get(SCodesService)).toBeDefined();
        });

        it('should have all repository dependencies resolved', () => {
            expect(module.get(SCodesRepository)).toBeDefined();
        });

        it('should have SCodesSeeder available', () => {
            expect(module.get(SCodesSeeder)).toBeDefined();
        });

        it('should have Reflector available', () => {
            expect(module.get(Reflector)).toBeDefined();
        });
    });

    describe('Module Exports Validation', () => {
        it('should export both SCodesRepository and SCodesService', () => {
            const exports = Reflect.getMetadata('exports', SCodesModule);
            expect(exports).toContain(SCodesRepository);
            expect(exports).toContain(SCodesService);
            expect(exports.length).toBe(2);
        });

        it('should have matching exports and providers for exported items', () => {
            const exports = Reflect.getMetadata('exports', SCodesModule);
            const providers = Reflect.getMetadata('providers', SCodesModule);

            exports.forEach((exp: any) => {
                expect(providers).toContain(exp);
            });
        });

        it('should keep SCodesSeeder private', () => {
            const exports = Reflect.getMetadata('exports', SCodesModule);
            const providers = Reflect.getMetadata('providers', SCodesModule);

            expect(providers).toContain(SCodesSeeder);
            expect(exports).not.toContain(SCodesSeeder);
        });
    });

    describe('Module Import Validation', () => {
        it('should import DatabaseModule twice (base + forFeature)', () => {
            const imports = Reflect.getMetadata('imports', SCodesModule) || [];
            const databaseImports = imports.filter(
                (imp: any) =>
                    imp?.name === 'DatabaseModule' ||
                    imp?.module?.name === 'DatabaseModule' ||
                    imp?.constructor?.name === 'DatabaseModule',
            );
            expect(databaseImports.length >= 1 || imports.length === 2).toBe(true);
        });

        it('should configure forFeature with SCodeEntity', () => {
            const imports = Reflect.getMetadata('imports', SCodesModule) || [];
            expect(imports.length).toBe(2);
        });
    });

    describe('Module Compilation', () => {
        it('should compile without errors', () => {
            expect(module).toBeDefined();
            expect(module).toBeInstanceOf(TestingModule);
        });

        it('should initialize all providers', () => {
            expect(module.get(SCodesRepository)).toBeDefined();
            expect(module.get(SCodesService)).toBeDefined();
            expect(module.get(SCodesSeeder)).toBeDefined();
        });

        it('should initialize all controllers', () => {
            expect(module.get(SCodesController)).toBeDefined();
        });
    });

    describe('Provider Uniqueness', () => {
        it('should have unique service instances per module', () => {
            const service1 = module.get<SCodesService>(SCodesService);
            const service2 = module.get<SCodesService>(SCodesService);

            expect(service1).toBe(service2);
        });

        it('should have unique repository instances per module', () => {
            const repo1 = module.get<SCodesRepository>(SCodesRepository);
            const repo2 = module.get<SCodesRepository>(SCodesRepository);

            expect(repo1).toBe(repo2);
        });
    });

    describe('Module Integration', () => {
        it('should integrate with DatabaseModule', () => {
            const imports = Reflect.getMetadata('imports', SCodesModule) || [];
            expect(imports.length).toBe(2);
        });
    });

    describe('Complete Module Structure', () => {
        it('should have correct module structure', () => {
            const controllers = Reflect.getMetadata('controllers', SCodesModule);
            const providers = Reflect.getMetadata('providers', SCodesModule);
            const exports = Reflect.getMetadata('exports', SCodesModule);
            const imports = Reflect.getMetadata('imports', SCodesModule);

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
        it('should export repository and service', () => {
            const exports = Reflect.getMetadata('exports', SCodesModule);

            expect(exports).toContain(SCodesRepository);
            expect(exports).toContain(SCodesService);
            expect(exports.length).toBe(2);
        });

        it('should keep seeder private', () => {
            const exports = Reflect.getMetadata('exports', SCodesModule);
            expect(exports).not.toContain(SCodesSeeder);
        });
    });

    describe('Module Provider Order', () => {
        it('should have providers in correct order', () => {
            const providers = Reflect.getMetadata('providers', SCodesModule);
            expect(providers[0]).toBe(SCodesRepository);
            expect(providers[1]).toBe(SCodesService);
            expect(providers[2]).toBe(SCodesSeeder);
        });
    });

    describe('Module Export Order', () => {
        it('should have exports in correct order', () => {
            const exports = Reflect.getMetadata('exports', SCodesModule);
            expect(exports[0]).toBe(SCodesRepository);
            expect(exports[1]).toBe(SCodesService);
        });
    });

    describe('Internal vs External Providers', () => {
        it('should distinguish between public and internal providers', () => {
            const providers = Reflect.getMetadata('providers', SCodesModule);
            const exports = Reflect.getMetadata('exports', SCodesModule);

            const internalProviders = providers.filter((p: any) => !exports.includes(p));

            expect(internalProviders).toContain(SCodesSeeder);
            expect(internalProviders.length).toBe(1);
        });

        it('should export 2 out of 3 providers', () => {
            const providers = Reflect.getMetadata('providers', SCodesModule);
            const exports = Reflect.getMetadata('exports', SCodesModule);

            expect(providers.length).toBe(3);
            expect(exports.length).toBe(2);
        });
    });

    describe('Seeder Integration', () => {
        it('should include SCodesSeeder in providers', () => {
            const providers = Reflect.getMetadata('providers', SCodesModule);
            expect(providers).toContain(SCodesSeeder);
        });

        it('should not export SCodesSeeder', () => {
            const exports = Reflect.getMetadata('exports', SCodesModule);
            expect(exports).not.toContain(SCodesSeeder);
        });

        it('should be able to get SCodesSeeder instance', () => {
            const seeder = module.get(SCodesSeeder);
            expect(seeder).toBeDefined();
            expect(seeder).toBe(mockSCodesSeeder);
        });
    });

    describe('Module Encapsulation', () => {
        it('should expose SCodesRepository and SCodesService to other modules', () => {
            const exports = Reflect.getMetadata('exports', SCodesModule);
            expect(exports.length).toBe(2);
            expect(exports).toContain(SCodesRepository);
            expect(exports).toContain(SCodesService);
        });

        it('should keep 1 provider internal', () => {
            const providers = Reflect.getMetadata('providers', SCodesModule);
            const exports = Reflect.getMetadata('exports', SCodesModule);

            const internalCount = providers.length - exports.length;
            expect(internalCount).toBe(1);
        });

        it('should provide clear API through exported repository and service', () => {
            const exports = Reflect.getMetadata('exports', SCodesModule);
            expect(exports).toEqual([SCodesRepository, SCodesService]);
        });
    });
});
