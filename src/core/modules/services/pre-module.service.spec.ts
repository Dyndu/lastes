import { Test, TestingModule } from '@nestjs/testing';
import { PreModuleService } from './pre-module.service';
import { ModulesService } from './modules.service';
import { ModuleEntity } from '../entities';
import {
    FileUsageEnum,
    ModuleMethodEnum,
    ModuleTypeEnum,
    SocketEventEnum,
} from '../../../common/enum';
import { MRelationDto } from '../dto';
import { SelectQueryBuilder } from 'typeorm';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('PreModuleService', () => {
    let service: PreModuleService;
    let modulesService: typeof mockModulesService;
    let mockQueryBuilder: Partial<SelectQueryBuilder<ModuleEntity>>;

    const mockModulesService = {
        moduleRepository: {
            getRepository: jest.fn(),
            findActiveOne: jest.fn(),
            assertUniqueActive: jest.fn(),
            update: jest.fn(),
        },
        otherUtils: {
            formatCriteria: jest.fn(),
        },
        logger: {
            info: jest.fn(),
            debug: jest.fn(),
            error: jest.fn(),
        },
        errorHandler: {
            notFound: jest.fn(),
            validation: jest.fn(),
        },
        fileLinksService: {
            linkFileToEntity: jest.fn(),
        },
        socketService: {
            sendDataToRoom: jest.fn(),
            sendDataToRoute: jest.fn(),
            sendDataToUser: jest.fn(),
        },
        mTransformService: {
            transformUserModule: jest.fn(),
            transformAdminModule: jest.fn(),
        },
    };

    beforeEach(async () => {
        mockQueryBuilder = {
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([]),
        };

        mockModulesService.moduleRepository.getRepository.mockReturnValue({
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
        });

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PreModuleService,
                {
                    provide: ModulesService,
                    useValue: mockModulesService,
                },
            ],
        }).compile();

        service = module.get<PreModuleService>(PreModuleService);
        modulesService = module.get<ModulesService>(ModulesService) as any;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('baseModuleQuery', () => {
        it('should apply deleted=false filter', () => {
            service.baseModuleQuery({});
            expect(mockQueryBuilder.where).toHaveBeenCalledWith('module.deleted = false');
        });

        it('should not apply isActive filter when active is undefined', () => {
            service.baseModuleQuery({});
            expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
        });

        it('should apply isActive=true filter when active is true', () => {
            service.baseModuleQuery({ active: true });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('module.isActive = :active', {
                active: true,
            });
        });

        it('should apply isActive=false filter when active is false', () => {
            service.baseModuleQuery({ active: false });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('module.isActive = :active', {
                active: false,
            });
        });
    });

    describe('adminModulesList', () => {
        it('should select admin fields', async () => {
            await service.adminModulesList({});
            expect(mockQueryBuilder.select).toHaveBeenCalledWith([
                'module.id',
                'module.icon',
                'module.label',
                'module.color',
                'module.usageCount',
                'module.type',
                'module.isActive',
            ]);
        });

        it('should order by updatedAt DESC', async () => {
            await service.adminModulesList({});
            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('module.updatedAt', 'DESC');
        });

        it('should apply searchTerm filter when provided', async () => {
            await service.adminModulesList({ searchTerm: 'abc' });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                expect.stringContaining('module.label ILIKE'),
                { searchTerm: '%a%b%c%' },
            );
        });

        it('should not apply searchTerm filter when not provided', async () => {
            await service.adminModulesList({});
            const calls = (mockQueryBuilder.andWhere as jest.Mock).mock.calls;
            const hasSearchTerm = calls.some(([q]: [string]) => q.includes('ILIKE'));
            expect(hasSearchTerm).toBe(false);
        });

        it('should apply active filter', async () => {
            await service.adminModulesList({ active: true });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('module.isActive = :active', {
                active: true,
            });
        });

        it('should return result of getMany', async () => {
            const modules = [{ id: '1' }];
            (mockQueryBuilder.getMany as jest.Mock).mockResolvedValue(modules);
            const result = await service.adminModulesList({});
            expect(result).toEqual(modules);
        });
    });

    describe('buildUserModuleListQuery', () => {
        it('should always filter isActive=true', () => {
            service.buildUserModuleListQuery();
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('module.isActive = true');
        });

        it('should select user fields including color', () => {
            service.buildUserModuleListQuery();
            expect(mockQueryBuilder.select).toHaveBeenCalledWith([
                'module.id',
                'module.icon',
                'module.label',
                'module.color',
                'module.description',
                'module.type',
            ]);
        });

        it('should apply type filter when provided', () => {
            service.buildUserModuleListQuery(undefined, ModuleTypeEnum.TOOLS);
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('module.type = :type', {
                type: ModuleTypeEnum.TOOLS,
            });
        });

        it('should not apply type filter when not provided', () => {
            service.buildUserModuleListQuery();
            const calls = (mockQueryBuilder.andWhere as jest.Mock).mock.calls;
            const hasType = calls.some(([q]: [string]) => q.includes('type'));
            expect(hasType).toBe(false);
        });

        it('should apply searchTerm filter on label and description', () => {
            service.buildUserModuleListQuery('test');
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                expect.stringContaining('module.description ILIKE'),
                { searchTerm: '%t%e%s%t%' },
            );
        });

        it('should not apply searchTerm filter when not provided', () => {
            service.buildUserModuleListQuery();
            const calls = (mockQueryBuilder.andWhere as jest.Mock).mock.calls;
            const hasSearch = calls.some(([q]: [string]) => q.includes('description ILIKE'));
            expect(hasSearch).toBe(false);
        });

        it('should return the query builder', () => {
            const result = service.buildUserModuleListQuery();
            expect(result).toBe(mockQueryBuilder);
        });
    });

    describe('userModuleList', () => {
        it('should call getMany and return results', async () => {
            const modules = [{ id: '1' }];
            (mockQueryBuilder.getMany as jest.Mock).mockResolvedValue(modules);
            const result = await service.userModuleList();
            expect(mockQueryBuilder.getMany).toHaveBeenCalled();
            expect(result).toEqual(modules);
        });

        it('should forward searchTerm', async () => {
            await service.userModuleList('foo');
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                expect.stringContaining('ILIKE'),
                {
                    searchTerm: '%f%o%o%',
                },
            );
        });
    });

    describe('userToolList', () => {
        it('should filter by TOOLS type', async () => {
            await service.userToolList();
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('module.type = :type', {
                type: ModuleTypeEnum.TOOLS,
            });
        });

        it('should forward searchTerm', async () => {
            await service.userToolList('bar');
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                expect.stringContaining('ILIKE'),
                {
                    searchTerm: '%b%a%r%',
                },
            );
        });

        it('should return getMany result', async () => {
            const tools = [{ id: '2' }];
            (mockQueryBuilder.getMany as jest.Mock).mockResolvedValue(tools);
            const result = await service.userToolList();
            expect(result).toEqual(tools);
        });
    });

    describe('findModuleByCriteria', () => {
        it('should return the module when found', async () => {
            const mockModule = { id: 'm1' } as ModuleEntity;
            mockModulesService.otherUtils.formatCriteria.mockReturnValue('id=m1');
            mockModulesService.moduleRepository.findActiveOne.mockResolvedValue(mockModule);

            const result = await service.findModuleByCriteria({ id: 'm1' });

            expect(result).toBe(mockModule);
            expect(mockModulesService.logger.info).toHaveBeenCalledWith(
                'Find a module by criteria: id=m1',
            );
        });

        it('should call findActiveOne with criteria and relations', async () => {
            const mockModule = { id: 'm1' } as ModuleEntity;
            mockModulesService.otherUtils.formatCriteria.mockReturnValue('');
            mockModulesService.moduleRepository.findActiveOne.mockResolvedValue(mockModule);

            await service.findModuleByCriteria({ id: 'm1' }, ['relation1']);

            expect(mockModulesService.moduleRepository.findActiveOne).toHaveBeenCalledWith(
                mockModulesService.moduleRepository,
                { id: 'm1' },
                ['relation1'],
            );
        });

        it('should call notFound and throw when module is not found', async () => {
            mockModulesService.otherUtils.formatCriteria.mockReturnValue('id=x');
            mockModulesService.moduleRepository.findActiveOne.mockResolvedValue(null);
            mockModulesService.errorHandler.notFound.mockImplementation(() => {
                throw new Error('Not found');
            });

            await expect(service.findModuleByCriteria({ id: 'x' })).rejects.toThrow('Not found');
            expect(mockModulesService.errorHandler.notFound).toHaveBeenCalledWith(
                'Module not found with criteria: id=x',
                'Module not found',
            );
        });
    });

    describe('updateModuleDetails', () => {
        const mockModule = { id: 'module-1' } as ModuleEntity;

        it('should return early message when moduleUpdates is undefined', async () => {
            const result = await service.updateModuleDetails(mockModule);
            expect(result).toEqual({
                message: 'No updates provided for module',
            });
        });

        it('should return early message when updates is empty object', async () => {
            const result = await service.updateModuleDetails(mockModule, {});
            expect(result).toEqual({
                message: 'No updates provided for module',
            });
        });

        it('should trim and include requiredFields (label, icon, color)', async () => {
            mockModulesService.moduleRepository.update.mockResolvedValue({
                affected: 1,
            });

            await service.updateModuleDetails(mockModule, {
                label: '  Hello  ',
                icon: '  star  ',
                color: '  #fff  ',
            });

            expect(mockModulesService.moduleRepository.update).toHaveBeenCalledWith(
                { id: 'module-1' },
                { label: 'Hello', icon: 'star', color: '#fff' },
            );
        });

        it('should skip requiredFields when they are empty strings after trim', async () => {
            mockModulesService.moduleRepository.update.mockResolvedValue({
                affected: 1,
            });

            await service.updateModuleDetails(mockModule, { label: '   ' });

            expect(mockModulesService.moduleRepository.update).toHaveBeenCalledWith(
                { id: 'module-1' },
                {},
            );
        });

        it('should set stringFields to null when null is passed', async () => {
            mockModulesService.moduleRepository.update.mockResolvedValue({
                affected: 1,
            });

            await service.updateModuleDetails(mockModule, {
                description: null as any,
                usageDescription: null as any,
            });

            expect(mockModulesService.moduleRepository.update).toHaveBeenCalledWith(
                { id: 'module-1' },
                { description: null, usageDescription: null },
            );
        });

        it('should trim stringFields when they are strings', async () => {
            mockModulesService.moduleRepository.update.mockResolvedValue({
                affected: 1,
            });

            await service.updateModuleDetails(mockModule, {
                description: '  A description  ',
                usageDescription: '  usage  ',
            });

            expect(mockModulesService.moduleRepository.update).toHaveBeenCalledWith(
                { id: 'module-1' },
                { description: 'A description', usageDescription: 'usage' },
            );
        });

        it('should include otherFields (link, type, isActive, usageCount)', async () => {
            mockModulesService.moduleRepository.update.mockResolvedValue({
                affected: 1,
            });
            const link = { id: 'link-1' } as any;

            await service.updateModuleDetails(mockModule, {
                link,
                type: ModuleTypeEnum.TOOLS,
                isActive: false,
                usageCount: 42,
            });

            expect(mockModulesService.moduleRepository.update).toHaveBeenCalledWith(
                { id: 'module-1' },
                {
                    link,
                    type: ModuleTypeEnum.TOOLS,
                    isActive: false,
                    usageCount: 42,
                },
            );
        });

        it('should not include otherFields when they are undefined', async () => {
            mockModulesService.moduleRepository.update.mockResolvedValue({
                affected: 1,
            });

            await service.updateModuleDetails(mockModule, {
                isActive: undefined,
            });

            const callArg = mockModulesService.moduleRepository.update.mock.calls[0][1];
            expect(callArg).not.toHaveProperty('isActive');
        });
    });

    describe('ensureLabelUniqueness', () => {
        const mockModule = { id: 'm1' } as ModuleEntity;

        it('should resolve without throwing when label is unique', async () => {
            mockModulesService.moduleRepository.assertUniqueActive.mockResolvedValue(undefined);
            await expect(
                service.ensureLabelUniqueness('UniqueLabel', mockModule),
            ).resolves.not.toThrow();
        });

        it('should throw validation error when label is not unique', async () => {
            mockModulesService.moduleRepository.assertUniqueActive.mockImplementation(
                async (_repo: any, errors: Record<string, string>) => {
                    errors['label'] = 'Label already in use';
                },
            );
            const validationError = new Error('Validation failed');
            mockModulesService.errorHandler.validation.mockReturnValue(validationError);

            await expect(
                service.ensureLabelUniqueness('DuplicateLabel', mockModule),
            ).rejects.toThrow('Validation failed');
            expect(mockModulesService.errorHandler.validation).toHaveBeenCalledWith({
                label: 'Label already in use',
            });
        });
    });

    describe('prepareModuleData', () => {
        const mockModule = { id: 'module-1' } as ModuleEntity;

        it('should return empty object when dto is empty', async () => {
            const result = await service.prepareModuleData(mockModule, {});
            expect(result).toEqual({});
        });

        it('should set label after uniqueness check', async () => {
            mockModulesService.moduleRepository.assertUniqueActive.mockResolvedValue(undefined);
            const result = await service.prepareModuleData(mockModule, {
                label: 'New Label',
            });
            expect(result).toMatchObject({ label: 'New Label' });
            expect(mockModulesService.moduleRepository.assertUniqueActive).toHaveBeenCalled();
        });

        it('should include description when provided', async () => {
            const result = await service.prepareModuleData(mockModule, {
                description: 'My desc',
            });
            expect(result).toMatchObject({ description: 'My desc' });
        });

        it('should include null description', async () => {
            const result = await service.prepareModuleData(mockModule, {
                description: null as any,
            });
            expect(result).toMatchObject({ description: null });
        });

        it('should include color when provided', async () => {
            const result = await service.prepareModuleData(mockModule, {
                color: '#ff0000',
            });
            expect(result).toMatchObject({ color: '#ff0000' });
        });

        it('should include null color', async () => {
            const result = await service.prepareModuleData(mockModule, {
                color: null as any,
            });
            expect(result).toMatchObject({ color: null });
        });

        it('should not include color when undefined', async () => {
            const result = await service.prepareModuleData(mockModule, {});
            expect(result).not.toHaveProperty('color');
        });

        it('should include usageDescription when provided', async () => {
            const result = await service.prepareModuleData(mockModule, {
                usageDescription: 'usage',
            });
            expect(result).toMatchObject({ usageDescription: 'usage' });
        });

        it('should include null usageDescription', async () => {
            const result = await service.prepareModuleData(mockModule, {
                usageDescription: null as any,
            });
            expect(result).toMatchObject({ usageDescription: null });
        });

        it('should include icon when provided', async () => {
            const result = await service.prepareModuleData(mockModule, {
                icon: 'star',
            });
            expect(result).toMatchObject({ icon: 'star' });
        });

        it('should include null icon', async () => {
            const result = await service.prepareModuleData(mockModule, {
                icon: null as any,
            });
            expect(result).toMatchObject({ icon: null });
        });

        it('should link file when link is provided', async () => {
            const fileLink = { id: 'fl-1' } as any;
            mockModulesService.fileLinksService.linkFileToEntity.mockResolvedValue(fileLink);

            const result = await service.prepareModuleData(mockModule, {
                link: 'some-file-id' as any,
            });

            expect(mockModulesService.fileLinksService.linkFileToEntity).toHaveBeenCalledWith(
                'some-file-id',
                FileUsageEnum.MODULES,
            );
            expect(result).toMatchObject({ link: fileLink });
        });

        it('should not call linkFileToEntity when link is not provided', async () => {
            await service.prepareModuleData(mockModule, {});
            expect(mockModulesService.fileLinksService.linkFileToEntity).not.toHaveBeenCalled();
        });
    });

    describe('splitByMethod', () => {
        it('should split CREATE and UPDATE correctly', () => {
            const data: MRelationDto[] = [
                { method: ModuleMethodEnum.CREATE, label: 'A' },
                { method: ModuleMethodEnum.UPDATE, id: '1', label: 'B' },
            ];
            const result = service.splitByMethod(data);
            expect(result.creates).toHaveLength(1);
            expect(result.creates[0].label).toBe('A');
            expect(result.updates).toHaveLength(1);
            expect(result.updates[0].label).toBe('B');
        });

        it('should return empty arrays when input is empty', () => {
            const result = service.splitByMethod([]);
            expect(result.creates).toHaveLength(0);
            expect(result.updates).toHaveLength(0);
        });

        it('should ignore entries with unknown method', () => {
            const data: MRelationDto[] = [{ method: 'UNKNOWN' as any, label: 'X' }];
            const result = service.splitByMethod(data);
            expect(result.creates).toHaveLength(0);
            expect(result.updates).toHaveLength(0);
        });

        it('should handle multiple creates and updates', () => {
            const data: MRelationDto[] = [
                { method: ModuleMethodEnum.CREATE, label: 'A' },
                { method: ModuleMethodEnum.CREATE, label: 'B' },
                { method: ModuleMethodEnum.UPDATE, id: '1', label: 'C' },
            ];
            const result = service.splitByMethod(data);
            expect(result.creates).toHaveLength(2);
            expect(result.updates).toHaveLength(1);
        });
    });

    describe('broadcastMChange', () => {
        it('should call sendDataToRoom with correct args', () => {
            const m = { id: 'm1' } as ModuleEntity;
            const userPayload = { id: 'm1', label: 'user' };
            mockModulesService.mTransformService.transformUserModule.mockReturnValue(userPayload);
            mockModulesService.mTransformService.transformAdminModule.mockReturnValue({});

            service.broadcastMChange(m, SocketEventEnum.MODULE_UPDATED);

            expect(mockModulesService.socketService.sendDataToRoom).toHaveBeenCalledWith(
                '/modules/users',
                'modules-user-room',
                SocketEventEnum.MODULE_UPDATED,
                { payload: [userPayload] },
            );
        });

        it('should call sendDataToRoute with correct args', () => {
            const m = { id: 'm1' } as ModuleEntity;
            const adminPayload = { id: 'm1', label: 'admin' };
            mockModulesService.mTransformService.transformUserModule.mockReturnValue({});
            mockModulesService.mTransformService.transformAdminModule.mockReturnValue(adminPayload);

            service.broadcastMChange(m, SocketEventEnum.MODULE_UPDATED);

            expect(mockModulesService.socketService.sendDataToRoute).toHaveBeenCalledWith(
                '/modules',
                SocketEventEnum.MODULE_UPDATED,
                {
                    payload: [adminPayload],
                },
            );
        });

        it('should call both transform methods with the module', () => {
            const m = { id: 'm1' } as ModuleEntity;
            mockModulesService.mTransformService.transformUserModule.mockReturnValue({});
            mockModulesService.mTransformService.transformAdminModule.mockReturnValue({});

            service.broadcastMChange(m, SocketEventEnum.MODULE_ACTIVATED);

            expect(mockModulesService.mTransformService.transformUserModule).toHaveBeenCalledWith(
                m,
            );
            expect(mockModulesService.mTransformService.transformAdminModule).toHaveBeenCalledWith(
                m,
            );
        });
    });

    describe('broadcastMToUser', () => {
        it('should call sendDataToUser with correct args', () => {
            const m = { id: 'm1' } as ModuleEntity;
            const transformed = { id: 'm1' };
            mockModulesService.mTransformService.transformUserModule.mockReturnValue(transformed);

            service.broadcastMToUser('user-1', m, SocketEventEnum.MODULE_UPDATED);

            expect(mockModulesService.socketService.sendDataToUser).toHaveBeenCalledWith(
                'user-1',
                '/modules/users/personal',
                SocketEventEnum.MODULE_UPDATED,
                transformed,
            );
        });

        it('should call transformUserModule with the module', () => {
            const m = { id: 'm2' } as ModuleEntity;
            mockModulesService.mTransformService.transformUserModule.mockReturnValue({});

            service.broadcastMToUser('user-2', m, SocketEventEnum.MODULE_ACTIVATED);

            expect(mockModulesService.mTransformService.transformUserModule).toHaveBeenCalledWith(
                m,
            );
        });
    });
});
