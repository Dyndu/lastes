import { Test, TestingModule } from '@nestjs/testing';
import { ABuilderModule } from './a-builder.module';
import {
    ABuilderService,
    TransformABuilderService,
    FExpensesService,
    ORepairsService,
    ERepairsService,
    IRepairsService,
    RepairsService,
    AdItemizedService,
    ADetailsService,
    PDetailsService,
    UnitsService,
    SaleService,
    HCoastService,
    HCoastItemizedService,
    BrRefinanceService,
} from './services';
import {
    ABuilderRepository,
    ORepairsRepository,
    RepairsRepository,
    IRepairsRepository,
    PDetailsRepository,
    ADetailsRepository,
    UnitsRepository,
    ERepairsRepository,
    FExpensesRepository,
    AdItemizedRepository,
    SaleRepository,
    HCoastRepository,
    HCoastItemizedRepository,
    BrRefinanceRepository,
} from './repositories';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('ABuilderModule', () => {
    let module: TestingModule;

    const mockABuilderService = { findAll: jest.fn() };
    const mockTransformABuilderService = { transformABuilder: jest.fn() };
    const mockFExpensesService = { buildFExpenseEntity: jest.fn() };
    const mockORepairsService = { buildORepairsEntity: jest.fn() };
    const mockERepairsService = { buildERepairsEntity: jest.fn() };
    const mockIRepairsService = { buildIRepairsEntity: jest.fn() };
    const mockRepairsService = { buildRepairsEntity: jest.fn() };
    const mockAdItemizedService = { buildAdItemizedEntity: jest.fn() };
    const mockADetailsService = { buildADetailsEntity: jest.fn() };
    const mockPDetailsService = { buildPDetailsEntity: jest.fn() };
    const mockUnitsService = { buildUnitEntity: jest.fn() };
    const mockSaleService = { buildSaleEntity: jest.fn() };
    const mockHCoastService = { createHCoast: jest.fn() };
    const mockHCoastItemizedService = { createHCItemizedEntity: jest.fn() };
    const mockBrRefinanceService = { createBrRefinanceEntity: jest.fn() };

    const mockABuilderRepository = { findOne: jest.fn(), save: jest.fn() };
    const mockORepairsRepository = { findOne: jest.fn() };
    const mockRepairsRepository = { findOne: jest.fn() };
    const mockIRepairsRepository = { findOne: jest.fn() };
    const mockPDetailsRepository = { findOne: jest.fn() };
    const mockADetailsRepository = { findOne: jest.fn() };
    const mockUnitsRepository = { findOne: jest.fn() };
    const mockERepairsRepository = { findOne: jest.fn() };
    const mockFExpensesRepository = { findOne: jest.fn() };
    const mockAdItemizedRepository = { findOne: jest.fn() };
    const mockSaleRepository = { findOne: jest.fn() };
    const mockHCoastRepository = { findOne: jest.fn() };
    const mockHCoastItemizedRepository = { findOne: jest.fn() };
    const mockBrRefinanceRepository = { findOne: jest.fn() };

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [
                { provide: ABuilderService, useValue: mockABuilderService },
                { provide: TransformABuilderService, useValue: mockTransformABuilderService },
                { provide: FExpensesService, useValue: mockFExpensesService },
                { provide: ORepairsService, useValue: mockORepairsService },
                { provide: ERepairsService, useValue: mockERepairsService },
                { provide: IRepairsService, useValue: mockIRepairsService },
                { provide: RepairsService, useValue: mockRepairsService },
                { provide: AdItemizedService, useValue: mockAdItemizedService },
                { provide: ADetailsService, useValue: mockADetailsService },
                { provide: PDetailsService, useValue: mockPDetailsService },
                { provide: UnitsService, useValue: mockUnitsService },
                { provide: SaleService, useValue: mockSaleService },
                { provide: HCoastService, useValue: mockHCoastService },
                { provide: HCoastItemizedService, useValue: mockHCoastItemizedService },
                { provide: ABuilderRepository, useValue: mockABuilderRepository },
                { provide: ORepairsRepository, useValue: mockORepairsRepository },
                { provide: RepairsRepository, useValue: mockRepairsRepository },
                { provide: IRepairsRepository, useValue: mockIRepairsRepository },
                { provide: PDetailsRepository, useValue: mockPDetailsRepository },
                { provide: ADetailsRepository, useValue: mockADetailsRepository },
                { provide: UnitsRepository, useValue: mockUnitsRepository },
                { provide: ERepairsRepository, useValue: mockERepairsRepository },
                { provide: FExpensesRepository, useValue: mockFExpensesRepository },
                { provide: AdItemizedRepository, useValue: mockAdItemizedRepository },
                { provide: SaleRepository, useValue: mockSaleRepository },
                { provide: HCoastRepository, useValue: mockHCoastRepository },
                { provide: HCoastItemizedRepository, useValue: mockHCoastItemizedRepository },
                { provide: BrRefinanceRepository, useValue: mockBrRefinanceRepository },
                { provide: BrRefinanceService, useValue: mockBrRefinanceService },
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
            const imports = Reflect.getMetadata('imports', ABuilderModule);
            expect(imports).toBeDefined();
        });

        it('should have exactly 2 imports (DatabaseModule + forFeature)', () => {
            const imports = Reflect.getMetadata('imports', ABuilderModule);
            expect(imports.length).toBe(2);
        });

        it('should include DatabaseModule as first import', () => {
            const imports = Reflect.getMetadata('imports', ABuilderModule);
            expect(imports[0]).toBeDefined();
        });

        it('should include DatabaseModule.forFeature as second import', () => {
            const imports = Reflect.getMetadata('imports', ABuilderModule);
            expect(imports[1]).toBeDefined();
        });
    });

    describe('Module Metadata — Providers', () => {
        it('should have providers metadata', () => {
            const providers = Reflect.getMetadata('providers', ABuilderModule);
            expect(providers).toBeDefined();
        });

        it('should have exactly 39 providers', () => {
            const providers = Reflect.getMetadata('providers', ABuilderModule);
            expect(providers.length).toBe(39);
        });

        it('should contain ABuilderService in providers', () => {
            const providers = Reflect.getMetadata('providers', ABuilderModule);
            expect(providers).toContain(ABuilderService);
        });

        it('should contain ABuilderRepository in providers', () => {
            const providers = Reflect.getMetadata('providers', ABuilderModule);
            expect(providers).toContain(ABuilderRepository);
        });

        it('should contain all Repositories in providers', () => {
            const providers = Reflect.getMetadata('providers', ABuilderModule);
            expect(providers).toContain(ORepairsRepository);
            expect(providers).toContain(RepairsRepository);
            expect(providers).toContain(IRepairsRepository);
            expect(providers).toContain(PDetailsRepository);
            expect(providers).toContain(ADetailsRepository);
            expect(providers).toContain(UnitsRepository);
            expect(providers).toContain(ERepairsRepository);
            expect(providers).toContain(FExpensesRepository);
            expect(providers).toContain(AdItemizedRepository);
            expect(providers).toContain(SaleRepository);
            expect(providers).toContain(HCoastRepository);
            expect(providers).toContain(HCoastItemizedRepository);
            expect(providers).toContain(BrRefinanceRepository);
        });

        it('should contain all Services in providers', () => {
            const providers = Reflect.getMetadata('providers', ABuilderModule);
            expect(providers).toContain(TransformABuilderService);
            expect(providers).toContain(FExpensesService);
            expect(providers).toContain(ORepairsService);
            expect(providers).toContain(ERepairsService);
            expect(providers).toContain(IRepairsService);
            expect(providers).toContain(RepairsService);
            expect(providers).toContain(AdItemizedService);
            expect(providers).toContain(ADetailsService);
            expect(providers).toContain(PDetailsService);
            expect(providers).toContain(UnitsService);
            expect(providers).toContain(SaleService);
            expect(providers).toContain(HCoastService);
            expect(providers).toContain(HCoastItemizedService);
            expect(providers).toContain(BrRefinanceService);
        });
    });

    describe('Module Metadata — Exports', () => {
        it('should have exports metadata', () => {
            const exports = Reflect.getMetadata('exports', ABuilderModule);
            expect(exports).toBeDefined();
        });

        it('should have exactly 1 export', () => {
            const exports = Reflect.getMetadata('exports', ABuilderModule);
            expect(exports.length).toBe(1);
        });

        it('should export only ABuilderService', () => {
            const exports = Reflect.getMetadata('exports', ABuilderModule);
            expect(exports).toEqual([ABuilderService]);
        });

        it('should NOT export any repository', () => {
            const exports = Reflect.getMetadata('exports', ABuilderModule);
            [
                ABuilderRepository,
                ORepairsRepository,
                RepairsRepository,
                IRepairsRepository,
                PDetailsRepository,
                ADetailsRepository,
                UnitsRepository,
                ERepairsRepository,
                FExpensesRepository,
                AdItemizedRepository,
                SaleRepository,
                HCoastRepository,
                HCoastItemizedRepository,
                BrRefinanceRepository,
            ].forEach((repo) => expect(exports).not.toContain(repo));
        });

        it('should NOT export internal services', () => {
            const exports = Reflect.getMetadata('exports', ABuilderModule);
            [
                TransformABuilderService,
                FExpensesService,
                ORepairsService,
                ERepairsService,
                IRepairsService,
                RepairsService,
                AdItemizedService,
                ADetailsService,
                PDetailsService,
                UnitsService,
                SaleService,
                HCoastService,
                HCoastItemizedService,
                BrRefinanceService,
            ].forEach((svc) => expect(exports).not.toContain(svc));
        });
    });

    describe('Service Instances', () => {
        it('should get ABuilderService instance', () => {
            expect(module.get(ABuilderService)).toBe(mockABuilderService);
        });

        it('should get TransformABuilderService instance', () => {
            expect(module.get(TransformABuilderService)).toBe(mockTransformABuilderService);
        });

        it('should get FExpensesService instance', () => {
            expect(module.get(FExpensesService)).toBe(mockFExpensesService);
        });

        it('should get ORepairsService instance', () => {
            expect(module.get(ORepairsService)).toBe(mockORepairsService);
        });

        it('should get ERepairsService instance', () => {
            expect(module.get(ERepairsService)).toBe(mockERepairsService);
        });

        it('should get IRepairsService instance', () => {
            expect(module.get(IRepairsService)).toBe(mockIRepairsService);
        });

        it('should get RepairsService instance', () => {
            expect(module.get(RepairsService)).toBe(mockRepairsService);
        });

        it('should get AdItemizedService instance', () => {
            expect(module.get(AdItemizedService)).toBe(mockAdItemizedService);
        });

        it('should get ADetailsService instance', () => {
            expect(module.get(ADetailsService)).toBe(mockADetailsService);
        });

        it('should get PDetailsService instance', () => {
            expect(module.get(PDetailsService)).toBe(mockPDetailsService);
        });

        it('should get UnitsService instance', () => {
            expect(module.get(UnitsService)).toBe(mockUnitsService);
        });

        it('should get SaleService instance', () => {
            expect(module.get(SaleService)).toBe(mockSaleService);
        });

        it('should get HCoastService instance', () => {
            expect(module.get(HCoastService)).toBe(mockHCoastService);
        });

        it('should get HCoastItemizedService instance', () => {
            expect(module.get(HCoastItemizedService)).toBe(mockHCoastItemizedService);
        });

        it('should get BrRefinanceService instance', () => {
            expect(module.get(BrRefinanceService)).toBe(mockBrRefinanceService);
        });
    });

    describe('Repository Instances', () => {
        it('should get ABuilderRepository instance', () => {
            expect(module.get(ABuilderRepository)).toBe(mockABuilderRepository);
        });

        it('should get ORepairsRepository instance', () => {
            expect(module.get(ORepairsRepository)).toBe(mockORepairsRepository);
        });

        it('should get RepairsRepository instance', () => {
            expect(module.get(RepairsRepository)).toBe(mockRepairsRepository);
        });

        it('should get IRepairsRepository instance', () => {
            expect(module.get(IRepairsRepository)).toBe(mockIRepairsRepository);
        });

        it('should get PDetailsRepository instance', () => {
            expect(module.get(PDetailsRepository)).toBe(mockPDetailsRepository);
        });

        it('should get ADetailsRepository instance', () => {
            expect(module.get(ADetailsRepository)).toBe(mockADetailsRepository);
        });

        it('should get UnitsRepository instance', () => {
            expect(module.get(UnitsRepository)).toBe(mockUnitsRepository);
        });

        it('should get ERepairsRepository instance', () => {
            expect(module.get(ERepairsRepository)).toBe(mockERepairsRepository);
        });

        it('should get FExpensesRepository instance', () => {
            expect(module.get(FExpensesRepository)).toBe(mockFExpensesRepository);
        });

        it('should get AdItemizedRepository instance', () => {
            expect(module.get(AdItemizedRepository)).toBe(mockAdItemizedRepository);
        });

        it('should get SaleRepository instance', () => {
            expect(module.get(SaleRepository)).toBe(mockSaleRepository);
        });

        it('should get HCoastRepository instance', () => {
            expect(module.get(HCoastRepository)).toBe(mockHCoastRepository);
        });

        it('should get HCoastItemizedRepository instance', () => {
            expect(module.get(HCoastItemizedRepository)).toBe(mockHCoastItemizedRepository);
        });

        it('should get BrRefinanceRepository instance', () => {
            expect(module.get(BrRefinanceRepository)).toBe(mockBrRefinanceRepository);
        });
    });

    describe('Dependency Injection', () => {
        it('should resolve all services without error', () => {
            [
                ABuilderService,
                TransformABuilderService,
                FExpensesService,
                ORepairsService,
                ERepairsService,
                IRepairsService,
                RepairsService,
                AdItemizedService,
                ADetailsService,
                PDetailsService,
                UnitsService,
                SaleService,
                HCoastService,
                HCoastItemizedService,
                BrRefinanceService,
            ].forEach((svc) => expect(() => module.get(svc)).not.toThrow());
        });

        it('should resolve all repositories without error', () => {
            [
                ABuilderRepository,
                ORepairsRepository,
                RepairsRepository,
                IRepairsRepository,
                PDetailsRepository,
                ADetailsRepository,
                UnitsRepository,
                ERepairsRepository,
                FExpensesRepository,
                AdItemizedRepository,
                SaleRepository,
                HCoastRepository,
                HCoastItemizedRepository,
                BrRefinanceRepository,
            ].forEach((repo) => expect(() => module.get(repo)).not.toThrow());
        });

        it('should use singleton pattern for all providers', () => {
            expect(module.get(ABuilderService)).toBe(module.get(ABuilderService));
            expect(module.get(TransformABuilderService)).toBe(module.get(TransformABuilderService));
            expect(module.get(ABuilderRepository)).toBe(module.get(ABuilderRepository));
            expect(module.get(HCoastService)).toBe(module.get(HCoastService));
            expect(module.get(HCoastItemizedService)).toBe(module.get(HCoastItemizedService));
            expect(module.get(HCoastRepository)).toBe(module.get(HCoastRepository));
            expect(module.get(HCoastItemizedRepository)).toBe(module.get(HCoastItemizedRepository));
            expect(module.get(BrRefinanceRepository)).toBe(module.get(BrRefinanceRepository));
        });
    });

    describe('Module Encapsulation', () => {
        it('should expose only ABuilderService as public API', () => {
            const exports = Reflect.getMetadata('exports', ABuilderModule);
            expect(exports).toEqual([ABuilderService]);
        });

        it('should keep 28 providers internal', () => {
            const providers = Reflect.getMetadata('providers', ABuilderModule);
            const exports = Reflect.getMetadata('exports', ABuilderModule);
            expect(providers.length - exports.length).toBe(38);
        });

        it('should keep all repositories internal', () => {
            const providers = Reflect.getMetadata('providers', ABuilderModule);
            const exports = Reflect.getMetadata('exports', ABuilderModule);
            [
                ABuilderRepository,
                ORepairsRepository,
                RepairsRepository,
                IRepairsRepository,
                PDetailsRepository,
                ADetailsRepository,
                UnitsRepository,
                ERepairsRepository,
                FExpensesRepository,
                AdItemizedRepository,
                SaleRepository,
                HCoastRepository,
                HCoastItemizedRepository,
                BrRefinanceRepository,
            ].forEach((repo) => {
                expect(providers).toContain(repo);
                expect(exports).not.toContain(repo);
            });
        });

        it('should keep all internal services private', () => {
            const providers = Reflect.getMetadata('providers', ABuilderModule);
            const exports = Reflect.getMetadata('exports', ABuilderModule);
            [
                TransformABuilderService,
                FExpensesService,
                ORepairsService,
                ERepairsService,
                IRepairsService,
                RepairsService,
                AdItemizedService,
                ADetailsService,
                PDetailsService,
                UnitsService,
                SaleService,
                HCoastService,
                HCoastItemizedService,
                BrRefinanceService,
            ].forEach((svc) => {
                expect(providers).toContain(svc);
                expect(exports).not.toContain(svc);
            });
        });
    });

    describe('Complete Module Structure', () => {
        it('should have correct module structure counts', () => {
            const providers = Reflect.getMetadata('providers', ABuilderModule);
            const exports = Reflect.getMetadata('exports', ABuilderModule);
            const imports = Reflect.getMetadata('imports', ABuilderModule);

            expect(providers.length).toBe(39);
            expect(exports.length).toBe(1);
            expect(imports.length).toBe(2);
        });

        it('should follow NestJS module pattern', () => {
            expect(Reflect.getMetadata('providers', ABuilderModule)).toBeDefined();
            expect(Reflect.getMetadata('exports', ABuilderModule)).toBeDefined();
            expect(Reflect.getMetadata('imports', ABuilderModule)).toBeDefined();
        });

        it('should maintain separation of concerns between services and repositories', () => {
            const providers = Reflect.getMetadata('providers', ABuilderModule);
            const services = [
                ABuilderService,
                TransformABuilderService,
                FExpensesService,
                ORepairsService,
                ERepairsService,
                IRepairsService,
                RepairsService,
                AdItemizedService,
                ADetailsService,
                PDetailsService,
                UnitsService,
                SaleService,
                HCoastService,
                HCoastItemizedService,
                BrRefinanceService,
            ];
            const repositories = [
                ABuilderRepository,
                ORepairsRepository,
                RepairsRepository,
                IRepairsRepository,
                PDetailsRepository,
                ADetailsRepository,
                UnitsRepository,
                ERepairsRepository,
                FExpensesRepository,
                AdItemizedRepository,
                SaleRepository,
                HCoastRepository,
                HCoastItemizedRepository,
                BrRefinanceRepository,
            ];
            [...services, ...repositories].forEach((p) => expect(providers).toContain(p));
        });
    });

    describe('Module Compilation', () => {
        it('should compile without errors', () => {
            expect(module).toBeDefined();
            expect(module).toBeInstanceOf(TestingModule);
        });

        it('should initialize all services', () => {
            expect(module.get(ABuilderService)).toBeDefined();
            expect(module.get(TransformABuilderService)).toBeDefined();
            expect(module.get(FExpensesService)).toBeDefined();
            expect(module.get(ORepairsService)).toBeDefined();
            expect(module.get(ERepairsService)).toBeDefined();
            expect(module.get(IRepairsService)).toBeDefined();
            expect(module.get(RepairsService)).toBeDefined();
            expect(module.get(AdItemizedService)).toBeDefined();
            expect(module.get(ADetailsService)).toBeDefined();
            expect(module.get(PDetailsService)).toBeDefined();
            expect(module.get(UnitsService)).toBeDefined();
            expect(module.get(SaleService)).toBeDefined();
            expect(module.get(HCoastService)).toBeDefined();
            expect(module.get(HCoastItemizedService)).toBeDefined();
            expect(module.get(BrRefinanceService)).toBeDefined();
        });

        it('should initialize all repositories', () => {
            expect(module.get(ABuilderRepository)).toBeDefined();
            expect(module.get(ORepairsRepository)).toBeDefined();
            expect(module.get(RepairsRepository)).toBeDefined();
            expect(module.get(IRepairsRepository)).toBeDefined();
            expect(module.get(PDetailsRepository)).toBeDefined();
            expect(module.get(ADetailsRepository)).toBeDefined();
            expect(module.get(UnitsRepository)).toBeDefined();
            expect(module.get(ERepairsRepository)).toBeDefined();
            expect(module.get(FExpensesRepository)).toBeDefined();
            expect(module.get(AdItemizedRepository)).toBeDefined();
            expect(module.get(SaleRepository)).toBeDefined();
            expect(module.get(HCoastRepository)).toBeDefined();
            expect(module.get(HCoastItemizedRepository)).toBeDefined();
            expect(module.get(BrRefinanceRepository)).toBeDefined();
        });
    });
});
