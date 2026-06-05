import { Test, TestingModule } from '@nestjs/testing';
import { ModulesController } from './modules.controller';
import { ModulesService } from './services';
import { MHeaderService, MFeatureService, MUseService } from './services';
import { CurrentUserInterface } from '../../interface';
import { CreateMExportDto, PinStateDto, UpdateAllDto, UpdateMExportDto } from './dto';
import { ModuleMethodEnum, ModuleTypeEnum } from '../../common/enum';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guard';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('ModulesController', () => {
    let controller: ModulesController;
    let moduleService: jest.Mocked<ModulesService>;
    let mHeaderService: jest.Mocked<MHeaderService>;
    let mFeatureService: jest.Mocked<MFeatureService>;
    let mUseService: jest.Mocked<MUseService>;

    const mockCurrentUser: CurrentUserInterface = {
        id: 'user-123',
        role: 'user',
        sessionId: 'session-123',
        permissions: { module: ['view', 'update', 'delete'] },
    };

    const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';
    const VALID_UUID_2 = '456e7890-e89b-12d3-a456-426614174001';

    beforeEach(async () => {
        mHeaderService = { deleteMHeader: jest.fn() } as any;
        mFeatureService = { deleteMFeature: jest.fn() } as any;
        mUseService = { deleteMUse: jest.fn() } as any;

        const mockModulesService = {
            getModules: jest.fn(),
            userModulesList: jest.fn(),
            userPinModulesList: jest.fn(),
            userTools: jest.fn(),
            moduleDetails: jest.fn(),
            modulePinStateByUser: jest.fn(),
            updateModule: jest.fn(),
            toggleModule: jest.fn(),
            getUserMExportTemplates: jest.fn(),
            getModuleExportTDetails: jest.fn(),
            createMExports: jest.fn(),
            updateMExportData: jest.fn(),
            mHeaderService,
            mFeatureService,
            mUseService,
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [ModulesController],
            providers: [
                { provide: ModulesService, useValue: mockModulesService },
                {
                    provide: EnvConfigService,
                    useValue: {
                        sAdminRole: 'superadmin',
                        adminRole: 'admin',
                        userRole: 'user',
                        supportRole: 'support',
                    },
                },
                {
                    provide: ErrorHandlerService,
                    useValue: {
                        forbidden: jest.fn((_msg, userMsg) => {
                            throw new Error(userMsg);
                        }),
                    },
                },
                { provide: Reflector, useValue: { get: jest.fn() } },
                { provide: JwtAuthGuard, useValue: { canActivate: jest.fn(() => true) } },
                { provide: PermissionsGuard, useValue: { canActivate: jest.fn(() => true) } },
            ],
        }).compile();

        controller = module.get<ModulesController>(ModulesController);
        moduleService = module.get(ModulesService) as jest.Mocked<ModulesService>;
    });

    afterEach(() => jest.clearAllMocks());

    describe('adminModulesList', () => {
        it('should call getModules without filters', async () => {
            moduleService.getModules.mockResolvedValue([] as any);
            const result = await controller.adminModulesList();
            expect(moduleService.getModules).toHaveBeenCalledWith({
                active: undefined,
                searchTerm: undefined,
            });
            expect(result).toEqual([]);
        });

        it('should call getModules with isActive=true', async () => {
            moduleService.getModules.mockResolvedValue([] as any);
            await controller.adminModulesList(true);
            expect(moduleService.getModules).toHaveBeenCalledWith({
                active: true,
                searchTerm: undefined,
            });
        });

        it('should call getModules with isActive=false', async () => {
            moduleService.getModules.mockResolvedValue([] as any);
            await controller.adminModulesList(false);
            expect(moduleService.getModules).toHaveBeenCalledWith({
                active: false,
                searchTerm: undefined,
            });
        });

        it('should call getModules with search term', async () => {
            moduleService.getModules.mockResolvedValue([] as any);
            await controller.adminModulesList(undefined, 'test');
            expect(moduleService.getModules).toHaveBeenCalledWith({
                active: undefined,
                searchTerm: 'test',
            });
        });

        it('should call getModules with both filters', async () => {
            moduleService.getModules.mockResolvedValue([] as any);
            await controller.adminModulesList(true, 'search');
            expect(moduleService.getModules).toHaveBeenCalledWith({
                active: true,
                searchTerm: 'search',
            });
        });
    });

    describe('userModulesList', () => {
        it('should call userModulesList without search', async () => {
            moduleService.userModulesList.mockResolvedValue({} as any);
            const result = await controller.userModulesList();
            expect(moduleService.userModulesList).toHaveBeenCalledWith(undefined);
            expect(result).toEqual({});
        });

        it('should call userModulesList with search', async () => {
            moduleService.userModulesList.mockResolvedValue({} as any);
            await controller.userModulesList('term');
            expect(moduleService.userModulesList).toHaveBeenCalledWith('term');
        });
    });

    describe('templateList', () => {
        it('should return empty array when no templates exist', async () => {
            moduleService.getUserMExportTemplates.mockResolvedValue([]);
            const result = await controller.templateList(mockCurrentUser);
            expect(moduleService.getUserMExportTemplates).toHaveBeenCalledWith(mockCurrentUser);
            expect(result).toEqual([]);
        });

        it('should return transformed list of export templates', async () => {
            const mockTemplates = [
                { id: 'exp-1', label: 'T1' },
                { id: 'exp-2', label: 'T2' },
            ];
            moduleService.getUserMExportTemplates.mockResolvedValue(mockTemplates as any);
            const result = await controller.templateList(mockCurrentUser);
            expect(moduleService.getUserMExportTemplates).toHaveBeenCalledWith(mockCurrentUser);
            expect(result).toEqual(mockTemplates);
        });
    });

    describe('templateDetails', () => {
        it('should return export template details for valid id', async () => {
            const mockDetail = { id: VALID_UUID, label: 'T1', companyName: 'Acme' };
            moduleService.getModuleExportTDetails.mockResolvedValue(mockDetail as any);

            const result = await controller.templateDetails(mockCurrentUser, VALID_UUID);

            expect(moduleService.getModuleExportTDetails).toHaveBeenCalledWith(
                mockCurrentUser,
                VALID_UUID,
            );
            expect(result).toEqual(mockDetail);
        });

        it('should forward the user and id to the service', async () => {
            moduleService.getModuleExportTDetails.mockResolvedValue({} as any);
            await controller.templateDetails(mockCurrentUser, VALID_UUID_2);
            expect(moduleService.getModuleExportTDetails).toHaveBeenCalledWith(
                mockCurrentUser,
                VALID_UUID_2,
            );
        });
    });

    describe('createTemplate', () => {
        const dto: CreateMExportDto = {
            companyName: 'Acme',
            phoneNumber: '+22900000000',
            address: '1 Rue A',
            email: 'acme@test.com',
            file: VALID_UUID,
        };

        it('should create a template and return success message', async () => {
            const mockResult = { message: 'Module export template created successfully.' };
            moduleService.createMExports.mockResolvedValue(mockResult as any);

            const result = await controller.createTemplate(mockCurrentUser, dto);

            expect(moduleService.createMExports).toHaveBeenCalledWith(mockCurrentUser, dto);
            expect(result).toEqual(mockResult);
        });

        it('should create a template with optional label', async () => {
            const dtoWithLabel: CreateMExportDto = { ...dto, label: 'My Label' };
            moduleService.createMExports.mockResolvedValue({ message: 'ok' } as any);

            await controller.createTemplate(mockCurrentUser, dtoWithLabel);

            expect(moduleService.createMExports).toHaveBeenCalledWith(
                mockCurrentUser,
                dtoWithLabel,
            );
        });
    });

    describe('updateTemplate', () => {
        const dto: UpdateMExportDto = { companyName: 'NewCorp', email: 'new@test.com' };

        it('should update a template and return service result', async () => {
            const mockResult = { message: 'Data updated successfully' };
            moduleService.updateMExportData.mockResolvedValue(mockResult as any);

            const result = await controller.updateTemplate(mockCurrentUser, dto, VALID_UUID);

            expect(moduleService.updateMExportData).toHaveBeenCalledWith(
                mockCurrentUser,
                dto,
                VALID_UUID,
            );
            expect(result).toEqual(mockResult);
        });

        it('should forward the correct id to the service', async () => {
            moduleService.updateMExportData.mockResolvedValue({} as any);
            await controller.updateTemplate(mockCurrentUser, dto, VALID_UUID_2);
            expect(moduleService.updateMExportData).toHaveBeenCalledWith(
                mockCurrentUser,
                dto,
                VALID_UUID_2,
            );
        });

        it('should handle partial dto (all fields optional)', async () => {
            const partialDto: UpdateMExportDto = { phoneNumber: '+22900000099' };
            moduleService.updateMExportData.mockResolvedValue({ message: 'ok' } as any);

            await controller.updateTemplate(mockCurrentUser, partialDto, VALID_UUID);

            expect(moduleService.updateMExportData).toHaveBeenCalledWith(
                mockCurrentUser,
                partialDto,
                VALID_UUID,
            );
        });
    });

    describe('usePinMList', () => {
        it('should call userPinModulesList without search', async () => {
            moduleService.userPinModulesList.mockResolvedValue([] as any);
            const result = await controller.usePinMList(mockCurrentUser);
            expect(moduleService.userPinModulesList).toHaveBeenCalledWith(
                mockCurrentUser,
                undefined,
            );
            expect(result).toEqual([]);
        });

        it('should call userPinModulesList with search', async () => {
            moduleService.userPinModulesList.mockResolvedValue([] as any);
            await controller.usePinMList(mockCurrentUser, 'test');
            expect(moduleService.userPinModulesList).toHaveBeenCalledWith(mockCurrentUser, 'test');
        });
    });

    describe('userToolsList', () => {
        it('should call userTools without search', async () => {
            moduleService.userTools.mockResolvedValue([] as any);
            const result = await controller.userToolsList();
            expect(moduleService.userTools).toHaveBeenCalledWith(undefined);
            expect(result).toEqual([]);
        });

        it('should call userTools with search', async () => {
            moduleService.userTools.mockResolvedValue([] as any);
            await controller.userToolsList('tool');
            expect(moduleService.userTools).toHaveBeenCalledWith('tool');
        });
    });

    describe('moduleDetails', () => {
        it('should retrieve module details by id', async () => {
            const mockModule = { id: VALID_UUID, label: 'Test Module' };
            moduleService.moduleDetails.mockResolvedValue(mockModule as any);

            const result = await controller.moduleDetails(VALID_UUID);

            expect(moduleService.moduleDetails).toHaveBeenCalledWith(VALID_UUID);
            expect(result).toEqual(mockModule);
        });
    });

    describe('modulePinState', () => {
        it('should pin a module', async () => {
            const dto: PinStateDto = { isPin: true };
            const mockResult = { message: 'Module pinned successfully' };
            moduleService.modulePinStateByUser.mockResolvedValue(mockResult as any);

            const result = await controller.modulePinState(mockCurrentUser, VALID_UUID, dto);

            expect(moduleService.modulePinStateByUser).toHaveBeenCalledWith(
                mockCurrentUser,
                VALID_UUID,
                true,
            );
            expect(result).toEqual(mockResult);
        });

        it('should unpin a module', async () => {
            const dto: PinStateDto = { isPin: false };
            const mockResult = { message: 'Module unpinned successfully' };
            moduleService.modulePinStateByUser.mockResolvedValue(mockResult as any);

            const result = await controller.modulePinState(mockCurrentUser, VALID_UUID, dto);

            expect(moduleService.modulePinStateByUser).toHaveBeenCalledWith(
                mockCurrentUser,
                VALID_UUID,
                false,
            );
            expect(result).toEqual(mockResult);
        });
    });

    describe('updateModule', () => {
        it('should update module with basic fields', async () => {
            const dto: UpdateAllDto = { label: 'Updated', icon: 'icon', description: 'Desc' };
            const mockResult = { message: 'Module updated successfully.' };
            moduleService.updateModule.mockResolvedValue(mockResult as any);

            const result = await controller.updateModule(VALID_UUID, dto);

            expect(moduleService.updateModule).toHaveBeenCalledWith(VALID_UUID, dto);
            expect(result).toEqual(mockResult);
        });

        it('should update module with all relation fields', async () => {
            const dto: UpdateAllDto = {
                label: 'Full Update',
                icon: 'icon',
                description: 'Desc',
                usageDescription: 'Usage',
                type: ModuleTypeEnum.MODULE,
                link: VALID_UUID_2,
                features: [{ method: ModuleMethodEnum.CREATE, label: 'F', icon: 'f' }],
                headers: [{ method: ModuleMethodEnum.UPDATE, id: 'h-1', label: 'H', icon: 'h' }],
                uses: [{ method: ModuleMethodEnum.CREATE, label: 'U', icon: 'u' }],
            };
            moduleService.updateModule.mockResolvedValue({ message: 'ok' } as any);

            await controller.updateModule(VALID_UUID, dto);

            expect(moduleService.updateModule).toHaveBeenCalledWith(VALID_UUID, dto);
        });

        it('should update module with empty relation arrays', async () => {
            const dto: UpdateAllDto = { label: 'Min', features: [], headers: [], uses: [] };
            moduleService.updateModule.mockResolvedValue({ message: 'ok' } as any);

            await controller.updateModule(VALID_UUID, dto);

            expect(moduleService.updateModule).toHaveBeenCalledWith(VALID_UUID, dto);
        });
    });

    describe('toggle', () => {
        it('should toggle module activation state', async () => {
            const mockResult = { message: 'Module activated successfully.' };
            moduleService.toggleModule.mockResolvedValue(mockResult as any);

            const result = await controller.toggle(VALID_UUID);

            expect(moduleService.toggleModule).toHaveBeenCalledWith(VALID_UUID);
            expect(result).toEqual(mockResult);
        });
    });

    describe('moduleHeaderDelete', () => {
        it('should delete a module header', async () => {
            const mockResult = { message: 'Module header deleted successfully' };
            mHeaderService.deleteMHeader.mockResolvedValue(mockResult as any);

            const result = await controller.moduleHeaderDelete(VALID_UUID, VALID_UUID_2);

            expect(mHeaderService.deleteMHeader).toHaveBeenCalledWith(VALID_UUID, VALID_UUID_2);
            expect(result).toEqual(mockResult);
        });
    });

    describe('moduleFeatureDelete', () => {
        it('should delete a module feature', async () => {
            const mockResult = { message: 'Module feature deleted successfully' };
            mFeatureService.deleteMFeature.mockResolvedValue(mockResult as any);

            const result = await controller.moduleFeatureDelete(VALID_UUID, VALID_UUID_2);

            expect(mFeatureService.deleteMFeature).toHaveBeenCalledWith(VALID_UUID, VALID_UUID_2);
            expect(result).toEqual(mockResult);
        });
    });

    describe('moduleUseDelete', () => {
        it('should delete a module use', async () => {
            const mockResult = { message: 'Module use deleted successfully' };
            mUseService.deleteMUse.mockResolvedValue(mockResult as any);

            const result = await controller.moduleUseDelete(VALID_UUID, VALID_UUID_2);

            expect(mUseService.deleteMUse).toHaveBeenCalledWith(VALID_UUID, VALID_UUID_2);
            expect(result).toEqual(mockResult);
        });
    });
});
