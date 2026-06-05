import { Test, TestingModule } from '@nestjs/testing';
import { FFlipModule } from './f-flip.module';
import {
    FFlipService,
    FFlipSummaryService,
    PreFFlipService,
    TransformFFlipService,
} from './services';
import { FFlipController } from './f-flip.controller';
import { FFlipRepository } from './f-flip.repository';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('FFlipModule', () => {
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
    };

    const mockFFlipService = { getFFlipAnalysisBuilder: jest.fn() };
    const mockFFlipSummaryService = { calculateMaxOffer: jest.fn() };
    const mockPreFFlipService = { createFFlip: jest.fn() };
    const mockTransformFFlipService = { transformFFlipABuilder: jest.fn() };
    const mockFFlipRepository = { findOne: jest.fn(), save: jest.fn() };

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [
                { provide: FFlipService, useValue: mockFFlipService },
                { provide: FFlipSummaryService, useValue: mockFFlipSummaryService },
                { provide: PreFFlipService, useValue: mockPreFFlipService },
                { provide: TransformFFlipService, useValue: mockTransformFFlipService },
                { provide: FFlipRepository, useValue: mockFFlipRepository },
                {
                    provide: EnvConfigService,
                    useValue: mockEnvConfigService,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandlerService,
                },
            ],
            controllers: [FFlipController],
        })
            .overrideProvider(FFlipService)
            .useValue(mockFFlipService)
            .compile();
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
            const imports = Reflect.getMetadata('imports', FFlipModule);
            expect(imports).toBeDefined();
        });

        it('should have exactly 4 imports', () => {
            const imports = Reflect.getMetadata('imports', FFlipModule);
            expect(imports.length).toBe(4);
        });

        it('should include DatabaseModule as first import', () => {
            const imports = Reflect.getMetadata('imports', FFlipModule);
            expect(imports[0]).toBeDefined();
        });

        it('should include DatabaseModule.forFeature as second import', () => {
            const imports = Reflect.getMetadata('imports', FFlipModule);
            expect(imports[1]).toBeDefined();
        });

        it('should include RAnalysisModule as third import', () => {
            const imports = Reflect.getMetadata('imports', FFlipModule);
            expect(imports[2]).toBeDefined();
        });

        it('should include ABuilderModule as fourth import', () => {
            const imports = Reflect.getMetadata('imports', FFlipModule);
            expect(imports[3]).toBeDefined();
        });
    });

    describe('Module Metadata — Controllers', () => {
        it('should have controllers metadata', () => {
            const controllers = Reflect.getMetadata('controllers', FFlipModule);
            expect(controllers).toBeDefined();
        });

        it('should have exactly 1 controller', () => {
            const controllers = Reflect.getMetadata('controllers', FFlipModule);
            expect(controllers.length).toBe(1);
        });

        it('should contain FFlipController', () => {
            const controllers = Reflect.getMetadata('controllers', FFlipModule);
            expect(controllers).toContain(FFlipController);
        });
    });

    describe('Module Metadata — Providers', () => {
        it('should have providers metadata', () => {
            const providers = Reflect.getMetadata('providers', FFlipModule);
            expect(providers).toBeDefined();
        });

        it('should have exactly 5 providers', () => {
            const providers = Reflect.getMetadata('providers', FFlipModule);
            expect(providers.length).toBe(5);
        });

        it('should contain FFlipRepository', () => {
            const providers = Reflect.getMetadata('providers', FFlipModule);
            expect(providers).toContain(FFlipRepository);
        });

        it('should contain FFlipService', () => {
            const providers = Reflect.getMetadata('providers', FFlipModule);
            expect(providers).toContain(FFlipService);
        });

        it('should contain PreFFlipService', () => {
            const providers = Reflect.getMetadata('providers', FFlipModule);
            expect(providers).toContain(PreFFlipService);
        });

        it('should contain TransformFFlipService', () => {
            const providers = Reflect.getMetadata('providers', FFlipModule);
            expect(providers).toContain(TransformFFlipService);
        });

        it('should contain FFlipSummaryService', () => {
            const providers = Reflect.getMetadata('providers', FFlipModule);
            expect(providers).toContain(FFlipSummaryService);
        });
    });

    describe('Module Metadata — Exports', () => {
        it('should have exports metadata', () => {
            const exports = Reflect.getMetadata('exports', FFlipModule);
            expect(exports).toBeDefined();
        });

        it('should have exactly 1 export', () => {
            const exports = Reflect.getMetadata('exports', FFlipModule);
            expect(exports.length).toBe(1);
        });

        it('should export only FFlipService', () => {
            const exports = Reflect.getMetadata('exports', FFlipModule);
            expect(exports).toEqual([FFlipService]);
        });

        it('should NOT export FFlipRepository', () => {
            const exports = Reflect.getMetadata('exports', FFlipModule);
            expect(exports).not.toContain(FFlipRepository);
        });

        it('should NOT export internal services', () => {
            const exports = Reflect.getMetadata('exports', FFlipModule);
            [PreFFlipService, TransformFFlipService, FFlipSummaryService].forEach((svc) =>
                expect(exports).not.toContain(svc),
            );
        });
    });

    describe('Service Instances', () => {
        it('should get FFlipService instance', () => {
            expect(module.get(FFlipService)).toBe(mockFFlipService);
        });

        it('should get FFlipSummaryService instance', () => {
            expect(module.get(FFlipSummaryService)).toBe(mockFFlipSummaryService);
        });

        it('should get PreFFlipService instance', () => {
            expect(module.get(PreFFlipService)).toBe(mockPreFFlipService);
        });

        it('should get TransformFFlipService instance', () => {
            expect(module.get(TransformFFlipService)).toBe(mockTransformFFlipService);
        });

        it('should get FFlipRepository instance', () => {
            expect(module.get(FFlipRepository)).toBe(mockFFlipRepository);
        });
    });

    describe('Controller Instances', () => {
        it('should get FFlipController instance', () => {
            expect(module.get(FFlipController)).toBeDefined();
        });
    });

    describe('Dependency Injection', () => {
        it('should resolve all services without error', () => {
            [FFlipService, FFlipSummaryService, PreFFlipService, TransformFFlipService].forEach(
                (svc) => expect(() => module.get(svc)).not.toThrow(),
            );
        });

        it('should resolve FFlipRepository without error', () => {
            expect(() => module.get(FFlipRepository)).not.toThrow();
        });

        it('should use singleton pattern for all providers', () => {
            expect(module.get(FFlipService)).toBe(module.get(FFlipService));
            expect(module.get(FFlipSummaryService)).toBe(module.get(FFlipSummaryService));
            expect(module.get(PreFFlipService)).toBe(module.get(PreFFlipService));
            expect(module.get(TransformFFlipService)).toBe(module.get(TransformFFlipService));
            expect(module.get(FFlipRepository)).toBe(module.get(FFlipRepository));
        });
    });

    describe('Module Encapsulation', () => {
        it('should expose only FFlipService as public API', () => {
            const exports = Reflect.getMetadata('exports', FFlipModule);
            expect(exports).toEqual([FFlipService]);
        });

        it('should keep 4 providers internal', () => {
            const providers = Reflect.getMetadata('providers', FFlipModule);
            const exports = Reflect.getMetadata('exports', FFlipModule);
            expect(providers.length - exports.length).toBe(4);
        });

        it('should keep FFlipRepository internal', () => {
            const providers = Reflect.getMetadata('providers', FFlipModule);
            const exports = Reflect.getMetadata('exports', FFlipModule);
            expect(providers).toContain(FFlipRepository);
            expect(exports).not.toContain(FFlipRepository);
        });

        it('should keep all internal services private', () => {
            const providers = Reflect.getMetadata('providers', FFlipModule);
            const exports = Reflect.getMetadata('exports', FFlipModule);
            [PreFFlipService, TransformFFlipService, FFlipSummaryService].forEach((svc) => {
                expect(providers).toContain(svc);
                expect(exports).not.toContain(svc);
            });
        });
    });

    describe('Complete Module Structure', () => {
        it('should have correct module structure counts', () => {
            const providers = Reflect.getMetadata('providers', FFlipModule);
            const exports = Reflect.getMetadata('exports', FFlipModule);
            const imports = Reflect.getMetadata('imports', FFlipModule);
            const controllers = Reflect.getMetadata('controllers', FFlipModule);

            expect(providers.length).toBe(5);
            expect(exports.length).toBe(1);
            expect(imports.length).toBe(4);
            expect(controllers.length).toBe(1);
        });

        it('should follow NestJS module pattern', () => {
            expect(Reflect.getMetadata('providers', FFlipModule)).toBeDefined();
            expect(Reflect.getMetadata('exports', FFlipModule)).toBeDefined();
            expect(Reflect.getMetadata('imports', FFlipModule)).toBeDefined();
            expect(Reflect.getMetadata('controllers', FFlipModule)).toBeDefined();
        });
    });

    describe('Module Compilation', () => {
        it('should compile without errors', () => {
            expect(module).toBeDefined();
            expect(module).toBeInstanceOf(TestingModule);
        });

        it('should initialize all services', () => {
            expect(module.get(FFlipService)).toBeDefined();
            expect(module.get(FFlipSummaryService)).toBeDefined();
            expect(module.get(PreFFlipService)).toBeDefined();
            expect(module.get(TransformFFlipService)).toBeDefined();
        });

        it('should initialize FFlipRepository', () => {
            expect(module.get(FFlipRepository)).toBeDefined();
        });

        it('should initialize FFlipController', () => {
            expect(module.get(FFlipController)).toBeDefined();
        });
    });
});
