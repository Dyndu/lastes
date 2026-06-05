import { Test, TestingModule } from '@nestjs/testing';
import { WholesaleModule } from './wholesale.module';
import { WholesaleController } from './wholesale.controller';
import { WholesaleRepository } from './wholesale.repository';
import {
    WholesaleService,
    PreWholesaleService,
    TransformWholesaleEntityService,
    WholesaleCalculatorService,
} from './services';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WholesaleEntity } from './entities/wholesale.entity';
import { Reflector } from '@nestjs/core';
import { RAnalysisModule } from '../r-analysis/r-analysis.module';
import { ABuilderModule } from '../a-builder/a-builder.module';
import { FFlipModule } from '../fix-flip/f-flip.module';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('WholesaleModule', () => {
    let module: TestingModule;

    const mockRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockEnvConfigService = {
        sAdminRole: 'superadmin',
        adminRole: 'admin',
        userRole: 'user',
        supportRole: 'support',
    };

    const mockErrorHandlerService = {
        forbidden: jest.fn((_message: string) => {
            throw new Error(_message);
        }),
    };

    const mockReflector = { get: jest.fn(), getAllAndOverride: jest.fn() };

    const mockWholesaleService = {
        getWholesaleAnalysisBuilder: jest.fn(),
        getWholesaleSummary: jest.fn(),
        resolveWholesaleBuilder: jest.fn(),
    };
    const mockPreWholesaleService = {
        createWholesale: jest.fn(),
        getOrCreateIStrategyBuilder: jest.fn(),
    };
    const mockTransformWholesaleEntityService = { transformWholesaleABuilder: jest.fn() };
    const mockWholesaleCalculatorService = { computeWholesaleSummary: jest.fn() };

    beforeEach(async () => {
        module = await Test.createTestingModule({
            controllers: [WholesaleController],
            providers: [
                { provide: WholesaleRepository, useValue: mockRepository },
                { provide: EnvConfigService, useValue: mockEnvConfigService },
                { provide: ErrorHandlerService, useValue: mockErrorHandlerService },
                { provide: WholesaleService, useValue: mockWholesaleService },
                { provide: PreWholesaleService, useValue: mockPreWholesaleService },
                {
                    provide: TransformWholesaleEntityService,
                    useValue: mockTransformWholesaleEntityService,
                },
                { provide: WholesaleCalculatorService, useValue: mockWholesaleCalculatorService },
                { provide: getRepositoryToken(WholesaleEntity), useValue: mockRepository },
                { provide: Reflector, useValue: mockReflector },
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
        it('should have WholesaleController defined', () => {
            expect(module.get<WholesaleController>(WholesaleController)).toBeDefined();
        });

        it('should create WholesaleController instance', () => {
            expect(module.get<WholesaleController>(WholesaleController)).toBeInstanceOf(
                WholesaleController,
            );
        });
    });

    describe('Providers', () => {
        it('should have WholesaleRepository defined', () => {
            expect(module.get<WholesaleRepository>(WholesaleRepository)).toBeDefined();
        });

        it('should have WholesaleService defined', () => {
            expect(module.get(WholesaleService)).toBeDefined();
        });

        it('should have PreWholesaleService defined', () => {
            expect(module.get(PreWholesaleService)).toBeDefined();
        });

        it('should have WholesaleCalculatorService defined', () => {
            expect(module.get(WholesaleCalculatorService)).toBeDefined();
        });

        it('should have TransformWholesaleEntityService defined', () => {
            expect(module.get(TransformWholesaleEntityService)).toBeDefined();
        });
    });

    describe('Module Metadata', () => {
        it('should have controllers metadata', () => {
            const controllers = Reflect.getMetadata('controllers', WholesaleModule);
            expect(controllers).toBeDefined();
            expect(controllers).toContain(WholesaleController);
        });

        it('should have providers metadata', () => {
            const providers = Reflect.getMetadata('providers', WholesaleModule);
            expect(providers).toBeDefined();
            expect(providers).toContain(WholesaleRepository);
            expect(providers).toContain(WholesaleService);
            expect(providers).toContain(PreWholesaleService);
            expect(providers).toContain(WholesaleCalculatorService);
            expect(providers).toContain(TransformWholesaleEntityService);
        });

        it('should have exports metadata', () => {
            const exports = Reflect.getMetadata('exports', WholesaleModule);
            expect(exports).toBeDefined();
            expect(exports).toContain(WholesaleService);
        });

        it('should have imports metadata', () => {
            const imports = Reflect.getMetadata('imports', WholesaleModule);
            expect(imports).toBeDefined();
            expect(imports.length).toBe(5);
        });

        it('should have correct number of controllers', () => {
            const controllers = Reflect.getMetadata('controllers', WholesaleModule);
            expect(controllers.length).toBe(1);
        });

        it('should have correct number of providers', () => {
            const providers = Reflect.getMetadata('providers', WholesaleModule);
            expect(providers.length).toBe(5);
        });

        it('should have correct number of exports', () => {
            const exports = Reflect.getMetadata('exports', WholesaleModule);
            expect(exports.length).toBe(1);
        });
    });

    describe('Module Imports', () => {
        it('should import RAnalysisModule', () => {
            const imports = Reflect.getMetadata('imports', WholesaleModule);
            expect(imports).toContain(RAnalysisModule);
        });

        it('should import ABuilderModule', () => {
            const imports = Reflect.getMetadata('imports', WholesaleModule);
            expect(imports).toContain(ABuilderModule);
        });

        it('should import FFlipModule', () => {
            const imports = Reflect.getMetadata('imports', WholesaleModule);
            expect(imports).toContain(FFlipModule);
        });

        it('should have 5 imports (DatabaseModule, forFeature, RAnalysisModule, FFlipModule, ABuilderModule)', () => {
            const imports = Reflect.getMetadata('imports', WholesaleModule);
            expect(imports.length).toBe(5);
        });
    });

    describe('Exports Verification', () => {
        it('should export only WholesaleService', () => {
            const exports = Reflect.getMetadata('exports', WholesaleModule);
            expect(exports).toEqual([WholesaleService]);
        });

        it('should not export WholesaleRepository', () => {
            const exports = Reflect.getMetadata('exports', WholesaleModule);
            expect(exports).not.toContain(WholesaleRepository);
        });

        it('should not export PreWholesaleService', () => {
            const exports = Reflect.getMetadata('exports', WholesaleModule);
            expect(exports).not.toContain(PreWholesaleService);
        });

        it('should not export WholesaleCalculatorService', () => {
            const exports = Reflect.getMetadata('exports', WholesaleModule);
            expect(exports).not.toContain(WholesaleCalculatorService);
        });

        it('should not export TransformWholesaleEntityService', () => {
            const exports = Reflect.getMetadata('exports', WholesaleModule);
            expect(exports).not.toContain(TransformWholesaleEntityService);
        });

        it('should not export WholesaleController', () => {
            const exports = Reflect.getMetadata('exports', WholesaleModule);
            expect(exports).not.toContain(WholesaleController);
        });
    });

    describe('Provider Instances', () => {
        it('should get WholesaleRepository instance', () => {
            expect(module.get<WholesaleRepository>(WholesaleRepository)).toBe(mockRepository);
        });

        it('should get WholesaleService instance', () => {
            expect(module.get(WholesaleService)).toBe(mockWholesaleService);
        });

        it('should get PreWholesaleService instance', () => {
            expect(module.get(PreWholesaleService)).toBe(mockPreWholesaleService);
        });

        it('should get WholesaleCalculatorService instance', () => {
            expect(module.get(WholesaleCalculatorService)).toBe(mockWholesaleCalculatorService);
        });

        it('should get TransformWholesaleEntityService instance', () => {
            expect(module.get(TransformWholesaleEntityService)).toBe(
                mockTransformWholesaleEntityService,
            );
        });
    });

    describe('Provider Uniqueness', () => {
        it('should return same WholesaleService instance (singleton)', () => {
            expect(module.get(WholesaleService)).toBe(module.get(WholesaleService));
        });

        it('should return same WholesaleRepository instance (singleton)', () => {
            expect(module.get(WholesaleRepository)).toBe(module.get(WholesaleRepository));
        });
    });

    describe('Module Encapsulation', () => {
        it('should expose only WholesaleService to other modules', () => {
            const exports = Reflect.getMetadata('exports', WholesaleModule);
            expect(exports).toEqual([WholesaleService]);
        });

        it('should keep 4 providers internal', () => {
            const providers = Reflect.getMetadata('providers', WholesaleModule);
            const exports = Reflect.getMetadata('exports', WholesaleModule);
            expect(providers.length - exports.length).toBe(4);
        });

        it('should have providers in correct order', () => {
            const providers = Reflect.getMetadata('providers', WholesaleModule);
            expect(providers[0]).toBe(WholesaleRepository);
            expect(providers[1]).toBe(WholesaleService);
            expect(providers[2]).toBe(PreWholesaleService);
            expect(providers[3]).toBe(WholesaleCalculatorService);
            expect(providers[4]).toBe(TransformWholesaleEntityService);
        });
    });

    describe('Entity Configuration', () => {
        it('should have WholesaleEntity token available', () => {
            const token = getRepositoryToken(WholesaleEntity);
            expect(token).toBeDefined();
        });

        it('should register WholesaleEntity token correctly', () => {
            const token = getRepositoryToken(WholesaleEntity);
            expect(token).toBe('WholesaleEntityRepository');
        });
    });

    describe('Module Compilation', () => {
        it('should compile without errors', () => {
            expect(module).toBeDefined();
            expect(module).toBeInstanceOf(TestingModule);
        });

        it('should initialize all providers', () => {
            expect(module.get(WholesaleRepository)).toBeDefined();
            expect(module.get(WholesaleService)).toBeDefined();
            expect(module.get(PreWholesaleService)).toBeDefined();
            expect(module.get(WholesaleCalculatorService)).toBeDefined();
            expect(module.get(TransformWholesaleEntityService)).toBeDefined();
        });

        it('should initialize all controllers', () => {
            expect(module.get(WholesaleController)).toBeDefined();
        });
    });
});
