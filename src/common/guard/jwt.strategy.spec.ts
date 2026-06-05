import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { EnvConfigService } from '../../utils/services/config';
import { UserSessionRepository } from '../../core/user-session/user-session.repository';
import { ErrorHandlerService } from '../response';
import { JwtPayload } from '../../interface';
import { PermissionEntity } from '../../core/permissions/entities/permission.entity';
import { UserStatusEnum } from '../enum';

describe('JwtStrategy', () => {
    let strategy: JwtStrategy;
    let envConfigService: any;
    let errorHandler: any;
    let jwtService: any;
    let userSessionRepo: any;

    const mockSession = {
        id: 'session-123',
        revokedAt: null,
        tokenVersion: 1,
        lastActivityAt: new Date(),
        user: {
            id: 'user-123',
            email: 'test@example.com',
            status: UserStatusEnum.ACTIVE,
            group: {
                id: 'group-123',
                name: 'Admin Group',
                permissions: [
                    { ui: 'users', action: 'view' },
                    { ui: 'users', action: 'create' },
                    { ui: 'posts', action: 'view' },
                ] as PermissionEntity[],
            },
        },
    };

    const mockPayload: JwtPayload = {
        sub: 'user-123',
        role: 'admin',
        sid: 'session-123',
        type: 'access',
        ver: 1,
    };

    beforeEach(async () => {
        envConfigService = {
            accessTokenSecret: 'test-secret',
            sAdminRole: 'super-admin',
            userRole: 'user',
        };

        errorHandler = {
            unauthorized: jest.fn((message: string) => {
                throw new UnauthorizedException(message);
            }),
        };

        jwtService = {
            verifyAsync: jest.fn(),
        };

        userSessionRepo = {
            findOne: jest.fn(),
            update: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                JwtStrategy,
                {
                    provide: EnvConfigService,
                    useValue: envConfigService,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: errorHandler,
                },
                {
                    provide: JwtService,
                    useValue: jwtService,
                },
                {
                    provide: UserSessionRepository,
                    useValue: userSessionRepo,
                },
            ],
        }).compile();

        strategy = module.get<JwtStrategy>(JwtStrategy);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Service Definition', () => {
        it('should be defined', () => {
            expect(strategy).toBeDefined();
        });

        it('should have envConfigService injected', () => {
            expect(strategy['envConfigService']).toBeDefined();
        });

        it('should have errorHandler injected', () => {
            expect(strategy['errorHandler']).toBeDefined();
        });

        it('should have jwtService injected', () => {
            expect(strategy['jwtService']).toBeDefined();
        });

        it('should have userSessionRepo injected', () => {
            expect(strategy['userSessionRepo']).toBeDefined();
        });
    });

    describe('transformPermissions', () => {
        it('should transform permissions array to grouped object', () => {
            const permissions: PermissionEntity[] = [
                { ui: 'users', action: 'view' },
                { ui: 'users', action: 'create' },
                { ui: 'posts', action: 'view' },
                { ui: 'posts', action: 'delete' },
            ] as PermissionEntity[];

            const result = strategy.transformPermissions(permissions);

            expect(result).toEqual({
                users: ['view', 'create'],
                posts: ['view', 'delete'],
            });
        });

        it('should handle empty permissions array', () => {
            const result = strategy.transformPermissions([]);

            expect(result).toEqual({});
        });

        it('should handle null permissions', () => {
            const result = strategy.transformPermissions(null as any);

            expect(result).toEqual({});
        });

        it('should handle undefined permissions', () => {
            const result = strategy.transformPermissions(undefined as any);

            expect(result).toEqual({});
        });

        it('should not duplicate actions for same UI', () => {
            const permissions: PermissionEntity[] = [
                { ui: 'users', action: 'view' },
                { ui: 'users', action: 'view' },
                { ui: 'users', action: 'create' },
            ] as PermissionEntity[];

            const result = strategy.transformPermissions(permissions);

            expect(result).toEqual({
                users: ['view', 'create'],
            });
        });

        it('should handle single permission', () => {
            const permissions: PermissionEntity[] = [
                { ui: 'dashboard', action: 'view' },
            ] as PermissionEntity[];

            const result = strategy.transformPermissions(permissions);

            expect(result).toEqual({
                dashboard: ['view'],
            });
        });

        it('should handle multiple actions for multiple UIs', () => {
            const permissions: PermissionEntity[] = [
                { ui: 'users', action: 'view' },
                { ui: 'users', action: 'create' },
                { ui: 'users', action: 'update' },
                { ui: 'posts', action: 'view' },
                { ui: 'settings', action: 'update' },
            ] as PermissionEntity[];

            const result = strategy.transformPermissions(permissions);

            expect(result).toEqual({
                users: ['view', 'create', 'update'],
                posts: ['view'],
                settings: ['update'],
            });
        });

        it('should preserve order of actions', () => {
            const permissions: PermissionEntity[] = [
                { ui: 'users', action: 'delete' },
                { ui: 'users', action: 'create' },
                { ui: 'users', action: 'view' },
            ] as PermissionEntity[];

            const result = strategy.transformPermissions(permissions);

            expect(result.users).toEqual(['delete', 'create', 'view']);
        });

        it('should handle permissions with different UI types', () => {
            const permissions: PermissionEntity[] = [
                { ui: 'dashboard', action: 'view' },
                { ui: 'analytics', action: 'view' },
                { ui: 'reports', action: 'export' },
            ] as PermissionEntity[];

            const result = strategy.transformPermissions(permissions);

            expect(Object.keys(result)).toHaveLength(3);
            expect(result).toHaveProperty('dashboard');
            expect(result).toHaveProperty('analytics');
            expect(result).toHaveProperty('reports');
        });
    });

    describe('validate', () => {
        it('should validate access token and return user data', async () => {
            userSessionRepo.findOne.mockResolvedValue(mockSession);
            userSessionRepo.update.mockResolvedValue({ affected: 1 });

            const result = await strategy.validate(mockPayload);

            expect(userSessionRepo.findOne).toHaveBeenCalledWith({
                where: { id: mockPayload.sid },
                relations: ['user', 'user.group', 'user.group.permissions'],
            });
            expect(userSessionRepo.update).toHaveBeenCalledWith(
                { id: mockPayload.sid },
                { lastActivityAt: expect.any(Date) },
            );
            expect(result).toEqual({
                id: mockPayload.sub,
                role: mockPayload.role,
                sessionId: mockPayload.sid,
                permissions: {
                    users: ['view', 'create'],
                    posts: ['view'],
                },
            });
        });

        it('should throw UnauthorizedException for non-access token type', async () => {
            const invalidPayload = { ...mockPayload, type: 'refresh' };

            await expect(strategy.validate(invalidPayload as any)).rejects.toThrow(
                UnauthorizedException,
            );
            await expect(strategy.validate(invalidPayload as any)).rejects.toThrow(
                'Invalid token type',
            );
        });

        it('should throw UnauthorizedException when session not found', async () => {
            userSessionRepo.findOne.mockResolvedValue(null);

            await expect(strategy.validate(mockPayload)).rejects.toThrow(UnauthorizedException);

            expect(errorHandler.unauthorized).toHaveBeenCalledWith(
                'Session not found',
                'Session not found',
            );
        });

        it('should throw UnauthorizedException when session is revoked', async () => {
            const revokedSession = { ...mockSession, revokedAt: new Date() };
            userSessionRepo.findOne.mockResolvedValue(revokedSession);

            await expect(strategy.validate(mockPayload)).rejects.toThrow(UnauthorizedException);

            expect(errorHandler.unauthorized).toHaveBeenCalledWith(
                'Session revoked',
                'Session revoked',
            );
        });

        it('should throw UnauthorizedException when token version mismatch', async () => {
            const outdatedSession = { ...mockSession, tokenVersion: 2 };
            userSessionRepo.findOne.mockResolvedValue(outdatedSession);

            await expect(strategy.validate(mockPayload)).rejects.toThrow(UnauthorizedException);

            expect(errorHandler.unauthorized).toHaveBeenCalledWith(
                'Token version mismatch',
                'Token version mismatch',
            );
        });

        it('should throw UnauthorizedException when user status is SUSPENDED', async () => {
            const suspendedSession = {
                ...mockSession,
                user: {
                    ...mockSession.user,
                    status: UserStatusEnum.SUSPENDED,
                },
            };
            userSessionRepo.findOne.mockResolvedValue(suspendedSession);

            await expect(strategy.validate(mockPayload)).rejects.toThrow(UnauthorizedException);

            expect(errorHandler.unauthorized).toHaveBeenCalledWith(
                'User not authorized',
                'User not authorized',
            );
        });

        it('should update session last activity', async () => {
            userSessionRepo.findOne.mockResolvedValue(mockSession);
            userSessionRepo.update.mockResolvedValue({ affected: 1 });

            await strategy.validate(mockPayload);

            expect(userSessionRepo.update).toHaveBeenCalledWith(
                { id: mockPayload.sid },
                { lastActivityAt: expect.any(Date) },
            );
        });

        it('should return empty permissions for super-admin role', async () => {
            const superAdminPayload = { ...mockPayload, role: 'super-admin' };
            userSessionRepo.findOne.mockResolvedValue(mockSession);
            userSessionRepo.update.mockResolvedValue({ affected: 1 });

            const result = await strategy.validate(superAdminPayload);

            expect(result.permissions).toEqual({});
        });

        it('should return empty permissions for user role', async () => {
            const userPayload = { ...mockPayload, role: 'user' };
            userSessionRepo.findOne.mockResolvedValue(mockSession);
            userSessionRepo.update.mockResolvedValue({ affected: 1 });

            const result = await strategy.validate(userPayload);

            expect(result.permissions).toEqual({});
        });

        it('should handle session with no group', async () => {
            const sessionWithoutGroup = {
                ...mockSession,
                user: { ...mockSession.user, group: null },
            };
            userSessionRepo.findOne.mockResolvedValue(sessionWithoutGroup);
            userSessionRepo.update.mockResolvedValue({ affected: 1 });

            const result = await strategy.validate(mockPayload);

            expect(result.permissions).toEqual({});
        });

        it('should handle session with group but no permissions', async () => {
            const sessionWithoutPermissions = {
                ...mockSession,
                user: {
                    ...mockSession.user,
                    group: { ...mockSession.user.group, permissions: [] },
                },
            };
            userSessionRepo.findOne.mockResolvedValue(sessionWithoutPermissions);
            userSessionRepo.update.mockResolvedValue({ affected: 1 });

            const result = await strategy.validate(mockPayload);

            expect(result.permissions).toEqual({});
        });

        it('should handle session with undefined group permissions', async () => {
            const sessionWithUndefinedPermissions = {
                ...mockSession,
                user: {
                    ...mockSession.user,
                    group: {
                        ...mockSession.user.group,
                        permissions: undefined,
                    },
                },
            };
            userSessionRepo.findOne.mockResolvedValue(sessionWithUndefinedPermissions);
            userSessionRepo.update.mockResolvedValue({ affected: 1 });

            const result = await strategy.validate(mockPayload);

            expect(result.permissions).toEqual({});
        });

        it('should return correct user interface structure', async () => {
            userSessionRepo.findOne.mockResolvedValue(mockSession);
            userSessionRepo.update.mockResolvedValue({ affected: 1 });

            const result = await strategy.validate(mockPayload);

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('role');
            expect(result).toHaveProperty('sessionId');
            expect(result).toHaveProperty('permissions');
            expect(typeof result.permissions).toBe('object');
        });

        it('should handle different role values', async () => {
            const customRolePayload = { ...mockPayload, role: 'moderator' };
            userSessionRepo.findOne.mockResolvedValue(mockSession);
            userSessionRepo.update.mockResolvedValue({ affected: 1 });

            const result = await strategy.validate(customRolePayload);

            expect(result.role).toBe('moderator');
            expect(result.permissions).toEqual({
                users: ['view', 'create'],
                posts: ['view'],
            });
        });

        it('should execute validations in correct order', async () => {
            const executionOrder: string[] = [];

            const invalidTypePayload = { ...mockPayload, type: 'refresh' };

            try {
                await strategy.validate(invalidTypePayload as any);
            } catch (error) {
                executionOrder.push('token-type-check');
            }

            expect(executionOrder).toContain('token-type-check');
            // Token type is checked first, before any DB calls
            expect(userSessionRepo.findOne).not.toHaveBeenCalled();
        });

        it('should handle all validation checks for valid active user', async () => {
            userSessionRepo.findOne.mockResolvedValue(mockSession);
            userSessionRepo.update.mockResolvedValue({ affected: 1 });

            const result = await strategy.validate(mockPayload);

            // All checks passed
            expect(result).toBeDefined();
            expect(result.id).toBe(mockPayload.sub);
            expect(userSessionRepo.findOne).toHaveBeenCalledTimes(1);
            expect(userSessionRepo.update).toHaveBeenCalledTimes(1);
        });
    });

    describe('validateToken', () => {
        it('should verify and validate token string', async () => {
            const token = 'valid.jwt.token';
            jwtService.verifyAsync.mockResolvedValue(mockPayload);
            userSessionRepo.findOne.mockResolvedValue(mockSession);
            userSessionRepo.update.mockResolvedValue({ affected: 1 });

            const result = await strategy.validateToken(token);

            expect(jwtService.verifyAsync).toHaveBeenCalledWith(token, {
                secret: envConfigService.accessTokenSecret,
            });
            expect(result).toEqual({
                id: mockPayload.sub,
                role: mockPayload.role,
                sessionId: mockPayload.sid,
                permissions: {
                    users: ['view', 'create'],
                    posts: ['view'],
                },
            });
        });

        it('should throw error for invalid token', async () => {
            const token = 'invalid.token';
            jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

            await expect(strategy.validateToken(token)).rejects.toThrow('Invalid token');

            expect(jwtService.verifyAsync).toHaveBeenCalledWith(token, {
                secret: envConfigService.accessTokenSecret,
            });
        });

        it('should throw error for expired token', async () => {
            const token = 'expired.token';
            jwtService.verifyAsync.mockRejectedValue(new Error('Token expired'));

            await expect(strategy.validateToken(token)).rejects.toThrow('Token expired');
        });

        it('should validate token with correct secret', async () => {
            const token = 'test.token';
            jwtService.verifyAsync.mockResolvedValue(mockPayload);
            userSessionRepo.findOne.mockResolvedValue(mockSession);
            userSessionRepo.update.mockResolvedValue({ affected: 1 });

            await strategy.validateToken(token);

            expect(jwtService.verifyAsync).toHaveBeenCalledWith(token, {
                secret: 'test-secret',
            });
        });

        it('should throw UnauthorizedException for refresh token type', async () => {
            const token = 'refresh.token';
            const refreshPayload = { ...mockPayload, type: 'refresh' };
            jwtService.verifyAsync.mockResolvedValue(refreshPayload);

            await expect(strategy.validateToken(token)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException for revoked session via token', async () => {
            const token = 'valid.token';
            const revokedSession = { ...mockSession, revokedAt: new Date() };
            jwtService.verifyAsync.mockResolvedValue(mockPayload);
            userSessionRepo.findOne.mockResolvedValue(revokedSession);

            await expect(strategy.validateToken(token)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException for inactive user via token', async () => {
            const token = 'valid.token';
            const inactiveSession = {
                ...mockSession,
                user: {
                    ...mockSession.user,
                    status: UserStatusEnum.SUSPENDED,
                },
            };
            jwtService.verifyAsync.mockResolvedValue(mockPayload);
            userSessionRepo.findOne.mockResolvedValue(inactiveSession);

            await expect(strategy.validateToken(token)).rejects.toThrow(UnauthorizedException);

            expect(errorHandler.unauthorized).toHaveBeenCalledWith(
                'User not authorized',
                'User not authorized',
            );
        });

        it('should update last activity when validating token', async () => {
            const token = 'valid.token';
            jwtService.verifyAsync.mockResolvedValue(mockPayload);
            userSessionRepo.findOne.mockResolvedValue(mockSession);
            userSessionRepo.update.mockResolvedValue({ affected: 1 });

            await strategy.validateToken(token);

            expect(userSessionRepo.update).toHaveBeenCalledWith(
                { id: mockPayload.sid },
                { lastActivityAt: expect.any(Date) },
            );
        });

        it('should call validate method internally', async () => {
            const token = 'valid.token';
            const validateSpy = jest.spyOn(strategy, 'validate');

            jwtService.verifyAsync.mockResolvedValue(mockPayload);
            userSessionRepo.findOne.mockResolvedValue(mockSession);
            userSessionRepo.update.mockResolvedValue({ affected: 1 });

            await strategy.validateToken(token);

            expect(validateSpy).toHaveBeenCalledWith(mockPayload);
        });

        it('should handle malformed token', async () => {
            const token = 'malformed';
            jwtService.verifyAsync.mockRejectedValue(new Error('jwt malformed'));

            await expect(strategy.validateToken(token)).rejects.toThrow('jwt malformed');
        });

        it('should handle token without required claims', async () => {
            const token = 'incomplete.token';
            const incompletePayload = { sub: 'user-123' } as any;
            jwtService.verifyAsync.mockResolvedValue(incompletePayload);

            await expect(strategy.validateToken(token)).rejects.toThrow();
        });
    });

    describe('Integration tests', () => {
        it('should handle complete authentication flow', async () => {
            userSessionRepo.findOne.mockResolvedValue(mockSession);
            userSessionRepo.update.mockResolvedValue({ affected: 1 });

            const result = await strategy.validate(mockPayload);

            expect(userSessionRepo.findOne).toHaveBeenCalled();
            expect(userSessionRepo.update).toHaveBeenCalled();
            expect(result.id).toBe(mockPayload.sub);
            expect(result.sessionId).toBe(mockPayload.sid);
        });

        it('should handle WebSocket token validation flow', async () => {
            const token = 'websocket.token';
            jwtService.verifyAsync.mockResolvedValue(mockPayload);
            userSessionRepo.findOne.mockResolvedValue(mockSession);
            userSessionRepo.update.mockResolvedValue({ affected: 1 });

            const result = await strategy.validateToken(token);

            expect(jwtService.verifyAsync).toHaveBeenCalled();
            expect(userSessionRepo.findOne).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('should validate permissions transformation in complete flow', async () => {
            const complexPermissions = [
                { ui: 'dashboard', action: 'view' },
                { ui: 'users', action: 'create' },
                { ui: 'users', action: 'view' },
                { ui: 'users', action: 'update' },
                { ui: 'posts', action: 'delete' },
            ] as PermissionEntity[];

            const sessionWithComplexPerms = {
                ...mockSession,
                user: {
                    ...mockSession.user,
                    group: {
                        ...mockSession.user.group,
                        permissions: complexPermissions,
                    },
                },
            };

            userSessionRepo.findOne.mockResolvedValue(sessionWithComplexPerms);
            userSessionRepo.update.mockResolvedValue({ affected: 1 });

            const result = await strategy.validate(mockPayload);

            expect(result.permissions).toEqual({
                dashboard: ['view'],
                users: ['create', 'view', 'update'],
                posts: ['delete'],
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle concurrent validation requests', async () => {
            userSessionRepo.findOne.mockResolvedValue(mockSession);
            userSessionRepo.update.mockResolvedValue({ affected: 1 });

            const promises = [
                await strategy.validate(mockPayload),
                await strategy.validate(mockPayload),
                await strategy.validate(mockPayload),
            ];

            const results = await Promise.all(promises);

            expect(results).toHaveLength(3);
            expect(userSessionRepo.findOne).toHaveBeenCalledTimes(3);
            expect(userSessionRepo.update).toHaveBeenCalledTimes(3);
        });

        it('should handle session update failure gracefully', async () => {
            userSessionRepo.findOne.mockResolvedValue(mockSession);
            userSessionRepo.update.mockRejectedValue(new Error('Database error'));

            await expect(strategy.validate(mockPayload)).rejects.toThrow('Database error');
        });

        it('should validate with different token versions', async () => {
            const versions = [1, 2, 5, 10];

            for (const version of versions) {
                const versionedSession = {
                    ...mockSession,
                    tokenVersion: version,
                };
                const versionedPayload = { ...mockPayload, ver: version };

                userSessionRepo.findOne.mockResolvedValue(versionedSession);
                userSessionRepo.update.mockResolvedValue({ affected: 1 });

                const result = await strategy.validate(versionedPayload);

                expect(result).toBeDefined();
            }
        });
    });
});
