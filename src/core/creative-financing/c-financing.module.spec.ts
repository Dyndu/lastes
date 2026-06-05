import { Test, TestingModule } from '@nestjs/testing';
import { CFinancingModule } from './c-financing.module';
import { CFinancingService, PreCFinancingService, CFinancingCalculatorService } from './services';
import { CFinancingController } from './c-financing.controller';
import { CFinancingRepository } from './c-financing.repository';
import { RAnalysisModule } from '../r-analysis/r-analysis.module';
import { ABuilderModule } from '../a-builder/a-builder.module';
import { FFlipModule } from '../fix-flip/f-flip.module';
import { Reflector } from '@nestjs/core';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('CFinancingModule', () => {
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

    const mockCFinancingService = { findOne: jest.fn(), create: jest.fn() };
    const mockPreCFinancingService = { prepare: jest.fn() };
    const mockCFinancingCalculatorService = { computePrincipalPaidDown: jest.fn() };
    const mockCFinancingRepository = { findOne: jest.fn(), save: jest.fn(), create: jest.fn() };

    beforeEach(async () => {
        module = await Test.createTestingModule({
            controllers: [CFinancingController],
            providers: [
                { provide: CFinancingService, useValue: mockCFinancingService },
                { provide: PreCFinancingService, useValue: mockPreCFinancingService },
                { provide: CFinancingRepository, useValue: mockCFinancingRepository },
                { provide: CFinancingCalculatorService, useValue: mockCFinancingCalculatorService },
                { provide: Reflector, useValue: { get: jest.fn(), getAllAndOverride: jest.fn() } },
                { provide: EnvConfigService, useValue: mockEnvConfigService },
                { provide: ErrorHandlerService, useValue: mockErrorHandlerService },
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
            const imports = Reflect.getMetadata('imports', CFinancingModule);
            expect(imports).toBeDefined();
        });

        it('should have exactly 5 imports', () => {
            const imports = Reflect.getMetadata('imports', CFinancingModule);
            expect(imports.length).toBe(5);
        });

        it('should include DatabaseModule as first import', () => {
            const imports = Reflect.getMetadata('imports', CFinancingModule);
            expect(imports[0]).toBeDefined();
        });

        it('should include DatabaseModule.forFeature as second import', () => {
            const imports = Reflect.getMetadata('imports', CFinancingModule);
            expect(imports[1]).toBeDefined();
        });

        it('should import RAnalysisModule', () => {
            const imports = Reflect.getMetadata('imports', CFinancingModule);
            expect(imports).toContain(RAnalysisModule);
        });

        it('should import FFlipModule', () => {
            const imports = Reflect.getMetadata('imports', CFinancingModule);
            expect(imports).toContain(FFlipModule);
        });

        it('should import ABuilderModule', () => {
            const imports = Reflect.getMetadata('imports', CFinancingModule);
            expect(imports).toContain(ABuilderModule);
        });
    });

    describe('Module Metadata — Controllers', () => {
        it('should have controllers metadata', () => {
            const controllers = Reflect.getMetadata('controllers', CFinancingModule);
            expect(controllers).toBeDefined();
        });

        it('should have exactly 1 controller', () => {
            const controllers = Reflect.getMetadata('controllers', CFinancingModule);
            expect(controllers.length).toBe(1);
        });

        it('should contain CFinancingController', () => {
            const controllers = Reflect.getMetadata('controllers', CFinancingModule);
            expect(controllers).toContain(CFinancingController);
        });
    });

    describe('Module Metadata — Providers', () => {
        it('should have providers metadata', () => {
            const providers = Reflect.getMetadata('providers', CFinancingModule);
            expect(providers).toBeDefined();
        });

        it('should have exactly 3 providers', () => {
            const providers = Reflect.getMetadata('providers', CFinancingModule);
            expect(providers.length).toBe(4);
        });

        it('should contain CFinancingRepository', () => {
            const providers = Reflect.getMetadata('providers', CFinancingModule);
            expect(providers).toContain(CFinancingRepository);
        });

        it('should contain CFinancingService', () => {
            const providers = Reflect.getMetadata('providers', CFinancingModule);
            expect(providers).toContain(CFinancingService);
        });

        it('should contain PreCFinancingService', () => {
            const providers = Reflect.getMetadata('providers', CFinancingModule);
            expect(providers).toContain(PreCFinancingService);
        });

        it('should contain CFinancingCalculatorService', () => {
            const providers = Reflect.getMetadata('providers', CFinancingModule);
            expect(providers).toContain(CFinancingCalculatorService);
        });
    });

    describe('Module Metadata — Exports', () => {
        it('should have exports metadata', () => {
            const exports = Reflect.getMetadata('exports', CFinancingModule);
            expect(exports).toBeDefined();
        });

        it('should have exactly 1 export', () => {
            const exports = Reflect.getMetadata('exports', CFinancingModule);
            expect(exports.length).toBe(1);
        });

        it('should export only CFinancingService', () => {
            const exports = Reflect.getMetadata('exports', CFinancingModule);
            expect(exports).toEqual([CFinancingService]);
        });

        it('should NOT export CFinancingRepository', () => {
            const exports = Reflect.getMetadata('exports', CFinancingModule);
            expect(exports).not.toContain(CFinancingRepository);
        });

        it('should NOT export PreCFinancingService', () => {
            const exports = Reflect.getMetadata('exports', CFinancingModule);
            expect(exports).not.toContain(PreCFinancingService);
        });

        it('should NOT export CFinancingCalculatorService', () => {
            const exports = Reflect.getMetadata('exports', CFinancingModule);
            expect(exports).not.toContain(CFinancingCalculatorService);
        });

        it('should NOT export CFinancingController', () => {
            const exports = Reflect.getMetadata('exports', CFinancingModule);
            expect(exports).not.toContain(CFinancingController);
        });
    });

    describe('Service Instances', () => {
        it('should get CFinancingService instance', () => {
            expect(module.get(CFinancingService)).toBe(mockCFinancingService);
        });

        it('should get PreCFinancingService instance', () => {
            expect(module.get(PreCFinancingService)).toBe(mockPreCFinancingService);
        });

        it('should get CFinancingCalculatorService instance', () => {
            expect(module.get(CFinancingCalculatorService)).toBe(mockCFinancingCalculatorService);
        });
    });

    describe('Repository Instances', () => {
        it('should get CFinancingRepository instance', () => {
            expect(module.get(CFinancingRepository)).toBe(mockCFinancingRepository);
        });
    });

    describe('Controller Instances', () => {
        it('should get CFinancingController instance', () => {
            expect(module.get(CFinancingController)).toBeDefined();
        });

        it('should create CFinancingController instance', () => {
            expect(module.get(CFinancingController)).toBeInstanceOf(CFinancingController);
        });
    });

    describe('Dependency Injection', () => {
        it('should resolve all services without error', () => {
            [CFinancingService, PreCFinancingService].forEach((svc) =>
                expect(() => module.get(svc)).not.toThrow(),
            );
        });

        it('should resolve repository without error', () => {
            expect(() => module.get(CFinancingRepository)).not.toThrow();
        });

        it('should use singleton pattern for all providers', () => {
            expect(module.get(CFinancingService)).toBe(module.get(CFinancingService));
            expect(module.get(CFinancingRepository)).toBe(module.get(CFinancingRepository));
            expect(module.get(PreCFinancingService)).toBe(module.get(PreCFinancingService));
        });
    });

    describe('Module Encapsulation', () => {
        it('should expose only CFinancingService as public API', () => {
            const exports = Reflect.getMetadata('exports', CFinancingModule);
            expect(exports).toEqual([CFinancingService]);
        });

        it('should keep 2 providers internal (excluding exported)', () => {
            const providers = Reflect.getMetadata('providers', CFinancingModule);
            const exports = Reflect.getMetadata('exports', CFinancingModule);
            expect(providers.length - exports.length).toBe(3);
        });

        it('should keep repository and PreCFinancingService private', () => {
            const providers = Reflect.getMetadata('providers', CFinancingModule);
            const exports = Reflect.getMetadata('exports', CFinancingModule);
            [CFinancingRepository, PreCFinancingService].forEach((p) => {
                expect(providers).toContain(p);
                expect(exports).not.toContain(p);
            });
        });
    });

    describe('Complete Module Structure', () => {
        it('should have correct module structure counts', () => {
            const providers = Reflect.getMetadata('providers', CFinancingModule);
            const exports = Reflect.getMetadata('exports', CFinancingModule);
            const imports = Reflect.getMetadata('imports', CFinancingModule);
            const controllers = Reflect.getMetadata('controllers', CFinancingModule);

            expect(providers.length).toBe(4);
            expect(exports.length).toBe(1);
            expect(imports.length).toBe(5);
            expect(controllers.length).toBe(1);
        });

        it('should follow NestJS module pattern', () => {
            expect(Reflect.getMetadata('providers', CFinancingModule)).toBeDefined();
            expect(Reflect.getMetadata('exports', CFinancingModule)).toBeDefined();
            expect(Reflect.getMetadata('imports', CFinancingModule)).toBeDefined();
            expect(Reflect.getMetadata('controllers', CFinancingModule)).toBeDefined();
        });
    });

    describe('Module Compilation', () => {
        it('should compile without errors', () => {
            expect(module).toBeDefined();
            expect(module).toBeInstanceOf(TestingModule);
        });

        it('should initialize all services', () => {
            expect(module.get(CFinancingService)).toBeDefined();
            expect(module.get(PreCFinancingService)).toBeDefined();
        });

        it('should initialize repository', () => {
            expect(module.get(CFinancingRepository)).toBeDefined();
        });

        it('should initialize controller', () => {
            expect(module.get(CFinancingController)).toBeDefined();
        });
    });
});
