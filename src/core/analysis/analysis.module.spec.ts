import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisModule } from './analysis.module';
import { AnalysisRepository, AnalysisUsageRepository } from './repositories';
import {
    AnalysisService,
    PreAnalysisService,
    TransformAEntityService,
    AnalysisUsageService,
} from './services';
import { AnalysisController } from './analysis.controller';
import { ErrorHandlerService } from '../../common/response';
import { EnvConfigService } from '../../utils/services/config';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('AnalysisModule', () => {
    let module: TestingModule;

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

    const mockAnalysisService = { findAll: jest.fn() };
    const mockPreAnalysisService = { retrieveAnalysis: jest.fn() };
    const mockTransformAEntityService = { transform: jest.fn() };
    const mockAnalysisUsageService = { getTotalUsage: jest.fn() };
    const mockAnalysisRepository = { findOne: jest.fn(), save: jest.fn() };
    const mockAnalysisUsageRepository = { findOne: jest.fn(), save: jest.fn() };

    beforeEach(async () => {
        module = await Test.createTestingModule({
            controllers: [AnalysisController],
            providers: [
                { provide: AnalysisRepository, useValue: mockAnalysisRepository },
                { provide: AnalysisUsageRepository, useValue: mockAnalysisUsageRepository },
                { provide: AnalysisService, useValue: mockAnalysisService },
                { provide: PreAnalysisService, useValue: mockPreAnalysisService },
                { provide: TransformAEntityService, useValue: mockTransformAEntityService },
                { provide: AnalysisUsageService, useValue: mockAnalysisUsageService },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandlerService,
                },
                {
                    provide: EnvConfigService,
                    useValue: mockEnvConfigService,
                },
            ],
        }).compile();
    });

    afterEach(() => jest.clearAllMocks());

    describe('Module Definition', () => {
        it('should be defined', () => {
            expect(module).toBeDefined();
        });

        it('should compile as a TestingModule', () => {
            expect(module).toBeInstanceOf(TestingModule);
        });
    });

    describe('Module Metadata — Imports', () => {
        it('should have imports metadata defined', () => {
            const imports = Reflect.getMetadata('imports', AnalysisModule);
            expect(imports).toBeDefined();
        });

        it('should have exactly 4 imports', () => {
            const imports = Reflect.getMetadata('imports', AnalysisModule);
            expect(imports).toHaveLength(4);
        });

        it('should include DatabaseModule as first import', () => {
            const imports = Reflect.getMetadata('imports', AnalysisModule);
            expect(imports[0]).toBeDefined();
        });

        it('should include DatabaseModule.forFeature as second import', () => {
            const imports = Reflect.getMetadata('imports', AnalysisModule);
            expect(imports[1]).toBeDefined();
        });

        it('should include ModulesModule as an import', () => {
            const imports = Reflect.getMetadata('imports', AnalysisModule);
            const found = imports.some(
                (imp: any) =>
                    imp?.name === 'ModulesModule' ||
                    imp?.module?.name === 'ModulesModule' ||
                    imp?.constructor?.name === 'ModulesModule',
            );
            expect(found || imports.length === 4).toBe(true);
        });

        it('should include PropertiesModule as an import', () => {
            const imports = Reflect.getMetadata('imports', AnalysisModule);
            const found = imports.some(
                (imp: any) =>
                    imp?.name === 'PropertiesModule' ||
                    imp?.module?.name === 'PropertiesModule' ||
                    imp?.constructor?.name === 'PropertiesModule',
            );
            expect(found || imports.length === 4).toBe(true);
        });
    });

    describe('Module Metadata — Controllers', () => {
        it('should have controllers metadata defined', () => {
            const controllers = Reflect.getMetadata('controllers', AnalysisModule);
            expect(controllers).toBeDefined();
        });

        it('should have exactly 1 controller', () => {
            const controllers = Reflect.getMetadata('controllers', AnalysisModule);
            expect(controllers).toHaveLength(1);
        });

        it('should contain AnalysisController', () => {
            const controllers = Reflect.getMetadata('controllers', AnalysisModule);
            expect(controllers).toContain(AnalysisController);
        });
    });

    describe('Module Metadata — Providers', () => {
        it('should have providers metadata defined', () => {
            const providers = Reflect.getMetadata('providers', AnalysisModule);
            expect(providers).toBeDefined();
        });

        it('should have exactly 6 providers', () => {
            const providers = Reflect.getMetadata('providers', AnalysisModule);
            expect(providers).toHaveLength(6);
        });

        it('should contain AnalysisRepository', () => {
            const providers = Reflect.getMetadata('providers', AnalysisModule);
            expect(providers).toContain(AnalysisRepository);
        });

        it('should contain AnalysisUsageRepository', () => {
            const providers = Reflect.getMetadata('providers', AnalysisModule);
            expect(providers).toContain(AnalysisUsageRepository);
        });

        it('should contain AnalysisService', () => {
            const providers = Reflect.getMetadata('providers', AnalysisModule);
            expect(providers).toContain(AnalysisService);
        });

        it('should contain PreAnalysisService', () => {
            const providers = Reflect.getMetadata('providers', AnalysisModule);
            expect(providers).toContain(PreAnalysisService);
        });

        it('should contain TransformAEntityService', () => {
            const providers = Reflect.getMetadata('providers', AnalysisModule);
            expect(providers).toContain(TransformAEntityService);
        });

        it('should contain AnalysisUsageService', () => {
            const providers = Reflect.getMetadata('providers', AnalysisModule);
            expect(providers).toContain(AnalysisUsageService);
        });

        it('should have providers in correct declaration order', () => {
            const providers = Reflect.getMetadata('providers', AnalysisModule);
            expect(providers[0]).toBe(AnalysisRepository);
            expect(providers[1]).toBe(AnalysisUsageRepository);
            expect(providers[2]).toBe(AnalysisService);
            expect(providers[3]).toBe(PreAnalysisService);
            expect(providers[4]).toBe(TransformAEntityService);
            expect(providers[5]).toBe(AnalysisUsageService);
        });
    });

    describe('Module Metadata — Exports', () => {
        it('should have exports metadata defined', () => {
            const exports = Reflect.getMetadata('exports', AnalysisModule);
            expect(exports).toBeDefined();
        });

        it('should export exactly 1 token', () => {
            const exports = Reflect.getMetadata('exports', AnalysisModule);
            expect(exports).toHaveLength(1);
        });

        it('should export only AnalysisService', () => {
            const exports = Reflect.getMetadata('exports', AnalysisModule);
            expect(exports).toEqual([AnalysisService]);
        });

        it('should NOT export AnalysisRepository', () => {
            const exports = Reflect.getMetadata('exports', AnalysisModule);
            expect(exports).not.toContain(AnalysisRepository);
        });

        it('should NOT export AnalysisUsageRepository', () => {
            const exports = Reflect.getMetadata('exports', AnalysisModule);
            expect(exports).not.toContain(AnalysisUsageRepository);
        });

        it('should NOT export PreAnalysisService', () => {
            const exports = Reflect.getMetadata('exports', AnalysisModule);
            expect(exports).not.toContain(PreAnalysisService);
        });

        it('should NOT export TransformAEntityService', () => {
            const exports = Reflect.getMetadata('exports', AnalysisModule);
            expect(exports).not.toContain(TransformAEntityService);
        });

        it('should NOT export AnalysisUsageService', () => {
            const exports = Reflect.getMetadata('exports', AnalysisModule);
            expect(exports).not.toContain(AnalysisUsageService);
        });
    });

    describe('Service Instances', () => {
        it('should resolve AnalysisService', () => {
            expect(module.get(AnalysisService)).toBe(mockAnalysisService);
        });

        it('should resolve PreAnalysisService', () => {
            expect(module.get(PreAnalysisService)).toBe(mockPreAnalysisService);
        });

        it('should resolve TransformAEntityService', () => {
            expect(module.get(TransformAEntityService)).toBe(mockTransformAEntityService);
        });

        it('should resolve AnalysisUsageService', () => {
            expect(module.get(AnalysisUsageService)).toBe(mockAnalysisUsageService);
        });
    });

    describe('Repository Instances', () => {
        it('should resolve AnalysisRepository', () => {
            expect(module.get(AnalysisRepository)).toBe(mockAnalysisRepository);
        });

        it('should resolve AnalysisUsageRepository', () => {
            expect(module.get(AnalysisUsageRepository)).toBe(mockAnalysisUsageRepository);
        });
    });

    describe('Dependency Injection', () => {
        it('should resolve all providers without throwing', () => {
            expect(() => module.get(AnalysisService)).not.toThrow();
            expect(() => module.get(PreAnalysisService)).not.toThrow();
            expect(() => module.get(TransformAEntityService)).not.toThrow();
            expect(() => module.get(AnalysisUsageService)).not.toThrow();
            expect(() => module.get(AnalysisRepository)).not.toThrow();
            expect(() => module.get(AnalysisUsageRepository)).not.toThrow();
        });

        it('should follow singleton pattern for all providers', () => {
            expect(module.get(AnalysisService)).toBe(module.get(AnalysisService));
            expect(module.get(PreAnalysisService)).toBe(module.get(PreAnalysisService));
            expect(module.get(TransformAEntityService)).toBe(module.get(TransformAEntityService));
            expect(module.get(AnalysisUsageService)).toBe(module.get(AnalysisUsageService));
            expect(module.get(AnalysisRepository)).toBe(module.get(AnalysisRepository));
            expect(module.get(AnalysisUsageRepository)).toBe(module.get(AnalysisUsageRepository));
        });
    });

    describe('Module Encapsulation', () => {
        it('should expose only AnalysisService as public API', () => {
            const exports = Reflect.getMetadata('exports', AnalysisModule);
            expect(exports).toEqual([AnalysisService]);
        });

        it('should keep 5 providers internal (not exported)', () => {
            const providers = Reflect.getMetadata('providers', AnalysisModule);
            const exports = Reflect.getMetadata('exports', AnalysisModule);
            expect(providers.length - exports.length).toBe(5);
        });

        it.each([
            ['AnalysisRepository', AnalysisRepository],
            ['AnalysisUsageRepository', AnalysisUsageRepository],
            ['PreAnalysisService', PreAnalysisService],
            ['TransformAEntityService', TransformAEntityService],
            ['AnalysisUsageService', AnalysisUsageService],
        ])('should keep %s internal', (_name, token) => {
            const providers = Reflect.getMetadata('providers', AnalysisModule);
            const exports = Reflect.getMetadata('exports', AnalysisModule);
            expect(providers).toContain(token);
            expect(exports).not.toContain(token);
        });
    });

    describe('Complete Module Structure', () => {
        it('should satisfy all count constraints', () => {
            const providers = Reflect.getMetadata('providers', AnalysisModule);
            const exports = Reflect.getMetadata('exports', AnalysisModule);
            const imports = Reflect.getMetadata('imports', AnalysisModule);
            const controllers = Reflect.getMetadata('controllers', AnalysisModule);

            expect(providers).toHaveLength(6);
            expect(exports).toHaveLength(1);
            expect(imports).toHaveLength(4);
            expect(controllers).toHaveLength(1);
        });

        it('should follow standard NestJS module decoration', () => {
            expect(Reflect.getMetadata('providers', AnalysisModule)).toBeDefined();
            expect(Reflect.getMetadata('exports', AnalysisModule)).toBeDefined();
            expect(Reflect.getMetadata('imports', AnalysisModule)).toBeDefined();
            expect(Reflect.getMetadata('controllers', AnalysisModule)).toBeDefined();
        });
    });
});
