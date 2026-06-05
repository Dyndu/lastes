import { Test, TestingModule } from '@nestjs/testing';
import { RAnalysisModule } from './r-analysis.module';
import { RAnalysisController } from './r-analysis.controller';
import { RAnalysisRepository } from './repositories/r-analysis.repository';
import {
    RAnalysisService,
    PreRAnalysisService,
    RaABuilderService,
    TransformRaService,
} from './services';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RAnalysisEntity } from './entities/r-analysis.entity';
import { Reflector } from '@nestjs/core';
import { AnalysisModule } from '../analysis/analysis.module';
import { ABuilderModule } from '../a-builder/a-builder.module';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('RAnalysisModule', () => {
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
        forbidden: jest.fn((_message, userMessage) => {
            throw new Error(userMessage);
        }),
    };

    const mockRAnalysisService = { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn() };
    const mockPreRAnalysisService = { prepare: jest.fn() };
    const mockRaABuilderService = { build: jest.fn() };
    const mockTransformRaService = { transform: jest.fn() };

    beforeEach(async () => {
        module = await Test.createTestingModule({
            controllers: [RAnalysisController],
            providers: [
                { provide: RAnalysisRepository, useValue: mockRepository },
                {
                    provide: EnvConfigService,
                    useValue: mockEnvConfigService,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandlerService,
                },
                { provide: RAnalysisService, useValue: mockRAnalysisService },
                { provide: PreRAnalysisService, useValue: mockPreRAnalysisService },
                { provide: RaABuilderService, useValue: mockRaABuilderService },
                { provide: TransformRaService, useValue: mockTransformRaService },
                { provide: getRepositoryToken(RAnalysisEntity), useValue: mockRepository },
                { provide: Reflector, useValue: { get: jest.fn(), getAllAndOverride: jest.fn() } },
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
        it('should have RAnalysisController defined', () => {
            expect(module.get<RAnalysisController>(RAnalysisController)).toBeDefined();
        });

        it('should create RAnalysisController instance', () => {
            expect(module.get<RAnalysisController>(RAnalysisController)).toBeInstanceOf(
                RAnalysisController,
            );
        });
    });

    describe('Providers', () => {
        it('should have RAnalysisRepository defined', () => {
            expect(module.get<RAnalysisRepository>(RAnalysisRepository)).toBeDefined();
        });

        it('should have RAnalysisService defined', () => {
            expect(module.get(RAnalysisService)).toBeDefined();
        });

        it('should have PreRAnalysisService defined', () => {
            expect(module.get(PreRAnalysisService)).toBeDefined();
        });

        it('should have RaABuilderService defined', () => {
            expect(module.get(RaABuilderService)).toBeDefined();
        });

        it('should have TransformRaService defined', () => {
            expect(module.get(TransformRaService)).toBeDefined();
        });
    });

    describe('Module Metadata', () => {
        it('should have controllers metadata', () => {
            const controllers = Reflect.getMetadata('controllers', RAnalysisModule);
            expect(controllers).toBeDefined();
            expect(controllers).toContain(RAnalysisController);
        });

        it('should have providers metadata', () => {
            const providers = Reflect.getMetadata('providers', RAnalysisModule);
            expect(providers).toBeDefined();
            expect(providers).toContain(RAnalysisRepository);
            expect(providers).toContain(RAnalysisService);
            expect(providers).toContain(PreRAnalysisService);
            expect(providers).toContain(RaABuilderService);
            expect(providers).toContain(TransformRaService);
        });

        it('should have exports metadata', () => {
            const exports = Reflect.getMetadata('exports', RAnalysisModule);
            expect(exports).toBeDefined();
            expect(exports).toContain(RAnalysisService);
        });

        it('should have imports metadata', () => {
            const imports = Reflect.getMetadata('imports', RAnalysisModule);
            expect(imports).toBeDefined();
            expect(imports.length).toBe(4);
        });

        it('should have correct number of controllers', () => {
            const controllers = Reflect.getMetadata('controllers', RAnalysisModule);
            expect(controllers.length).toBe(1);
        });

        it('should have correct number of providers', () => {
            const providers = Reflect.getMetadata('providers', RAnalysisModule);
            expect(providers.length).toBe(5);
        });

        it('should have correct number of exports', () => {
            const exports = Reflect.getMetadata('exports', RAnalysisModule);
            expect(exports.length).toBe(1);
        });
    });

    describe('Module Imports', () => {
        it('should import AnalysisModule', () => {
            const imports = Reflect.getMetadata('imports', RAnalysisModule);
            expect(imports).toContain(AnalysisModule);
        });

        it('should import ABuilderModule', () => {
            const imports = Reflect.getMetadata('imports', RAnalysisModule);
            expect(imports).toContain(ABuilderModule);
        });

        it('should have 4 imports (DatabaseModule, forFeature, AnalysisModule, ABuilderModule)', () => {
            const imports = Reflect.getMetadata('imports', RAnalysisModule);
            expect(imports.length).toBe(4);
        });
    });

    describe('Exports Verification', () => {
        it('should export only RAnalysisService', () => {
            const exports = Reflect.getMetadata('exports', RAnalysisModule);
            expect(exports).toContain(RAnalysisService);
            expect(exports.length).toBe(1);
        });

        it('should not export RAnalysisRepository', () => {
            const exports = Reflect.getMetadata('exports', RAnalysisModule);
            expect(exports).not.toContain(RAnalysisRepository);
        });

        it('should not export PreRAnalysisService', () => {
            const exports = Reflect.getMetadata('exports', RAnalysisModule);
            expect(exports).not.toContain(PreRAnalysisService);
        });

        it('should not export RaABuilderService', () => {
            const exports = Reflect.getMetadata('exports', RAnalysisModule);
            expect(exports).not.toContain(RaABuilderService);
        });

        it('should not export TransformRaService', () => {
            const exports = Reflect.getMetadata('exports', RAnalysisModule);
            expect(exports).not.toContain(TransformRaService);
        });

        it('should not export RAnalysisController', () => {
            const exports = Reflect.getMetadata('exports', RAnalysisModule);
            expect(exports).not.toContain(RAnalysisController);
        });
    });

    describe('Provider Instances', () => {
        it('should get RAnalysisRepository instance', () => {
            expect(module.get<RAnalysisRepository>(RAnalysisRepository)).toBe(mockRepository);
        });

        it('should get RAnalysisService instance', () => {
            expect(module.get(RAnalysisService)).toBe(mockRAnalysisService);
        });

        it('should get PreRAnalysisService instance', () => {
            expect(module.get(PreRAnalysisService)).toBe(mockPreRAnalysisService);
        });

        it('should get RaABuilderService instance', () => {
            expect(module.get(RaABuilderService)).toBe(mockRaABuilderService);
        });

        it('should get TransformRaService instance', () => {
            expect(module.get(TransformRaService)).toBe(mockTransformRaService);
        });
    });

    describe('Provider Uniqueness', () => {
        it('should return same RAnalysisService instance (singleton)', () => {
            expect(module.get(RAnalysisService)).toBe(module.get(RAnalysisService));
        });

        it('should return same RAnalysisRepository instance (singleton)', () => {
            expect(module.get(RAnalysisRepository)).toBe(module.get(RAnalysisRepository));
        });
    });

    describe('Module Encapsulation', () => {
        it('should expose only RAnalysisService to other modules', () => {
            const exports = Reflect.getMetadata('exports', RAnalysisModule);
            expect(exports).toEqual([RAnalysisService]);
        });

        it('should keep 4 providers internal', () => {
            const providers = Reflect.getMetadata('providers', RAnalysisModule);
            const exports = Reflect.getMetadata('exports', RAnalysisModule);
            expect(providers.length - exports.length).toBe(4);
        });

        it('should have providers in correct order', () => {
            const providers = Reflect.getMetadata('providers', RAnalysisModule);
            expect(providers[0]).toBe(RAnalysisRepository);
            expect(providers[1]).toBe(RAnalysisService);
            expect(providers[2]).toBe(PreRAnalysisService);
            expect(providers[3]).toBe(RaABuilderService);
            expect(providers[4]).toBe(TransformRaService);
        });
    });

    describe('Entity Configuration', () => {
        it('should have RAnalysisEntity token available', () => {
            const token = getRepositoryToken(RAnalysisEntity);
            expect(token).toBeDefined();
        });

        it('should register RAnalysisEntity token correctly', () => {
            const token = getRepositoryToken(RAnalysisEntity);
            expect(token).toBe('RAnalysisEntityRepository');
        });
    });

    describe('Module Compilation', () => {
        it('should compile without errors', () => {
            expect(module).toBeDefined();
            expect(module).toBeInstanceOf(TestingModule);
        });

        it('should initialize all providers', () => {
            expect(module.get(RAnalysisRepository)).toBeDefined();
            expect(module.get(RAnalysisService)).toBeDefined();
            expect(module.get(PreRAnalysisService)).toBeDefined();
            expect(module.get(RaABuilderService)).toBeDefined();
            expect(module.get(TransformRaService)).toBeDefined();
        });

        it('should initialize all controllers', () => {
            expect(module.get(RAnalysisController)).toBeDefined();
        });
    });
});
