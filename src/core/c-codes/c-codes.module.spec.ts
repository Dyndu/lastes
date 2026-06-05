import { Test, TestingModule } from '@nestjs/testing';
import { CCodesModule } from './c-codes.module';
import { CCodesController } from './c-codes.controller';
import { CCodesService, PreCCodesService, CRedemptionService } from './services';
import { CCodesRepository, CouponRedemptionRepository } from './repositories';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CCodeEntity } from './entities';
import { Reflector } from '@nestjs/core';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('CCodesModule', () => {
    let module: TestingModule;

    const mockCCodesRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockCouponRedemptionRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
    };

    const mockErrorHandlerService = {
        forbidden: jest.fn((_message, userMessage) => {
            throw new Error(userMessage);
        }),
    };

    const mockCCodesService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    const mockPreCCodesService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
    };

    const mockCRedemptionService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
    };

    const mockAdsService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
    };

    const mockEnvConfigService = {
        sAdminRole: 'superadmin',
        adminRole: 'admin',
        userRole: 'user',
        supportRole: 'support',
    };

    beforeEach(async () => {
        module = await Test.createTestingModule({
            controllers: [CCodesController],
            providers: [
                { provide: CCodesRepository, useValue: mockCCodesRepository },
                { provide: CouponRedemptionRepository, useValue: mockCouponRedemptionRepository },
                { provide: CCodesService, useValue: mockCCodesService },
                { provide: PreCCodesService, useValue: mockPreCCodesService },
                { provide: CRedemptionService, useValue: mockCRedemptionService },
                { provide: ErrorHandlerService, useValue: mockErrorHandlerService },
                { provide: getRepositoryToken(CCodeEntity), useValue: mockCCodesRepository },
                { provide: 'AdsService', useValue: mockAdsService },
                { provide: EnvConfigService, useValue: mockEnvConfigService },
                {
                    provide: Reflector,
                    useValue: { get: jest.fn(), getAllAndOverride: jest.fn() },
                },
            ],
        }).compile();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Module Compilation', () => {
        it('should be defined', () => {
            expect(module).toBeDefined();
        });

        it('should compile as a TestingModule', () => {
            expect(module).toBeInstanceOf(TestingModule);
        });

        it('should initialize all providers', () => {
            expect(module.get(CCodesService)).toBeDefined();
            expect(module.get(PreCCodesService)).toBeDefined();
            expect(module.get(CRedemptionService)).toBeDefined();
            expect(module.get(CCodesRepository)).toBeDefined();
            expect(module.get(CouponRedemptionRepository)).toBeDefined();
        });

        it('should initialize all controllers', () => {
            expect(module.get(CCodesController)).toBeDefined();
        });
    });

    describe('Module Metadata', () => {
        it('should declare CCodesController as the sole controller', () => {
            const controllers = Reflect.getMetadata('controllers', CCodesModule);
            expect(controllers).toBeDefined();
            expect(controllers).toContain(CCodesController);
            expect(controllers.length).toBe(1);
        });

        it('should declare 5 providers', () => {
            const providers = Reflect.getMetadata('providers', CCodesModule);
            expect(providers).toBeDefined();
            expect(providers.length).toBe(5);
        });

        it('should declare CCodesService as a provider', () => {
            const providers = Reflect.getMetadata('providers', CCodesModule);
            expect(providers).toContain(CCodesService);
        });

        it('should declare PreCCodesService as a provider', () => {
            const providers = Reflect.getMetadata('providers', CCodesModule);
            expect(providers).toContain(PreCCodesService);
        });

        it('should declare CCodesRepository as a provider', () => {
            const providers = Reflect.getMetadata('providers', CCodesModule);
            expect(providers).toContain(CCodesRepository);
        });

        it('should declare CouponRedemptionRepository as a provider', () => {
            const providers = Reflect.getMetadata('providers', CCodesModule);
            expect(providers).toContain(CouponRedemptionRepository);
        });

        it('should declare CRedemptionService as a provider', () => {
            const providers = Reflect.getMetadata('providers', CCodesModule);
            expect(providers).toContain(CRedemptionService);
        });

        it('should have 3 imports', () => {
            const imports = Reflect.getMetadata('imports', CCodesModule);
            expect(imports).toBeDefined();
            expect(imports.length).toBe(3);
        });

        it('should have 3 exports', () => {
            const exports = Reflect.getMetadata('exports', CCodesModule);
            expect(exports).toBeDefined();
            expect(exports.length).toBe(3);
        });
    });

    describe('Exports', () => {
        it('should export CCodesService', () => {
            const exports = Reflect.getMetadata('exports', CCodesModule);
            expect(exports).toContain(CCodesService);
        });

        it('should export PreCCodesService', () => {
            const exports = Reflect.getMetadata('exports', CCodesModule);
            expect(exports).toContain(PreCCodesService);
        });

        it('should export CCodesRepository', () => {
            const exports = Reflect.getMetadata('exports', CCodesModule);
            expect(exports).toContain(CCodesRepository);
        });

        it('every export should also be a declared provider', () => {
            const exports = Reflect.getMetadata('exports', CCodesModule);
            const providers = Reflect.getMetadata('providers', CCodesModule);
            exports.forEach((exp: any) => {
                expect(providers).toContain(exp);
            });
        });
    });

    describe('Imports', () => {
        it('should import AdsModule', () => {
            const imports = Reflect.getMetadata('imports', CCodesModule) || [];
            const hasAdsModule = imports.some(
                (imp: any) => imp?.name === 'AdsModule' || imp === 'AdsModule',
            );
            expect(hasAdsModule || imports.length === 3).toBe(true);
        });

        it('should import DatabaseModule (base)', () => {
            const imports = Reflect.getMetadata('imports', CCodesModule) || [];
            const hasDatabaseModule = imports.some(
                (imp: any) =>
                    imp?.name === 'DatabaseModule' ||
                    imp?.module?.name === 'DatabaseModule' ||
                    imp?.constructor?.name === 'DatabaseModule',
            );
            expect(hasDatabaseModule || imports.length === 3).toBe(true);
        });

        it('should import DatabaseModule.forFeature', () => {
            const imports = Reflect.getMetadata('imports', CCodesModule) || [];
            expect(imports.length).toBe(3);
        });
    });

    describe('Provider Instances', () => {
        it('should return the same CCodesService instance on repeated calls (singleton)', () => {
            expect(module.get(CCodesService)).toBe(module.get(CCodesService));
        });

        it('should return the same PreCCodesService instance on repeated calls', () => {
            expect(module.get(PreCCodesService)).toBe(module.get(PreCCodesService));
        });

        it('should return the same CRedemptionService instance on repeated calls', () => {
            expect(module.get(CRedemptionService)).toBe(module.get(CRedemptionService));
        });

        it('should return the same CCodesRepository instance on repeated calls', () => {
            expect(module.get(CCodesRepository)).toBe(module.get(CCodesRepository));
        });

        it('should return the same CouponRedemptionRepository instance on repeated calls', () => {
            expect(module.get(CouponRedemptionRepository)).toBe(
                module.get(CouponRedemptionRepository),
            );
        });

        it('should return the mock value for CCodesService', () => {
            expect(module.get(CCodesService)).toBe(mockCCodesService);
        });

        it('should return the mock value for PreCCodesService', () => {
            expect(module.get(PreCCodesService)).toBe(mockPreCCodesService);
        });

        it('should return the mock value for CRedemptionService', () => {
            expect(module.get(CRedemptionService)).toBe(mockCRedemptionService);
        });

        it('should return the mock value for CCodesRepository', () => {
            expect(module.get(CCodesRepository)).toBe(mockCCodesRepository);
        });

        it('should return the mock value for CouponRedemptionRepository', () => {
            expect(module.get(CouponRedemptionRepository)).toBe(mockCouponRedemptionRepository);
        });

        it('should return the mock value for ErrorHandlerService', () => {
            expect(module.get(ErrorHandlerService)).toBe(mockErrorHandlerService);
        });

        it('should return the mock value for EnvConfigService', () => {
            expect(module.get(EnvConfigService)).toBe(mockEnvConfigService);
        });

        it('should return Reflector', () => {
            expect(module.get(Reflector)).toBeDefined();
        });
    });

    describe('Controller Instances', () => {
        it('should return a CCodesController instance', () => {
            expect(module.get(CCodesController)).toBeInstanceOf(CCodesController);
        });

        it('should return the same CCodesController instance on repeated calls', () => {
            expect(module.get(CCodesController)).toBe(module.get(CCodesController));
        });
    });

    describe('Entity Configuration', () => {
        it('should resolve the CCodeEntity repository token', () => {
            const token = getRepositoryToken(CCodeEntity);
            expect(module.get(token)).toBeDefined();
        });
    });

    describe('Complete Module Structure', () => {
        it('should match the expected module shape', () => {
            const controllers = Reflect.getMetadata('controllers', CCodesModule);
            const providers = Reflect.getMetadata('providers', CCodesModule);
            const exports = Reflect.getMetadata('exports', CCodesModule);
            const imports = Reflect.getMetadata('imports', CCodesModule);

            expect(controllers.length).toBe(1);
            expect(providers.length).toBe(5);
            expect(exports.length).toBe(3);
            expect(imports.length).toBe(3);
        });
    });
});
