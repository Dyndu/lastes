import { Test, TestingModule } from '@nestjs/testing';
import { MUsersService } from './m-users.service';
import { ModulesService } from './modules.service';
import { ModuleEntity, MUsersEntity } from '../entities';
import { UserEntity } from '../../users/entities/user.entity';
import { ModuleTypeEnum } from '../../../common/enum';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('MUsersService', () => {
    let service: MUsersService;
    let modulesService: any;

    const mockMTransformService = {
        transformUserModule: jest.fn((module) => ({
            id: module.id,
            color: module.color,
            label: module.label,
            icon: module.icon,
            description: module.description,
            type: module.type,
        })),
    };

    const mockUser: UserEntity = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
    } as any;

    const mockModule: ModuleEntity = {
        id: 'module-123',
        label: 'Test Module',
        type: ModuleTypeEnum.MODULE,
        isActive: true,
        deleted: false,
        icon: 'test-icon',
        color: 'blue',
        description: 'Test Description',
        updatedAt: new Date(),
    } as ModuleEntity;

    const mockMUserEntity: MUsersEntity = {
        id: 'muser-123',
        user: mockUser,
        module: mockModule,
        isPinned: true,
        deleted: false,
    } as MUsersEntity;

    const mockLogger = {
        debug: jest.fn(),
        error: jest.fn(),
        log: jest.fn(),
        warn: jest.fn(),
    };

    const mockErrorHandler = {
        forbidden: jest.fn((_message, userMessage) => {
            throw new Error(userMessage);
        }),
    };

    const mockMUsersRepository = {
        getRepository: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MUsersService,
                {
                    provide: ModulesService,
                    useValue: {
                        logger: mockLogger,
                        errorHandler: mockErrorHandler,
                        mUsersRepository: mockMUsersRepository,
                        mTransformService: mockMTransformService,
                    },
                },
            ],
        }).compile();

        service = module.get<MUsersService>(MUsersService);
        modulesService = module.get(ModulesService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('buildUserModulesFromUserQuery', () => {
        let mockQueryBuilder: any;
        let mockRepository: any;

        beforeEach(() => {
            mockQueryBuilder = {
                innerJoin: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                getMany: jest.fn(),
            };

            mockRepository = {
                createQueryBuilder: jest.fn(() => mockQueryBuilder),
            };

            mockMUsersRepository.getRepository.mockReturnValue(mockRepository);
        });

        it('should return pinned modules for a user without search term', async () => {
            const mockResult = [
                {
                    module: {
                        id: 'module-1',
                        label: 'Module 1',
                        icon: 'icon1',
                        color: 'blue',
                        description: 'Description 1',
                        type: ModuleTypeEnum.MODULE,
                        updatedAt: new Date(),
                    },
                    isPinned: true,
                },
                {
                    module: {
                        id: 'module-2',
                        label: 'Module 2',
                        icon: 'icon2',
                        color: 'red',
                        description: 'Description 2',
                        type: ModuleTypeEnum.MODULE,
                        updatedAt: new Date(),
                    },
                    isPinned: true,
                },
            ];

            mockQueryBuilder.getMany.mockResolvedValue(mockResult);

            const result = await service.buildUserModulesFromUserQuery('user-123');

            expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('mu');
            expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith('mu.module', 'module');
            expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith('mu.user', 'user');
            expect(mockQueryBuilder.where).toHaveBeenCalledWith('module.deleted = false');
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('user.id = :userId', {
                userId: 'user-123',
            });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('mu.isPinned = :isPinned', {
                isPinned: true,
            });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('module.type = :type', {
                type: ModuleTypeEnum.MODULE,
            });
            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('module.updatedAt', 'DESC');
            expect(mockQueryBuilder.select).toHaveBeenCalledWith([
                'module.id',
                'module.icon',
                'module.color',
                'module.label',
                'module.description',
                'module.type',
                'mu.isPinned',
            ]);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                id: 'module-1',
                label: 'Module 1',
                icon: 'icon1',
                color: 'blue',
                description: 'Description 1',
                type: ModuleTypeEnum.MODULE,
                isPinned: true,
            });
            expect(mockMTransformService.transformUserModule).toHaveBeenCalledTimes(2);
        });

        it('should filter modules by search term with ILIKE pattern', async () => {
            const searchTerm = 'test';
            const mockResult = [
                {
                    module: {
                        id: 'module-1',
                        label: 'Test Module',
                        icon: 'icon1',
                        color: 'blue',
                        description: 'A test description',
                        type: ModuleTypeEnum.MODULE,
                    },
                    isPinned: true,
                },
            ];

            mockQueryBuilder.getMany.mockResolvedValue(mockResult);

            const result = await service.buildUserModulesFromUserQuery('user-123', searchTerm);

            const expectedPattern = '%t%e%s%t%';
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                `(module.label ILIKE :searchTerm
              OR module.description ILIKE :searchTerm)`,
                { searchTerm: expectedPattern },
            );

            expect(result).toHaveLength(1);
            expect(result[0].label).toBe('Test Module');
        });

        it('should return empty array when no pinned modules found', async () => {
            mockQueryBuilder.getMany.mockResolvedValue([]);

            const result = await service.buildUserModulesFromUserQuery('user-123');

            expect(result).toEqual([]);
            expect(mockQueryBuilder.getMany).toHaveBeenCalled();
        });

        it('should create proper ILIKE pattern for single character search', async () => {
            const searchTerm = 'a';
            mockQueryBuilder.getMany.mockResolvedValue([]);

            await service.buildUserModulesFromUserQuery('user-123', searchTerm);

            const expectedPattern = '%a%';
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(expect.any(String), {
                searchTerm: expectedPattern,
            });
        });

        it('should handle search term with spaces', async () => {
            const searchTerm = 'hello world';
            mockQueryBuilder.getMany.mockResolvedValue([]);

            await service.buildUserModulesFromUserQuery('user-123', searchTerm);

            const expectedPattern = '%h%e%l%l%o% %w%o%r%l%d%';
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(expect.any(String), {
                searchTerm: expectedPattern,
            });
        });

        it('should handle undefined search term', async () => {
            mockQueryBuilder.getMany.mockResolvedValue([]);

            await service.buildUserModulesFromUserQuery('user-123', undefined);

            const searchAndWhereCalls = mockQueryBuilder.andWhere.mock.calls.filter(
                (call: (string | string[])[]) => call[0].includes('ILIKE'),
            );
            expect(searchAndWhereCalls).toHaveLength(0);
        });

        it('should handle null search term', async () => {
            mockQueryBuilder.getMany.mockResolvedValue([]);

            await service.buildUserModulesFromUserQuery('user-123', null as any);

            const searchAndWhereCalls = mockQueryBuilder.andWhere.mock.calls.filter(
                (call: (string | string[])[]) => call[0].includes('ILIKE'),
            );
            expect(searchAndWhereCalls).toHaveLength(0);
        });
    });

    describe('buildMUserEntity', () => {
        it('should build a new MUsersEntity with all required fields', () => {
            const required = {
                module: mockModule,
                user: mockUser,
                isPinned: true,
            };

            const result = service.buildMUserEntity(required);

            expect(result).toBeInstanceOf(MUsersEntity);
            expect(result.module).toBe(mockModule);
            expect(result.user).toBe(mockUser);
            expect(result.isPinned).toBe(true);
        });

        it('should build MUsersEntity with isPinned false', () => {
            const required = {
                module: mockModule,
                user: mockUser,
                isPinned: false,
            };

            const result = service.buildMUserEntity(required);

            expect(result).toBeInstanceOf(MUsersEntity);
            expect(result.isPinned).toBe(false);
        });

        it('should create a new instance for each call', () => {
            const required = {
                module: mockModule,
                user: mockUser,
                isPinned: true,
            };

            const result1 = service.buildMUserEntity(required);
            const result2 = service.buildMUserEntity(required);

            expect(result1).not.toBe(result2);
            expect(result1).toBeInstanceOf(MUsersEntity);
            expect(result2).toBeInstanceOf(MUsersEntity);
        });

        it('should assign all properties correctly', () => {
            const required = {
                module: mockModule,
                user: mockUser,
                isPinned: true,
            };

            const result = service.buildMUserEntity(required);

            expect(result.module).toBe(required.module);
            expect(result.user).toBe(required.user);
            expect(result.isPinned).toBe(required.isPinned);
        });

        it('should not include any extra properties', () => {
            const required = {
                module: mockModule,
                user: mockUser,
                isPinned: true,
                extraProp: 'should not be included',
            } as any;

            const result = service.buildMUserEntity(required);
            expect(Object.keys(result)).toHaveLength(9);
        });
    });

    describe('ensureModuleIsActive', () => {
        it('should not throw error when module is active', () => {
            const activeModule = {
                ...mockModule,
                isActive: true,
            };

            expect(() => {
                service.ensureModuleIsActive(activeModule);
            }).not.toThrow();

            expect(mockErrorHandler.forbidden).not.toHaveBeenCalled();
        });

        it('should throw forbidden error when module is not active', () => {
            const inactiveModule = {
                ...mockModule,
                isActive: false,
                id: 'inactive-123',
            };

            expect(() => {
                service.ensureModuleIsActive(inactiveModule);
            }).toThrow("Module isn't active");

            expect(mockErrorHandler.forbidden).toHaveBeenCalledWith(
                `Module with id: inactive-123 has to be active before any further operation`,
                "Module isn't active",
            );
        });

        it('should include module id in error message', () => {
            const inactiveModule = {
                id: 'specific-module-id',
                label: 'Test',
                type: ModuleTypeEnum.MODULE,
                isActive: false,
            } as ModuleEntity;

            try {
                service.ensureModuleIsActive(inactiveModule);
            } catch (error) {}

            expect(mockErrorHandler.forbidden).toHaveBeenCalledWith(
                expect.stringContaining('specific-module-id'),
                expect.any(String),
            );
        });

        it('should handle module with undefined isActive', () => {
            const moduleWithUndefinedActive = {
                ...mockModule,
                isActive: undefined,
            } as any;

            expect(() => {
                service.ensureModuleIsActive(moduleWithUndefinedActive);
            }).toThrow("Module isn't active");

            expect(mockErrorHandler.forbidden).toHaveBeenCalled();
        });
    });

    describe('setModulePinnedState', () => {
        beforeEach(() => {
            mockMUsersRepository.findOne.mockReset();
            mockMUsersRepository.update.mockReset();
            mockMUsersRepository.create.mockReset();
        });

        describe('successful operations', () => {
            it('should pin a module when no existing link exists', async () => {
                mockMUsersRepository.findOne.mockResolvedValue(null);
                mockMUsersRepository.create.mockResolvedValue(mockMUserEntity);

                const result = await service.setModulePinnedState(mockUser, mockModule, true);

                expect(mockLogger.debug).toHaveBeenCalledWith(
                    `Setting pinned state for module with id: ${mockModule.id} by user: ${mockUser.id}`,
                );
                expect(mockMUsersRepository.findOne).toHaveBeenCalledWith({
                    where: {
                        user: { id: mockUser.id },
                        module: { id: mockModule.id },
                        deleted: false,
                    },
                });
                expect(mockMUsersRepository.create).toHaveBeenCalledWith(
                    expect.objectContaining({
                        user: mockUser,
                        module: mockModule,
                        isPinned: true,
                    }),
                );
                expect(mockMUsersRepository.update).not.toHaveBeenCalled();
                expect(result).toEqual({
                    message: 'Module pinned successfully',
                });
            });

            it('should unpin a module when no existing link exists', async () => {
                mockMUsersRepository.findOne.mockResolvedValue(null);
                mockMUsersRepository.create.mockResolvedValue(mockMUserEntity);

                const result = await service.setModulePinnedState(mockUser, mockModule, false);

                expect(mockMUsersRepository.create).toHaveBeenCalledWith(
                    expect.objectContaining({
                        user: mockUser,
                        module: mockModule,
                        isPinned: false,
                    }),
                );
                expect(mockMUsersRepository.update).not.toHaveBeenCalled();
                expect(result).toEqual({
                    message: 'Module unpinned successfully',
                });
            });

            it('should update existing link to pinned state', async () => {
                const existingLink = {
                    ...mockMUserEntity,
                    id: 'existing-123',
                    isPinned: false,
                };
                mockMUsersRepository.findOne.mockResolvedValue(existingLink);
                mockMUsersRepository.update.mockResolvedValue({ affected: 1 });

                const result = await service.setModulePinnedState(mockUser, mockModule, true);

                expect(mockMUsersRepository.update).toHaveBeenCalledWith(
                    { id: existingLink.id },
                    { isPinned: true },
                );
                expect(mockMUsersRepository.create).not.toHaveBeenCalled();
                expect(result).toEqual({
                    message: 'Module pinned successfully',
                });
            });

            it('should update existing link to unpinned state', async () => {
                const existingLink = {
                    ...mockMUserEntity,
                    id: 'existing-123',
                    isPinned: true,
                };
                mockMUsersRepository.findOne.mockResolvedValue(existingLink);
                mockMUsersRepository.update.mockResolvedValue({ affected: 1 });

                const result = await service.setModulePinnedState(mockUser, mockModule, false);

                expect(mockMUsersRepository.update).toHaveBeenCalledWith(
                    { id: existingLink.id },
                    { isPinned: false },
                );
                expect(result).toEqual({
                    message: 'Module unpinned successfully',
                });
            });

            it('should handle when existing link has same pinned state', async () => {
                const existingLink = {
                    ...mockMUserEntity,
                    id: 'existing-123',
                    isPinned: true,
                };
                mockMUsersRepository.findOne.mockResolvedValue(existingLink);
                mockMUsersRepository.update.mockResolvedValue({ affected: 1 });

                const result = await service.setModulePinnedState(mockUser, mockModule, true);

                expect(mockMUsersRepository.update).toHaveBeenCalledWith(
                    { id: existingLink.id },
                    { isPinned: true },
                );
                expect(result.message).toBe('Module pinned successfully');
            });
        });

        describe('validation and error handling', () => {
            it('should throw error when module is not active', async () => {
                const inactiveModule = {
                    ...mockModule,
                    isActive: false,
                };

                await expect(
                    service.setModulePinnedState(mockUser, inactiveModule, true),
                ).rejects.toThrow("Module isn't active");

                expect(mockErrorHandler.forbidden).toHaveBeenCalledWith(
                    `Module with id: ${inactiveModule.id} has to be active before any further operation`,
                    "Module isn't active",
                );
                expect(mockMUsersRepository.findOne).not.toHaveBeenCalled();
            });

            it('should check module is active before type validation', async () => {
                const inactiveToolModule = {
                    ...mockModule,
                    type: ModuleTypeEnum.TOOLS,
                    isActive: false,
                };

                await expect(
                    service.setModulePinnedState(mockUser, inactiveToolModule, true),
                ).rejects.toThrow("Module isn't active");

                expect(mockErrorHandler.forbidden).toHaveBeenCalledWith(
                    expect.stringContaining('has to be active'),
                    "Module isn't active",
                );
                expect(mockMUsersRepository.findOne).not.toHaveBeenCalled();
            });

            it('should throw error when module type is TOOLS', async () => {
                const toolModule = {
                    ...mockModule,
                    type: ModuleTypeEnum.TOOLS,
                    isActive: true,
                };

                await expect(
                    service.setModulePinnedState(mockUser, toolModule, true),
                ).rejects.toThrow('Only modules can be pinned');

                expect(mockErrorHandler.forbidden).toHaveBeenCalledWith(
                    `This module type type is different from ${JSON.stringify(ModuleTypeEnum.MODULE)}, can't pin unpin`,
                    'Only modules can be pinned',
                );
                expect(mockMUsersRepository.findOne).not.toHaveBeenCalled();
            });

            it('should throw error when module type is undefined', async () => {
                const undefinedTypeModule = {
                    ...mockModule,
                    type: undefined,
                    isActive: true,
                } as any;

                await expect(
                    service.setModulePinnedState(mockUser, undefinedTypeModule, true),
                ).rejects.toThrow('Only modules can be pinned');

                expect(mockErrorHandler.forbidden).toHaveBeenCalled();
            });

            it('should log debug message even when validation fails', async () => {
                const invalidModule = {
                    ...mockModule,
                    type: ModuleTypeEnum.TOOLS,
                    isActive: true,
                };

                try {
                    await service.setModulePinnedState(mockUser, invalidModule, true);
                } catch (error) {}

                expect(mockLogger.debug).toHaveBeenCalledWith(
                    `Setting pinned state for module with id: ${invalidModule.id} by user: ${mockUser.id}`,
                );
            });
        });

        describe('repository interactions', () => {
            it('should query for non-deleted links only', async () => {
                mockMUsersRepository.findOne.mockResolvedValue(null);
                mockMUsersRepository.create.mockResolvedValue(mockMUserEntity);

                await service.setModulePinnedState(mockUser, mockModule, true);

                expect(mockMUsersRepository.findOne).toHaveBeenCalledWith({
                    where: {
                        user: { id: mockUser.id },
                        module: { id: mockModule.id },
                        deleted: false,
                    },
                });
            });

            it('should call findOne before create', async () => {
                mockMUsersRepository.findOne.mockResolvedValue(null);
                mockMUsersRepository.create.mockResolvedValue(mockMUserEntity);

                await service.setModulePinnedState(mockUser, mockModule, true);

                const findOneOrder = mockMUsersRepository.findOne.mock.invocationCallOrder[0];
                const createOrder = mockMUsersRepository.create.mock.invocationCallOrder[0];
                expect(findOneOrder).toBeLessThan(createOrder);
            });

            it('should call findOne before update', async () => {
                mockMUsersRepository.findOne.mockResolvedValue(mockMUserEntity);
                mockMUsersRepository.update.mockResolvedValue({ affected: 1 });

                await service.setModulePinnedState(mockUser, mockModule, true);

                const findOneOrder = mockMUsersRepository.findOne.mock.invocationCallOrder[0];
                const updateOrder = mockMUsersRepository.update.mock.invocationCallOrder[0];
                expect(findOneOrder).toBeLessThan(updateOrder);
            });

            it('should not call create when link exists', async () => {
                mockMUsersRepository.findOne.mockResolvedValue(mockMUserEntity);
                mockMUsersRepository.update.mockResolvedValue({ affected: 1 });

                await service.setModulePinnedState(mockUser, mockModule, true);

                expect(mockMUsersRepository.create).not.toHaveBeenCalled();
            });

            it('should not call update when link does not exist', async () => {
                mockMUsersRepository.findOne.mockResolvedValue(null);
                mockMUsersRepository.create.mockResolvedValue(mockMUserEntity);

                await service.setModulePinnedState(mockUser, mockModule, true);

                expect(mockMUsersRepository.update).not.toHaveBeenCalled();
            });
        });

        describe('message formatting', () => {
            it('should return correct message when pinning with new link', async () => {
                mockMUsersRepository.findOne.mockResolvedValue(null);
                mockMUsersRepository.create.mockResolvedValue(mockMUserEntity);

                const result = await service.setModulePinnedState(mockUser, mockModule, true);

                expect(result).toEqual({
                    message: 'Module pinned successfully',
                });
            });

            it('should return correct message when unpinning with new link', async () => {
                mockMUsersRepository.findOne.mockResolvedValue(null);
                mockMUsersRepository.create.mockResolvedValue(mockMUserEntity);

                const result = await service.setModulePinnedState(mockUser, mockModule, false);

                expect(result).toEqual({
                    message: 'Module unpinned successfully',
                });
            });

            it('should return correct message when updating to pinned', async () => {
                mockMUsersRepository.findOne.mockResolvedValue(mockMUserEntity);
                mockMUsersRepository.update.mockResolvedValue({ affected: 1 });

                const result = await service.setModulePinnedState(mockUser, mockModule, true);

                expect(result).toEqual({
                    message: 'Module pinned successfully',
                });
            });

            it('should return correct message when updating to unpinned', async () => {
                mockMUsersRepository.findOne.mockResolvedValue(mockMUserEntity);
                mockMUsersRepository.update.mockResolvedValue({ affected: 1 });

                const result = await service.setModulePinnedState(mockUser, mockModule, false);

                expect(result).toEqual({
                    message: 'Module unpinned successfully',
                });
            });
        });

        describe('edge cases', () => {
            it('should handle multiple operations on same module', async () => {
                // First operation - create
                mockMUsersRepository.findOne.mockResolvedValueOnce(null);
                mockMUsersRepository.create.mockResolvedValueOnce(mockMUserEntity);

                await service.setModulePinnedState(mockUser, mockModule, true);

                // Second operation - update
                mockMUsersRepository.findOne.mockResolvedValueOnce(mockMUserEntity);
                mockMUsersRepository.update.mockResolvedValueOnce({
                    affected: 1,
                });

                const result = await service.setModulePinnedState(mockUser, mockModule, false);

                expect(result.message).toBe('Module unpinned successfully');
                expect(mockMUsersRepository.create).toHaveBeenCalledTimes(1);
                expect(mockMUsersRepository.update).toHaveBeenCalledTimes(1);
            });

            it('should handle user with no previous pins', async () => {
                mockMUsersRepository.findOne.mockResolvedValue(null);
                mockMUsersRepository.create.mockResolvedValue(mockMUserEntity);

                const result = await service.setModulePinnedState(mockUser, mockModule, true);

                expect(result.message).toBe('Module pinned successfully');
                expect(mockMUsersRepository.create).toHaveBeenCalledWith(
                    expect.objectContaining({
                        user: mockUser,
                        module: mockModule,
                    }),
                );
            });

            it('should handle different users for same module', async () => {
                const user1 = { ...mockUser, id: 'user1' } as any;
                const user2 = { ...mockUser, id: 'user2' } as any;

                mockMUsersRepository.findOne
                    .mockResolvedValueOnce(null)
                    .mockResolvedValueOnce(null);
                mockMUsersRepository.create.mockResolvedValue(mockMUserEntity);

                await service.setModulePinnedState(user1, mockModule, true);
                await service.setModulePinnedState(user2, mockModule, true);

                expect(mockMUsersRepository.findOne).toHaveBeenCalledTimes(2);
                expect(mockMUsersRepository.findOne).toHaveBeenNthCalledWith(1, {
                    where: {
                        user: { id: 'user1' },
                        module: { id: mockModule.id },
                        deleted: false,
                    },
                });
                expect(mockMUsersRepository.findOne).toHaveBeenNthCalledWith(2, {
                    where: {
                        user: { id: 'user2' },
                        module: { id: mockModule.id },
                        deleted: false,
                    },
                });
            });

            it('should handle same user for different modules', async () => {
                const module1 = { ...mockModule, id: 'module1' };
                const module2 = { ...mockModule, id: 'module2' };

                mockMUsersRepository.findOne
                    .mockResolvedValueOnce(null) // First module
                    .mockResolvedValueOnce(null); // Second module
                mockMUsersRepository.create.mockResolvedValue(mockMUserEntity);

                await service.setModulePinnedState(mockUser, module1, true);
                await service.setModulePinnedState(mockUser, module2, true);

                expect(mockMUsersRepository.findOne).toHaveBeenCalledTimes(2);
                expect(mockMUsersRepository.findOne).toHaveBeenNthCalledWith(1, {
                    where: {
                        user: { id: mockUser.id },
                        module: { id: 'module1' },
                        deleted: false,
                    },
                });
                expect(mockMUsersRepository.findOne).toHaveBeenNthCalledWith(2, {
                    where: {
                        user: { id: mockUser.id },
                        module: { id: 'module2' },
                        deleted: false,
                    },
                });
            });
        });
    });

    describe('dependency injection and service integration', () => {
        it('should have ModulesService injected', () => {
            expect(service['modulesService']).toBeDefined();
            expect(service['modulesService']).toBe(modulesService);
        });

        it('should access logger from ModulesService', async () => {
            mockMUsersRepository.findOne.mockResolvedValue(null);
            mockMUsersRepository.create.mockResolvedValue(mockMUserEntity);

            await service.setModulePinnedState(mockUser, mockModule, true);

            expect(modulesService.logger.debug).toHaveBeenCalled();
        });

        it('should access errorHandler from ModulesService', async () => {
            const toolModule = {
                ...mockModule,
                type: ModuleTypeEnum.TOOLS,
                isActive: true,
            };

            try {
                await service.setModulePinnedState(mockUser, toolModule, true);
            } catch (error) {}

            expect(modulesService.errorHandler.forbidden).toHaveBeenCalled();
        });

        it('should access mUsersRepository from ModulesService', async () => {
            mockMUsersRepository.findOne.mockResolvedValue(null);
            mockMUsersRepository.create.mockResolvedValue(mockMUserEntity);

            await service.setModulePinnedState(mockUser, mockModule, true);

            expect(modulesService.mUsersRepository.findOne).toHaveBeenCalled();
            expect(modulesService.mUsersRepository.create).toHaveBeenCalled();
        });

        it('should access mTransformService from ModulesService in buildUserModulesFromUserQuery', async () => {
            const mockQueryBuilder = {
                innerJoin: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([
                    {
                        module: { id: 'module-1', label: 'Module 1' },
                        isPinned: true,
                    },
                ]),
            };
            const mockRepository = {
                createQueryBuilder: jest.fn(() => mockQueryBuilder),
            };
            mockMUsersRepository.getRepository.mockReturnValue(mockRepository);

            await service.buildUserModulesFromUserQuery('user-123');

            expect(modulesService.mTransformService.transformUserModule).toHaveBeenCalled();
        });
    });
});
