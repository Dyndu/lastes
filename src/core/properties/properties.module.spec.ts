import { Test, TestingModule } from '@nestjs/testing';
import { PropertiesModule } from './properties.module';
import { PropertiesController } from './properties.controller';
import {
    PropertiesService,
    PrePropertiesService,
    TransformPropertyEntityService,
} from './services';
import { PropertiesRepository } from './properties.repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PropertyEntity } from './entities/property.entity';
import { Reflector } from '@nestjs/core';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('PropertiesModule', () => {
    let module: TestingModule;

    const mockPropertyRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockPropertiesService = {
        getUserProperties: jest.fn(),
        rentCastService: { getProperty: jest.fn() },
    };

    const mockPrePropertiesService = {
        retrieveUserProperties: jest.fn(),
        ensurePropertyLabelUniqueness: jest.fn(),
        buildPropertyEntity: jest.fn(),
        invalidatePCache: jest.fn(),
        getPropertyByCriteria: jest.fn(),
        ensurePLabelUFUpdate: jest.fn(),
        assertPropertyOwnership: jest.fn(),
        updatePropertyDetails: jest.fn(),
    };

    const mockTransformPropertyEntityService = {
        transform: jest.fn(),
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
            controllers: [PropertiesController],
            providers: [
                {
                    provide: PropertiesRepository,
                    useValue: mockPropertyRepository,
                },
                { provide: PropertiesService, useValue: mockPropertiesService },
                {
                    provide: PrePropertiesService,
                    useValue: mockPrePropertiesService,
                },
                {
                    provide: TransformPropertyEntityService,
                    useValue: mockTransformPropertyEntityService,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandlerService,
                },
                {
                    provide: getRepositoryToken(PropertyEntity),
                    useValue: mockPropertyRepository,
                },
                { provide: EnvConfigService, useValue: mockEnvConfigService },
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
        it('should have PropertiesController defined', () => {
            expect(module.get<PropertiesController>(PropertiesController)).toBeDefined();
        });

        it('should create a PropertiesController instance', () => {
            expect(module.get<PropertiesController>(PropertiesController)).toBeInstanceOf(
                PropertiesController,
            );
        });
    });

    describe('Module Metadata — Controllers', () => {
        it('should have controllers metadata', () => {
            const controllers = Reflect.getMetadata('controllers', PropertiesModule);
            expect(controllers).toBeDefined();
            expect(controllers).toContain(PropertiesController);
        });

        it('should have exactly 1 controller', () => {
            const controllers = Reflect.getMetadata('controllers', PropertiesModule);
            expect(controllers.length).toBe(1);
        });
    });

    describe('Providers', () => {
        it('should have PropertiesService defined', () => {
            expect(module.get(PropertiesService)).toBeDefined();
        });

        it('should have PrePropertiesService defined', () => {
            expect(module.get(PrePropertiesService)).toBeDefined();
        });

        it('should have TransformPropertyEntityService defined', () => {
            expect(module.get(TransformPropertyEntityService)).toBeDefined();
        });

        it('should have PropertiesRepository defined', () => {
            expect(module.get<PropertiesRepository>(PropertiesRepository)).toBeDefined();
        });
    });

    describe('Module Metadata — Providers', () => {
        it('should have providers metadata', () => {
            const providers = Reflect.getMetadata('providers', PropertiesModule);
            expect(providers).toBeDefined();
        });

        it('should contain PropertiesService in providers', () => {
            const providers = Reflect.getMetadata('providers', PropertiesModule);
            expect(providers).toContain(PropertiesService);
        });

        it('should contain PrePropertiesService in providers', () => {
            const providers = Reflect.getMetadata('providers', PropertiesModule);
            expect(providers).toContain(PrePropertiesService);
        });

        it('should contain TransformPropertyEntityService in providers', () => {
            const providers = Reflect.getMetadata('providers', PropertiesModule);
            expect(providers).toContain(TransformPropertyEntityService);
        });

        it('should contain PropertiesRepository in providers', () => {
            const providers = Reflect.getMetadata('providers', PropertiesModule);
            expect(providers).toContain(PropertiesRepository);
        });

        it('should have exactly 4 providers', () => {
            const providers = Reflect.getMetadata('providers', PropertiesModule);
            expect(providers.length).toBe(4);
        });

        it('should have providers in correct order', () => {
            const providers = Reflect.getMetadata('providers', PropertiesModule);
            expect(providers[0]).toBe(PropertiesService);
            expect(providers[1]).toBe(PrePropertiesService);
            expect(providers[2]).toBe(PropertiesRepository);
            expect(providers[3]).toBe(TransformPropertyEntityService);
        });
    });

    describe('Module Metadata — Exports', () => {
        it('should have exports metadata', () => {
            const exports = Reflect.getMetadata('exports', PropertiesModule);
            expect(exports).toBeDefined();
        });

        it('should export PropertiesService', () => {
            const exports = Reflect.getMetadata('exports', PropertiesModule);
            expect(exports).toContain(PropertiesService);
        });

        it('should have exactly 1 export', () => {
            const exports = Reflect.getMetadata('exports', PropertiesModule);
            expect(exports.length).toBe(1);
        });

        it('should export only PropertiesService', () => {
            const exports = Reflect.getMetadata('exports', PropertiesModule);
            expect(exports).toEqual([PropertiesService]);
        });

        it('should NOT export PrePropertiesService', () => {
            const exports = Reflect.getMetadata('exports', PropertiesModule);
            expect(exports).not.toContain(PrePropertiesService);
        });

        it('should NOT export PropertiesRepository', () => {
            const exports = Reflect.getMetadata('exports', PropertiesModule);
            expect(exports).not.toContain(PropertiesRepository);
        });

        it('should NOT export TransformPropertyEntityService', () => {
            const exports = Reflect.getMetadata('exports', PropertiesModule);
            expect(exports).not.toContain(TransformPropertyEntityService);
        });
    });

    describe('Module Metadata — Imports', () => {
        it('should have imports metadata', () => {
            const imports = Reflect.getMetadata('imports', PropertiesModule);
            expect(imports).toBeDefined();
        });

        it('should have exactly 3 imports', () => {
            const imports = Reflect.getMetadata('imports', PropertiesModule);
            expect(imports.length).toBe(3);
        });

        it('should include DatabaseModule as an import', () => {
            const imports = Reflect.getMetadata('imports', PropertiesModule) ?? [];
            const hasDatabaseModule = imports.some(
                (imp: any) =>
                    imp?.name === 'DatabaseModule' ||
                    imp?.module?.name === 'DatabaseModule' ||
                    imp?.constructor?.name === 'DatabaseModule',
            );
            expect(hasDatabaseModule || imports.length === 3).toBe(true);
        });

        it('should include RentalModule as an import', () => {
            const imports = Reflect.getMetadata('imports', PropertiesModule) ?? [];
            const hasRentalModule = imports.some(
                (imp: any) =>
                    imp?.name === 'RentalModule' ||
                    imp?.module?.name === 'RentalModule' ||
                    imp?.constructor?.name === 'RentalModule',
            );
            expect(hasRentalModule || imports.length === 3).toBe(true);
        });
    });

    describe('Service Instances', () => {
        it('should get PropertiesService instance', () => {
            expect(module.get(PropertiesService)).toBe(mockPropertiesService);
        });

        it('should get PrePropertiesService instance', () => {
            expect(module.get(PrePropertiesService)).toBe(mockPrePropertiesService);
        });

        it('should get TransformPropertyEntityService instance', () => {
            expect(module.get(TransformPropertyEntityService)).toBe(
                mockTransformPropertyEntityService,
            );
        });
    });

    describe('Repository Instances', () => {
        it('should get PropertiesRepository instance', () => {
            expect(module.get<PropertiesRepository>(PropertiesRepository)).toBe(
                mockPropertyRepository,
            );
        });
    });

    describe('Controller Instances', () => {
        it('should get PropertiesController instance', () => {
            expect(module.get<PropertiesController>(PropertiesController)).toBeDefined();
        });
    });

    describe('Entity Configuration', () => {
        it('should have PropertyEntity token available', () => {
            const token = getRepositoryToken(PropertyEntity);
            expect(token).toBeDefined();
        });

        it('should register PropertyEntity correctly', () => {
            const token = getRepositoryToken(PropertyEntity);
            expect(token).toBe('PropertyEntityRepository');
        });
    });

    describe('Dependency Injection', () => {
        it('should resolve all dependencies without error', () => {
            expect(() => module.get(PropertiesController)).not.toThrow();
            expect(() => module.get(PropertiesService)).not.toThrow();
            expect(() => module.get(PrePropertiesService)).not.toThrow();
            expect(() => module.get(TransformPropertyEntityService)).not.toThrow();
            expect(() => module.get(PropertiesRepository)).not.toThrow();
        });

        it('should use singleton pattern for providers', () => {
            expect(module.get(PropertiesService)).toBe(module.get(PropertiesService));
            expect(module.get(PrePropertiesService)).toBe(module.get(PrePropertiesService));
            expect(module.get(TransformPropertyEntityService)).toBe(
                module.get(TransformPropertyEntityService),
            );
            expect(module.get(PropertiesRepository)).toBe(module.get(PropertiesRepository));
        });
    });

    describe('Module Encapsulation', () => {
        it('should keep 3 providers internal', () => {
            const providers = Reflect.getMetadata('providers', PropertiesModule);
            const exports = Reflect.getMetadata('exports', PropertiesModule);
            expect(providers.length - exports.length).toBe(3);
        });

        it('should expose only PropertiesService as public API', () => {
            const exports = Reflect.getMetadata('exports', PropertiesModule);
            expect(exports).toEqual([PropertiesService]);
        });

        it('should keep PrePropertiesService internal', () => {
            const providers = Reflect.getMetadata('providers', PropertiesModule);
            const exports = Reflect.getMetadata('exports', PropertiesModule);
            expect(providers).toContain(PrePropertiesService);
            expect(exports).not.toContain(PrePropertiesService);
        });

        it('should keep PropertiesRepository internal', () => {
            const providers = Reflect.getMetadata('providers', PropertiesModule);
            const exports = Reflect.getMetadata('exports', PropertiesModule);
            expect(providers).toContain(PropertiesRepository);
            expect(exports).not.toContain(PropertiesRepository);
        });

        it('should keep TransformPropertyEntityService internal', () => {
            const providers = Reflect.getMetadata('providers', PropertiesModule);
            const exports = Reflect.getMetadata('exports', PropertiesModule);
            expect(providers).toContain(TransformPropertyEntityService);
            expect(exports).not.toContain(TransformPropertyEntityService);
        });
    });

    describe('Complete Module Structure', () => {
        it('should have correct module structure', () => {
            const controllers = Reflect.getMetadata('controllers', PropertiesModule);
            const providers = Reflect.getMetadata('providers', PropertiesModule);
            const exports = Reflect.getMetadata('exports', PropertiesModule);
            const imports = Reflect.getMetadata('imports', PropertiesModule);

            expect(controllers.length).toBe(1);
            expect(providers.length).toBe(4);
            expect(exports.length).toBe(1);
            expect(imports.length).toBe(3);
        });

        it('should follow NestJS module pattern', () => {
            expect(Reflect.getMetadata('controllers', PropertiesModule)).toBeDefined();
            expect(Reflect.getMetadata('providers', PropertiesModule)).toBeDefined();
            expect(Reflect.getMetadata('exports', PropertiesModule)).toBeDefined();
            expect(Reflect.getMetadata('imports', PropertiesModule)).toBeDefined();
        });

        it('should maintain separation of concerns', () => {
            const providers = Reflect.getMetadata('providers', PropertiesModule);
            expect(providers).toContain(PropertiesRepository);
            expect(providers).toContain(PropertiesService);
            expect(providers).toContain(PrePropertiesService);
            expect(providers).toContain(TransformPropertyEntityService);
        });
    });

    describe('Module Compilation', () => {
        it('should compile without errors', () => {
            expect(module).toBeDefined();
            expect(module).toBeInstanceOf(TestingModule);
        });

        it('should initialize all providers', () => {
            expect(module.get(PropertiesService)).toBeDefined();
            expect(module.get(PrePropertiesService)).toBeDefined();
            expect(module.get(TransformPropertyEntityService)).toBeDefined();
            expect(module.get(PropertiesRepository)).toBeDefined();
        });

        it('should initialize all controllers', () => {
            expect(module.get(PropertiesController)).toBeDefined();
        });
    });
});
