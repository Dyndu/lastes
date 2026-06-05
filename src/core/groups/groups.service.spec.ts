import { Test, TestingModule } from '@nestjs/testing';
import { GroupsService } from './groups.service';
import { GroupsRepository } from './groups.repository';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ErrorHandlerService } from '../../common/response';
import { OtherUtils } from '../../utils/services/tools';
import { PermissionsService } from '../permissions/permissions.service';
import { GroupEntity } from './entities/group.entity';
import { UserEntity } from '../users/entities/user.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { In } from 'typeorm';

describe('GroupsService', () => {
    let service: GroupsService;
    let groupRepository: jest.Mocked<GroupsRepository>;
    let logger: any;
    let errorHandler: jest.Mocked<ErrorHandlerService>;
    let otherUtils: jest.Mocked<OtherUtils>;
    let permissionService: jest.Mocked<PermissionsService>;

    const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    };

    const mockPermission = {
        id: 'perm-1',
        label: 'View Users',
        action: 'view',
        ui: 'users',
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    } as any;

    const mockGroup: GroupEntity = {
        id: 'group-1',
        label: 'admin',
        permissions: [mockPermission],
        users: [],
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GroupsService,
                {
                    provide: GroupsRepository,
                    useValue: {
                        find: jest.fn(),
                        findActiveOne: jest.fn(),
                        create: jest.fn(),
                        delete: jest.fn(),
                        assertUniqueActive: jest.fn(),
                    },
                },
                {
                    provide: WINSTON_MODULE_PROVIDER,
                    useValue: mockLogger,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: {
                        notFound: jest.fn(),
                        validation: jest.fn(),
                        forbidden: jest.fn(),
                    },
                },
                {
                    provide: OtherUtils,
                    useValue: {
                        formatCriteria: jest.fn(),
                        changeFirstLetterToUpperCase: jest.fn(
                            (str) => str.charAt(0).toUpperCase() + str.slice(1),
                        ),
                    },
                },
                {
                    provide: PermissionsService,
                    useValue: {
                        retrievePermsByCriteria: jest.fn(),
                        transformPermsGroupedByUi: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<GroupsService>(GroupsService);
        groupRepository = module.get(GroupsRepository);
        logger = module.get(WINSTON_MODULE_PROVIDER);
        errorHandler = module.get(ErrorHandlerService);
        otherUtils = module.get(OtherUtils);
        permissionService = module.get(PermissionsService);

        jest.clearAllMocks();
    });

    describe('transformGroup', () => {
        it('should transform a group entities to simplified object', () => {
            const result = service.transformGroup(mockGroup);

            expect(result).toEqual({
                id: 'group-1',
                label: 'Admin',
            });
            expect(otherUtils.changeFirstLetterToUpperCase).toHaveBeenCalledWith('admin');
        });

        it('should handle groups with different labels', () => {
            const group = { ...mockGroup, label: 'moderator' };
            const result = service.transformGroup(group);

            expect(result.label).toBe('Moderator');
        });
    });

    describe('transformGroups', () => {
        it('should transform an array of groups', () => {
            const groups = [mockGroup, { ...mockGroup, id: 'group-2', label: 'moderator' }];

            const result = service.transformGroups(groups);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({ id: 'group-1', label: 'Admin' });
            expect(result[1]).toEqual({ id: 'group-2', label: 'Moderator' });
        });

        it('should handle empty array', () => {
            const result = service.transformGroups([]);
            expect(result).toEqual([]);
        });
    });

    describe('retrieveGroupByCriteria', () => {
        const criteria = { id: 'group-1' };
        const relations = ['permissions'];

        beforeEach(() => {
            otherUtils.formatCriteria.mockReturnValue('id=group-1');
        });

        it('should retrieve a group successfully', async () => {
            groupRepository.findActiveOne.mockResolvedValue(mockGroup);

            const result = await service.retrieveGroupByCriteria(criteria, relations);

            expect(logger.info).toHaveBeenCalledWith('Retrieved group by id=group-1');
            expect(groupRepository.findActiveOne).toHaveBeenCalledWith(
                groupRepository,
                criteria,
                relations,
            );
            expect(result).toEqual(mockGroup);
        });

        it('should throw error when group not found', async () => {
            groupRepository.findActiveOne.mockResolvedValue(null);

            await service.retrieveGroupByCriteria(criteria, relations);

            expect(errorHandler.notFound).toHaveBeenCalledWith(
                'Group not found with entry id=group-1',
                'Group not found',
            );
        });
    });

    describe('findAllGroup', () => {
        it('should return all groups transformed', async () => {
            const groups = [mockGroup, { ...mockGroup, id: 'group-2' }];
            groupRepository.find.mockResolvedValue(groups);

            const result = await service.findAllGroup();

            expect(logger.info).toHaveBeenCalledWith('Retrieve groups permissions');
            expect(groupRepository.find).toHaveBeenCalledWith({
                where: { deleted: false },
                order: { updatedAt: 'DESC' },
            });
            expect(result).toHaveLength(2);
        });

        it('should return empty array when no groups exist', async () => {
            groupRepository.find.mockResolvedValue([]);

            const result = await service.findAllGroup();

            expect(result).toEqual([]);
        });

        it('should order by updatedAt DESC', async () => {
            groupRepository.find.mockResolvedValue([]);

            await service.findAllGroup();

            expect(groupRepository.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    order: { updatedAt: 'DESC' },
                }),
            );
        });
    });

    describe('buildGroupEntity', () => {
        it('should build a group entities with required fields', () => {
            const required = {
                label: 'Test Group',
                permissions: [mockPermission],
            };

            const result = service.buildGroupEntity(required, {});

            expect(result).toBeInstanceOf(GroupEntity);
            expect(result.label).toBe('Test Group');
            expect(result.permissions).toEqual([mockPermission]);
        });

        it('should build a group entities with optional users', () => {
            const user = new UserEntity();
            user.id = 'user-1';

            const required = {
                label: 'Test Group',
                permissions: [mockPermission],
            };
            const optional = { users: [user] };

            const result = service.buildGroupEntity(required, optional);

            expect(result.users).toEqual([user]);
        });

        it('should build a group entities without optional fields', () => {
            const required = {
                label: 'Test Group',
                permissions: [],
            };

            const result = service.buildGroupEntity(required, {});

            expect(result.users).toBeUndefined();
        });
    });

    describe('assertLabelIsUnique', () => {
        it('should call repository assertUniqueActive', async () => {
            const errors = {};
            await service.assertLabelIsUnique('admin', errors);

            expect(groupRepository.assertUniqueActive).toHaveBeenCalledWith(
                groupRepository,
                errors,
                { label: 'admin' },
                'Group',
            );
        });

        it('should work with default empty errors object', async () => {
            await service.assertLabelIsUnique('admin');

            expect(groupRepository.assertUniqueActive).toHaveBeenCalled();
        });
    });

    describe('validateUniqueFields', () => {
        it('should not throw error when label is unique', async () => {
            groupRepository.assertUniqueActive.mockResolvedValue(undefined);

            await expect(service.validateUniqueFields('uniqueLabel')).resolves.not.toThrow();
        });

        it('should throw validation error when label is not unique', async () => {
            groupRepository.assertUniqueActive.mockImplementation(async (_repo, errors) => {
                errors['label'] = 'Label already exists';
            });
            const validationError = new Error('Validation error');
            errorHandler.validation.mockReturnValue(validationError as any);

            await expect(service.validateUniqueFields('admin')).rejects.toThrow();
            expect(errorHandler.validation).toHaveBeenCalledWith({
                label: 'Label already exists',
            });
        });
    });

    describe('createPermissionGroup', () => {
        const createGroupDto: CreateGroupDto = {
            label: 'New Group',
            permissionIds: ['perm-1', 'perm-2'],
        };

        it('should create a group successfully', async () => {
            groupRepository.assertUniqueActive.mockResolvedValue(undefined);
            permissionService.retrievePermsByCriteria.mockResolvedValue([mockPermission]);
            groupRepository.create.mockResolvedValue(mockGroup);

            const result = await service.createPermissionGroup(createGroupDto);

            expect(permissionService.retrievePermsByCriteria).toHaveBeenCalledWith({
                id: In(createGroupDto.permissionIds),
            });
            expect(groupRepository.create).toHaveBeenCalled();
            expect(result).toEqual({ message: 'Group created successfully' });
        });

        it('should validate label uniqueness before creation', async () => {
            groupRepository.assertUniqueActive.mockResolvedValue(undefined);
            permissionService.retrievePermsByCriteria.mockResolvedValue([mockPermission]);

            await service.createPermissionGroup(createGroupDto);

            expect(groupRepository.assertUniqueActive).toHaveBeenCalledWith(
                groupRepository,
                expect.any(Object),
                { label: createGroupDto.label },
                'Group',
            );
        });

        it('should throw error when label is not unique', async () => {
            groupRepository.assertUniqueActive.mockImplementation(async (_repo, errors) => {
                errors['label'] = 'Label already exists';
            });
            const validationError = new Error('Validation error');
            errorHandler.validation.mockReturnValue(validationError as any);

            await expect(service.createPermissionGroup(createGroupDto)).rejects.toThrow();
        });
    });

    describe('validateUniqueFieldsForUpdate', () => {
        it('should validate label uniqueness for update', async () => {
            groupRepository.assertUniqueActive.mockResolvedValue(undefined);

            await expect(
                service.validateUniqueFieldsForUpdate(mockGroup, 'newLabel'),
            ).resolves.not.toThrow();

            expect(groupRepository.assertUniqueActive).toHaveBeenCalledWith(
                groupRepository,
                expect.any(Object),
                { label: 'newLabel' },
                'Group',
                mockGroup.id,
            );
        });

        it('should throw error when label is not unique for update', async () => {
            groupRepository.assertUniqueActive.mockImplementation(async (_repo, errors) => {
                errors['label'] = 'Label already exists';
            });
            const validationError = new Error('Validation error');
            errorHandler.validation.mockReturnValue(validationError as any);

            await expect(
                service.validateUniqueFieldsForUpdate(mockGroup, 'existingLabel'),
            ).rejects.toThrow();
        });
    });

    describe('findOne', () => {
        it('should return group with transformed permissions', async () => {
            const groupWithPerms = {
                ...mockGroup,
                permissions: [mockPermission],
                users: [],
            };
            groupRepository.findActiveOne.mockResolvedValue(groupWithPerms);
            permissionService.transformPermsGroupedByUi.mockReturnValue([
                {
                    ui: 'users',
                    perms: [{ id: 'perm-1', label: 'View Users', action: 'view' }],
                },
            ]);
            otherUtils.formatCriteria.mockReturnValue('id=group-1');

            const result = await service.findOne('group-1');

            expect(logger.info).toHaveBeenCalledWith('Retrieve group with id group-1');
            expect(groupRepository.findActiveOne).toHaveBeenCalledWith(
                groupRepository,
                { id: 'group-1' },
                ['permissions', 'users'],
            );
            expect(result).toEqual({
                id: 'group-1',
                label: 'Admin',
                hasUser: false,
                permissions: [
                    {
                        ui: 'users',
                        perms: [
                            {
                                id: 'perm-1',
                                label: 'View Users',
                                action: 'view',
                            },
                        ],
                    },
                ],
            });
        });

        it('should return hasUser as true when group has users', async () => {
            const user = new UserEntity();
            user.id = 'user-1';
            const groupWithUsers = {
                ...mockGroup,
                users: [user],
            };
            groupRepository.findActiveOne.mockResolvedValue(groupWithUsers);
            permissionService.transformPermsGroupedByUi.mockReturnValue([]);
            otherUtils.formatCriteria.mockReturnValue('id=group-1');

            const result = await service.findOne('group-1');

            expect(result.hasUser).toBe(true);
        });

        it('should return empty permissions array when no permissions', async () => {
            const groupWithoutPerms = {
                ...mockGroup,
                permissions: null,
                users: [],
            };
            groupRepository.findActiveOne.mockResolvedValue(groupWithoutPerms);
            otherUtils.formatCriteria.mockReturnValue('id=group-1');

            const result = await service.findOne('group-1');

            expect(result.permissions).toEqual([]);
        });
    });

    describe('comparePermissionIds', () => {
        it('should identify IDs to add and remove', () => {
            const oldIds = ['perm-1', 'perm-2', 'perm-3'];
            const newIds = ['perm-2', 'perm-3', 'perm-4', 'perm-5'];

            const result = service.comparePermissionIds(oldIds, newIds);

            expect(result.toAdd).toEqual(['perm-4', 'perm-5']);
            expect(result.toRemove).toEqual(['perm-1']);
        });

        it('should handle all new IDs', () => {
            const oldIds = ['perm-1'];
            const newIds = ['perm-2', 'perm-3'];

            const result = service.comparePermissionIds(oldIds, newIds);

            expect(result.toAdd).toEqual(['perm-2', 'perm-3']);
            expect(result.toRemove).toEqual(['perm-1']);
        });

        it('should handle all removed IDs', () => {
            const oldIds = ['perm-1', 'perm-2'];
            const newIds = [];

            const result = service.comparePermissionIds(oldIds, newIds);

            expect(result.toAdd).toEqual([]);
            expect(result.toRemove).toEqual(['perm-1', 'perm-2']);
        });

        it('should handle no changes', () => {
            const oldIds = ['perm-1', 'perm-2'];
            const newIds = ['perm-1', 'perm-2'];

            const result = service.comparePermissionIds(oldIds, newIds);

            expect(result.toAdd).toEqual([]);
            expect(result.toRemove).toEqual([]);
        });
    });

    describe('updateGroupPermissions', () => {
        it('should update permissions when there are changes', async () => {
            const group = {
                ...mockGroup,
                permissions: [mockPermission, { ...mockPermission, id: 'perm-2' }],
            };
            const newPerm = { ...mockPermission, id: 'perm-3' };
            permissionService.retrievePermsByCriteria.mockResolvedValue([newPerm]);

            await service.updateGroupPermissions(group, ['perm-2', 'perm-3']);

            expect(logger.info).toHaveBeenCalledWith(
                'Permissions changes - To add: [perm-3], To remove: [perm-1]',
            );
            expect(permissionService.retrievePermsByCriteria).toHaveBeenCalledWith({
                id: In(['perm-3']),
            });
            expect(group.permissions).toHaveLength(2);
        });

        it('should not update when no changes', async () => {
            const group = {
                ...mockGroup,
                permissions: [mockPermission],
            };

            await service.updateGroupPermissions(group, ['perm-1']);

            expect(logger.info).not.toHaveBeenCalled();
            expect(permissionService.retrievePermsByCriteria).not.toHaveBeenCalled();
        });

        it('should handle only removals', async () => {
            const group = {
                ...mockGroup,
                permissions: [mockPermission, { ...mockPermission, id: 'perm-2' }],
            };

            await service.updateGroupPermissions(group, ['perm-2']);

            expect(permissionService.retrievePermsByCriteria).not.toHaveBeenCalled();
            expect(group.permissions).toHaveLength(1);
            expect(group.permissions[0].id).toBe('perm-2');
        });
    });

    describe('updateGroupPerm', () => {
        const updateDto: UpdateGroupDto = {
            label: 'Updated Group',
            permissionIds: ['perm-2', 'perm-3'],
        };

        beforeEach(() => {
            otherUtils.formatCriteria.mockReturnValue('id=group-1');
        });

        it('should update group label and permissions', async () => {
            const group = { ...mockGroup, permissions: [mockPermission] };
            groupRepository.findActiveOne.mockResolvedValue(group);
            groupRepository.assertUniqueActive.mockResolvedValue(undefined);
            permissionService.retrievePermsByCriteria.mockResolvedValue([]);

            const result = await service.updateGroupPerm('group-1', updateDto);

            expect(logger.info).toHaveBeenCalledWith(
                'update group with id group-1 and data {"label":"Updated Group","permissionIds":["perm-2","perm-3"]}',
            );
            expect(groupRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({ label: 'Updated Group' }),
            );
            expect(result).toEqual({ message: 'Group updated successfully' });
        });

        it('should only update label when permissionIds not provided', async () => {
            const group = { ...mockGroup };
            groupRepository.findActiveOne.mockResolvedValue(group);
            groupRepository.assertUniqueActive.mockResolvedValue(undefined);

            await service.updateGroupPerm('group-1', { label: 'New Label' });

            expect(group.label).toBe('New Label');
            expect(permissionService.retrievePermsByCriteria).not.toHaveBeenCalled();
        });

        it('should only update permissions when label not provided', async () => {
            const group = { ...mockGroup, permissions: [mockPermission] };
            groupRepository.findActiveOne.mockResolvedValue(group);
            permissionService.retrievePermsByCriteria.mockResolvedValue([]);

            await service.updateGroupPerm('group-1', {
                permissionIds: ['perm-2'],
            });

            expect(groupRepository.assertUniqueActive).not.toHaveBeenCalled();
            expect(permissionService.retrievePermsByCriteria).toHaveBeenCalled();
        });
    });

    describe('deleteGroup', () => {
        beforeEach(() => {
            otherUtils.formatCriteria.mockReturnValue('id=group-1');
        });

        it('should delete group successfully when no users', async () => {
            const group = { ...mockGroup, users: [] };
            groupRepository.findActiveOne.mockResolvedValue(group);

            const result = await service.deleteGroup('group-1');

            expect(logger.info).toHaveBeenCalledWith('Delete group with id group-1');
            expect(groupRepository.delete).toHaveBeenCalledWith({
                id: 'group-1',
            });
            expect(result).toEqual({ message: 'Group deleted successfully' });
        });

        it('should throw forbidden error when group has users', async () => {
            const group = new GroupEntity({ id: 'group-1' });
            group.users = [new UserEntity({ id: 'user-1' }), new UserEntity({ id: 'user-2' })];
            groupRepository.findActiveOne.mockResolvedValue(group);
            await service.deleteGroup('group-1');

            expect(errorHandler.forbidden).toHaveBeenCalled();
        });

        it('should check for users relation', async () => {
            const group = { ...mockGroup, users: [] };
            groupRepository.findActiveOne.mockResolvedValue(group);

            await service.deleteGroup('group-1');

            expect(groupRepository.findActiveOne).toHaveBeenCalledWith(
                groupRepository,
                { id: 'group-1' },
                ['users'],
            );
        });
    });

    describe('Service initialization', () => {
        it('should be defined', () => {
            expect(service).toBeDefined();
        });

        it('should have all dependencies injected', () => {
            expect(service['logger']).toBeDefined();
            expect(service['groupRepository']).toBeDefined();
            expect(service['otherUtils']).toBeDefined();
            expect(service['errorHandler']).toBeDefined();
            expect(service['permissionService']).toBeDefined();
        });
    });
});
