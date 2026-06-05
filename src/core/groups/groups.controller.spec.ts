import { Test, TestingModule } from '@nestjs/testing';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { Reflector } from '@nestjs/core';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';
import { PermissionsGuard, JwtAuthGuard } from '../../common/guard';

describe('GroupsController', () => {
    let controller: GroupsController;
    let service: jest.Mocked<GroupsService>;

    const mockGroupResponse = {
        id: '30ac88d4-7ffe-418c-9551-66eeec2e6783',
        label: 'Admin Group',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockGroupWithPermissions = {
        ...mockGroupResponse,
        permissions: [
            {
                id: 'perm-1',
                label: 'View',
                action: 'view',
                ui: 'admin_users',
            },
        ],
    };

    const mockEnvConfigService = {
        sAdminRole: 'superadmin',
        adminRole: 'admin',
        userRole: 'user',
        supportRole: 'support',
    };

    const mockErrorHandlerService = {
        forbidden: jest.fn((message, userMessage) => {
            throw new Error(userMessage);
        }),
    };

    const mockReflector = {
        get: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [GroupsController],
            providers: [
                {
                    provide: GroupsService,
                    useValue: {
                        findAllGroup: jest.fn(),
                        findOne: jest.fn(),
                        createPermissionGroup: jest.fn(),
                        updateGroupPerm: jest.fn(),
                        deleteGroup: jest.fn(),
                    },
                },
                {
                    provide: EnvConfigService,
                    useValue: mockEnvConfigService,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandlerService,
                },
                {
                    provide: Reflector,
                    useValue: mockReflector,
                },
                {
                    provide: JwtAuthGuard,
                    useValue: { canActivate: jest.fn(() => true) },
                },
                {
                    provide: PermissionsGuard,
                    useValue: { canActivate: jest.fn(() => true) },
                },
            ],
        }).compile();

        controller = module.get<GroupsController>(GroupsController);
        service = module.get(GroupsService);

        jest.clearAllMocks();
    });

    describe('allGroups', () => {
        it('should return all groups', async () => {
            const mockGroups = [mockGroupResponse, { ...mockGroupResponse, id: 'group-2' }];
            service.findAllGroup.mockResolvedValue(mockGroups as any);

            const result = await controller.allGroups();

            expect(service.findAllGroup).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockGroups);
        });

        it('should return empty array when no groups exist', async () => {
            service.findAllGroup.mockResolvedValue([]);

            const result = await controller.allGroups();

            expect(service.findAllGroup).toHaveBeenCalledTimes(1);
            expect(result).toEqual([]);
        });

        it('should propagate service errors', async () => {
            const error = new Error('Database error');
            service.findAllGroup.mockRejectedValue(error);

            await expect(controller.allGroups()).rejects.toThrow('Database error');
        });

        it('should call service without parameters', async () => {
            service.findAllGroup.mockResolvedValue([]);

            await controller.allGroups();

            expect(service.findAllGroup).toHaveBeenCalledWith();
        });
    });

    describe('findOne', () => {
        const validUuid = '30ac88d4-7ffe-418c-9551-66eeec2e6783';

        it('should return a group by id with permissions', async () => {
            service.findOne.mockResolvedValue(mockGroupWithPermissions as any);

            const result = await controller.findOne(validUuid);

            expect(service.findOne).toHaveBeenCalledWith(validUuid);
            expect(result).toEqual(mockGroupWithPermissions);
            expect(result.permissions).toBeDefined();
        });

        it('should call service with correct uuid', async () => {
            service.findOne.mockResolvedValue(mockGroupWithPermissions as any);

            await controller.findOne(validUuid);

            expect(service.findOne).toHaveBeenCalledWith(validUuid);
            expect(service.findOne).toHaveBeenCalledTimes(1);
        });

        it('should propagate not found errors from service', async () => {
            const error = new Error('Group not found');
            service.findOne.mockRejectedValue(error);

            await expect(controller.findOne(validUuid)).rejects.toThrow('Group not found');
        });

        it('should handle different valid UUIDs', async () => {
            const anotherUuid = '12345678-1234-1234-1234-123456789012';
            service.findOne.mockResolvedValue(mockGroupResponse as any);

            await controller.findOne(anotherUuid);

            expect(service.findOne).toHaveBeenCalledWith(anotherUuid);
        });
    });

    describe('createG', () => {
        const createGroupDto: CreateGroupDto = {
            label: 'New Group',
            permissionIds: ['perm-1', 'perm-2'],
        };

        it('should create a new group with permissions', async () => {
            const expectedResponse = {
                ...mockGroupResponse,
                label: createGroupDto.label,
            };
            service.createPermissionGroup.mockResolvedValue(expectedResponse as any);

            const result = await controller.createG(createGroupDto);

            expect(service.createPermissionGroup).toHaveBeenCalledWith(createGroupDto);
            expect(result).toEqual(expectedResponse);
        });

        it('should pass DTO correctly to service', async () => {
            service.createPermissionGroup.mockResolvedValue(mockGroupResponse as any);

            await controller.createG(createGroupDto);

            expect(service.createPermissionGroup).toHaveBeenCalledWith(createGroupDto);
            expect(service.createPermissionGroup).toHaveBeenCalledTimes(1);
        });

        it('should propagate validation errors from service', async () => {
            const error = new Error('Invalid permission IDs');
            service.createPermissionGroup.mockRejectedValue(error);

            await expect(controller.createG(createGroupDto)).rejects.toThrow(
                'Invalid permission IDs',
            );
        });

        it('should handle empty permission IDs', async () => {
            const dtoWithoutPerms: CreateGroupDto = {
                label: 'Group Without Perms',
                permissionIds: [],
            };
            service.createPermissionGroup.mockResolvedValue(mockGroupResponse as any);

            await controller.createG(dtoWithoutPerms);

            expect(service.createPermissionGroup).toHaveBeenCalledWith(dtoWithoutPerms);
        });

        it('should handle group creation with multiple permissions', async () => {
            const multiPermDto: CreateGroupDto = {
                label: 'Multi Permission Group',
                permissionIds: ['perm-1', 'perm-2', 'perm-3', 'perm-4'],
            };
            service.createPermissionGroup.mockResolvedValue(mockGroupResponse as any);

            await controller.createG(multiPermDto);

            expect(service.createPermissionGroup).toHaveBeenCalledWith(multiPermDto);
        });
    });

    describe('update', () => {
        const validUuid = '30ac88d4-7ffe-418c-9551-66eeec2e6783';
        const updateGroupDto: UpdateGroupDto = {
            label: 'Updated Group',
            permissionIds: ['perm-3', 'perm-4'],
        };

        it('should update a group successfully', async () => {
            const expectedResponse = {
                ...mockGroupResponse,
                label: updateGroupDto.label,
            };
            service.updateGroupPerm.mockResolvedValue(expectedResponse as any);

            const result = await controller.update(validUuid, updateGroupDto);

            expect(service.updateGroupPerm).toHaveBeenCalledWith(validUuid, updateGroupDto);
            expect(result).toEqual(expectedResponse);
        });

        it('should pass id and DTO correctly to service', async () => {
            service.updateGroupPerm.mockResolvedValue(mockGroupResponse as any);

            await controller.update(validUuid, updateGroupDto);

            expect(service.updateGroupPerm).toHaveBeenCalledWith(validUuid, updateGroupDto);
            expect(service.updateGroupPerm).toHaveBeenCalledTimes(1);
        });

        it('should handle partial updates (label only)', async () => {
            const partialDto: UpdateGroupDto = {
                label: 'Only label Updated',
            };
            service.updateGroupPerm.mockResolvedValue(mockGroupResponse as any);

            await controller.update(validUuid, partialDto);

            expect(service.updateGroupPerm).toHaveBeenCalledWith(validUuid, partialDto);
        });

        it('should handle partial updates (permissions only)', async () => {
            const permOnlyDto: UpdateGroupDto = {
                permissionIds: ['perm-5', 'perm-6'],
            };
            service.updateGroupPerm.mockResolvedValue(mockGroupResponse as any);

            await controller.update(validUuid, permOnlyDto);

            expect(service.updateGroupPerm).toHaveBeenCalledWith(validUuid, permOnlyDto);
        });

        it('should propagate not found errors', async () => {
            const error = new Error('Group not found');
            service.updateGroupPerm.mockRejectedValue(error);

            await expect(controller.update(validUuid, updateGroupDto)).rejects.toThrow(
                'Group not found',
            );
        });

        it('should propagate permission validation errors', async () => {
            const error = new Error('Permission not found');
            service.updateGroupPerm.mockRejectedValue(error);

            await expect(controller.update(validUuid, updateGroupDto)).rejects.toThrow(
                'Permission not found',
            );
        });

        it('should handle different UUIDs', async () => {
            const anotherUuid = 'abcd1234-5678-90ab-cdef-123456789012';
            service.updateGroupPerm.mockResolvedValue(mockGroupResponse as any);

            await controller.update(anotherUuid, updateGroupDto);

            expect(service.updateGroupPerm).toHaveBeenCalledWith(anotherUuid, updateGroupDto);
        });
    });

    describe('delete', () => {
        const validUuid = '30ac88d4-7ffe-418c-9551-66eeec2e6783';

        it('should delete a group successfully', async () => {
            const deleteResponse = {
                message: 'Group deleted successfully',
                deleted: true,
            };
            service.deleteGroup.mockResolvedValue(deleteResponse as any);

            const result = await controller.delete(validUuid);

            expect(service.deleteGroup).toHaveBeenCalledWith(validUuid);
            expect(result).toEqual(deleteResponse);
        });

        it('should call service with correct id', async () => {
            service.deleteGroup.mockResolvedValue({ deleted: true } as any);

            await controller.delete(validUuid);

            expect(service.deleteGroup).toHaveBeenCalledWith(validUuid);
            expect(service.deleteGroup).toHaveBeenCalledTimes(1);
        });

        it('should propagate not found errors', async () => {
            const error = new Error('Group not found');
            service.deleteGroup.mockRejectedValue(error);

            await expect(controller.delete(validUuid)).rejects.toThrow('Group not found');
        });

        it('should propagate forbidden errors when group contains users', async () => {
            const error = new Error('Cannot delete group with active users');
            service.deleteGroup.mockRejectedValue(error);

            await expect(controller.delete(validUuid)).rejects.toThrow(
                'Cannot delete group with active users',
            );
        });

        it('should handle different UUIDs', async () => {
            const anotherUuid = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
            service.deleteGroup.mockResolvedValue({ deleted: true } as any);

            await controller.delete(anotherUuid);

            expect(service.deleteGroup).toHaveBeenCalledWith(anotherUuid);
        });
    });

    describe('Controller metadata and guards', () => {
        it('should be defined', () => {
            expect(controller).toBeDefined();
        });

        it('should have GroupsService injected', () => {
            expect(controller['groupsService']).toBeDefined();
        });

        it('should have correct route prefix', () => {
            const metadata = Reflect.getMetadata('path', GroupsController);
            expect(metadata).toBe('groups');
        });

        it('should have service instance', () => {
            expect(service).toBeDefined();
            expect(service).toBe(controller['groupsService']);
        });
    });

    describe('UUID validation', () => {
        it('should accept valid UUIDs in findOne', async () => {
            const validUuid = '30ac88d4-7ffe-418c-9551-66eeec2e6783';
            service.findOne.mockResolvedValue(mockGroupResponse as any);

            await controller.findOne(validUuid);

            expect(service.findOne).toHaveBeenCalledWith(validUuid);
        });

        it('should accept valid UUIDs in update', async () => {
            const validUuid = '30ac88d4-7ffe-418c-9551-66eeec2e6783';
            const dto: UpdateGroupDto = { label: 'Test' };
            service.updateGroupPerm.mockResolvedValue(mockGroupResponse as any);

            await controller.update(validUuid, dto);

            expect(service.updateGroupPerm).toHaveBeenCalledWith(validUuid, dto);
        });

        it('should accept valid UUIDs in delete', async () => {
            const validUuid = '30ac88d4-7ffe-418c-9551-66eeec2e6783';
            service.deleteGroup.mockResolvedValue({ deleted: true } as any);

            await controller.delete(validUuid);

            expect(service.deleteGroup).toHaveBeenCalledWith(validUuid);
        });
    });

    describe('Error propagation', () => {
        it('should propagate database errors from findAllGroup', async () => {
            const dbError = new Error('Database connection failed');
            service.findAllGroup.mockRejectedValue(dbError);

            await expect(controller.allGroups()).rejects.toThrow('Database connection failed');
        });

        it('should propagate validation errors from create', async () => {
            const validationError = new Error('Validation failed');
            const dto: CreateGroupDto = {
                label: 'Test',
                permissionIds: ['invalid-id'],
            };
            service.createPermissionGroup.mockRejectedValue(validationError);

            await expect(controller.createG(dto)).rejects.toThrow('Validation failed');
        });

        it('should propagate forbidden errors from delete', async () => {
            const forbiddenError = new Error('Access denied');
            service.deleteGroup.mockRejectedValue(forbiddenError);

            await expect(controller.delete('30ac88d4-7ffe-418c-9551-66eeec2e6783')).rejects.toThrow(
                'Access denied',
            );
        });
    });
});
