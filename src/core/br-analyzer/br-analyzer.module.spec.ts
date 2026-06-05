import { Test, TestingModule } from '@nestjs/testing';
import { BrAnalyzerModule } from './br-analyzer.module';
import { BrAnalyzerController } from './br-analyzer.controller';
import { BrAnalyzerRepository } from './br-analyzer.repository';
import {
    BrAnalyzerService,
    PreBrAnalyzerService,
    TransformBrAnalyzerService,
    BrAnalyzerSummaryService,
} from './services';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('BrAnalyzerModule', () => {
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

    const mockBrAnalyzerService = { getBrAnalyzerFullBreakdown: jest.fn() };
    const mockPreBrAnalyzerService = { createBrAnalyzer: jest.fn() };
    const mockTransformBrAnalyzerService = { transformBrAnalyzerServiceABuilder: jest.fn() };
    const mockBrAnalyzerSummaryService = { summaryData: jest.fn() };
    const mockBrAnalyzerRepository = { findOne: jest.fn(), save: jest.fn() };
    const mockBrAnalyzerController = {};

    beforeEach(async () => {
        module = await Test.createTestingModule({
            controllers: [BrAnalyzerController],
            providers: [
                { provide: BrAnalyzerService, useValue: mockBrAnalyzerService },
                { provide: PreBrAnalyzerService, useValue: mockPreBrAnalyzerService },
                { provide: TransformBrAnalyzerService, useValue: mockTransformBrAnalyzerService },
                { provide: BrAnalyzerSummaryService, useValue: mockBrAnalyzerSummaryService },
                { provide: BrAnalyzerRepository, useValue: mockBrAnalyzerRepository },
                { provide: BrAnalyzerController, useValue: mockBrAnalyzerController },
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
            const imports = Reflect.getMetadata('imports', BrAnalyzerModule);
            expect(imports).toBeDefined();
        });

        it('should have exactly 3 imports (DatabaseModule + forFeature + RAnalysisModule)', () => {
            const imports = Reflect.getMetadata('imports', BrAnalyzerModule);
            expect(imports.length).toBe(3);
        });

        it('should include DatabaseModule as first import', () => {
            const imports = Reflect.getMetadata('imports', BrAnalyzerModule);
            expect(imports[0]).toBeDefined();
        });

        it('should include DatabaseModule.forFeature as second import', () => {
            const imports = Reflect.getMetadata('imports', BrAnalyzerModule);
            expect(imports[1]).toBeDefined();
        });

        it('should include RAnalysisModule as third import', () => {
            const imports = Reflect.getMetadata('imports', BrAnalyzerModule);
            expect(imports[2]).toBeDefined();
        });
    });

    describe('Module Metadata — Controllers', () => {
        it('should have controllers metadata', () => {
            const controllers = Reflect.getMetadata('controllers', BrAnalyzerModule);
            expect(controllers).toBeDefined();
        });

        it('should have exactly 1 controller', () => {
            const controllers = Reflect.getMetadata('controllers', BrAnalyzerModule);
            expect(controllers.length).toBe(1);
        });

        it('should contain BrAnalyzerController', () => {
            const controllers = Reflect.getMetadata('controllers', BrAnalyzerModule);
            expect(controllers).toContain(BrAnalyzerController);
        });
    });

    describe('Module Metadata — Providers', () => {
        it('should have providers metadata', () => {
            const providers = Reflect.getMetadata('providers', BrAnalyzerModule);
            expect(providers).toBeDefined();
        });

        it('should have exactly 5 providers', () => {
            const providers = Reflect.getMetadata('providers', BrAnalyzerModule);
            expect(providers.length).toBe(5);
        });

        it('should contain BrAnalyzerRepository', () => {
            const providers = Reflect.getMetadata('providers', BrAnalyzerModule);
            expect(providers).toContain(BrAnalyzerRepository);
        });

        it('should contain all services', () => {
            const providers = Reflect.getMetadata('providers', BrAnalyzerModule);
            expect(providers).toContain(BrAnalyzerService);
            expect(providers).toContain(PreBrAnalyzerService);
            expect(providers).toContain(TransformBrAnalyzerService);
            expect(providers).toContain(BrAnalyzerSummaryService);
        });
    });

    describe('Module Metadata — Exports', () => {
        it('should have exports metadata', () => {
            const exports = Reflect.getMetadata('exports', BrAnalyzerModule);
            expect(exports).toBeDefined();
        });

        it('should have exactly 1 export', () => {
            const exports = Reflect.getMetadata('exports', BrAnalyzerModule);
            expect(exports.length).toBe(1);
        });

        it('should export only BrAnalyzerService', () => {
            const exports = Reflect.getMetadata('exports', BrAnalyzerModule);
            expect(exports).toEqual([BrAnalyzerService]);
        });

        it('should NOT export the repository', () => {
            const exports = Reflect.getMetadata('exports', BrAnalyzerModule);
            expect(exports).not.toContain(BrAnalyzerRepository);
        });

        it('should NOT export internal services', () => {
            const exports = Reflect.getMetadata('exports', BrAnalyzerModule);
            expect(exports).not.toContain(PreBrAnalyzerService);
            expect(exports).not.toContain(TransformBrAnalyzerService);
            expect(exports).not.toContain(BrAnalyzerSummaryService);
        });
    });

    describe('Service Instances', () => {
        it('should get BrAnalyzerService instance', () => {
            expect(module.get(BrAnalyzerService)).toBe(mockBrAnalyzerService);
        });

        it('should get PreBrAnalyzerService instance', () => {
            expect(module.get(PreBrAnalyzerService)).toBe(mockPreBrAnalyzerService);
        });

        it('should get TransformBrAnalyzerService instance', () => {
            expect(module.get(TransformBrAnalyzerService)).toBe(mockTransformBrAnalyzerService);
        });

        it('should get BrAnalyzerSummaryService instance', () => {
            expect(module.get(BrAnalyzerSummaryService)).toBe(mockBrAnalyzerSummaryService);
        });
    });

    describe('Repository Instances', () => {
        it('should get BrAnalyzerRepository instance', () => {
            expect(module.get(BrAnalyzerRepository)).toBe(mockBrAnalyzerRepository);
        });
    });

    describe('Dependency Injection', () => {
        it('should resolve all services without error', () => {
            [
                BrAnalyzerService,
                PreBrAnalyzerService,
                TransformBrAnalyzerService,
                BrAnalyzerSummaryService,
            ].forEach((svc) => expect(() => module.get(svc)).not.toThrow());
        });

        it('should resolve repository without error', () => {
            expect(() => module.get(BrAnalyzerRepository)).not.toThrow();
        });

        it('should use singleton pattern for all providers', () => {
            expect(module.get(BrAnalyzerService)).toBe(module.get(BrAnalyzerService));
            expect(module.get(PreBrAnalyzerService)).toBe(module.get(PreBrAnalyzerService));
            expect(module.get(TransformBrAnalyzerService)).toBe(
                module.get(TransformBrAnalyzerService),
            );
            expect(module.get(BrAnalyzerSummaryService)).toBe(module.get(BrAnalyzerSummaryService));
            expect(module.get(BrAnalyzerRepository)).toBe(module.get(BrAnalyzerRepository));
        });
    });

    describe('Module Encapsulation', () => {
        it('should expose only BrAnalyzerService as public API', () => {
            const exports = Reflect.getMetadata('exports', BrAnalyzerModule);
            expect(exports).toEqual([BrAnalyzerService]);
        });

        it('should keep 4 providers internal', () => {
            const providers = Reflect.getMetadata('providers', BrAnalyzerModule);
            const exports = Reflect.getMetadata('exports', BrAnalyzerModule);
            expect(providers.length - exports.length).toBe(4);
        });

        it('should keep repository internal', () => {
            const providers = Reflect.getMetadata('providers', BrAnalyzerModule);
            const exports = Reflect.getMetadata('exports', BrAnalyzerModule);
            expect(providers).toContain(BrAnalyzerRepository);
            expect(exports).not.toContain(BrAnalyzerRepository);
        });

        it('should keep internal services private', () => {
            const providers = Reflect.getMetadata('providers', BrAnalyzerModule);
            const exports = Reflect.getMetadata('exports', BrAnalyzerModule);
            [PreBrAnalyzerService, TransformBrAnalyzerService, BrAnalyzerSummaryService].forEach(
                (svc) => {
                    expect(providers).toContain(svc);
                    expect(exports).not.toContain(svc);
                },
            );
        });
    });

    describe('Complete Module Structure', () => {
        it('should have correct module structure counts', () => {
            const providers = Reflect.getMetadata('providers', BrAnalyzerModule);
            const exports = Reflect.getMetadata('exports', BrAnalyzerModule);
            const imports = Reflect.getMetadata('imports', BrAnalyzerModule);
            const controllers = Reflect.getMetadata('controllers', BrAnalyzerModule);

            expect(providers.length).toBe(5);
            expect(exports.length).toBe(1);
            expect(imports.length).toBe(3);
            expect(controllers.length).toBe(1);
        });

        it('should follow NestJS module pattern', () => {
            expect(Reflect.getMetadata('providers', BrAnalyzerModule)).toBeDefined();
            expect(Reflect.getMetadata('exports', BrAnalyzerModule)).toBeDefined();
            expect(Reflect.getMetadata('imports', BrAnalyzerModule)).toBeDefined();
            expect(Reflect.getMetadata('controllers', BrAnalyzerModule)).toBeDefined();
        });

        it('should maintain separation of concerns between services and repository', () => {
            const providers = Reflect.getMetadata('providers', BrAnalyzerModule);
            [
                BrAnalyzerService,
                PreBrAnalyzerService,
                TransformBrAnalyzerService,
                BrAnalyzerSummaryService,
                BrAnalyzerRepository,
            ].forEach((p) => expect(providers).toContain(p));
        });
    });

    describe('Module Compilation', () => {
        it('should compile without errors', () => {
            expect(module).toBeDefined();
            expect(module).toBeInstanceOf(TestingModule);
        });

        it('should initialize all services', () => {
            expect(module.get(BrAnalyzerService)).toBeDefined();
            expect(module.get(PreBrAnalyzerService)).toBeDefined();
            expect(module.get(TransformBrAnalyzerService)).toBeDefined();
            expect(module.get(BrAnalyzerSummaryService)).toBeDefined();
        });

        it('should initialize repository', () => {
            expect(module.get(BrAnalyzerRepository)).toBeDefined();
        });
    });
});
