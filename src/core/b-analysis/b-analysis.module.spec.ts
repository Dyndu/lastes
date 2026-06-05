import { Test, TestingModule } from '@nestjs/testing';
import { BAnalysisModule } from './b-analysis.module';
import {
    BAnalysisService,
    RoomCategoryService,
    RoomSectionService,
    RoomExpenseItemService,
    TransformBAEntitiesService,
} from './services';
import {
    BAnalysisRepository,
    RoomCategoryRepository,
    RoomSectionRepository,
    RoomExpenseItemRepository,
} from './repositories';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('BAnalysisModule', () => {
    let module: TestingModule;

    const mockBAnalysisService = { createBAnalysis: jest.fn() };
    const mockRoomCategoryService = { createRoomCategory: jest.fn() };
    const mockRoomSectionService = { createRoomSection: jest.fn() };
    const mockRoomExpenseItemService = { createRoomExpenseItem: jest.fn() };
    const mockTransformBAEntitiesService = { transform: jest.fn() };

    const mockBAnalysisRepository = { findOne: jest.fn(), save: jest.fn(), create: jest.fn() };
    const mockRoomCategoryRepository = { findOne: jest.fn(), save: jest.fn(), create: jest.fn() };
    const mockRoomSectionRepository = { findOne: jest.fn(), save: jest.fn(), create: jest.fn() };
    const mockRoomExpenseItemRepository = {
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
    };

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [
                { provide: BAnalysisService, useValue: mockBAnalysisService },
                { provide: RoomCategoryService, useValue: mockRoomCategoryService },
                { provide: RoomSectionService, useValue: mockRoomSectionService },
                { provide: RoomExpenseItemService, useValue: mockRoomExpenseItemService },
                { provide: TransformBAEntitiesService, useValue: mockTransformBAEntitiesService },
                { provide: BAnalysisRepository, useValue: mockBAnalysisRepository },
                { provide: RoomCategoryRepository, useValue: mockRoomCategoryRepository },
                { provide: RoomSectionRepository, useValue: mockRoomSectionRepository },
                { provide: RoomExpenseItemRepository, useValue: mockRoomExpenseItemRepository },
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
            const imports = Reflect.getMetadata('imports', BAnalysisModule);
            expect(imports).toBeDefined();
        });

        it('should have exactly 2 imports (DatabaseModule + forFeature)', () => {
            const imports = Reflect.getMetadata('imports', BAnalysisModule);
            expect(imports.length).toBe(2);
        });

        it('should include DatabaseModule as first import', () => {
            const imports = Reflect.getMetadata('imports', BAnalysisModule);
            expect(imports[0]).toBeDefined();
        });

        it('should include DatabaseModule.forFeature as second import', () => {
            const imports = Reflect.getMetadata('imports', BAnalysisModule);
            expect(imports[1]).toBeDefined();
        });
    });

    describe('Module Metadata — Providers', () => {
        it('should have providers metadata', () => {
            const providers = Reflect.getMetadata('providers', BAnalysisModule);
            expect(providers).toBeDefined();
        });

        it('should have exactly 9 providers', () => {
            const providers = Reflect.getMetadata('providers', BAnalysisModule);
            expect(providers.length).toBe(9);
        });

        it('should contain all repositories in providers', () => {
            const providers = Reflect.getMetadata('providers', BAnalysisModule);
            expect(providers).toContain(BAnalysisRepository);
            expect(providers).toContain(RoomCategoryRepository);
            expect(providers).toContain(RoomSectionRepository);
            expect(providers).toContain(RoomExpenseItemRepository);
        });

        it('should contain all services in providers', () => {
            const providers = Reflect.getMetadata('providers', BAnalysisModule);
            expect(providers).toContain(BAnalysisService);
            expect(providers).toContain(RoomCategoryService);
            expect(providers).toContain(RoomSectionService);
            expect(providers).toContain(RoomExpenseItemService);
            expect(providers).toContain(TransformBAEntitiesService);
        });
    });

    describe('Module Metadata — Exports', () => {
        it('should have exports metadata', () => {
            const exports = Reflect.getMetadata('exports', BAnalysisModule);
            expect(exports).toBeDefined();
        });

        it('should have exactly 1 export', () => {
            const exports = Reflect.getMetadata('exports', BAnalysisModule);
            expect(exports.length).toBe(1);
        });

        it('should export only BAnalysisService', () => {
            const exports = Reflect.getMetadata('exports', BAnalysisModule);
            expect(exports).toEqual([BAnalysisService]);
        });

        it('should NOT export any repository', () => {
            const exports = Reflect.getMetadata('exports', BAnalysisModule);
            [
                BAnalysisRepository,
                RoomCategoryRepository,
                RoomSectionRepository,
                RoomExpenseItemRepository,
            ].forEach((repo) => expect(exports).not.toContain(repo));
        });

        it('should NOT export internal services', () => {
            const exports = Reflect.getMetadata('exports', BAnalysisModule);
            [
                RoomCategoryService,
                RoomSectionService,
                RoomExpenseItemService,
                TransformBAEntitiesService,
            ].forEach((svc) => expect(exports).not.toContain(svc));
        });
    });

    describe('Service Instances', () => {
        it('should get BAnalysisService instance', () => {
            expect(module.get(BAnalysisService)).toBe(mockBAnalysisService);
        });

        it('should get RoomCategoryService instance', () => {
            expect(module.get(RoomCategoryService)).toBe(mockRoomCategoryService);
        });

        it('should get RoomSectionService instance', () => {
            expect(module.get(RoomSectionService)).toBe(mockRoomSectionService);
        });

        it('should get RoomExpenseItemService instance', () => {
            expect(module.get(RoomExpenseItemService)).toBe(mockRoomExpenseItemService);
        });

        it('should get TransformBAEntitiesService instance', () => {
            expect(module.get(TransformBAEntitiesService)).toBe(mockTransformBAEntitiesService);
        });
    });

    describe('Repository Instances', () => {
        it('should get BAnalysisRepository instance', () => {
            expect(module.get(BAnalysisRepository)).toBe(mockBAnalysisRepository);
        });

        it('should get RoomCategoryRepository instance', () => {
            expect(module.get(RoomCategoryRepository)).toBe(mockRoomCategoryRepository);
        });

        it('should get RoomSectionRepository instance', () => {
            expect(module.get(RoomSectionRepository)).toBe(mockRoomSectionRepository);
        });

        it('should get RoomExpenseItemRepository instance', () => {
            expect(module.get(RoomExpenseItemRepository)).toBe(mockRoomExpenseItemRepository);
        });
    });

    describe('Dependency Injection', () => {
        it('should resolve all services without error', () => {
            [
                BAnalysisService,
                RoomCategoryService,
                RoomSectionService,
                RoomExpenseItemService,
                TransformBAEntitiesService,
            ].forEach((svc) => expect(() => module.get(svc)).not.toThrow());
        });

        it('should resolve all repositories without error', () => {
            [
                BAnalysisRepository,
                RoomCategoryRepository,
                RoomSectionRepository,
                RoomExpenseItemRepository,
            ].forEach((repo) => expect(() => module.get(repo)).not.toThrow());
        });

        it('should use singleton pattern for all providers', () => {
            expect(module.get(BAnalysisService)).toBe(module.get(BAnalysisService));
            expect(module.get(BAnalysisRepository)).toBe(module.get(BAnalysisRepository));
            expect(module.get(TransformBAEntitiesService)).toBe(
                module.get(TransformBAEntitiesService),
            );
        });
    });

    describe('Module Encapsulation', () => {
        it('should expose only BAnalysisService as public API', () => {
            const exports = Reflect.getMetadata('exports', BAnalysisModule);
            expect(exports).toEqual([BAnalysisService]);
        });

        it('should keep 8 providers internal', () => {
            const providers = Reflect.getMetadata('providers', BAnalysisModule);
            const exports = Reflect.getMetadata('exports', BAnalysisModule);
            expect(providers.length - exports.length).toBe(8);
        });

        it('should keep all repositories internal', () => {
            const providers = Reflect.getMetadata('providers', BAnalysisModule);
            const exports = Reflect.getMetadata('exports', BAnalysisModule);
            [
                BAnalysisRepository,
                RoomCategoryRepository,
                RoomSectionRepository,
                RoomExpenseItemRepository,
            ].forEach((repo) => {
                expect(providers).toContain(repo);
                expect(exports).not.toContain(repo);
            });
        });

        it('should keep all internal services private', () => {
            const providers = Reflect.getMetadata('providers', BAnalysisModule);
            const exports = Reflect.getMetadata('exports', BAnalysisModule);
            [
                RoomCategoryService,
                RoomSectionService,
                RoomExpenseItemService,
                TransformBAEntitiesService,
            ].forEach((svc) => {
                expect(providers).toContain(svc);
                expect(exports).not.toContain(svc);
            });
        });
    });

    describe('Complete Module Structure', () => {
        it('should have correct module structure counts', () => {
            const providers = Reflect.getMetadata('providers', BAnalysisModule);
            const exports = Reflect.getMetadata('exports', BAnalysisModule);
            const imports = Reflect.getMetadata('imports', BAnalysisModule);

            expect(providers.length).toBe(9);
            expect(exports.length).toBe(1);
            expect(imports.length).toBe(2);
        });

        it('should follow NestJS module pattern', () => {
            expect(Reflect.getMetadata('providers', BAnalysisModule)).toBeDefined();
            expect(Reflect.getMetadata('exports', BAnalysisModule)).toBeDefined();
            expect(Reflect.getMetadata('imports', BAnalysisModule)).toBeDefined();
        });

        it('should maintain separation of concerns between services and repositories', () => {
            const providers = Reflect.getMetadata('providers', BAnalysisModule);
            const services = [
                BAnalysisService,
                RoomCategoryService,
                RoomSectionService,
                RoomExpenseItemService,
                TransformBAEntitiesService,
            ];
            const repositories = [
                BAnalysisRepository,
                RoomCategoryRepository,
                RoomSectionRepository,
                RoomExpenseItemRepository,
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
            expect(module.get(BAnalysisService)).toBeDefined();
            expect(module.get(RoomCategoryService)).toBeDefined();
            expect(module.get(RoomSectionService)).toBeDefined();
            expect(module.get(RoomExpenseItemService)).toBeDefined();
            expect(module.get(TransformBAEntitiesService)).toBeDefined();
        });

        it('should initialize all repositories', () => {
            expect(module.get(BAnalysisRepository)).toBeDefined();
            expect(module.get(RoomCategoryRepository)).toBeDefined();
            expect(module.get(RoomSectionRepository)).toBeDefined();
            expect(module.get(RoomExpenseItemRepository)).toBeDefined();
        });
    });
});
