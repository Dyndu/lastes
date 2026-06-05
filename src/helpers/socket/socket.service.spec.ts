import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { EnvConfigService } from '../../utils/services/config';
import { JwtStrategy } from '../../common/guard';
import { ErrorHandlerService } from '../../common/response';
import { Socket, Server } from 'socket.io';
import { CurrentUserInterface } from '../../interface';
import { SocketService } from './socket.service';

describe('SocketService', () => {
    let service: SocketService;
    let mockLogger: any;
    let mockEnvConfig: jest.Mocked<EnvConfigService>;
    let mockJwtStrategy: jest.Mocked<JwtStrategy>;
    let mockErrorHandler: jest.Mocked<ErrorHandlerService>;
    let mockServer: jest.Mocked<Server>;
    let mockClient: jest.Mocked<Socket>;

    const mockCurrentUser: CurrentUserInterface = {
        id: 'user-123',
        role: 'admin',
        sessionId: 'session-123',
        permissions: {
            admin_users: ['view', 'create'],
            module: ['view'],
        },
    };

    beforeEach(async () => {
        mockLogger = {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
        };

        mockEnvConfig = {
            sAdminRole: 'super_admin',
            adminRole: 'admin',
            supportRole: 'support',
            userRole: 'user',
        } as any;

        mockJwtStrategy = {
            validateToken: jest.fn(),
        } as any;

        mockErrorHandler = {
            badRequest: jest.fn((_msg, userMsg) => {
                throw new Error(userMsg);
            }),
            fail: jest.fn((_msg, userMsg) => {
                throw new Error(userMsg);
            }),
        } as any;

        mockClient = {
            id: 'client-123',
            handshake: {
                headers: {},
                query: {},
            },
            data: {},
            join: jest.fn().mockResolvedValue(undefined),
            disconnect: jest.fn(),
            on: jest.fn(),
        } as any;

        mockServer = {
            of: jest.fn().mockReturnThis(),
            emit: jest.fn(),
            to: jest.fn().mockReturnThis(),
            on: jest.fn(),
            sockets: new Map(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SocketService,
                {
                    provide: WINSTON_MODULE_PROVIDER,
                    useValue: mockLogger,
                },
                {
                    provide: EnvConfigService,
                    useValue: mockEnvConfig,
                },
                {
                    provide: JwtStrategy,
                    useValue: mockJwtStrategy,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandler,
                },
            ],
        }).compile();

        service = module.get<SocketService>(SocketService);
        service.server = mockServer;

        jest.clearAllMocks();
    });

    describe('Service initialization', () => {
        it('should be defined', () => {
            expect(service).toBeDefined();
        });

        it('should have all dependencies injected', () => {
            expect(service['logger']).toBeDefined();
            expect(service['envConfigService']).toBeDefined();
            expect(service['tokenVerify']).toBeDefined();
            expect(service['errorHandler']).toBeDefined();
        });
    });

    describe('handleConnection', () => {
        it('should log client connection and return the client', () => {
            const result = service.handleConnection(mockClient);

            expect(mockLogger.info).toHaveBeenCalledWith('Client connected: client-123');
            expect(result).toBe(mockClient);
        });
    });

    describe('handleDisconnect', () => {
        it('should log client disconnection', () => {
            service.handleDisconnect(mockClient);

            expect(mockLogger.info).toHaveBeenCalledWith('Client disconnected: client-123');
        });

        it('should log disconnection for a different client id', () => {
            const anotherClient = { ...mockClient, id: 'client-789' } as any;

            service.handleDisconnect(anotherClient);

            expect(mockLogger.info).toHaveBeenCalledWith('Client disconnected: client-789');
        });
    });

    describe('sendDataToRoute', () => {
        it('should send data to route successfully', () => {
            const data = { message: 'test' };

            service.sendDataToRoute('/test', 'event-title', data);

            expect(mockLogger.info).toHaveBeenCalledWith(
                'Sending data in event event-title: {"message":"test"}',
            );
            expect(mockServer.of).toHaveBeenCalledWith('/test');
            expect(mockServer.emit).toHaveBeenCalledWith('event-title', data);
        });

        it('should send data with a different event and route', () => {
            const data = { count: 5 };

            service.sendDataToRoute('/notifications', 'badge-update', data);

            expect(mockLogger.info).toHaveBeenCalledWith(
                'Sending data in event badge-update: {"count":5}',
            );
            expect(mockServer.of).toHaveBeenCalledWith('/notifications');
            expect(mockServer.emit).toHaveBeenCalledWith('badge-update', data);
        });

        it('should log the error and rethrow when emit fails', () => {
            const error = new Error('Send failed');
            mockServer.emit.mockImplementationOnce(() => {
                throw error;
            });

            expect(() => service.sendDataToRoute('/test', 'event-title', {})).toThrow(
                'Send failed',
            );
            expect(mockLogger.error).toHaveBeenCalledWith('Failed to send data: Send failed');
        });
    });

    describe('sendDataToRoom', () => {
        it('should send data to a room successfully', () => {
            const data = { message: 'test' };

            service.sendDataToRoom('/test', 'room-1', 'event-title', data);

            expect(mockLogger.info).toHaveBeenCalledWith(
                'Sending data in room room-1: {"message":"test"}',
            );
            expect(mockServer.of).toHaveBeenCalledWith('/test');
            expect(mockServer.to).toHaveBeenCalledWith('room-1');
            expect(mockServer.emit).toHaveBeenCalledWith('event-title', data);
        });

        it('should send data to a different room', () => {
            const data = { update: true };

            service.sendDataToRoom('/chat', 'room-123', 'message', data);

            expect(mockServer.of).toHaveBeenCalledWith('/chat');
            expect(mockServer.to).toHaveBeenCalledWith('room-123');
            expect(mockServer.emit).toHaveBeenCalledWith('message', data);
        });

        it('should log the error and rethrow when emit fails', () => {
            const error = new Error('Room send failed');
            mockServer.emit.mockImplementationOnce(() => {
                throw error;
            });

            expect(() => service.sendDataToRoom('/test', 'room-1', 'event-title', {})).toThrow(
                'Room send failed',
            );
            expect(mockLogger.error).toHaveBeenCalledWith('Failed to send data: Room send failed');
        });
    });

    describe('sendDataToUser', () => {
        it('should send data to a user successfully', () => {
            const data = { notification: 'New message' };

            service.sendDataToUser('user-123', '/notifications', 'new-notif', data);

            expect(mockLogger.info).toHaveBeenCalledWith(
                'Sending "new-notif" to user-user-123: {"notification":"New message"}',
            );
            expect(mockServer.of).toHaveBeenCalledWith('/notifications');
            expect(mockServer.to).toHaveBeenCalledWith('user-user-123');
            expect(mockServer.emit).toHaveBeenCalledWith('new-notif', data);
        });

        it('should send data to a different user', () => {
            service.sendDataToUser('user-456', '/updates', 'badge-count', { count: 10 });

            expect(mockServer.to).toHaveBeenCalledWith('user-user-456');
        });

        it('should log the error and rethrow when emit fails', () => {
            const error = new Error('User send failed');
            mockServer.emit.mockImplementationOnce(() => {
                throw error;
            });

            expect(() => service.sendDataToUser('user-123', '/test', 'event', {})).toThrow(
                'User send failed',
            );
            expect(mockLogger.error).toHaveBeenCalledWith(
                'Failed to send data to user user-123: User send failed',
            );
        });
    });

    describe('handleNamespaceConnection', () => {
        it('should join the resolved room and register disconnect listener', async () => {
            const roomResolver = jest.fn().mockResolvedValue('test-room');

            await service.handleNamespaceConnection('/test', mockClient, roomResolver);

            expect(mockLogger.info).toHaveBeenCalledWith('Client connected to /test: client-123');
            expect(roomResolver).toHaveBeenCalledWith(mockClient);
            expect(mockClient.join).toHaveBeenCalledWith('test-room');
            expect(mockLogger.info).toHaveBeenCalledWith('Client client-123 joined room test-room');
            expect(mockClient.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
        });

        it('should disconnect client and log error when room resolver rejects', async () => {
            const error = new Error('Resolver failed');
            const roomResolver = jest.fn().mockRejectedValue(error);

            await service.handleNamespaceConnection('/test', mockClient, roomResolver);

            expect(mockLogger.error).toHaveBeenCalledWith(
                'Error resolving room for client client-123: Resolver failed',
            );
            expect(mockClient.disconnect).toHaveBeenCalled();
            expect(mockClient.join).not.toHaveBeenCalled();
        });

        it('should not join any room when resolver returns null', async () => {
            const roomResolver = jest.fn().mockResolvedValue(null);

            await service.handleNamespaceConnection('/test', mockClient, roomResolver);

            expect(mockClient.join).not.toHaveBeenCalled();
            expect(mockClient.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
        });

        it('should log disconnection when the disconnect event fires', async () => {
            const roomResolver = jest.fn().mockResolvedValue('test-room');

            await service.handleNamespaceConnection('/test', mockClient, roomResolver);

            const disconnectCallback = mockClient.on.mock.calls.find(
                (call) => call[0] === 'disconnect',
            )?.[1];

            disconnectCallback?.();

            expect(mockLogger.info).toHaveBeenCalledWith(
                'Client disconnected from /test: client-123',
            );
        });
    });

    describe('extractAndVerifyToken', () => {
        it('should extract and verify a Bearer token from the authorization header', async () => {
            mockClient.handshake.headers['authorization'] = 'Bearer valid-token';
            mockJwtStrategy.validateToken.mockResolvedValue(mockCurrentUser);

            const result = await service.extractAndVerifyToken(mockClient);

            expect(mockJwtStrategy.validateToken).toHaveBeenCalledWith('valid-token');
            expect(result).toEqual(mockCurrentUser);
        });

        it('should extract and verify a plain token from the query parameter', async () => {
            mockClient.handshake.query.token = 'valid-token';
            mockJwtStrategy.validateToken.mockResolvedValue(mockCurrentUser);

            const result = await service.extractAndVerifyToken(mockClient);

            expect(mockJwtStrategy.validateToken).toHaveBeenCalledWith('valid-token');
            expect(result).toEqual(mockCurrentUser);
        });

        it('should normalize a string[] query token and use the first element', async () => {
            mockClient.handshake.query.token = ['valid-token', 'extra'] as any;
            mockJwtStrategy.validateToken.mockResolvedValue(mockCurrentUser);

            const result = await service.extractAndVerifyToken(mockClient);

            expect(mockJwtStrategy.validateToken).toHaveBeenCalledWith('valid-token');
            expect(result).toEqual(mockCurrentUser);
        });

        it('should strip the Bearer prefix before calling validateToken', async () => {
            mockClient.handshake.headers['authorization'] = 'Bearer test-token';
            mockJwtStrategy.validateToken.mockResolvedValue(mockCurrentUser);

            await service.extractAndVerifyToken(mockClient);

            expect(mockJwtStrategy.validateToken).toHaveBeenCalledWith('test-token');
        });

        it('should pass a token without a Bearer prefix directly to validateToken', async () => {
            mockClient.handshake.headers['authorization'] = 'test-token';
            mockJwtStrategy.validateToken.mockResolvedValue(mockCurrentUser);

            await service.extractAndVerifyToken(mockClient);

            expect(mockJwtStrategy.validateToken).toHaveBeenCalledWith('test-token');
        });

        it('should throw immediately when no token is provided', async () => {
            await expect(service.extractAndVerifyToken(mockClient)).rejects.toThrow(
                'Token is missing',
            );

            expect(mockErrorHandler.badRequest).toHaveBeenCalledWith(
                expect.stringContaining('Token has to be provided'),
                'Token is missing',
            );
        });

        it('should throw when the token is empty after stripping Bearer', async () => {
            mockClient.handshake.headers['authorization'] = 'Bearer ';

            await expect(service.extractAndVerifyToken(mockClient)).rejects.toThrow(
                'Invalid token',
            );

            expect(mockErrorHandler.badRequest).toHaveBeenCalledWith(
                'Invalid token format',
                'Invalid token',
            );
        });

        it('should propagate validateToken rejection without wrapping', async () => {
            mockClient.handshake.headers['authorization'] = 'Bearer invalid-token';
            mockJwtStrategy.validateToken.mockRejectedValue(new Error('jwt expired'));

            await expect(service.extractAndVerifyToken(mockClient)).rejects.toThrow('jwt expired');
        });
    });

    describe('isUserAuthorized', () => {
        it('should return true for super admin when sAdminOnly is true', () => {
            expect(service.isUserAuthorized('super_admin', { sAdminOnly: true })).toBe(true);
        });

        it('should return false for regular admin when sAdminOnly is true', () => {
            expect(service.isUserAuthorized('admin', { sAdminOnly: true })).toBe(false);
        });

        it('should return true for admin when adminOnly is true', () => {
            expect(service.isUserAuthorized('admin', { adminOnly: true })).toBe(true);
        });

        it('should return true for super admin when adminOnly is true', () => {
            expect(service.isUserAuthorized('super_admin', { adminOnly: true })).toBe(true);
        });

        it('should return true for support when adminOnly is true', () => {
            expect(service.isUserAuthorized('support', { adminOnly: true })).toBe(true);
        });

        it('should return false for a regular user when adminOnly is true', () => {
            expect(service.isUserAuthorized('user', { adminOnly: true })).toBe(false);
        });

        it('should return true when no restrictions are set', () => {
            expect(service.isUserAuthorized('user', {})).toBe(true);
        });
    });

    describe('hasRequiredPermissions', () => {
        it('should return true if no permissions are required', () => {
            expect(service.hasRequiredPermissions(mockCurrentUser)).toBe(true);
        });

        it('should return true for super admin regardless of permissions', () => {
            const superAdmin: CurrentUserInterface = {
                ...mockCurrentUser,
                role: 'super_admin',
                permissions: {},
            };

            expect(
                service.hasRequiredPermissions(superAdmin, {
                    ui: 'admin_users',
                    actions: ['delete'],
                }),
            ).toBe(true);
        });

        it('should return false when user lacks the permission scope entirely', () => {
            const result = service.hasRequiredPermissions(mockCurrentUser, {
                ui: 'non_existent',
                actions: ['view'],
            });

            expect(result).toBe(false);
            expect(mockLogger.warn).toHaveBeenCalledWith(
                "User user-123 lacks permission scope for 'non_existent'",
            );
        });

        it('should return false when user has the scope but is missing at least one required action', () => {
            const result = service.hasRequiredPermissions(mockCurrentUser, {
                ui: 'admin_users',
                actions: ['delete', 'update'],
            });

            expect(result).toBe(false);
            expect(mockLogger.warn).toHaveBeenCalledWith(
                "User user-123 lacks required actions [delete, update] for 'admin_users'",
            );
        });

        it('should return false when only one of several required actions is present', () => {
            // User has 'view' but not 'delete' — every() must fail
            const result = service.hasRequiredPermissions(mockCurrentUser, {
                ui: 'admin_users',
                actions: ['view', 'delete'],
            });

            expect(result).toBe(false);
        });

        it('should return true when user has all required actions', () => {
            const result = service.hasRequiredPermissions(mockCurrentUser, {
                ui: 'admin_users',
                actions: ['view', 'create'],
            });

            expect(result).toBe(true);
        });

        it('should return false for a user without a permissions object', () => {
            const userWithoutPerms: CurrentUserInterface = {
                id: 'user-456',
                role: 'admin',
                sessionId: 'session-456',
                permissions: undefined,
            } as any;

            const result = service.hasRequiredPermissions(userWithoutPerms, {
                ui: 'admin_users',
                actions: ['view'],
            });

            expect(result).toBe(false);
        });
    });

    describe('authenticateClient', () => {
        beforeEach(() => {
            mockClient.handshake.headers['authorization'] = 'Bearer valid-token';
        });

        it('should authenticate an authorized client and attach user data to the socket', async () => {
            mockJwtStrategy.validateToken.mockResolvedValue(mockCurrentUser);

            const result = await service.authenticateClient(mockClient, { adminOnly: true });

            expect(result).toEqual(mockCurrentUser);
            expect(mockClient.data.user).toEqual(mockCurrentUser);
        });

        it('should disconnect and return null when the user role is not authorized', async () => {
            const regularUser: CurrentUserInterface = { ...mockCurrentUser, role: 'user' };
            mockJwtStrategy.validateToken.mockResolvedValue(regularUser);

            const result = await service.authenticateClient(mockClient, { adminOnly: true });

            expect(result).toBeNull();
            expect(mockClient.disconnect).toHaveBeenCalled();
            expect(mockLogger.warn).toHaveBeenCalledWith(
                'User user-123 is not authorized for this namespace (role: user)',
            );
        });

        it('should disconnect and return null when the user lacks required permissions', async () => {
            mockJwtStrategy.validateToken.mockResolvedValue(mockCurrentUser);

            const result = await service.authenticateClient(mockClient, {
                adminOnly: true,
                requiredPermissions: { ui: 'admin_users', actions: ['delete'] },
            });

            expect(result).toBeNull();
            expect(mockClient.disconnect).toHaveBeenCalled();
            expect(mockLogger.warn).toHaveBeenCalledWith(
                'User user-123 lacks required permissions for this namespace',
            );
        });

        it('should authenticate a client that has all required permissions', async () => {
            mockJwtStrategy.validateToken.mockResolvedValue(mockCurrentUser);

            const result = await service.authenticateClient(mockClient, {
                adminOnly: true,
                requiredPermissions: { ui: 'admin_users', actions: ['view'] },
            });

            expect(result).toEqual(mockCurrentUser);
        });

        it('should authenticate a super admin for sAdminOnly namespaces', async () => {
            const superAdmin: CurrentUserInterface = { ...mockCurrentUser, role: 'super_admin' };
            mockJwtStrategy.validateToken.mockResolvedValue(superAdmin);

            const result = await service.authenticateClient(mockClient, { sAdminOnly: true });

            expect(result).toEqual(superAdmin);
        });

        it('should authenticate a support user for adminOnly namespaces', async () => {
            const supportUser: CurrentUserInterface = { ...mockCurrentUser, role: 'support' };
            mockJwtStrategy.validateToken.mockResolvedValue(supportUser);

            const result = await service.authenticateClient(mockClient, { adminOnly: true });

            expect(result).toEqual(supportUser);
        });
    });

    describe('getAdminDefaultRoom', () => {
        it('should return the default room for an admin user', () => {
            expect(service.getAdminDefaultRoom(mockCurrentUser, 'admin-room')).toBe('admin-room');
        });

        it('should return null when no default room is provided', () => {
            expect(service.getAdminDefaultRoom(mockCurrentUser)).toBeNull();
        });

        it('should return null when currentUser is null', () => {
            expect(service.getAdminDefaultRoom(null, 'admin-room')).toBeNull();
        });

        it('should return null for a non-admin user', () => {
            const regularUser: CurrentUserInterface = { ...mockCurrentUser, role: 'user' };
            expect(service.getAdminDefaultRoom(regularUser, 'admin-room')).toBeNull();
        });

        it('should return the default room for a super admin', () => {
            const superAdmin: CurrentUserInterface = { ...mockCurrentUser, role: 'super_admin' };
            expect(service.getAdminDefaultRoom(superAdmin, 'admin-room')).toBe('admin-room');
        });

        it('should return the default room for a support user', () => {
            const support: CurrentUserInterface = { ...mockCurrentUser, role: 'support' };
            expect(service.getAdminDefaultRoom(support, 'admin-room')).toBe('admin-room');
        });
    });

    describe('getQueryParamRoom', () => {
        it('should return a formatted room string from the query param', () => {
            mockClient.handshake.query.userId = 'user-456';

            const result = service.getQueryParamRoom(mockClient, {
                queryParam: 'userId',
                roomPrefix: 'user',
            });

            expect(result).toBe('user-user-456-room');
        });

        it('should normalize a string[] query param and use the first element', () => {
            mockClient.handshake.query.userId = ['user-456', 'user-789'] as any;

            const result = service.getQueryParamRoom(mockClient, {
                queryParam: 'userId',
                roomPrefix: 'user',
            });

            expect(result).toBe('user-user-456-room');
        });

        it('should return null when queryParam option is missing', () => {
            const result = service.getQueryParamRoom(mockClient, { roomPrefix: 'user' });
            expect(result).toBeNull();
        });

        it('should return null when roomPrefix option is missing', () => {
            mockClient.handshake.query.userId = 'user-456';
            const result = service.getQueryParamRoom(mockClient, { queryParam: 'userId' });
            expect(result).toBeNull();
        });

        it('should return null when the query param value is an empty string', () => {
            mockClient.handshake.query.userId = '';
            const result = service.getQueryParamRoom(mockClient, {
                queryParam: 'userId',
                roomPrefix: 'user',
            });
            expect(result).toBeNull();
        });
    });

    describe('resolveNamespaceRoom', () => {
        beforeEach(() => {
            mockClient.handshake.headers['authorization'] = 'Bearer valid-token';
        });

        it('should resolve the admin default room for an authenticated admin', async () => {
            mockJwtStrategy.validateToken.mockResolvedValue(mockCurrentUser);

            const result = await service.resolveNamespaceRoom(mockClient, {
                requireAuth: true,
                defaultRoom: 'admin-room',
            });

            expect(result).toBe('admin-room');
        });

        it('should resolve a room from a query param', async () => {
            mockClient.handshake.query.propertyId = 'prop-123';

            const result = await service.resolveNamespaceRoom(mockClient, {
                queryParam: 'propertyId',
                roomPrefix: 'property',
            });

            expect(result).toBe('property-prop-123-room');
        });

        it('should fall back to the plain defaultRoom when no other room resolves', async () => {
            const result = await service.resolveNamespaceRoom(mockClient, {
                defaultRoom: 'fallback-room',
            });

            expect(result).toBe('fallback-room');
        });

        it('should return null when nothing can be resolved', async () => {
            const result = await service.resolveNamespaceRoom(mockClient, {});
            expect(result).toBeNull();
        });

        it('should return null and log error when authentication throws', async () => {
            mockJwtStrategy.validateToken.mockRejectedValue(new Error('Auth failed'));

            const result = await service.resolveNamespaceRoom(mockClient, { requireAuth: true });

            expect(result).toBeNull();
            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.stringContaining('Failed to resolve room'),
            );
        });

        it('should prioritize query param room over admin default room', async () => {
            mockJwtStrategy.validateToken.mockResolvedValue(mockCurrentUser);
            mockClient.handshake.query.userId = 'user-456';

            const result = await service.resolveNamespaceRoom(mockClient, {
                requireAuth: true,
                adminOnly: true,
                defaultRoom: 'admin-room',
                queryParam: 'userId',
                roomPrefix: 'user',
            });

            expect(result).toBe('user-user-456-room');
        });

        it('should resolve correctly with permission requirements', async () => {
            mockJwtStrategy.validateToken.mockResolvedValue(mockCurrentUser);

            const result = await service.resolveNamespaceRoom(mockClient, {
                requireAuth: true,
                adminOnly: true,
                requiredPermissions: { ui: 'admin_users', actions: ['view'] },
                defaultRoom: 'admin-room',
            });

            expect(result).toBe('admin-room');
        });

        it('should return null when the user lacks required permissions', async () => {
            mockJwtStrategy.validateToken.mockResolvedValue(mockCurrentUser);

            const result = await service.resolveNamespaceRoom(mockClient, {
                requireAuth: true,
                adminOnly: true,
                requiredPermissions: { ui: 'admin_users', actions: ['delete'] },
            });

            expect(result).toBeNull();
        });
    });

    describe('onModuleInit', () => {
        it('should register a connection handler for every namespace', () => {
            const mockNamespace = { on: jest.fn() };
            mockServer.of.mockReturnValue(mockNamespace as any);

            service.onModuleInit();

            expect(mockServer.of).toHaveBeenCalledWith('/admin-users');
            expect(mockNamespace.on).toHaveBeenCalledWith('connection', expect.any(Function));
        });

        it('should call handleNamespaceConnection when a client connects to /admin-users', async () => {
            const mockNamespace = { on: jest.fn() };
            mockServer.of.mockReturnValue(mockNamespace as any);
            mockJwtStrategy.validateToken.mockResolvedValue({
                ...mockCurrentUser,
                role: 'super_admin',
            });
            mockClient.handshake.headers['authorization'] = 'Bearer valid-token';

            service.onModuleInit();

            const connectionHandler = mockNamespace.on.mock.calls[0][1];
            await connectionHandler(mockClient);

            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.stringContaining('Client connected to /admin-users'),
            );
        });

        it('should call server.of for every declared namespace', () => {
            const mockNamespace = { on: jest.fn() };
            mockServer.of.mockReturnValue(mockNamespace as any);

            service.onModuleInit();

            expect(mockServer.of).toHaveBeenCalledWith('/guides');
            expect(mockServer.of).toHaveBeenCalledWith('/notifications');
            expect(mockServer.of).toHaveBeenCalledWith('/supports');
            expect(mockServer.of).toHaveBeenCalledWith('/modules/users/personal');
        });
    });
});
