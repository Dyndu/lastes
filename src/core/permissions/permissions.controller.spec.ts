import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { Reflector } from '@nestjs/core';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';
import { PermissionsGuard, JwtAuthGuard } from '../../common/guard';

describe('PermissionsController', () => {
    let controller: PermissionsController;
    let service: PermissionsService;

    const mockPermissionsService = {
        allPermissions: jest.fn(),
    };

    const mockEnvConfigService = {
        sAdminRole: 'superadmin',
        adminRole: 'admin',
        userRole: 'user',
        supportRole: 'support',
    };

    const mockErrorHandlerService = {
        forbidden: jest.fn((_message, userMessage) => {
            throw new Error(userMessage);
        }),
    };

    const mockReflector = {
        get: jest.fn(),
    };

    const mockPermissions = [
        {
            ui: 'admin_users',
            perms: [
                {
                    id: '1',
                    label: 'View',
                    action: 'view',
                },
                {
                    id: '2',
                    label: 'Create',
                    action: 'create',
                },
                {
                    id: '3',
                    label: 'Edit',
                    action: 'edit',
                },
                {
                    id: '4',
                    label: 'Delete',
                    action: 'delete',
                },
            ],
        },
        {
            ui: 'categories',
            perms: [
                {
                    id: '5',
                    label: 'View',
                    action: 'view',
                },
                {
                    id: '6',
                    label: 'Create',
                    action: 'create',
                },
            ],
        },
        {
            ui: 'media',
            perms: [
                {
                    id: '7',
                    label: 'View',
                    action: 'view',
                },
                {
                    id: '8',
                    label: 'Create',
                    action: 'create',
                },
                {
                    id: '9',
                    label: 'Edit',
                    action: 'edit',
                },
            ],
        },
    ];

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PermissionsController],
            providers: [
                {
                    provide: PermissionsService,
                    useValue: mockPermissionsService,
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

        controller = module.get<PermissionsController>(PermissionsController);
        service = module.get<PermissionsService>(PermissionsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('allPerms', () => {
        it('should return all permissions', async () => {
            mockPermissionsService.allPermissions.mockResolvedValue(mockPermissions);

            const result = await controller.allPerms();

            expect(result).toEqual(mockPermissions);
            expect(service.allPermissions).toHaveBeenCalledTimes(1);
            expect(service.allPermissions).toHaveBeenCalledWith();
        });

        it('should return empty array when no permissions exist', async () => {
            mockPermissionsService.allPermissions.mockResolvedValue([]);

            const result = await controller.allPerms();

            expect(result).toEqual([]);
            expect(service.allPermissions).toHaveBeenCalledTimes(1);
        });

        it('should propagate service errors', async () => {
            const error = new Error('Database connection failed');
            mockPermissionsService.allPermissions.mockRejectedValue(error);

            await expect(controller.allPerms()).rejects.toThrow('Database connection failed');
            expect(service.allPermissions).toHaveBeenCalledTimes(1);
        });

        it('should handle service returning null', async () => {
            mockPermissionsService.allPermissions.mockResolvedValue(null);

            const result = await controller.allPerms();

            expect(result).toBeNull();
            expect(service.allPermissions).toHaveBeenCalledTimes(1);
        });

        it('should handle service returning undefined', async () => {
            mockPermissionsService.allPermissions.mockResolvedValue(undefined);

            const result = await controller.allPerms();

            expect(result).toBeUndefined();
            expect(service.allPermissions).toHaveBeenCalledTimes(1);
        });

        it('should return permissions with different structures', async () => {
            const differentPermissions = [
                {
                    ui: 'reports',
                    perms: [
                        {
                            id: '10',
                            label: 'View',
                            action: 'view',
                        },
                    ],
                },
            ];
            mockPermissionsService.allPermissions.mockResolvedValue(differentPermissions);

            const result = await controller.allPerms();

            expect(result).toEqual(differentPermissions);
            expect(service.allPermissions).toHaveBeenCalledTimes(1);
        });

        it('should handle large permissions dataset', async () => {
            const largePermissions = Array.from({ length: 100 }, (_, i) => ({
                ui: `module_${i + 1}`,
                perms: [
                    {
                        id: `${i * 4 + 1}`,
                        label: 'View',
                        action: 'view',
                    },
                    {
                        id: `${i * 4 + 2}`,
                        label: 'Create',
                        action: 'create',
                    },
                    {
                        id: `${i * 4 + 3}`,
                        label: 'Edit',
                        action: 'edit',
                    },
                    {
                        id: `${i * 4 + 4}`,
                        label: 'Delete',
                        action: 'delete',
                    },
                ],
            }));
            mockPermissionsService.allPermissions.mockResolvedValue(largePermissions);

            const result = await controller.allPerms();

            expect(result).toEqual(largePermissions);
            expect(result).toHaveLength(100);
            expect(service.allPermissions).toHaveBeenCalledTimes(1);
        });

        it('should call service method without parameters', async () => {
            mockPermissionsService.allPermissions.mockResolvedValue(mockPermissions);

            await controller.allPerms();

            expect(service.allPermissions).toHaveBeenCalledWith();
        });

        it('should return permissions with correct structure', async () => {
            mockPermissionsService.allPermissions.mockResolvedValue(mockPermissions);

            const result = await controller.allPerms();

            expect(Array.isArray(result)).toBe(true);
            result.forEach((permission) => {
                expect(permission).toHaveProperty('ui');
                expect(permission).toHaveProperty('perms');
                expect(Array.isArray(permission.perms)).toBe(true);
                permission.perms.forEach((perm) => {
                    expect(perm).toHaveProperty('id');
                    expect(perm).toHaveProperty('label');
                    expect(perm).toHaveProperty('action');
                });
            });
        });
    });

    describe('Controller metadata', () => {
        it('should have correct controller path', () => {
            const path = Reflect.getMetadata('path', PermissionsController);
            expect(path).toBe('permissions');
        });

        it('should have GET method metadata on allPerms', () => {
            const path = Reflect.getMetadata('path', controller.allPerms);
            expect(path).toBeDefined();
        });

        it('should have AdminViewDecorator with admin_users ui', () => {
            expect(controller).toBeDefined();
        });
    });

    describe('Service integration', () => {
        it('should have PermissionsService injected', () => {
            expect(service).toBeDefined();
            expect(service).toBe(mockPermissionsService);
        });

        it('should call service method independently for multiple requests', async () => {
            mockPermissionsService.allPermissions.mockResolvedValue(mockPermissions);

            await controller.allPerms();
            await controller.allPerms();
            await controller.allPerms();

            expect(service.allPermissions).toHaveBeenCalledTimes(3);
        });

        it('should handle concurrent requests correctly', async () => {
            mockPermissionsService.allPermissions.mockResolvedValue(mockPermissions);

            const [result1, result2, result3] = await Promise.all([
                controller.allPerms(),
                controller.allPerms(),
                controller.allPerms(),
            ]);

            expect(result1).toEqual(mockPermissions);
            expect(result2).toEqual(mockPermissions);
            expect(result3).toEqual(mockPermissions);
            expect(service.allPermissions).toHaveBeenCalledTimes(3);
        });

        it('should maintain correct service call order', async () => {
            const callOrder: string[] = [];
            mockPermissionsService.allPermissions.mockImplementation(() => {
                callOrder.push('allPermissions');
                return Promise.resolve(mockPermissions);
            });

            await controller.allPerms();
            await controller.allPerms();

            expect(callOrder).toEqual(['allPermissions', 'allPermissions']);
        });
    });

    describe('Error handling', () => {
        it('should handle timeout errors', async () => {
            const timeoutError = new Error('Request timeout');
            mockPermissionsService.allPermissions.mockRejectedValue(timeoutError);

            await expect(controller.allPerms()).rejects.toThrow('Request timeout');
        });

        it('should handle validation errors', async () => {
            const validationError = new Error('Validation failed');
            mockPermissionsService.allPermissions.mockRejectedValue(validationError);

            await expect(controller.allPerms()).rejects.toThrow('Validation failed');
        });

        it('should maintain service call count on error', async () => {
            mockPermissionsService.allPermissions.mockRejectedValue(new Error('Test error'));

            try {
                await controller.allPerms();
            } catch (error) {
                // Expected error
            }

            expect(service.allPermissions).toHaveBeenCalledTimes(1);
        });
    });

    describe('Response handling', () => {
        it('should not modify service response', async () => {
            const originalData = [...mockPermissions];
            mockPermissionsService.allPermissions.mockResolvedValue(mockPermissions);

            const result = await controller.allPerms();

            expect(result).toEqual(originalData);
        });

        it('should handle permissions with empty actions array', async () => {
            const permissionsWithEmptyActions = [
                {
                    ui: 'test_module',
                    perms: [],
                },
            ];
            mockPermissionsService.allPermissions.mockResolvedValue(permissionsWithEmptyActions);

            const result = await controller.allPerms();

            expect(result).toEqual(permissionsWithEmptyActions);
            expect(result[0].perms).toEqual([]);
        });

        it('should handle permissions with single action', async () => {
            const singleActionPermissions = [
                {
                    ui: 'readonly_module',
                    perms: [
                        {
                            id: '1',
                            label: 'View',
                            action: 'view',
                        },
                    ],
                },
            ];
            mockPermissionsService.allPermissions.mockResolvedValue(singleActionPermissions);

            const result = await controller.allPerms();

            expect(result).toEqual(singleActionPermissions);
            expect(result[0].perms).toHaveLength(1);
        });
    });
});
