import { Test, TestingModule } from '@nestjs/testing';
import { ModulesService } from './modules.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import {
    ModulesRepository,
    MHeaderRepository,
    MUseRepository,
    MFeatureRepository,
    MUsersRepository,
    MExportRepository,
} from '../repositories';
import { ErrorHandlerService } from '../../../common/response';
import { PreModuleService } from './pre-module.service';
import { OtherUtils } from '../../../utils/services/tools';
import { UsersService } from '../../users/services';
import { MTransformService } from './m-transform.service';
import { CacheService } from '../../../helpers/cache/cache.service';
import { MHeaderService } from './m-header.service';
import { MFeatureService } from './m-feature.service';
import { MUseService } from './m-use.service';
import { MUsersService } from './m-users.service';
import { MExportService } from './m-export.service';
import { FileLinksService } from '../../files/services/file-links.service';
import { SocketService } from '../../../helpers/socket/socket.service';
import { ModuleEntity } from '../entities';
import { UpdateAllDto } from '../dto';
import { ModuleTypeEnum, SocketEventEnum } from '../../../common/enum';
import { CurrentUserInterface } from '../../../interface';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('ModulesService', () => {
    let service: ModulesService;
    let preModuleService: PreModuleService;
    let mTransformService: MTransformService;
    let mHeaderService: MHeaderService;
    let mFeatureService: MFeatureService;
    let mUseService: MUseService;
    let mUsersService: MUsersService;
    let userService: UsersService;
    let fileLinksService: FileLinksService;
    let mExportService: MExportService;
    let logger: any;

    const mockLogger = {
        info: jest.fn(),
        debug: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    };

    const mockPreModuleService = {
        adminModulesList: jest.fn(),
        userModuleList: jest.fn(),
        userToolList: jest.fn(),
        findModuleByCriteria: jest.fn(),
        updateModuleDetails: jest.fn(),
        prepareModuleData: jest.fn(),
        broadcastMChange: jest.fn(),
        broadcastMToUser: jest.fn(),
    };

    const mockMTransformService = {
        transformAModules: jest.fn(),
        transformUserModules: jest.fn(),
        moduleDetails: jest.fn(),
        transformModule: jest.fn(),
        mExportDetails: jest.fn(),
        transformMExportEntities: jest.fn(),
        transformMExport: jest.fn(),
    };

    const mockMHeaderService = { processModuleHeaders: jest.fn() };
    const mockMFeatureService = { processModuleFeatures: jest.fn() };
    const mockMUseService = { processModuleUses: jest.fn() };

    const mockMUsersService = {
        buildUserModulesFromUserQuery: jest.fn(),
        setModulePinnedState: jest.fn(),
    };

    const mockUserService = {
        preUserService: { retrieveUserByCriteria: jest.fn() },
    };

    const mockFileLinksService = { unlinkAndCleanup: jest.fn() };

    const mockSocketService = {
        sendDataToRoom: jest.fn(),
        sendDataToRoute: jest.fn(),
        sendDataToUser: jest.fn(),
    };

    const mockMExportService = {
        userMExports: jest.fn(),
        retrieveMExportByCriteria: jest.fn(),
        createMExport: jest.fn(),
        mExportUpdate: jest.fn(),
    };

    const mockUser: CurrentUserInterface = {
        id: 'user-123',
        role: 'user',
        sessionId: 'session-123',
        permissions: {},
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ModulesService,
                { provide: WINSTON_MODULE_PROVIDER, useValue: mockLogger },
                { provide: PreModuleService, useValue: mockPreModuleService },
                { provide: MTransformService, useValue: mockMTransformService },
                { provide: MHeaderService, useValue: mockMHeaderService },
                { provide: MFeatureService, useValue: mockMFeatureService },
                { provide: MUseService, useValue: mockMUseService },
                { provide: MUsersService, useValue: mockMUsersService },
                { provide: MExportService, useValue: mockMExportService },
                { provide: ErrorHandlerService, useValue: {} },
                { provide: OtherUtils, useValue: {} },
                { provide: CacheService, useValue: {} },
                { provide: SocketService, useValue: mockSocketService },
                { provide: UsersService, useValue: mockUserService },
                { provide: FileLinksService, useValue: mockFileLinksService },
                { provide: MUsersRepository, useValue: {} },
                { provide: ModulesRepository, useValue: {} },
                { provide: MHeaderRepository, useValue: {} },
                { provide: MUseRepository, useValue: {} },
                { provide: MExportRepository, useValue: {} },
                { provide: MFeatureRepository, useValue: {} },
            ],
        }).compile();

        service = module.get<ModulesService>(ModulesService);
        preModuleService = module.get<PreModuleService>(PreModuleService);
        mTransformService = module.get<MTransformService>(MTransformService);
        mHeaderService = module.get<MHeaderService>(MHeaderService);
        mFeatureService = module.get<MFeatureService>(MFeatureService);
        mUseService = module.get<MUseService>(MUseService);
        mUsersService = module.get<MUsersService>(MUsersService);
        userService = module.get<UsersService>(UsersService);
        fileLinksService = module.get<FileLinksService>(FileLinksService);
        mExportService = module.get<MExportService>(MExportService);
        logger = module.get(WINSTON_MODULE_PROVIDER);
    });

    afterEach(() => jest.clearAllMocks());

    describe('Service instantiation', () => {
        it('should be defined', () => {
            expect(service).toBeDefined();
        });

        it('should have all dependencies injected', () => {
            expect(service['logger']).toBeDefined();
            expect(service['preModuleService']).toBeDefined();
            expect(service['mTransformService']).toBeDefined();
            expect(service['mHeaderService']).toBeDefined();
            expect(service['mFeatureService']).toBeDefined();
            expect(service['mUseService']).toBeDefined();
            expect(service['mUsersService']).toBeDefined();
            expect(service['mExportService']).toBeDefined();
            expect(service['errorHandler']).toBeDefined();
            expect(service['otherUtils']).toBeDefined();
            expect(service['cacheService']).toBeDefined();
            expect(service['socketService']).toBeDefined();
            expect(service['userService']).toBeDefined();
            expect(service['fileLinksService']).toBeDefined();
            expect(service['mUsersRepository']).toBeDefined();
            expect(service['moduleRepository']).toBeDefined();
            expect(service['mHeaderRepo']).toBeDefined();
            expect(service['mUseRepository']).toBeDefined();
            expect(service['mExportRepository']).toBeDefined();
            expect(service['mFeatureRepo']).toBeDefined();
        });
    });

    describe('getModules', () => {
        it('should retrieve and transform admin modules list with filters', async () => {
            const filters = { active: true, searchTerm: 'test' };
            const mockModules = [{ id: '1', label: 'Module 1', isActive: true } as ModuleEntity];
            const transformed = [{ id: '1', label: 'Module 1' }];

            mockPreModuleService.adminModulesList.mockResolvedValue(mockModules);
            mockMTransformService.transformAModules.mockReturnValue(transformed);

            const result = await service.getModules(filters);

            expect(logger.info).toHaveBeenCalledWith('Retrieve module list with specified fields');
            expect(preModuleService.adminModulesList).toHaveBeenCalledWith(filters);
            expect(mTransformService.transformAModules).toHaveBeenCalledWith(mockModules);
            expect(result).toEqual(transformed);
        });

        it('should retrieve modules without filters', async () => {
            const filters = {};
            mockPreModuleService.adminModulesList.mockResolvedValue([]);
            mockMTransformService.transformAModules.mockReturnValue([]);

            const result = await service.getModules(filters);

            expect(preModuleService.adminModulesList).toHaveBeenCalledWith(filters);
            expect(result).toEqual([]);
        });
    });

    describe('userModulesList', () => {
        it('should group user modules by type with searchTerm', async () => {
            const mockModules = [
                { id: '1', type: ModuleTypeEnum.MODULE } as ModuleEntity,
                { id: '2', type: ModuleTypeEnum.MODULE } as ModuleEntity,
                { id: '3', type: ModuleTypeEnum.TOOLS } as ModuleEntity,
            ];

            mockPreModuleService.userModuleList.mockResolvedValue(mockModules);

            const result = await service.userModulesList('search');

            expect(logger.info).toHaveBeenCalledWith(
                'Retrieve userModulesList with searchTerm: search',
            );
            expect(result).toEqual({
                [ModuleTypeEnum.MODULE]: [mockModules[0], mockModules[1]],
                [ModuleTypeEnum.TOOLS]: [mockModules[2]],
            });
        });

        it('should retrieve user modules without searchTerm', async () => {
            mockPreModuleService.userModuleList.mockResolvedValue([
                { id: '1', type: ModuleTypeEnum.MODULE } as ModuleEntity,
            ]);

            const result = await service.userModulesList(undefined);

            expect(logger.info).toHaveBeenCalledWith(
                'Retrieve userModulesList with searchTerm: undefined',
            );
            expect(preModuleService.userModuleList).toHaveBeenCalledWith(undefined);
            expect(result).toEqual({
                [ModuleTypeEnum.MODULE]: [{ id: '1', type: ModuleTypeEnum.MODULE }],
            });
        });

        it('should return empty object when no modules found', async () => {
            mockPreModuleService.userModuleList.mockResolvedValue([]);
            const result = await service.userModulesList('test');
            expect(result).toEqual({});
        });

        it('should group multiple modules of different types', async () => {
            const mockModules = [
                { id: '1', type: ModuleTypeEnum.MODULE } as ModuleEntity,
                { id: '2', type: ModuleTypeEnum.TOOLS } as ModuleEntity,
                { id: '3', type: ModuleTypeEnum.TOOLS } as ModuleEntity,
            ];
            mockPreModuleService.userModuleList.mockResolvedValue(mockModules);

            const result = await service.userModulesList();

            expect(result).toEqual({
                [ModuleTypeEnum.MODULE]: [mockModules[0]],
                [ModuleTypeEnum.TOOLS]: [mockModules[1], mockModules[2]],
            });
        });
    });

    describe('userPinModulesList', () => {
        it('should retrieve user pinned modules with searchTerm', async () => {
            const expected = [{ id: '1' }];
            mockMUsersService.buildUserModulesFromUserQuery.mockResolvedValue(expected);

            const result = await service.userPinModulesList(mockUser, 'test');

            expect(logger.info).toHaveBeenCalledWith(
                'Retrieve userPinModules with searchTerm: test',
            );
            expect(mUsersService.buildUserModulesFromUserQuery).toHaveBeenCalledWith(
                mockUser.id,
                'test',
            );
            expect(result).toEqual(expected);
        });

        it('should retrieve pinned modules without searchTerm', async () => {
            mockMUsersService.buildUserModulesFromUserQuery.mockResolvedValue([]);

            const result = await service.userPinModulesList(mockUser, undefined);

            expect(logger.info).toHaveBeenCalledWith(
                'Retrieve userPinModules with searchTerm: undefined',
            );
            expect(mUsersService.buildUserModulesFromUserQuery).toHaveBeenCalledWith(
                mockUser.id,
                undefined,
            );
            expect(result).toEqual([]);
        });
    });

    describe('userTools', () => {
        it('should retrieve and transform user tools with searchTerm', async () => {
            const mockTools = [{ id: '1', type: ModuleTypeEnum.TOOLS } as ModuleEntity];
            const transformed = [{ id: '1' }];

            mockPreModuleService.userToolList.mockResolvedValue(mockTools);
            mockMTransformService.transformUserModules.mockReturnValue(transformed);

            const result = await service.userTools('tool');

            expect(logger.info).toHaveBeenCalledWith('Retrieve userTools with searchTerm: tool');
            expect(preModuleService.userToolList).toHaveBeenCalledWith('tool');
            expect(mTransformService.transformUserModules).toHaveBeenCalledWith(mockTools);
            expect(result).toEqual(transformed);
        });

        it('should retrieve user tools without searchTerm', async () => {
            mockPreModuleService.userToolList.mockResolvedValue([]);
            mockMTransformService.transformUserModules.mockReturnValue([]);

            const result = await service.userTools(undefined);

            expect(preModuleService.userToolList).toHaveBeenCalledWith(undefined);
            expect(result).toEqual([]);
        });
    });

    describe('moduleDetails', () => {
        it('should retrieve and transform module details by id', async () => {
            const mockModule = { id: 'mod-1' } as ModuleEntity;
            const relations = ['features', 'headers'];
            const transformed = { id: 'mod-1', label: 'M' };

            mockMTransformService.moduleDetails.mockReturnValue(relations);
            mockPreModuleService.findModuleByCriteria.mockResolvedValue(mockModule);
            mockMTransformService.transformModule.mockReturnValue(transformed);

            const result = await service.moduleDetails('mod-1');

            expect(logger.info).toHaveBeenCalledWith(
                'Retrieve module details with specified fields',
            );
            expect(mTransformService.moduleDetails).toHaveBeenCalled();
            expect(preModuleService.findModuleByCriteria).toHaveBeenCalledWith(
                { id: 'mod-1' },
                relations,
            );
            expect(mTransformService.transformModule).toHaveBeenCalledWith(mockModule);
            expect(result).toEqual(transformed);
        });
    });

    describe('modulePinStateByUser', () => {
        const mockUserEntity = { id: mockUser.id };
        const mockModule = { id: 'mod-1' } as ModuleEntity;

        beforeEach(() => {
            mockUserService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockUserEntity);
            mockPreModuleService.findModuleByCriteria.mockResolvedValue(mockModule);
            mockMUsersService.setModulePinnedState.mockResolvedValue(undefined);
        });

        it('should pin a module and broadcast MODULE_PINNED event', async () => {
            const result = await service.modulePinStateByUser(mockUser, 'mod-1', true);

            expect(logger.debug).toHaveBeenCalledWith(
                `Setting pinned state for module with id: ${mockUser.id} by user: mod-1`,
            );
            expect(mUsersService.setModulePinnedState).toHaveBeenCalledWith(
                mockUserEntity,
                mockModule,
                true,
            );
            expect(preModuleService.broadcastMToUser).toHaveBeenCalledWith(
                mockUser.id,
                mockModule,
                SocketEventEnum.MODULE_PINNED,
            );
            expect(result).toEqual({ message: 'Module pinned successfully' });
        });

        it('should unpin a module and broadcast MODULE_UNPINNED event', async () => {
            const result = await service.modulePinStateByUser(mockUser, 'mod-1', false);

            expect(preModuleService.broadcastMToUser).toHaveBeenCalledWith(
                mockUser.id,
                mockModule,
                SocketEventEnum.MODULE_UNPINNED,
            );
            expect(result).toEqual({ message: 'Module unpinned successfully' });
        });
    });

    describe('toggleModule', () => {
        it('should activate an inactive module', async () => {
            const mockModule = { id: 'mod-1', isActive: false } as ModuleEntity;
            mockPreModuleService.findModuleByCriteria.mockResolvedValue(mockModule);
            mockPreModuleService.updateModuleDetails.mockResolvedValue(undefined);

            const result = await service.toggleModule('mod-1');

            expect(logger.info).toHaveBeenCalledWith('Toggle module with id: mod-1');
            expect(preModuleService.updateModuleDetails).toHaveBeenCalledWith(mockModule, {
                isActive: true,
            });
            expect(preModuleService.broadcastMChange).toHaveBeenCalledWith(
                mockModule,
                SocketEventEnum.MODULE_ACTIVATED,
            );
            expect(result).toEqual({ message: 'Module activated successfully.' });
        });

        it('should deactivate an active module', async () => {
            const mockModule = { id: 'mod-2', isActive: true } as ModuleEntity;
            mockPreModuleService.findModuleByCriteria.mockResolvedValue(mockModule);
            mockPreModuleService.updateModuleDetails.mockResolvedValue(undefined);

            const result = await service.toggleModule('mod-2');

            expect(preModuleService.updateModuleDetails).toHaveBeenCalledWith(mockModule, {
                isActive: false,
            });
            expect(preModuleService.broadcastMChange).toHaveBeenCalledWith(
                mockModule,
                SocketEventEnum.MODULE_DEACTIVATED,
            );
            expect(result).toEqual({ message: 'Module deactivated successfully.' });
        });
    });

    describe('updateModule', () => {
        const baseModule = { id: 'mod-1', link: { id: 'link-1', file: { id: 'file-1' } } } as any;
        const baseUpdates = { label: 'Updated' };

        beforeEach(() => {
            mockPreModuleService.findModuleByCriteria.mockResolvedValue(baseModule);
            mockPreModuleService.prepareModuleData.mockResolvedValue(baseUpdates);
            mockPreModuleService.updateModuleDetails.mockResolvedValue(undefined);
            mockMHeaderService.processModuleHeaders.mockResolvedValue(undefined);
            mockMFeatureService.processModuleFeatures.mockResolvedValue(undefined);
            mockMUseService.processModuleUses.mockResolvedValue(undefined);
            mockFileLinksService.unlinkAndCleanup.mockResolvedValue(undefined);
        });

        it('should update module with all fields and broadcast MODULE_UPDATED', async () => {
            const dto: UpdateAllDto = {
                label: 'Updated',
                headers: [{ method: 'CREATE' as any, label: 'H1', icon: 'h' }],
                features: [{ method: 'UPDATE' as any, id: 'f1', label: 'F1', icon: 'f' }],
                uses: [{ method: 'CREATE' as any, label: 'U1', icon: 'u' }],
            };

            const result = await service.updateModule('mod-1', dto);

            expect(logger.info).toHaveBeenCalledWith('Update module with id: mod-1');
            expect(preModuleService.findModuleByCriteria).toHaveBeenCalledWith({ id: 'mod-1' }, [
                'link',
                'link.file',
            ]);
            expect(preModuleService.prepareModuleData).toHaveBeenCalledWith(baseModule, dto);
            expect(preModuleService.updateModuleDetails).toHaveBeenCalledWith(
                baseModule,
                baseUpdates,
            );
            expect(mHeaderService.processModuleHeaders).toHaveBeenCalledWith(
                baseModule,
                dto.headers,
            );
            expect(mFeatureService.processModuleFeatures).toHaveBeenCalledWith(
                baseModule,
                dto.features,
            );
            expect(mUseService.processModuleUses).toHaveBeenCalledWith(baseModule, dto.uses);
            expect(preModuleService.broadcastMChange).toHaveBeenCalledWith(
                baseModule,
                SocketEventEnum.MODULE_UPDATED,
            );
            expect(result).toEqual({ message: 'Module updated successfully.' });
        });

        it('should unlink old file when dto.link is provided', async () => {
            const dto: UpdateAllDto = { label: 'Updated', link: 'new-link-uuid' };

            await service.updateModule('mod-1', dto);

            expect(fileLinksService.unlinkAndCleanup).toHaveBeenCalledWith('link-1');
        });

        it('should NOT unlink file when dto.link is not provided', async () => {
            const dto: UpdateAllDto = { label: 'Updated' };

            await service.updateModule('mod-1', dto);

            expect(fileLinksService.unlinkAndCleanup).not.toHaveBeenCalled();
        });

        it('should handle module with null link', async () => {
            mockPreModuleService.findModuleByCriteria.mockResolvedValue({
                id: 'mod-2',
                link: null,
            });
            const dto: UpdateAllDto = { label: 'Minimal' };

            const result = await service.updateModule('mod-2', dto);

            expect(fileLinksService.unlinkAndCleanup).not.toHaveBeenCalled();
            expect(result).toEqual({ message: 'Module updated successfully.' });
        });

        it('should pass undefined sub-entities when not in dto', async () => {
            const dto: UpdateAllDto = { label: 'Minimal' };

            await service.updateModule('mod-1', dto);

            expect(mHeaderService.processModuleHeaders).toHaveBeenCalledWith(baseModule, undefined);
            expect(mFeatureService.processModuleFeatures).toHaveBeenCalledWith(
                baseModule,
                undefined,
            );
            expect(mUseService.processModuleUses).toHaveBeenCalledWith(baseModule, undefined);
        });
    });

    describe('getUserMExportTemplates', () => {
        const mockUserEntity = { id: mockUser.id };

        beforeEach(() => {
            mockUserService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockUserEntity);
        });

        it('should return transformed templates when data exists', async () => {
            const mockExports = [
                { id: 'exp-1', label: 'T1' },
                { id: 'exp-2', label: 'T2' },
            ];
            const transformed = [{ id: 'exp-1' }, { id: 'exp-2' }];

            mockMExportService.userMExports.mockResolvedValue(mockExports);
            mockMTransformService.transformMExportEntities.mockReturnValue(transformed);

            const result = await service.getUserMExportTemplates(mockUser);

            expect(logger.info).toHaveBeenCalledWith(
                `Modules export templates with user ${mockUser.id}`,
            );
            expect(userService.preUserService.retrieveUserByCriteria).toHaveBeenCalledWith({
                id: mockUser.id,
            });
            expect(mExportService.userMExports).toHaveBeenCalledWith(mockUserEntity);
            expect(mTransformService.transformMExportEntities).toHaveBeenCalledWith(mockExports);
            expect(result).toEqual(transformed);
        });

        it('should return empty array when no templates exist', async () => {
            mockMExportService.userMExports.mockResolvedValue([]);

            const result = await service.getUserMExportTemplates(mockUser);

            expect(result).toEqual([]);
            expect(mTransformService.transformMExportEntities).not.toHaveBeenCalled();
        });
    });

    describe('getModuleExportTDetails', () => {
        it('should retrieve and transform export template details', async () => {
            const mockExport = { id: 'exp-1', label: 'T1' };
            const transformed = { id: 'exp-1', companyName: 'Acme' };
            const relations = ['file', 'file.file'];

            mockMTransformService.mExportDetails.mockReturnValue(relations);
            mockMExportService.retrieveMExportByCriteria.mockResolvedValue(mockExport);
            mockMTransformService.transformMExport.mockReturnValue(transformed);

            const result = await service.getModuleExportTDetails(mockUser, 'exp-1');

            expect(logger.info).toHaveBeenCalledWith(
                'Module export template details with id: exp-1',
            );
            expect(mTransformService.mExportDetails).toHaveBeenCalled();
            expect(mExportService.retrieveMExportByCriteria).toHaveBeenCalledWith(
                { id: 'exp-1', createdBy: { id: mockUser.id } },
                relations,
            );
            expect(mTransformService.transformMExport).toHaveBeenCalledWith(mockExport);
            expect(result).toEqual(transformed);
        });
    });

    describe('createMExports', () => {
        const mockUserEntity = { id: mockUser.id };
        const dto = {
            companyName: 'Acme',
            phoneNumber: '+229',
            address: '1 Rue A',
            email: 'a@a.com',
        } as any;

        beforeEach(() => {
            mockUserService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockUserEntity);
            mockMExportService.createMExport.mockResolvedValue({ id: 'exp-new' });
        });

        it('should create a module export template and return success message', async () => {
            const result = await service.createMExports(mockUser, dto);

            expect(logger.info).toHaveBeenCalledWith(
                `Create a new module export with data ${JSON.stringify(dto)} by user ${mockUser.id}`,
            );
            expect(userService.preUserService.retrieveUserByCriteria).toHaveBeenCalledWith({
                id: mockUser.id,
            });
            expect(mExportService.createMExport).toHaveBeenCalledWith(mockUserEntity, dto);
            expect(result).toEqual({ message: 'Module export template created successfully.' });
        });
    });

    describe('updateMExportData', () => {
        const mockUserEntity = { id: mockUser.id };
        const dto = { companyName: 'NewCorp' } as any;

        beforeEach(() => {
            mockUserService.preUserService.retrieveUserByCriteria.mockResolvedValue(mockUserEntity);
            mockMExportService.mExportUpdate.mockResolvedValue({
                message: 'Data updated successfully',
            });
        });

        it('should delegate update to mExportService and return its result', async () => {
            const result = await service.updateMExportData(mockUser, dto, 'exp-1');

            expect(logger.info).toHaveBeenCalledWith('Update module with id: exp-1');
            expect(userService.preUserService.retrieveUserByCriteria).toHaveBeenCalledWith({
                id: mockUser.id,
            });
            expect(mExportService.mExportUpdate).toHaveBeenCalledWith(
                mockUserEntity,
                dto,
                'exp-1',
                ['file', 'file.file'],
            );
            expect(result).toEqual({ message: 'Data updated successfully' });
        });
    });
});
