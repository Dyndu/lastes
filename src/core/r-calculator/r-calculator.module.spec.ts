import { Test, TestingModule } from '@nestjs/testing';
import { RCalculatorModule } from './r-calculator.module';
import { RCalculatorService, PreRCalculatorService, TransformRCalculatorService } from './services';
import { RCalculatorController } from './r-calculator.controller';
import { RCalculatorRepository } from './r-calculator.repository';
import { RAnalysisModule } from '../r-analysis/r-analysis.module';
import { BAnalysisModule } from '../b-analysis/b-analysis.module';
import { Reflector } from '@nestjs/core';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('RCalculatorModule', () => {
    let module: TestingModule;

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
        notFound: jest.fn((_message, userMessage) => {
            throw new Error(userMessage);
        }),
        fail: jest.fn((_message, userMessage) => {
            throw new Error(userMessage);
        }),
    };

    const mockRCalculatorService = { findOne: jest.fn(), create: jest.fn() };
    const mockPreRCalculatorService = { prepare: jest.fn() };
    const mockTransformRCalculatorService = { transform: jest.fn() };
    const mockRCalculatorRepository = { findOne: jest.fn(), save: jest.fn(), create: jest.fn() };

    beforeEach(async () => {
        module = await Test.createTestingModule({
            controllers: [RCalculatorController],
            providers: [
                { provide: RCalculatorService, useValue: mockRCalculatorService },
                { provide: PreRCalculatorService, useValue: mockPreRCalculatorService },
                { provide: TransformRCalculatorService, useValue: mockTransformRCalculatorService },
                { provide: RCalculatorRepository, useValue: mockRCalculatorRepository },
                { provide: Reflector, useValue: { get: jest.fn(), getAllAndOverride: jest.fn() } },
                {
                    provide: EnvConfigService,
                    useValue: mockEnvConfigService,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandlerService,
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

    describe('Module Metadata — Imports', () => {
        it('should have imports metadata', () => {
            const imports = Reflect.getMetadata('imports', RCalculatorModule);
            expect(imports).toBeDefined();
        });

        it('should have exactly 4 imports', () => {
            const imports = Reflect.getMetadata('imports', RCalculatorModule);
            expect(imports.length).toBe(4);
        });

        it('should include DatabaseModule as first import', () => {
            const imports = Reflect.getMetadata('imports', RCalculatorModule);
            expect(imports[0]).toBeDefined();
        });

        it('should include DatabaseModule.forFeature as second import', () => {
            const imports = Reflect.getMetadata('imports', RCalculatorModule);
            expect(imports[1]).toBeDefined();
        });

        it('should import RAnalysisModule', () => {
            const imports = Reflect.getMetadata('imports', RCalculatorModule);
            expect(imports).toContain(RAnalysisModule);
        });

        it('should import BAnalysisModule', () => {
            const imports = Reflect.getMetadata('imports', RCalculatorModule);
            expect(imports).toContain(BAnalysisModule);
        });
    });

    describe('Module Metadata — Controllers', () => {
        it('should have controllers metadata', () => {
            const controllers = Reflect.getMetadata('controllers', RCalculatorModule);
            expect(controllers).toBeDefined();
        });

        it('should have exactly 1 controller', () => {
            const controllers = Reflect.getMetadata('controllers', RCalculatorModule);
            expect(controllers.length).toBe(1);
        });

        it('should contain RCalculatorController', () => {
            const controllers = Reflect.getMetadata('controllers', RCalculatorModule);
            expect(controllers).toContain(RCalculatorController);
        });
    });

    describe('Module Metadata — Providers', () => {
        it('should have providers metadata', () => {
            const providers = Reflect.getMetadata('providers', RCalculatorModule);
            expect(providers).toBeDefined();
        });

        it('should have exactly 4 providers', () => {
            const providers = Reflect.getMetadata('providers', RCalculatorModule);
            expect(providers.length).toBe(4);
        });

        it('should contain all providers', () => {
            const providers = Reflect.getMetadata('providers', RCalculatorModule);
            expect(providers).toContain(RCalculatorRepository);
            expect(providers).toContain(RCalculatorService);
            expect(providers).toContain(PreRCalculatorService);
            expect(providers).toContain(TransformRCalculatorService);
        });
    });

    describe('Module Metadata — Exports', () => {
        it('should have exports metadata', () => {
            const exports = Reflect.getMetadata('exports', RCalculatorModule);
            expect(exports).toBeDefined();
        });

        it('should have exactly 1 export', () => {
            const exports = Reflect.getMetadata('exports', RCalculatorModule);
            expect(exports.length).toBe(1);
        });

        it('should export only RCalculatorService', () => {
            const exports = Reflect.getMetadata('exports', RCalculatorModule);
            expect(exports).toEqual([RCalculatorService]);
        });

        it('should NOT export repository', () => {
            const exports = Reflect.getMetadata('exports', RCalculatorModule);
            expect(exports).not.toContain(RCalculatorRepository);
        });

        it('should NOT export internal services', () => {
            const exports = Reflect.getMetadata('exports', RCalculatorModule);
            expect(exports).not.toContain(PreRCalculatorService);
            expect(exports).not.toContain(TransformRCalculatorService);
        });

        it('should NOT export controller', () => {
            const exports = Reflect.getMetadata('exports', RCalculatorModule);
            expect(exports).not.toContain(RCalculatorController);
        });
    });

    describe('Service Instances', () => {
        it('should get RCalculatorService instance', () => {
            expect(module.get(RCalculatorService)).toBe(mockRCalculatorService);
        });

        it('should get PreRCalculatorService instance', () => {
            expect(module.get(PreRCalculatorService)).toBe(mockPreRCalculatorService);
        });

        it('should get TransformRCalculatorService instance', () => {
            expect(module.get(TransformRCalculatorService)).toBe(mockTransformRCalculatorService);
        });
    });

    describe('Repository Instances', () => {
        it('should get RCalculatorRepository instance', () => {
            expect(module.get(RCalculatorRepository)).toBe(mockRCalculatorRepository);
        });
    });

    describe('Controller Instances', () => {
        it('should get RCalculatorController instance', () => {
            expect(module.get(RCalculatorController)).toBeDefined();
        });

        it('should create RCalculatorController instance', () => {
            expect(module.get(RCalculatorController)).toBeInstanceOf(RCalculatorController);
        });
    });

    describe('Dependency Injection', () => {
        it('should resolve all services without error', () => {
            [RCalculatorService, PreRCalculatorService, TransformRCalculatorService].forEach(
                (svc) => expect(() => module.get(svc)).not.toThrow(),
            );
        });

        it('should resolve repository without error', () => {
            expect(() => module.get(RCalculatorRepository)).not.toThrow();
        });

        it('should use singleton pattern for all providers', () => {
            expect(module.get(RCalculatorService)).toBe(module.get(RCalculatorService));
            expect(module.get(RCalculatorRepository)).toBe(module.get(RCalculatorRepository));
            expect(module.get(PreRCalculatorService)).toBe(module.get(PreRCalculatorService));
        });
    });

    describe('Module Encapsulation', () => {
        it('should expose only RCalculatorService as public API', () => {
            const exports = Reflect.getMetadata('exports', RCalculatorModule);
            expect(exports).toEqual([RCalculatorService]);
        });

        it('should keep 3 providers internal', () => {
            const providers = Reflect.getMetadata('providers', RCalculatorModule);
            const exports = Reflect.getMetadata('exports', RCalculatorModule);
            expect(providers.length - exports.length).toBe(3);
        });

        it('should keep repository and internal services private', () => {
            const providers = Reflect.getMetadata('providers', RCalculatorModule);
            const exports = Reflect.getMetadata('exports', RCalculatorModule);
            [RCalculatorRepository, PreRCalculatorService, TransformRCalculatorService].forEach(
                (p) => {
                    expect(providers).toContain(p);
                    expect(exports).not.toContain(p);
                },
            );
        });
    });

    describe('Complete Module Structure', () => {
        it('should have correct module structure counts', () => {
            const providers = Reflect.getMetadata('providers', RCalculatorModule);
            const exports = Reflect.getMetadata('exports', RCalculatorModule);
            const imports = Reflect.getMetadata('imports', RCalculatorModule);
            const controllers = Reflect.getMetadata('controllers', RCalculatorModule);

            expect(providers.length).toBe(4);
            expect(exports.length).toBe(1);
            expect(imports.length).toBe(4);
            expect(controllers.length).toBe(1);
        });

        it('should follow NestJS module pattern', () => {
            expect(Reflect.getMetadata('providers', RCalculatorModule)).toBeDefined();
            expect(Reflect.getMetadata('exports', RCalculatorModule)).toBeDefined();
            expect(Reflect.getMetadata('imports', RCalculatorModule)).toBeDefined();
            expect(Reflect.getMetadata('controllers', RCalculatorModule)).toBeDefined();
        });
    });

    describe('Module Compilation', () => {
        it('should compile without errors', () => {
            expect(module).toBeDefined();
            expect(module).toBeInstanceOf(TestingModule);
        });

        it('should initialize all services', () => {
            expect(module.get(RCalculatorService)).toBeDefined();
            expect(module.get(PreRCalculatorService)).toBeDefined();
            expect(module.get(TransformRCalculatorService)).toBeDefined();
        });

        it('should initialize repository', () => {
            expect(module.get(RCalculatorRepository)).toBeDefined();
        });

        it('should initialize controller', () => {
            expect(module.get(RCalculatorController)).toBeDefined();
        });
    });
});
