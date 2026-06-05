import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../response';
import { CurrentUserInterface } from '../../interface';

describe('PermissionsGuard', () => {
    let guard: PermissionsGuard;

    const mockReflector = {
        get: jest.fn(),
    };

    const mockConfigService = {
        sAdminRole: 'super_admin',
        adminRole: 'admin',
        userRole: 'user',
        supportRole: 'support',
    };

    const mockErrorHandler = {
        forbidden: jest.fn(),
    };

    const createMockExecutionContext = (user?: CurrentUserInterface): ExecutionContext => {
        return {
            switchToHttp: () => ({
                getRequest: () => ({
                    user: user || null,
                }),
            }),
            getHandler: jest.fn(),
            getClass: jest.fn(),
        } as any;
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PermissionsGuard,
                { provide: Reflector, useValue: mockReflector },
                { provide: EnvConfigService, useValue: mockConfigService },
                { provide: ErrorHandlerService, useValue: mockErrorHandler },
            ],
        }).compile();

        guard = module.get<PermissionsGuard>(PermissionsGuard);
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('canActivate', () => {
        it('should return true if no user is present in request', async () => {
            const context = createMockExecutionContext();

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
        });

        it('should return true for super admin with no restrictions', async () => {
            const mockUser: CurrentUserInterface = {
                id: 'user-123',
                role: 'super_admin',
                sessionId: 'session-123',
                permissions: {},
            };
            const context = createMockExecutionContext(mockUser);

            mockReflector.get.mockReturnValue(null);

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
        });

        it('should return true when user has required permissions', async () => {
            const mockUser: CurrentUserInterface = {
                id: 'user-123',
                role: 'user',
                sessionId: 'session-123',
                permissions: {
                    users: ['read', 'write'],
                },
            };
            const context = createMockExecutionContext(mockUser);

            mockReflector.get
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(false)
                .mockReturnValueOnce({ ui: 'users', actions: ['read'] });

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
        });
    });

    describe('checkRoleRestrictions', () => {
        it('should throw forbidden error when non-super-admin tries to access super-admin-only route', () => {
            const context = createMockExecutionContext();

            mockReflector.get
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(null);

            guard.checkRoleRestrictions(context, 'admin');

            expect(mockErrorHandler.forbidden).toHaveBeenCalledWith(
                'Route is only restricted to user with role: super_admin',
                'Only Super Admin is allowed on this route.',
            );
        });

        it('should allow super admin to access super-admin-only route', () => {
            const context = createMockExecutionContext();

            mockReflector.get
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(null);

            guard.checkRoleRestrictions(context, 'super_admin');

            expect(mockErrorHandler.forbidden).not.toHaveBeenCalled();
        });

        it('should throw forbidden error when user tries to access admin-or-super-admin route', () => {
            const context = createMockExecutionContext();

            mockReflector.get
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(null);

            guard.checkRoleRestrictions(context, 'user');

            expect(mockErrorHandler.forbidden).toHaveBeenCalledWith(
                'Route is only restricted to user with roles: super_admin, admin and support',
                'Only Admin or Super Admin are allowed on this route.',
            );
        });

        it('should allow admin to access admin-or-super-admin route', () => {
            const context = createMockExecutionContext();

            mockReflector.get
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(null);

            guard.checkRoleRestrictions(context, 'admin');

            expect(mockErrorHandler.forbidden).not.toHaveBeenCalled();
        });

        it('should allow support to access admin-or-super-admin route', () => {
            const context = createMockExecutionContext();

            mockReflector.get
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(null);

            guard.checkRoleRestrictions(context, 'support');

            expect(mockErrorHandler.forbidden).not.toHaveBeenCalled();
        });

        it('should throw forbidden error when admin tries to access non-admin-only route', () => {
            const context = createMockExecutionContext();

            mockReflector.get
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(null);

            guard.checkRoleRestrictions(context, 'admin');

            expect(mockErrorHandler.forbidden).toHaveBeenCalledWith(
                'Route is only restricted to user with role: user',
                'Only users are allowed on this route.',
            );
        });

        it('should return required permissions from handler', () => {
            const context = createMockExecutionContext();
            const permissions = { ui: 'users', actions: ['read'] };

            mockReflector.get
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(permissions);

            const result = guard.checkRoleRestrictions(context, 'user');

            expect(result).toEqual(permissions);
        });

        it('should return required permissions from class if handler has none', () => {
            const context = createMockExecutionContext();
            const permissions = { ui: 'products', actions: ['write'] };

            mockReflector.get
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(null)
                .mockReturnValueOnce(permissions);

            const result = guard.checkRoleRestrictions(context, 'user');

            expect(result).toEqual(permissions);
        });
    });

    describe('checkPermissions', () => {
        it('should return true if no permissions are required', () => {
            const user: CurrentUserInterface = {
                id: 'user-123',
                role: 'user',
                sessionId: 'session-123',
                permissions: {
                    users: ['read'],
                },
            };

            const result = guard.checkPermissions(null!, user, 'user');

            expect(result).toBe(true);
        });

        it('should return true if user is super admin', () => {
            const permissions = { ui: 'users', actions: ['read'] };
            const user: CurrentUserInterface = {
                id: 'user-123',
                role: 'super_admin',
                sessionId: 'session-123',
                permissions: {
                    users: ['read'],
                },
            };

            const result = guard.checkPermissions(permissions, user, 'super_admin');

            expect(result).toBe(true);
        });

        it('should call forbidden when user lacks permission scope', () => {
            const permissions = { ui: 'users', actions: ['read'] };
            const user: CurrentUserInterface = {
                id: 'user-123',
                role: 'user',
                sessionId: 'session-123',
                permissions: {},
            };

            guard.checkPermissions(permissions, user, 'user');

            expect(mockErrorHandler.forbidden).toHaveBeenCalledWith(
                `Unallowed, doesn't have the right permission for this route.`,
                `Access denied: missing permission scope for 'users'.`,
            );
        });

        it('should call forbidden when user lacks required actions', () => {
            const permissions = { ui: 'users', actions: ['write', 'delete'] };
            const user: CurrentUserInterface = {
                id: 'user-123',
                role: 'user',
                sessionId: 'session-123',
                permissions: {
                    users: ['read'],
                },
            };

            guard.checkPermissions(permissions, user, 'user');

            expect(mockErrorHandler.forbidden).toHaveBeenCalledWith(
                `Access denied: missing required permissions for 'users' (write, delete).`,
                `Access denied: missing required permissions for 'users' (write, delete).`,
            );
        });

        it('should return true when user has at least one required action', () => {
            const permissions = { ui: 'users', actions: ['read', 'write'] };
            const user: CurrentUserInterface = {
                id: 'user-123',
                role: 'user',
                sessionId: 'session-123',
                permissions: {
                    users: ['read', 'update'],
                },
            };

            const result = guard.checkPermissions(permissions, user, 'user');

            expect(result).toBe(true);
            expect(mockErrorHandler.forbidden).not.toHaveBeenCalled();
        });

        it('should return true when user has all required actions', () => {
            const permissions = { ui: 'products', actions: ['read'] };
            const user: CurrentUserInterface = {
                id: 'user-123',
                role: 'user',
                sessionId: 'session-123',
                permissions: {
                    products: ['read', 'write', 'delete'],
                },
            };

            const result = guard.checkPermissions(permissions, user, 'user');

            expect(result).toBe(true);
        });

        it('should handle undefined user permissions gracefully', () => {
            const permissions = { ui: 'users', actions: ['read'] };
            const user: CurrentUserInterface = {
                id: 'user-123',
                role: 'user',
                sessionId: 'session-123',
            } as any;

            guard.checkPermissions(permissions, user, 'user');

            expect(mockErrorHandler.forbidden).toHaveBeenCalled();
        });

        it('should handle null user permissions gracefully', () => {
            const permissions = { ui: 'users', actions: ['read'] };
            const user: CurrentUserInterface = {
                id: 'user-123',
                role: 'user',
                sessionId: 'session-123',
                permissions: null as any,
            };

            guard.checkPermissions(permissions, user, 'user');

            expect(mockErrorHandler.forbidden).toHaveBeenCalled();
        });
    });

    describe('Integration tests', () => {
        it('should allow super admin full access regardless of permissions', async () => {
            const mockUser: CurrentUserInterface = {
                id: 'user-123',
                role: 'super_admin',
                sessionId: 'session-123',
                permissions: {},
            };
            const context = createMockExecutionContext(mockUser);

            mockReflector.get
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(false)
                .mockReturnValueOnce({ ui: 'admin', actions: ['delete'] });

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
            expect(mockErrorHandler.forbidden).not.toHaveBeenCalled();
        });

        it('should block user without proper permissions', async () => {
            const mockUser: CurrentUserInterface = {
                id: 'user-123',
                role: 'user',
                sessionId: 'session-123',
                permissions: {
                    users: ['read'],
                },
            };
            const context = createMockExecutionContext(mockUser);

            mockReflector.get
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(false)
                .mockReturnValueOnce(false)
                .mockReturnValueOnce({ ui: 'users', actions: ['delete'] });

            await guard.canActivate(context);

            expect(mockErrorHandler.forbidden).toHaveBeenCalled();
        });

        it('should handle case-insensitive role labels', async () => {
            const mockUser: CurrentUserInterface = {
                id: 'user-123',
                role: 'SUPER_ADMIN',
                sessionId: 'session-123',
                permissions: {},
            };
            const context = createMockExecutionContext(mockUser);

            mockReflector.get.mockReturnValue(null);

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
        });
    });
});
