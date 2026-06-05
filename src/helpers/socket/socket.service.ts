import { Injectable, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from 'winston';
import { EnvConfigService } from '../../utils/services/config';
import { JwtStrategy } from '../../common/guard';
import { ErrorHandlerService } from '../../common/response';
import { CurrentUserInterface, NameSpaceInterface } from '../../interface';

@Injectable()
@WebSocketGateway({ cors: { origin: true } })
export class SocketService implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger: Logger;

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) logger: Logger,
        private readonly envConfigService: EnvConfigService,
        private readonly tokenVerify: JwtStrategy,
        private readonly errorHandler: ErrorHandlerService,
    ) {
        this.logger = logger;
    }

    /**
     * Handles a new client connection.
     * Logs the connection event and returns the connected client.
     */
    handleConnection(client: Socket) {
        this.logger.info(`Client connected: ${client.id}`);
        return client;
    }

    /**
     * Handles the disconnection of a client.
     * Logs the disconnection event of the client.
     */
    handleDisconnect(client: Socket) {
        this.logger.info(`Client disconnected: ${client.id}`);
    }

    /**
     * Sends data to a specific Socket.IO route with a given event title, logging the action
     * and handling errors.
     */
    sendDataToRoute(eventRoute: string, eventTitle: string, data: unknown) {
        try {
            this.logger.info(`Sending data in event ${eventTitle}: ${JSON.stringify(data)}`);
            return this.server.of(eventRoute).emit(eventTitle, data);
        } catch (error) {
            this.logger.error(`Failed to send data: ${error.message}`);
            throw error;
        }
    }

    /**
     * Sends data to all clients in a specific room on a given Socket.IO route with a given event title,
     * logging the action and handling errors.
     */
    sendDataToRoom(eventRoute: string, room: string, eventTitle: string, data: unknown) {
        try {
            this.logger.info(`Sending data in room ${room}: ${JSON.stringify(data)}`);
            return this.server.of(eventRoute).to(room).emit(eventTitle, data);
        } catch (error) {
            this.logger.error(`Failed to send data: ${error.message}`);
            throw error;
        }
    }

    /**
     * Sends data to a specific user via a socket room.
     * Constructs a user-specific room, logs the event, and emits the data to the user.
     * Throws an error if the operation fails.
     */
    sendDataToUser(userId: string, eventRoute: string, eventTitle: string, data: unknown) {
        try {
            const room = `user-${userId}`;

            this.logger.info(`Sending "${eventTitle}" to ${room}: ${JSON.stringify(data)}`);
            return this.server.of(eventRoute).to(room).emit(eventTitle, data);
        } catch (error) {
            this.logger.error(`Failed to send data to user ${userId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Handles a client connection to a specific namespace.
     * Logs the connection event and resolves the room for the client.
     * Joins the client to the resolved room if available.
     * Logs any errors that occur during the room resolution process and disconnects the client on error.
     * Listens to the client's disconnection event and logs it.
     */
    async handleNamespaceConnection(
        namespace: string,
        client: Socket,
        roomResolver: (client: Socket) => Promise<string | null>,
    ) {
        this.logger.info(`Client connected to ${namespace}: ${client.id}`);

        const room = await roomResolver(client).catch((error) => {
            this.logger.error(`Error resolving room for client ${client.id}: ${error.message}`);
            client.disconnect();
            return null;
        });

        if (room) {
            await client.join(room);
            this.logger.info(`Client ${client.id} joined room ${room}`);
        }

        client.on('disconnect', () => {
            this.logger.info(`Client disconnected from ${namespace}: ${client.id}`);
        });
    }

    /**
     * Extracts and verifies a token from a WebSocket client's handshake headers or query parameters.
     * Uses JwtStrategy to validate the token and session.
     * Returns the validated user data if valid, otherwise throws.
     *
     * Fix: Guards now throw explicitly so execution never continues past a failed check.
     * Fix: query. Token is normalized from string | string[] to string before processing.
     */
    async extractAndVerifyToken(client: Socket): Promise<CurrentUserInterface> {
        const rawHeader = client.handshake.headers['authorization'];
        const rawQuery = client.handshake.query.token;

        const rawToken = rawHeader ?? (Array.isArray(rawQuery) ? rawQuery[0] : rawQuery) ?? null;

        if (!rawToken)
            this.errorHandler.badRequest(
                `Token has to be provided when trying to extract token from websocket of the client: ${client.id}`,
                `Token is missing`,
            );

        const cleanToken = rawToken.startsWith('Bearer ') ? rawToken.split(' ')[1] : rawToken;

        if (!cleanToken) this.errorHandler.badRequest(`Invalid token format`, `Invalid token`);

        return this.tokenVerify.validateToken(cleanToken);
    }

    /**
     * Determines if a user is authorized based on their role and specified options.
     * Returns `true` if no restrictions are set, or if the user's role matches the required authorization level.
     */
    isUserAuthorized(
        role: string,
        options: { sAdminOnly?: boolean; adminOnly?: boolean },
    ): boolean {
        if (options.sAdminOnly) return role === this.envConfigService.sAdminRole;

        if (options.adminOnly) {
            const validRoles = new Set([
                this.envConfigService.sAdminRole,
                this.envConfigService.adminRole,
                this.envConfigService.supportRole,
            ]);
            return validRoles.has(role);
        }

        return true;
    }

    /**
     * Checks if the current user has the required permissions for a specific UI scope and actions.
     * Returns `true` if no permissions are required, if the user is a super admin, or if the user's
     * permissions include ALL required actions (changed from `some` to `every` for stricter enforcement).
     * Logs a warning if the user lacks the necessary permissions.
     */
    hasRequiredPermissions(
        currentUser: CurrentUserInterface,
        requiredPermissions?: { ui: string; actions: string[] },
    ): boolean {
        if (!requiredPermissions) return true;
        if (currentUser.role === this.envConfigService.sAdminRole) return true;

        const { ui, actions } = requiredPermissions;

        if (!currentUser.permissions?.[ui]) {
            this.logger.warn(`User ${currentUser.id} lacks permission scope for '${ui}'`);
            return false;
        }

        const userActions = currentUser.permissions[ui];

        const hasPermission = actions.every((action) => userActions.includes(action));

        if (!hasPermission)
            this.logger.warn(
                `User ${currentUser.id} lacks required actions [${actions.join(', ')}] for '${ui}'`,
            );

        return hasPermission;
    }

    /**
     * Authenticates a client socket connection by extracting and verifying the user token.
     * Validates if the user is authorized based on role and required permissions.
     * Attaches the user data to the client socket if authorized.
     *
     * Fix: unauthorized clients are now explicitly disconnected before returning null.
     */
    async authenticateClient(
        client: Socket,
        options: {
            sAdminOnly?: boolean;
            adminOnly?: boolean;
            requiredPermissions?: { ui: string; actions: string[] };
        },
    ): Promise<CurrentUserInterface | null> {
        const currentUser = await this.extractAndVerifyToken(client);
        client.data.user = currentUser;

        await client.join(`user-${currentUser.id}`);

        if (!this.isUserAuthorized(currentUser.role, options)) {
            this.logger.warn(
                `User ${currentUser.id} is not authorized for this namespace (role: ${currentUser.role})`,
            );
            client.disconnect();
            return null;
        }

        if (
            options.requiredPermissions &&
            !this.hasRequiredPermissions(currentUser, options.requiredPermissions)
        ) {
            this.logger.warn(
                `User ${currentUser.id} lacks required permissions for this namespace`,
            );
            client.disconnect();
            return null;
        }

        return currentUser;
    }

    /**
     * Returns the default admin room for a user if they have an admin, super admin, or support role.
     * Returns `null` if the user is not authorized or if no default room is provided.
     */
    getAdminDefaultRoom(
        currentUser: CurrentUserInterface | null,
        defaultRoom?: string,
    ): string | null {
        if (!defaultRoom || !currentUser) return null;

        const validRoles = new Set([
            this.envConfigService.sAdminRole,
            this.envConfigService.adminRole,
            this.envConfigService.supportRole,
        ]);

        return validRoles.has(currentUser.role) ? defaultRoom : null;
    }

    /**
     * Extracts a room identifier from the client's query parameters and formats it with a specified prefix.
     * Returns the formatted room string if the query parameter exists; otherwise, returns `null`.
     */
    getQueryParamRoom(
        client: Socket,
        options: { queryParam?: string; roomPrefix?: string },
    ): string | null {
        if (!options.queryParam || !options.roomPrefix) return null;

        const raw = client.handshake.query[options.queryParam];
        const id = Array.isArray(raw) ? raw[0] : raw;

        return id ? `${options.roomPrefix}-${id}-room` : null;
    }

    /**
     * Resolves the appropriate namespace room for a client socket based on authentication,
     * query parameters, and default room options.
     *
     * Resolution order:
     *   1. Query param room (takes priority so per-resource namespaces like `/supports` work for all roles)
     *   2. Admin default room (fallback for admins when no query param is given)
     *   3. Plain default room
     *
     * Fix: query param room is checked first to avoid admins being silently routed to the
     * default room when connecting to namespaces that use `queryParam`.
     */
    async resolveNamespaceRoom(
        client: Socket,
        options: {
            roomPrefix?: string;
            queryParam?: string;
            defaultRoom?: string;
            requireAuth?: boolean;
            sAdminOnly?: boolean;
            adminOnly?: boolean;
            requiredPermissions?: { ui: string; actions: string[] };
        },
    ) {
        try {
            const currentUser = options.requireAuth
                ? await this.authenticateClient(client, options)
                : null;

            return (
                this.getQueryParamRoom(client, options) ??
                this.getAdminDefaultRoom(currentUser, options.defaultRoom) ??
                options.defaultRoom ??
                null
            );
        } catch (error) {
            this.logger.error(
                `Failed to resolve room for ${client.nsp?.name ?? 'unknown'}: ${error.message}`,
            );
            return null;
        }
    }

    createResolver(config: NameSpaceInterface) {
        return (client: Socket) => this.resolveNamespaceRoom(client, config.options);
    }

    private readonly namespaces: NameSpaceInterface[] = [
        {
            name: '/admin-users',
            options: {
                requireAuth: true,
                adminOnly: true,
                requiredPermissions: {
                    ui: 'admin_users',
                    actions: ['view'],
                },
            },
        },
        {
            name: '/guides/badge-count',
            options: {},
        },
        {
            name: '/guides',
            options: {},
        },
        {
            name: '/ads/badge-count',
            options: {
                requireAuth: true,
                adminOnly: true,
                requiredPermissions: {
                    ui: 'ads_spaces',
                    actions: ['view'],
                },
            },
        },
        {
            name: '/ads',
            options: {
                requireAuth: true,
                adminOnly: true,
                requiredPermissions: {
                    ui: 'ads_spaces',
                    actions: ['view'],
                },
            },
        },
        {
            name: '/ads-running',
            options: {},
        },
        {
            name: '/notifications',
            options: {
                requireAuth: true,
            },
        },
        {
            name: '/newsletter',
            options: {
                requireAuth: true,
                adminOnly: true,
                requiredPermissions: {
                    ui: 'newsletter',
                    actions: ['view'],
                },
            },
        },
        {
            name: '/c-codes',
            options: {
                requireAuth: true,
                adminOnly: true,
                requiredPermissions: {
                    ui: 'affiliation',
                    actions: ['view'],
                },
            },
        },
        {
            name: '/s-codes',
            options: {
                requireAuth: true,
                adminOnly: true,
                requiredPermissions: {
                    ui: 'help_support',
                    actions: ['view'],
                },
            },
        },
        {
            name: '/supports',
            options: {
                requireAuth: true,
                roomPrefix: 'support',
                queryParam: 'id',
            },
        },
        {
            name: '/supports/cons',
            options: {
                requireAuth: true,
            },
        },
        {
            name: '/social',
            options: {},
        },
        {
            name: '/modules',
            options: {
                requireAuth: true,
                adminOnly: true,
                requiredPermissions: {
                    ui: 'module',
                    actions: ['view'],
                },
            },
        },
        {
            name: '/modules/users',
            options: {
                requireAuth: true,
                roomPrefix: 'modules',
                queryParam: 'id',
            },
        },
        {
            name: '/modules/users/personal',
            options: {
                requireAuth: true,
            },
        },
    ];

    /**
     * Initializes the module by setting up WebSocket namespaces and their respective room resolvers.
     * Each namespace has a resolver function that determines the room a client should join
     * based on query parameters or token verification.
     * Logs connection and disconnection events, and handles errors during the room resolution process.
     */
    onModuleInit() {
        for (const ns of this.namespaces) {
            this.server.of(ns.name).on('connection', (client: Socket) => {
                void this.handleNamespaceConnection(ns.name, client, this.createResolver(ns));
            });
        }
    }
}
