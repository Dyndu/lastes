import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { UserSessionService } from './user-session.service';
import { PreUserSessionService } from './pre-user-session.service';
import { UserSessionRepository } from '../user-session.repository';
import { EnvConfigService } from '../../../utils/services/config';
import { ErrorHandlerService } from '../../../common/response';
import { GlobalUtils } from '../../../utils/services/tools';
import { UserSessionEntity } from '../entities/user-session.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { CurrentUserInterface } from '../../../interface';
import { IsNull, MoreThan } from 'typeorm';

describe('UserSessionService', () => {
    let service: UserSessionService;

    const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    };

    const mockJwtService = {
        sign: jest.fn(),
        verify: jest.fn(),
    };

    const mockEnvConfigService = {
        accessTokenExpiry: '15m',
        refreshTokenExpiry: '180d',
        maxUserSession: 5,
    };

    const mockErrorHandlerService = {
        unauthorized: jest.fn(),
        forbidden: jest.fn(),
        notFound: jest.fn(),
    };

    const mockGlobalUtils = {
        auth: {
            generateRefreshToken: jest.fn(),
            hashToken: jest.fn(),
        },
    };

    const mockUserSessionRepo = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    };

    const mockPreUserSessionService = {
        revokeOldSession: jest.fn(),
        initializeSession: jest.fn(),
        generateToken: jest.fn(),
        updateSession: jest.fn(),
        retrieveSessionByCriteria: jest.fn(),
        ensureSessionNotRevoked: jest.fn(),
        ensureSessionIsValid: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserSessionService,
                {
                    provide: WINSTON_MODULE_PROVIDER,
                    useValue: mockLogger,
                },
                {
                    provide: JwtService,
                    useValue: mockJwtService,
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
                    provide: UserSessionRepository,
                    useValue: mockUserSessionRepo,
                },
                {
                    provide: GlobalUtils,
                    useValue: mockGlobalUtils,
                },
                {
                    provide: PreUserSessionService,
                    useValue: mockPreUserSessionService,
                },
            ],
        }).compile();

        service = module.get<UserSessionService>(UserSessionService);
        module.get(PreUserSessionService);
        module.get(UserSessionRepository);
        module.get(ErrorHandlerService);
        module.get(GlobalUtils);
        module.get(WINSTON_MODULE_PROVIDER);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('transformUSession', () => {
        it('should transform session entities to simplified object', () => {
            const sessionId = 'current-session-id';
            const session = {
                id: 'session-123',
                deviceName: 'Chrome on Windows',
                ipAddress: '192.168.1.1',
                lastActivityAt: new Date('2024-01-15'),
            } as UserSessionEntity;

            const result = service.transformUSession(sessionId, session);

            expect(result).toEqual({
                id: 'session-123',
                device: 'Chrome on Windows',
                ipAddress: '192.168.1.1',
                lastActivityAt: new Date('2024-01-15'),
                isCurrent: false,
            });
        });

        it('should mark session as current when IDs match', () => {
            const sessionId = 'session-123';
            const session = {
                id: 'session-123',
                deviceName: 'Chrome',
                ipAddress: '192.168.1.1',
                lastActivityAt: new Date(),
            } as UserSessionEntity;

            const result = service.transformUSession(sessionId, session);

            expect(result.isCurrent).toBe(true);
        });

        it('should handle different session IDs', () => {
            const sessionId = 'other-session';
            const session = {
                id: 'session-456',
                deviceName: 'Firefox',
                ipAddress: '10.0.0.1',
                lastActivityAt: new Date(),
            } as UserSessionEntity;

            const result = service.transformUSession(sessionId, session);

            expect(result.isCurrent).toBe(false);
            expect(result.id).toBe('session-456');
        });
    });

    describe('getActiveSessionsForUser', () => {
        it('should retrieve and transform active sessions', async () => {
            const currentUser: CurrentUserInterface = {
                id: 'user-123',
                sessionId: 'current-session',
                role: 'user',
            } as any;

            const mockSessions = [
                {
                    id: 'current-session',
                    deviceName: 'Chrome',
                    ipAddress: '192.168.1.1',
                    lastActivityAt: new Date('2024-01-15'),
                },
                {
                    id: 'session-2',
                    deviceName: 'Firefox',
                    ipAddress: '192.168.1.2',
                    lastActivityAt: new Date('2024-01-14'),
                },
            ] as UserSessionEntity[];

            mockUserSessionRepo.find.mockResolvedValue(mockSessions);

            const result = await service.getActiveSessionsForUser(currentUser);

            expect(mockLogger.info).toHaveBeenCalledWith('Retrieve user connected active sessions');
            expect(mockUserSessionRepo.find).toHaveBeenCalledWith({
                where: {
                    user: { id: 'user-123' },
                    revokedAt: IsNull(),
                    expiredAt: MoreThan(expect.any(Date)),
                },
                order: { lastActivityAt: 'DESC' },
            });
            expect(result).toHaveLength(2);
            expect(result[0].isCurrent).toBe(true);
            expect(result[1].isCurrent).toBe(false);
        });

        it('should return empty array when no active sessions found', async () => {
            const currentUser: CurrentUserInterface = {
                id: 'user-123',
                sessionId: 'current-session',
                role: 'user',
            } as any;

            mockUserSessionRepo.find.mockResolvedValue([]);

            const result = await service.getActiveSessionsForUser(currentUser);

            expect(result).toEqual([]);
        });

        it('should handle different user IDs', async () => {
            const currentUser: CurrentUserInterface = {
                id: 'user-456',
                sessionId: 'session-abc',
                role: 'admin',
            } as any;

            const mockSessions = [
                {
                    id: 'session-abc',
                    deviceName: 'Safari',
                    ipAddress: '10.0.0.5',
                    lastActivityAt: new Date(),
                },
            ] as UserSessionEntity[];

            mockUserSessionRepo.find.mockResolvedValue(mockSessions);

            await service.getActiveSessionsForUser(currentUser);

            expect(mockUserSessionRepo.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        user: { id: 'user-456' },
                    }),
                }),
            );
        });
    });

    describe('generateUserSession', () => {
        it('should generate a new user session with all parameters', async () => {
            const user = {
                id: 'user-123',
                role: { label: 'admin' },
            } as UserEntity;

            const refreshToken = 'generated-refresh-token';
            const sessionEntity = {
                id: 'new-session',
                tokenVersion: 1,
            } as UserSessionEntity;

            const accessToken = 'generated-access-token';

            mockGlobalUtils.auth.generateRefreshToken.mockReturnValue(refreshToken);
            mockPreUserSessionService.initializeSession.mockReturnValue(sessionEntity);
            mockUserSessionRepo.create.mockResolvedValue(sessionEntity);
            mockPreUserSessionService.generateToken.mockReturnValue(accessToken);

            const result = await service.generateUserSession(
                user,
                true,
                'Mozilla/5.0',
                '192.168.1.1',
            );

            expect(mockPreUserSessionService.revokeOldSession).toHaveBeenCalledWith(user);
            expect(mockGlobalUtils.auth.generateRefreshToken).toHaveBeenCalled();
            expect(mockPreUserSessionService.initializeSession).toHaveBeenCalledWith(
                user,
                refreshToken,
                true,
                'Mozilla/5.0',
                '192.168.1.1',
            );
            expect(mockUserSessionRepo.create).toHaveBeenCalledWith(sessionEntity);
            expect(mockLogger.info).toHaveBeenCalledWith(
                'Session created for user user-123: new-session',
            );
            expect(result).toEqual({
                accessToken,
                refreshToken,
            });
        });

        it('should generate session without optional parameters', async () => {
            const user = {
                id: 'user-456',
                role: { label: 'user' },
            } as UserEntity;

            const refreshToken = 'refresh-token';
            const sessionEntity = { id: 'session-1' } as UserSessionEntity;

            mockGlobalUtils.auth.generateRefreshToken.mockReturnValue(refreshToken);
            mockPreUserSessionService.initializeSession.mockReturnValue(sessionEntity);
            mockUserSessionRepo.create.mockResolvedValue(sessionEntity);
            mockPreUserSessionService.generateToken.mockReturnValue('access-token');

            await service.generateUserSession(user);

            expect(mockPreUserSessionService.initializeSession).toHaveBeenCalledWith(
                user,
                refreshToken,
                undefined,
                undefined,
                undefined,
            );
        });

        it('should handle rememberMe false', async () => {
            const user = {
                id: 'user-789',
                role: { label: 'user' },
            } as UserEntity;

            mockGlobalUtils.auth.generateRefreshToken.mockReturnValue('token');
            mockPreUserSessionService.initializeSession.mockReturnValue({} as any);
            mockUserSessionRepo.create.mockResolvedValue({} as any);
            mockPreUserSessionService.generateToken.mockReturnValue('access');

            await service.generateUserSession(user, false);

            expect(mockPreUserSessionService.initializeSession).toHaveBeenCalledWith(
                user,
                'token',
                false,
                undefined,
                undefined,
            );
        });
    });

    describe('getActiveSession', () => {
        it('should retrieve and validate active session', async () => {
            const refreshToken = 'valid-refresh-token';
            const hashedToken = 'hashed-token';
            const session = {
                id: 'session-123',
                user: { id: 'user-123', role: { label: 'user' } },
            } as UserSessionEntity;

            mockGlobalUtils.auth.hashToken.mockReturnValue(hashedToken);
            mockUserSessionRepo.findOne.mockResolvedValue(session);

            const result = await service.getActiveSession(refreshToken);

            expect(mockGlobalUtils.auth.hashToken).toHaveBeenCalledWith(refreshToken);
            expect(mockUserSessionRepo.findOne).toHaveBeenCalledWith({
                where: { refreshTokenHash: hashedToken },
                relations: ['user', 'user.role'],
            });
            expect(mockPreUserSessionService.ensureSessionNotRevoked).toHaveBeenCalledWith(session);
            expect(mockPreUserSessionService.ensureSessionIsValid).toHaveBeenCalledWith(session);
            expect(result).toBe(session);
        });

        it('should throw unauthorized when session not found', async () => {
            const refreshToken = 'invalid-token';
            const hashedToken = 'hashed-invalid';

            mockGlobalUtils.auth.hashToken.mockReturnValue(hashedToken);
            mockUserSessionRepo.findOne.mockResolvedValue(null);
            mockErrorHandlerService.unauthorized.mockImplementation(() => {
                throw new Error('Unauthorized');
            });

            await expect(service.getActiveSession(refreshToken)).rejects.toThrow();

            expect(mockErrorHandlerService.unauthorized).toHaveBeenCalledWith(
                expect.stringContaining('Session not found with token'),
                'Unauthorized, session corrupted',
            );
        });

        it('should handle different refresh tokens', async () => {
            const refreshToken = 'another-token';
            const hashedToken = 'hashed-another';
            const session = {
                id: 'session-456',
                user: { id: 'user-456', role: { label: 'admin' } },
            } as UserSessionEntity;

            mockGlobalUtils.auth.hashToken.mockReturnValue(hashedToken);
            mockUserSessionRepo.findOne.mockResolvedValue(session);

            const result = await service.getActiveSession(refreshToken);

            expect(result).toBe(session);
        });
    });

    describe('renewSession', () => {
        it('should renew session with new token and version', async () => {
            const session = {
                id: 'session-123',
                tokenVersion: 1,
            } as UserSessionEntity;

            const now = new Date('2024-01-15');
            const newRefreshToken = 'new-refresh-token';
            const hashedToken = 'hashed-new-token';

            mockGlobalUtils.auth.generateRefreshToken.mockReturnValue(newRefreshToken);
            mockGlobalUtils.auth.hashToken.mockReturnValue(hashedToken);
            mockPreUserSessionService.updateSession.mockResolvedValue(session);

            const result = await service.renewSession(session, now);

            expect(mockGlobalUtils.auth.generateRefreshToken).toHaveBeenCalled();
            expect(mockGlobalUtils.auth.hashToken).toHaveBeenCalledWith(newRefreshToken);
            expect(mockPreUserSessionService.updateSession).toHaveBeenCalledWith(session, {
                refreshTokenHash: hashedToken,
                tokenVersion: 2,
                lastActivityAt: now,
            });
            expect(result).toEqual({
                newSession: session,
                refreshToken: newRefreshToken,
            });
        });

        it('should increment token version correctly', async () => {
            const session = {
                id: 'session-456',
                tokenVersion: 5,
            } as UserSessionEntity;

            const now = new Date();
            mockGlobalUtils.auth.generateRefreshToken.mockReturnValue('token');
            mockGlobalUtils.auth.hashToken.mockReturnValue('hash');
            mockPreUserSessionService.updateSession.mockResolvedValue(session);

            await service.renewSession(session, now);

            expect(mockPreUserSessionService.updateSession).toHaveBeenCalledWith(
                session,
                expect.objectContaining({
                    tokenVersion: 6,
                }),
            );
        });
    });

    describe('revokeInactiveSession', () => {
        it('should not revoke session if inactive less than 2 days', async () => {
            const session = {
                id: 'session-123',
                lastActivityAt: new Date('2024-01-14T12:00:00'),
            } as UserSessionEntity;

            const now = new Date('2024-01-15T12:00:00');

            await service.revokeInactiveSession(session, now);

            expect(mockPreUserSessionService.updateSession).not.toHaveBeenCalled();
            expect(mockErrorHandlerService.unauthorized).not.toHaveBeenCalled();
        });

        it('should revoke session if inactive exactly 2 days', async () => {
            const session = {
                id: 'session-123',
                lastActivityAt: new Date('2024-01-13T12:00:00'),
            } as UserSessionEntity;

            const now = new Date('2024-01-15T12:00:01');

            mockErrorHandlerService.unauthorized.mockImplementation(() => {
                throw new Error('Unauthorized');
            });

            await expect(service.revokeInactiveSession(session, now)).rejects.toThrow();

            expect(mockPreUserSessionService.updateSession).toHaveBeenCalledWith(session, {
                revokedAt: now,
            });
        });

        it('should revoke session if inactive more than 2 days', async () => {
            const session = {
                id: 'session-123',
                lastActivityAt: new Date('2024-01-10'),
            } as UserSessionEntity;

            const now = new Date('2024-01-15');

            mockErrorHandlerService.unauthorized.mockImplementation(() => {
                throw new Error('Unauthorized');
            });

            await expect(service.revokeInactiveSession(session, now)).rejects.toThrow();

            expect(mockPreUserSessionService.updateSession).toHaveBeenCalledWith(session, {
                revokedAt: now,
            });
            expect(mockErrorHandlerService.unauthorized).toHaveBeenCalledWith(
                expect.stringContaining('User has been inactive for too long'),
                'Unauthorized, session corrupted',
            );
        });

        it('should calculate correct inactivity days', async () => {
            const session = {
                id: 'session-123',
                lastActivityAt: new Date('2024-01-01'),
            } as UserSessionEntity;

            const now = new Date('2024-01-08');

            mockErrorHandlerService.unauthorized.mockImplementation(() => {
                throw new Error('Unauthorized');
            });

            await expect(service.revokeInactiveSession(session, now)).rejects.toThrow();

            expect(mockErrorHandlerService.unauthorized).toHaveBeenCalledWith(
                expect.stringContaining('7 days'),
                'Unauthorized, session corrupted',
            );
        });
    });

    describe('renewAccessToken', () => {
        it('should renew access token successfully', async () => {
            const refreshToken = 'valid-refresh-token';
            const now = new Date();
            const recentActivity = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago

            const session = {
                id: 'session-123',
                tokenVersion: 1,
                lastActivityAt: recentActivity,
                user: {
                    id: 'user-123',
                    role: { label: 'admin' },
                },
            } as UserSessionEntity;

            const newSession = { ...session, tokenVersion: 2 };
            const newAccessToken = 'new-access-token';
            const newRefreshToken = 'new-refresh-token';

            mockGlobalUtils.auth.hashToken.mockReturnValue('hashed');
            mockUserSessionRepo.findOne.mockResolvedValue(session);
            mockGlobalUtils.auth.generateRefreshToken.mockReturnValue(newRefreshToken);
            mockPreUserSessionService.updateSession.mockResolvedValue(newSession);
            mockPreUserSessionService.generateToken.mockReturnValue(newAccessToken);

            const result = await service.renewAccessToken(refreshToken);

            expect(mockLogger.info).toHaveBeenCalledWith(
                'Renew access token by using the refresh token',
            );
            expect(result).toEqual({
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            });
        });

        it('should handle session renewal with different roles', async () => {
            const refreshToken = 'token';
            const now = new Date();
            const recentActivity = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12 hours ago

            const session = {
                id: 'session-456',
                tokenVersion: 3,
                lastActivityAt: recentActivity,
                user: {
                    id: 'user-456',
                    role: { label: 'user' },
                },
            } as UserSessionEntity;

            mockGlobalUtils.auth.hashToken.mockReturnValue('hash');
            mockUserSessionRepo.findOne.mockResolvedValue(session);
            mockGlobalUtils.auth.generateRefreshToken.mockReturnValue('new-token');
            mockPreUserSessionService.updateSession.mockResolvedValue(session);
            mockPreUserSessionService.generateToken.mockReturnValue('access');

            await service.renewAccessToken(refreshToken);

            expect(mockPreUserSessionService.generateToken).toHaveBeenCalledWith(
                session,
                'user',
                'user-456',
            );
        });

        it('should throw unauthorized when session inactive for more than 2 days', async () => {
            const refreshToken = 'old-token';
            const now = new Date();
            const oldActivity = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago

            const session = {
                id: 'session-789',
                tokenVersion: 1,
                lastActivityAt: oldActivity,
                user: {
                    id: 'user-789',
                    role: { label: 'user' },
                },
            } as UserSessionEntity;

            mockGlobalUtils.auth.hashToken.mockReturnValue('hash');
            mockUserSessionRepo.findOne.mockResolvedValue(session);
            mockPreUserSessionService.updateSession.mockResolvedValue(session);
            mockErrorHandlerService.unauthorized.mockImplementation(() => {
                throw new Error('Unauthorized');
            });

            await expect(service.renewAccessToken(refreshToken)).rejects.toThrow();

            expect(mockPreUserSessionService.updateSession).toHaveBeenCalledWith(session, {
                revokedAt: expect.any(Date),
            });
            expect(mockErrorHandlerService.unauthorized).toHaveBeenCalledWith(
                expect.stringContaining('User has been inactive for too long'),
                'Unauthorized, session corrupted',
            );
        });
    });

    describe('revokeSession', () => {
        it('should revoke a specific session successfully', async () => {
            const currentUser: CurrentUserInterface = {
                id: 'user-123',
                sessionId: 'current-session',
                role: 'user',
            } as any;

            const sessionToRevoke = {
                id: 'session-to-revoke',
                user: { id: 'user-123' },
            } as UserSessionEntity;

            mockPreUserSessionService.retrieveSessionByCriteria.mockResolvedValue(sessionToRevoke);
            mockPreUserSessionService.updateSession.mockResolvedValue(sessionToRevoke);

            const result = await service.revokeSession(currentUser, 'session-to-revoke');

            expect(mockLogger.info).toHaveBeenCalledWith(
                'Revoke a particular session for user user-123',
            );
            expect(mockPreUserSessionService.retrieveSessionByCriteria).toHaveBeenCalledWith({
                user: { id: 'user-123' },
                id: 'session-to-revoke',
                revokedAt: IsNull(),
            });
            expect(mockPreUserSessionService.updateSession).toHaveBeenCalledWith(sessionToRevoke, {
                revokedAt: expect.any(Date),
            });
            expect(result).toEqual({
                message: 'Session revoked successfully.',
            });
        });

        it('should handle different session IDs', async () => {
            const currentUser: CurrentUserInterface = {
                id: 'user-456',
                sessionId: 'current',
                role: 'admin',
            } as any;

            const sessionToRevoke = {
                id: 'another-session',
                user: { id: 'user-456' },
            } as UserSessionEntity;

            mockPreUserSessionService.retrieveSessionByCriteria.mockResolvedValue(sessionToRevoke);
            mockPreUserSessionService.updateSession.mockResolvedValue(sessionToRevoke);

            await service.revokeSession(currentUser, 'another-session');

            expect(mockPreUserSessionService.retrieveSessionByCriteria).toHaveBeenCalledWith({
                user: { id: 'user-456' },
                id: 'another-session',
                revokedAt: IsNull(),
            });
        });
    });

    describe('revokeAllSessions', () => {
        it('should revoke all sessions for a user', async () => {
            const currentUser: CurrentUserInterface = {
                id: 'user-123',
                sessionId: 'current-session',
                role: 'user',
            } as any;

            const sessions = [
                { id: 'session-1' },
                { id: 'session-2' },
                { id: 'session-3' },
            ] as UserSessionEntity[];

            mockUserSessionRepo.find.mockResolvedValue(sessions);
            mockPreUserSessionService.updateSession.mockResolvedValue({} as any);

            const result = await service.revokeAllSessions(currentUser);

            expect(mockLogger.info).toHaveBeenCalledWith('Revoke all sessions for user user-123');
            expect(mockUserSessionRepo.find).toHaveBeenCalledWith({
                where: {
                    user: { id: 'user-123' },
                    revokedAt: IsNull(),
                },
            });
            expect(mockPreUserSessionService.updateSession).toHaveBeenCalledTimes(3);
            expect(result).toEqual({
                message: 'All sessions revoked successfully.',
            });
        });

        it('should return message when no sessions found', async () => {
            const currentUser: CurrentUserInterface = {
                id: 'user-123',
                sessionId: 'current-session',
                role: 'user',
            } as any;

            mockUserSessionRepo.find.mockResolvedValue([]);

            const result = await service.revokeAllSessions(currentUser);

            expect(result).toEqual({
                message: 'No sessions found.',
            });
            expect(mockPreUserSessionService.updateSession).not.toHaveBeenCalled();
        });

        it('should handle single session', async () => {
            const currentUser: CurrentUserInterface = {
                id: 'user-789',
                sessionId: 'session-x',
                role: 'user',
            } as any;

            const sessions = [{ id: 'session-only' }] as UserSessionEntity[];

            mockUserSessionRepo.find.mockResolvedValue(sessions);
            mockPreUserSessionService.updateSession.mockResolvedValue({} as any);

            await service.revokeAllSessions(currentUser);

            expect(mockPreUserSessionService.updateSession).toHaveBeenCalledTimes(1);
        });
    });
});
