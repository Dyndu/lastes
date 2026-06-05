import { Test, TestingModule } from '@nestjs/testing';
import { MTransformService } from './m-transform.service';
import { ModulesService } from './modules.service';
import { MExportEntity, ModuleEntity } from '../entities';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('MTransformService', () => {
    let service: MTransformService;
    let modulesService: any;

    const mockUETransformService = { transformFiles: jest.fn() };
    const mockUserService = { uETransformService: mockUETransformService };
    const mockModulesService = { userService: mockUserService };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MTransformService,
                { provide: ModulesService, useValue: mockModulesService },
            ],
        }).compile();

        service = module.get<MTransformService>(MTransformService);
        modulesService = module.get(ModulesService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('moduleDetails', () => {
        it('should return the correct relations array', () => {
            expect(service.moduleDetails()).toEqual([
                'features',
                'headers',
                'uses',
                'link',
                'link.file',
            ]);
        });

        it('should return a new array on each call (no shared reference)', () => {
            const r1 = service.moduleDetails();
            const r2 = service.moduleDetails();
            expect(r1).toEqual(r2);
            expect(r1).not.toBe(r2);
        });
    });

    describe('mExportDetails', () => {
        it('should return the correct relations for MExport', () => {
            expect(service.mExportDetails()).toEqual(['file', 'file.file']);
        });

        it('should return a new array on each call', () => {
            const r1 = service.mExportDetails();
            const r2 = service.mExportDetails();
            expect(r1).toEqual(r2);
            expect(r1).not.toBe(r2);
        });
    });

    describe('transformEntity', () => {
        it('should pick only id, label, icon from entity', () => {
            expect(
                service.transformEntity({ id: 1, label: 'A', icon: 'i', extra: 'ignored' }),
            ).toEqual({ id: 1, label: 'A', icon: 'i' });
        });

        it('should handle string id', () => {
            expect(service.transformEntity({ id: 'uuid', label: 'B', icon: 'j' })).toEqual({
                id: 'uuid',
                label: 'B',
                icon: 'j',
            });
        });

        it('should handle null/undefined fields', () => {
            expect(service.transformEntity({ id: null, label: undefined, icon: 'k' })).toEqual({
                id: null,
                label: undefined,
                icon: 'k',
            });
        });

        it('should handle missing fields (returns undefined)', () => {
            expect(service.transformEntity({ id: 1 })).toEqual({
                id: 1,
                label: undefined,
                icon: undefined,
            });
        });

        it('should handle null icon', () => {
            expect(service.transformEntity({ id: 1, label: 'X', icon: null })).toEqual({
                id: 1,
                label: 'X',
                icon: null,
            });
        });
    });

    describe('transformEntities', () => {
        it('should transform an array of entities', () => {
            const input = [
                { id: 1, label: 'E1', icon: 'i1' },
                { id: 2, label: 'E2', icon: 'i2' },
            ];
            expect(service.transformEntities(input)).toEqual(input);
        });

        it('should return empty array for empty input', () => {
            expect(service.transformEntities([])).toEqual([]);
        });

        it('should strip extra fields from each entity', () => {
            const input = [{ id: 1, label: 'E', icon: 'i', extra: 'drop' }];
            expect(service.transformEntities(input)).toEqual([{ id: 1, label: 'E', icon: 'i' }]);
        });
    });

    describe('transformModule', () => {
        it('should transform a complete module with all relations', () => {
            const mockFile = { id: 10, name: 'test.jpg' };
            const mockTransformedFile = { id: 10, url: '/test.jpg' };
            mockUETransformService.transformFiles.mockReturnValue(mockTransformedFile);

            const module: ModuleEntity = {
                id: 1,
                label: 'Mod',
                color: '#fff',
                icon: 'icon',
                type: 'standard',
                isActive: true,
                description: 'Desc',
                usageDescription: 'Usage',
                features: [{ id: 1, label: 'F1', icon: 'f1' }],
                headers: [{ id: 2, label: 'H1', icon: 'h1' }],
                uses: [{ id: 3, label: 'U1', icon: 'u1' }],
                link: { id: 5, file: mockFile },
            } as any;

            const result = service.transformModule(module);

            expect(result).toEqual({
                id: 1,
                label: 'Mod',
                color: '#fff',
                icon: 'icon',
                type: 'standard',
                isActive: true,
                description: 'Desc',
                usageDescription: 'Usage',
                features: [{ id: 1, label: 'F1', icon: 'f1' }],
                headers: [{ id: 2, label: 'H1', icon: 'h1' }],
                uses: [{ id: 3, label: 'U1', icon: 'u1' }],
                file: mockTransformedFile,
            });
            expect(mockUETransformService.transformFiles).toHaveBeenCalledWith(mockFile);
        });

        it('should return null file and empty arrays when link/features/headers/uses are null', () => {
            const module: ModuleEntity = {
                id: 2,
                label: 'Min',
                color: '#000',
                icon: 'i',
                type: 'basic',
                isActive: false,
                description: 'D',
                usageDescription: 'U',
                features: null,
                headers: null,
                uses: null,
                link: null,
            } as any;

            const result = service.transformModule(module);

            expect(result.features).toEqual([]);
            expect(result.headers).toEqual([]);
            expect(result.uses).toEqual([]);
            expect(result.file).toBeNull();
            expect(mockUETransformService.transformFiles).not.toHaveBeenCalled();
        });

        it('should return null file and empty arrays when fields are undefined', () => {
            const module: ModuleEntity = {
                id: 3,
                label: 'U',
                color: '#000',
                icon: 'i',
                type: 't',
                isActive: true,
                description: 'D',
                usageDescription: 'U',
                features: undefined,
                headers: undefined,
                uses: undefined,
                link: undefined,
            } as any;

            const result = service.transformModule(module);

            expect(result.features).toEqual([]);
            expect(result.headers).toEqual([]);
            expect(result.uses).toEqual([]);
            expect(result.file).toBeNull();
        });

        it('should handle link with null file', () => {
            mockUETransformService.transformFiles.mockReturnValue(null);
            const module: ModuleEntity = {
                id: 4,
                label: 'L',
                color: '#000',
                icon: 'i',
                type: 't',
                isActive: true,
                description: 'D',
                usageDescription: 'U',
                features: [],
                headers: [],
                uses: [],
                link: { id: 6, file: null },
            } as any;

            const result = service.transformModule(module);

            expect(result.file).toBeNull();
            expect(mockUETransformService.transformFiles).toHaveBeenCalledWith(null);
        });

        it('should handle link with missing file property', () => {
            mockUETransformService.transformFiles.mockReturnValue(null);
            const module: ModuleEntity = {
                id: 5,
                label: 'M',
                color: '#000',
                icon: 'i',
                type: 't',
                isActive: true,
                description: 'D',
                usageDescription: 'U',
                features: [],
                headers: [],
                uses: [],
                link: { id: 7 },
            } as any;

            service.transformModule(module);

            expect(mockUETransformService.transformFiles).toHaveBeenCalledWith(undefined);
        });

        it('should handle module with empty arrays', () => {
            const module: ModuleEntity = {
                id: 6,
                label: 'E',
                color: '#000',
                icon: 'i',
                type: 't',
                isActive: true,
                description: 'D',
                usageDescription: 'U',
                features: [],
                headers: [],
                uses: [],
                link: null,
            } as any;

            const result = service.transformModule(module);

            expect(result.features).toEqual([]);
            expect(result.headers).toEqual([]);
            expect(result.uses).toEqual([]);
        });

        it('should handle missing optional fields on module', () => {
            const module: ModuleEntity = {
                id: 7,
                label: 'Min',
                icon: 'i',
                color: '#000',
                type: 'basic',
                features: [],
                headers: [],
                uses: [],
                link: null,
            } as any;

            const result = service.transformModule(module);

            expect(result.isActive).toBeUndefined();
            expect(result.description).toBeUndefined();
            expect(result.usageDescription).toBeUndefined();
        });
    });

    describe('transformAdminModule', () => {
        it('should return admin-focused fields only', () => {
            const module: ModuleEntity = {
                id: 1,
                label: 'A',
                icon: 'i',
                color: '#123',
                type: 'premium',
                isActive: true,
                usageCount: 42,
                description: 'drop',
            } as any;

            const result = service.transformAdminModule(module);

            expect(result).toEqual({
                id: 1,
                label: 'A',
                icon: 'i',
                color: '#123',
                type: 'premium',
                isActive: true,
                usageCount: 42,
            });
            expect(result).not.toHaveProperty('description');
        });

        it('should handle zero usageCount', () => {
            const module: ModuleEntity = {
                id: 2,
                label: 'B',
                icon: 'j',
                color: '#000',
                type: 'free',
                isActive: false,
                usageCount: 0,
            } as any;
            expect(service.transformAdminModule(module).usageCount).toBe(0);
        });

        it('should handle undefined usageCount', () => {
            const module: ModuleEntity = {
                id: 3,
                label: 'C',
                icon: 'k',
                color: '#000',
                type: 'free',
                isActive: true,
            } as any;
            expect(service.transformAdminModule(module).usageCount).toBeUndefined();
        });

        it('should handle missing color', () => {
            const module: ModuleEntity = {
                id: 4,
                label: 'D',
                icon: 'l',
                type: 'basic',
                isActive: true,
                usageCount: 1,
            } as any;
            expect(service.transformAdminModule(module).color).toBeUndefined();
        });
    });

    describe('transformAModules', () => {
        it('should transform an array of modules for admin', () => {
            const modules: ModuleEntity[] = [
                {
                    id: 1,
                    label: 'M1',
                    icon: 'i1',
                    color: '#1',
                    type: 't1',
                    isActive: true,
                    usageCount: 10,
                } as any,
                {
                    id: 2,
                    label: 'M2',
                    icon: 'i2',
                    color: '#2',
                    type: 't2',
                    isActive: false,
                    usageCount: 5,
                } as any,
            ];
            const result = service.transformAModules(modules);
            expect(result).toHaveLength(2);
            expect(result[0].usageCount).toBe(10);
            expect(result[1].usageCount).toBe(5);
        });

        it('should return empty array for empty input', () => {
            expect(service.transformAModules([])).toEqual([]);
        });
    });

    describe('transformUserModule', () => {
        it('should return user-focused fields only', () => {
            const module: ModuleEntity = {
                id: 1,
                label: 'U',
                icon: 'i',
                color: '#f',
                type: 'standard',
                description: 'Desc',
                usageCount: 99,
                isActive: true,
            } as any;

            const result = service.transformUserModule(module);

            expect(result).toEqual({
                id: 1,
                label: 'U',
                icon: 'i',
                color: '#f',
                type: 'standard',
                description: 'Desc',
            });
            expect(result).not.toHaveProperty('usageCount');
            expect(result).not.toHaveProperty('isActive');
        });

        it('should handle null description', () => {
            const module: ModuleEntity = {
                id: 2,
                label: 'B',
                icon: 'j',
                color: '#0',
                type: 'basic',
                description: null,
            } as any;
            expect(service.transformUserModule(module).description).toBeNull();
        });

        it('should handle missing description', () => {
            const module: ModuleEntity = {
                id: 3,
                label: 'C',
                icon: 'k',
                color: '#0',
                type: 'basic',
            } as any;
            expect(service.transformUserModule(module).description).toBeUndefined();
        });

        it('should handle missing color', () => {
            const module: ModuleEntity = {
                id: 4,
                label: 'D',
                icon: 'l',
                type: 'basic',
                description: 'D',
            } as any;
            expect(service.transformUserModule(module).color).toBeUndefined();
        });

        it('should handle missing icon', () => {
            const module: ModuleEntity = {
                id: 5,
                label: 'E',
                color: '#0',
                type: 'basic',
                description: 'D',
            } as any;
            expect(service.transformUserModule(module).icon).toBeUndefined();
        });
    });

    describe('transformUserModules', () => {
        it('should transform array of modules for user view', () => {
            const modules: ModuleEntity[] = [
                {
                    id: 1,
                    label: 'M1',
                    icon: 'i1',
                    color: '#1',
                    type: 't1',
                    description: 'D1',
                } as any,
                {
                    id: 2,
                    label: 'M2',
                    icon: 'i2',
                    color: '#2',
                    type: 't2',
                    description: 'D2',
                } as any,
            ];
            const result = service.transformUserModules(modules);
            expect(result).toHaveLength(2);
            expect(result[0]).not.toHaveProperty('usageCount');
        });

        it('should return empty array for empty input', () => {
            expect(service.transformUserModules([])).toEqual([]);
        });

        it('should handle modules with missing optional fields', () => {
            const modules: ModuleEntity[] = [{ id: 1, label: 'M', icon: 'i', type: 't' } as any];
            const result = service.transformUserModules(modules);
            expect(result[0].color).toBeUndefined();
            expect(result[0].description).toBeUndefined();
        });
    });

    describe('transformMExportEntity', () => {
        it('should return id and label only', () => {
            const entity = {
                id: 'exp-1',
                label: 'Template 1',
                companyName: 'Acme',
                email: 'a@a.com',
            } as MExportEntity;
            const result = service.transformMExportEntity(entity);
            expect(result).toEqual({ id: 'exp-1', label: 'Template 1' });
            expect(result).not.toHaveProperty('companyName');
            expect(result).not.toHaveProperty('email');
        });

        it('should handle entity with undefined label', () => {
            const entity = { id: 'exp-2' } as MExportEntity;
            expect(service.transformMExportEntity(entity)).toEqual({
                id: 'exp-2',
                label: undefined,
            });
        });
    });

    describe('transformMExport', () => {
        const mockFile = { id: 10, name: 'logo.png' };
        const mockTransformedFile = { id: 10, url: '/logo.png' };

        beforeEach(() => {
            mockUETransformService.transformFiles.mockReturnValue(mockTransformedFile);
        });

        it('should return full export detail with transformed file', () => {
            const entity: MExportEntity = {
                id: 'exp-1',
                label: 'Template 1',
                companyName: 'Acme',
                address: '1 Rue A',
                phoneNumber: '+229',
                email: 'acme@test.com',
                file: { id: 'fl-1', file: mockFile } as any,
            } as MExportEntity;

            const result = service.transformMExport(entity);

            expect(result).toEqual({
                id: 'exp-1',
                label: 'Template 1',
                companyName: 'Acme',
                address: '1 Rue A',
                phoneNumber: '+229',
                email: 'acme@test.com',
                file: mockTransformedFile,
            });
            expect(mockUETransformService.transformFiles).toHaveBeenCalledWith(mockFile);
        });

        it('should call transformFiles with the nested file entity', () => {
            const nestedFile = { id: 99, name: 'nested.jpg' };
            const entity: MExportEntity = {
                id: 'exp-2',
                label: 'T2',
                companyName: 'Corp',
                address: '2 Rue B',
                phoneNumber: '+1',
                email: 'corp@test.com',
                file: { id: 'fl-2', file: nestedFile } as any,
            } as MExportEntity;

            service.transformMExport(entity);

            expect(mockUETransformService.transformFiles).toHaveBeenCalledWith(nestedFile);
        });
    });

    describe('transformMExportEntities', () => {
        it('should transform array of MExport entities to minimal format', () => {
            const entities: MExportEntity[] = [
                { id: 'exp-1', label: 'T1', companyName: 'A' } as MExportEntity,
                { id: 'exp-2', label: 'T2', companyName: 'B' } as MExportEntity,
            ];

            const result = service.transformMExportEntities(entities);

            expect(result).toEqual([
                { id: 'exp-1', label: 'T1' },
                { id: 'exp-2', label: 'T2' },
            ]);
        });

        it('should return empty array for empty input', () => {
            expect(service.transformMExportEntities([])).toEqual([]);
        });

        it('should handle single entity', () => {
            const entities: MExportEntity[] = [{ id: 'exp-1', label: 'T1' } as MExportEntity];
            expect(service.transformMExportEntities(entities)).toEqual([
                { id: 'exp-1', label: 'T1' },
            ]);
        });
    });

    describe('dependency injection', () => {
        it('should have ModulesService injected', () => {
            expect(service['modulesService']).toBeDefined();
            expect(service['modulesService']).toBe(mockModulesService);
        });

        it('should access uETransformService.transformFiles in transformModule when link exists', () => {
            mockUETransformService.transformFiles.mockReturnValue('transformed');
            const module: ModuleEntity = {
                id: 1,
                label: 'T',
                icon: 'i',
                color: '#0',
                type: 't',
                link: { file: { id: 1 } },
                features: [],
                headers: [],
                uses: [],
            } as any;

            service.transformModule(module);

            expect(mockUETransformService.transformFiles).toHaveBeenCalled();
        });
    });
});
