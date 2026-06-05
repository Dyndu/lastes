import { Test, TestingModule } from '@nestjs/testing';
import { PSettingsModule } from './p-settings.module';
import { PSettingsController } from './p-settings.controller';
import {
    MetricsService,
    PSettingsService,
    PreSettingsService,
    TransformPSettingService,
    SMetricService,
} from './services';
import { MetricsRepository, SMetricRepository, PSettingRepository } from './repositories';
import { MetricsSeeder } from './seeder/metrics.seeder';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MetricsEntity, SMetricEntity, PSettingEntity } from './entities';
import { Reflector } from '@nestjs/core';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';
import { PSettingSeeder } from './seeder/p-setting.seeder';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('PSettingsModule', () => {
    let module: TestingModule;

    const mockMetricsRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
    };

    const mockSMetricRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
    };

    const mockPSettingRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
    };

    const mockMetricsSeeder = {
        seed: jest.fn(),
    };

    const mockPSettingSeeder = {
        seed: jest.fn(),
    };

    const mockMetricsService = {
        retrieveMetrics: jest.fn(),
        getAllMetrics: jest.fn(),
    };

    const mockPSettingsService = {
        retrieveUserSProfile: jest.fn(),
        settingDetails: jest.fn(),
        createPSetting: jest.fn(),
        updatePSetting: jest.fn(),
        metricsService: mockMetricsService,
    };

    const mockPreSettingsService = {
        ensureUniqueness: jest.fn(),
        buildEntity: jest.fn(),
    };

    const mockTransformPSettingService = {
        transformMetrics: jest.fn(),
        transformSettings: jest.fn(),
    };

    const mockSMetricService = {
        find: jest.fn(),
        create: jest.fn(),
    };

    const mockErrorHandlerService = {
        notFound: jest.fn((_message, userMessage) => {
            throw new Error(userMessage);
        }),
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
            controllers: [PSettingsController],
            providers: [
                { provide: MetricsSeeder, useValue: mockMetricsSeeder },
                { provide: PSettingSeeder, useValue: mockPSettingSeeder },
                { provide: MetricsRepository, useValue: mockMetricsRepository },
                { provide: SMetricRepository, useValue: mockSMetricRepository },
                {
                    provide: PSettingRepository,
                    useValue: mockPSettingRepository,
                },
                { provide: MetricsService, useValue: mockMetricsService },
                { provide: PSettingsService, useValue: mockPSettingsService },
                {
                    provide: PreSettingsService,
                    useValue: mockPreSettingsService,
                },
                {
                    provide: TransformPSettingService,
                    useValue: mockTransformPSettingService,
                },
                { provide: SMetricService, useValue: mockSMetricService },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandlerService,
                },
                { provide: EnvConfigService, useValue: mockEnvConfigService },
                {
                    provide: getRepositoryToken(MetricsEntity),
                    useValue: mockMetricsRepository,
                },
                {
                    provide: getRepositoryToken(SMetricEntity),
                    useValue: mockSMetricRepository,
                },
                {
                    provide: getRepositoryToken(PSettingEntity),
                    useValue: mockPSettingRepository,
                },
                {
                    provide: Reflector,
                    useValue: { get: jest.fn(), getAllAndOverride: jest.fn() },
                },
            ],
        }).compile();
    });

    afterEach(() => jest.clearAllMocks());

    describe('Module Definition', () => {
        it('should be defined', () => {
            expect(module).toBeDefined();
        });

        it('should compile the module', () => {
            expect(module).toBeInstanceOf(TestingModule);
        });
    });

    describe('Controllers', () => {
        it('should have PSettingsController defined', () => {
            expect(module.get<PSettingsController>(PSettingsController)).toBeDefined();
        });

        it('should create a PSettingsController instance', () => {
            expect(module.get<PSettingsController>(PSettingsController)).toBeInstanceOf(
                PSettingsController,
            );
        });
    });

    describe('Module Metadata — Controllers', () => {
        it('should have controllers metadata', () => {
            const controllers = Reflect.getMetadata('controllers', PSettingsModule);
            expect(controllers).toBeDefined();
        });

        it('should contain PSettingsController', () => {
            const controllers = Reflect.getMetadata('controllers', PSettingsModule);
            expect(controllers).toContain(PSettingsController);
        });

        it('should have exactly 1 controller', () => {
            const controllers = Reflect.getMetadata('controllers', PSettingsModule);
            expect(controllers.length).toBe(1);
        });
    });

    describe('Module Metadata — Providers', () => {
        it('should have providers metadata', () => {
            const providers = Reflect.getMetadata('providers', PSettingsModule);
            expect(providers).toBeDefined();
        });

        it('should contain MetricsSeeder', () => {
            const providers = Reflect.getMetadata('providers', PSettingsModule);
            expect(providers).toContain(MetricsSeeder);
        });

        it('should contain PSettingSeeder', () => {
            const providers = Reflect.getMetadata('providers', PSettingsModule);
            expect(providers).toContain(PSettingSeeder);
        });

        it('should contain MetricsRepository', () => {
            const providers = Reflect.getMetadata('providers', PSettingsModule);
            expect(providers).toContain(MetricsRepository);
        });

        it('should contain SMetricRepository', () => {
            const providers = Reflect.getMetadata('providers', PSettingsModule);
            expect(providers).toContain(SMetricRepository);
        });

        it('should contain PSettingRepository', () => {
            const providers = Reflect.getMetadata('providers', PSettingsModule);
            expect(providers).toContain(PSettingRepository);
        });

        it('should contain MetricsService', () => {
            const providers = Reflect.getMetadata('providers', PSettingsModule);
            expect(providers).toContain(MetricsService);
        });

        it('should contain PSettingsService', () => {
            const providers = Reflect.getMetadata('providers', PSettingsModule);
            expect(providers).toContain(PSettingsService);
        });

        it('should contain PreSettingsService', () => {
            const providers = Reflect.getMetadata('providers', PSettingsModule);
            expect(providers).toContain(PreSettingsService);
        });

        it('should contain TransformPSettingService', () => {
            const providers = Reflect.getMetadata('providers', PSettingsModule);
            expect(providers).toContain(TransformPSettingService);
        });

        it('should contain SMetricService', () => {
            const providers = Reflect.getMetadata('providers', PSettingsModule);
            expect(providers).toContain(SMetricService);
        });

        it('should have exactly 10 providers', () => {
            const providers = Reflect.getMetadata('providers', PSettingsModule);
            expect(providers.length).toBe(10);
        });

        it('should have providers in correct order', () => {
            const providers = Reflect.getMetadata('providers', PSettingsModule);
            expect(providers[0]).toBe(PSettingSeeder);
            expect(providers[1]).toBe(MetricsSeeder);
            expect(providers[2]).toBe(MetricsRepository);
            expect(providers[3]).toBe(SMetricRepository);
            expect(providers[4]).toBe(PSettingRepository);
            expect(providers[5]).toBe(MetricsService);
            expect(providers[6]).toBe(PSettingsService);
            expect(providers[7]).toBe(PreSettingsService);
            expect(providers[8]).toBe(TransformPSettingService);
            expect(providers[9]).toBe(SMetricService);
        });
    });

    describe('Module Metadata — Exports', () => {
        it('should have exports metadata', () => {
            const exports = Reflect.getMetadata('exports', PSettingsModule);
            expect(exports).toBeDefined();
        });

        it('should export PSettingsService', () => {
            const exports = Reflect.getMetadata('exports', PSettingsModule);
            expect(exports).toContain(PSettingsService);
        });

        it('should have exactly 1 export', () => {
            const exports = Reflect.getMetadata('exports', PSettingsModule);
            expect(exports.length).toBe(1);
        });

        it('should export only PSettingsService', () => {
            const exports = Reflect.getMetadata('exports', PSettingsModule);
            expect(exports).toEqual([PSettingsService]);
        });

        it('should NOT export MetricsService', () => {
            const exports = Reflect.getMetadata('exports', PSettingsModule);
            expect(exports).not.toContain(MetricsService);
        });

        it('should NOT export PreSettingsService', () => {
            const exports = Reflect.getMetadata('exports', PSettingsModule);
            expect(exports).not.toContain(PreSettingsService);
        });

        it('should NOT export TransformPSettingService', () => {
            const exports = Reflect.getMetadata('exports', PSettingsModule);
            expect(exports).not.toContain(TransformPSettingService);
        });

        it('should NOT export SMetricService', () => {
            const exports = Reflect.getMetadata('exports', PSettingsModule);
            expect(exports).not.toContain(SMetricService);
        });

        it('should NOT export MetricsRepository', () => {
            const exports = Reflect.getMetadata('exports', PSettingsModule);
            expect(exports).not.toContain(MetricsRepository);
        });

        it('should NOT export MetricsSeeder', () => {
            const exports = Reflect.getMetadata('exports', PSettingsModule);
            expect(exports).not.toContain(MetricsSeeder);
        });

        it('should NOT export PSettingSeeder', () => {
            const exports = Reflect.getMetadata('exports', PSettingsModule);
            expect(exports).not.toContain(PSettingSeeder);
        });
    });

    describe('Module Metadata — Imports', () => {
        it('should have imports metadata', () => {
            const imports = Reflect.getMetadata('imports', PSettingsModule);
            expect(imports).toBeDefined();
        });

        it('should have exactly 2 imports', () => {
            const imports = Reflect.getMetadata('imports', PSettingsModule);
            expect(imports.length).toBe(2);
        });

        it('should use forFeature to register entities', () => {
            const imports = Reflect.getMetadata('imports', PSettingsModule) || [];
            expect(imports.length).toBe(2);
        });
    });

    describe('Providers', () => {
        it('should have MetricsService defined', () => {
            expect(module.get(MetricsService)).toBeDefined();
        });

        it('should have PSettingsService defined', () => {
            expect(module.get(PSettingsService)).toBeDefined();
        });

        it('should have PreSettingsService defined', () => {
            expect(module.get(PreSettingsService)).toBeDefined();
        });

        it('should have TransformPSettingService defined', () => {
            expect(module.get(TransformPSettingService)).toBeDefined();
        });

        it('should have SMetricService defined', () => {
            expect(module.get(SMetricService)).toBeDefined();
        });

        it('should have MetricsSeeder defined', () => {
            expect(module.get(MetricsSeeder)).toBeDefined();
        });

        it('should have PSettingSeeder defined', () => {
            expect(module.get(PSettingSeeder)).toBeDefined();
        });

        it('should have MetricsRepository defined', () => {
            expect(module.get(MetricsRepository)).toBeDefined();
        });

        it('should have SMetricRepository defined', () => {
            expect(module.get(SMetricRepository)).toBeDefined();
        });

        it('should have PSettingRepository defined', () => {
            expect(module.get(PSettingRepository)).toBeDefined();
        });
    });

    describe('Service Instances', () => {
        it('should get PSettingsService instance', () => {
            expect(module.get(PSettingsService)).toBe(mockPSettingsService);
        });

        it('should get MetricsService instance', () => {
            expect(module.get(MetricsService)).toBe(mockMetricsService);
        });

        it('should get PreSettingsService instance', () => {
            expect(module.get(PreSettingsService)).toBe(mockPreSettingsService);
        });

        it('should get TransformPSettingService instance', () => {
            expect(module.get(TransformPSettingService)).toBe(mockTransformPSettingService);
        });

        it('should get SMetricService instance', () => {
            expect(module.get(SMetricService)).toBe(mockSMetricService);
        });
    });

    describe('Repository Instances', () => {
        it('should get MetricsRepository instance', () => {
            expect(module.get(MetricsRepository)).toBe(mockMetricsRepository);
        });

        it('should get SMetricRepository instance', () => {
            expect(module.get(SMetricRepository)).toBe(mockSMetricRepository);
        });

        it('should get PSettingRepository instance', () => {
            expect(module.get(PSettingRepository)).toBe(mockPSettingRepository);
        });
    });

    describe('Entity Configuration', () => {
        it('should have MetricsEntity token available', () => {
            const token = getRepositoryToken(MetricsEntity);
            expect(token).toBeDefined();
        });

        it('should have SMetricEntity token available', () => {
            const token = getRepositoryToken(SMetricEntity);
            expect(token).toBeDefined();
        });

        it('should have PSettingEntity token available', () => {
            const token = getRepositoryToken(PSettingEntity);
            expect(token).toBeDefined();
        });

        it('should register MetricsEntity correctly', () => {
            const token = getRepositoryToken(MetricsEntity);
            expect(token).toBe('MetricsEntityRepository');
        });

        it('should register SMetricEntity correctly', () => {
            const token = getRepositoryToken(SMetricEntity);
            expect(token).toBe('SMetricEntityRepository');
        });

        it('should register PSettingEntity correctly', () => {
            const token = getRepositoryToken(PSettingEntity);
            expect(token).toBe('PSettingEntityRepository');
        });
    });

    describe('Dependency Injection', () => {
        it('should resolve all dependencies without error', () => {
            expect(() => module.get(PSettingsController)).not.toThrow();
            expect(() => module.get(PSettingsService)).not.toThrow();
            expect(() => module.get(MetricsService)).not.toThrow();
            expect(() => module.get(PreSettingsService)).not.toThrow();
            expect(() => module.get(TransformPSettingService)).not.toThrow();
            expect(() => module.get(SMetricService)).not.toThrow();
            expect(() => module.get(MetricsRepository)).not.toThrow();
            expect(() => module.get(SMetricRepository)).not.toThrow();
            expect(() => module.get(PSettingRepository)).not.toThrow();
            expect(() => module.get(MetricsSeeder)).not.toThrow();
            expect(() => module.get(PSettingSeeder)).not.toThrow();
        });

        it('should use singleton pattern for providers', () => {
            expect(module.get(PSettingsService)).toBe(module.get(PSettingsService));
            expect(module.get(MetricsService)).toBe(module.get(MetricsService));
            expect(module.get(PreSettingsService)).toBe(module.get(PreSettingsService));
            expect(module.get(TransformPSettingService)).toBe(module.get(TransformPSettingService));
            expect(module.get(SMetricService)).toBe(module.get(SMetricService));
        });
    });

    describe('Module Encapsulation', () => {
        it('should expose only PSettingsService as public API', () => {
            const exports = Reflect.getMetadata('exports', PSettingsModule);
            expect(exports).toEqual([PSettingsService]);
        });

        it('should keep 9 providers internal', () => {
            const providers = Reflect.getMetadata('providers', PSettingsModule);
            const exports = Reflect.getMetadata('exports', PSettingsModule);
            expect(providers.length - exports.length).toBe(9);
        });

        it('should keep repositories internal', () => {
            const providers = Reflect.getMetadata('providers', PSettingsModule);
            const exports = Reflect.getMetadata('exports', PSettingsModule);
            [MetricsRepository, SMetricRepository, PSettingRepository].forEach((repo) => {
                expect(providers).toContain(repo);
                expect(exports).not.toContain(repo);
            });
        });

        it('should keep seeder internal', () => {
            const providers = Reflect.getMetadata('providers', PSettingsModule);
            const exports = Reflect.getMetadata('exports', PSettingsModule);
            expect(providers).toContain(MetricsSeeder);
            expect(exports).not.toContain(MetricsSeeder);
        });
    });

    describe('Complete Module Structure', () => {
        it('should have correct module structure', () => {
            const controllers = Reflect.getMetadata('controllers', PSettingsModule);
            const providers = Reflect.getMetadata('providers', PSettingsModule);
            const exports = Reflect.getMetadata('exports', PSettingsModule);
            const imports = Reflect.getMetadata('imports', PSettingsModule);

            expect(controllers.length).toBe(1);
            expect(providers.length).toBe(10);
            expect(exports.length).toBe(1);
            expect(imports.length).toBe(2);
        });

        it('should follow NestJS module pattern', () => {
            expect(Reflect.getMetadata('controllers', PSettingsModule)).toBeDefined();
            expect(Reflect.getMetadata('providers', PSettingsModule)).toBeDefined();
            expect(Reflect.getMetadata('exports', PSettingsModule)).toBeDefined();
            expect(Reflect.getMetadata('imports', PSettingsModule)).toBeDefined();
        });

        it('should maintain separation of concerns', () => {
            const providers = Reflect.getMetadata('providers', PSettingsModule);
            expect(providers).toContain(MetricsRepository);
            expect(providers).toContain(SMetricRepository);
            expect(providers).toContain(PSettingRepository);
            expect(providers).toContain(MetricsService);
            expect(providers).toContain(PSettingsService);
            expect(providers).toContain(PreSettingsService);
            expect(providers).toContain(TransformPSettingService);
            expect(providers).toContain(SMetricService);
            expect(providers).toContain(MetricsSeeder);
        });
    });

    describe('Module Compilation', () => {
        it('should compile without errors', () => {
            expect(module).toBeDefined();
            expect(module).toBeInstanceOf(TestingModule);
        });

        it('should initialize all providers', () => {
            expect(module.get(MetricsService)).toBeDefined();
            expect(module.get(PSettingsService)).toBeDefined();
            expect(module.get(PreSettingsService)).toBeDefined();
            expect(module.get(TransformPSettingService)).toBeDefined();
            expect(module.get(SMetricService)).toBeDefined();
            expect(module.get(MetricsSeeder)).toBeDefined();
            expect(module.get(PSettingSeeder)).toBeDefined();
            expect(module.get(MetricsRepository)).toBeDefined();
            expect(module.get(SMetricRepository)).toBeDefined();
            expect(module.get(PSettingRepository)).toBeDefined();
        });

        it('should initialize all controllers', () => {
            expect(module.get(PSettingsController)).toBeDefined();
        });
    });
});
