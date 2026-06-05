import { Test, TestingModule } from '@nestjs/testing';
import { PreUserSessionService } from './pre-user-session.service';
import { UserSessionService } from './user-session.service';
import { UserSessionEntity } from '../entities/user-session.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { IsNull } from 'typeorm';

describe('PreUserSessionService', () => {
    let service: PreUserSessionService;

    const mockErrorHandlerService = {
        unauthorized: jest.fn(),
        notFound: jest.fn(),
    };

    const mockEnvConfigService = {
        sessionMaxDurationDays: '90d',
        accessTokenSecret: 'test-secret',
        accessTokenExpiry: '15m',
        maxUserSession: 5,
    };

    const mockJwt = {
        sign: jest.fn(),
    };

    const mockGlobalUtils = {
        others: {
            formatCriteria: jest.fn((criteria) => JSON.stringify(criteria)),
        },
        auth: {
            hashToken: jest.fn((token) => `hashed_${token}`),
            parseDeviceName: jest.fn((userAgent) => userAgent || 'Unknown Device'),
        },
    };

    const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    };

    const mockUserSessionRepo = {
        findActiveOne: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        findOne: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PreUserSessionService,
                {
                    provide: UserSessionService,
                    useValue: {
                        errorHandlerService: mockErrorHandlerService,
                        envConfigService: mockEnvConfigService,
                        jwt: mockJwt,
                        globalUtils: mockGlobalUtils,
                        logger: mockLogger,
                        uSessionRepo: mockUserSessionRepo,
                    },
                },
            ],
        }).compile();

        service = module.get<PreUserSessionService>(PreUserSessionService);
        module.get(UserSessionService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('ensureSessionNotRevoked', () => {
        it('should not throw error when session is not revoked', () => {
            const session = {
                id: 'session-1',
                revokedAt: null,
            } as any;

            expect(() => service.ensureSessionNotRevoked(session)).not.toThrow();
            expect(mockErrorHandlerService.unauthorized).not.toHaveBeenCalled();
        });

        it('should not throw error when revokedAt is undefined', () => {
            const session = {
                id: 'session-1',
            } as UserSessionEntity;

            expect(() => service.ensureSessionNotRevoked(session)).not.toThrow();
            expect(mockErrorHandlerService.unauthorized).not.toHaveBeenCalled();
        });

        it('should throw unauthorized error when session is revoked', () => {
            const session = {
                id: 'session-1',
                revokedAt: new Date(),
            } as UserSessionEntity;

            mockErrorHandlerService.unauthorized.mockImplementation(() => {
                throw new Error('Unauthorized');
            });

            expect(() => service.ensureSessionNotRevoked(session)).toThrow();

            expect(mockErrorHandlerService.unauthorized).toHaveBeenCalledWith(
                'This session session-1 has been revoked',
                'Unauthorized, session corrupted',
            );
        });
    });

    describe('ensureSessionIsValid', () => {
        it('should not throw error when session is still valid', () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 10);

            const session = {
                id: 'session-1',
                expiredAt: futureDate,
            } as UserSessionEntity;

            expect(() => service.ensureSessionIsValid(session)).not.toThrow();
            expect(mockErrorHandlerService.unauthorized).not.toHaveBeenCalled();
        });

        it('should throw unauthorized error when session is expired', () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 10);

            const session = {
                id: 'session-1',
                expiredAt: pastDate,
            } as UserSessionEntity;

            mockErrorHandlerService.unauthorized.mockImplementation(() => {
                throw new Error('Unauthorized');
            });

            expect(() => service.ensureSessionIsValid(session)).toThrow();

            expect(mockErrorHandlerService.unauthorized).toHaveBeenCalledWith(
                'This session session-1 has expired',
                'Unauthorized, session corrupted',
            );
        });

        it('should throw error when session expired exactly now', () => {
            const now = new Date();
            // Set to 1ms in the past to ensure it's expired
            const expiredDate = new Date(now.getTime() - 1);

            const session = {
                id: 'session-2',
                expiredAt: expiredDate,
            } as UserSessionEntity;

            mockErrorHandlerService.unauthorized.mockImplementation(() => {
                throw new Error('Unauthorized');
            });

            expect(() => service.ensureSessionIsValid(session)).toThrow();
        });
    });

    describe('calculateSessionExpirationDate', () => {
        it('should add 90 days to the base date when rememberMe is false', () => {
            mockEnvConfigService.sessionMaxDurationDays = '90d';
            const baseDate = new Date('2024-01-01');
            const result = service.calculateSessionExpirationDate(baseDate, false);

            const expected = new Date('2024-01-01');
            expected.setDate(expected.getDate() + 90);

            expect(result).toEqual(expected);
        });

        it('should add 30 days when rememberMe is true', () => {
            const baseDate = new Date('2024-01-01');
            const result = service.calculateSessionExpirationDate(baseDate, true);

            const expected = new Date('2024-01-01');
            expected.setDate(expected.getDate() + 30);

            expect(result).toEqual(expected);
        });

        it('should handle different expiry configurations', () => {
            mockEnvConfigService.sessionMaxDurationDays = '60d';
            const baseDate = new Date('2024-01-01');
            const result = service.calculateSessionExpirationDate(baseDate);

            const expected = new Date('2024-01-01');
            expected.setDate(expected.getDate() + 60);

            expect(result).toEqual(expected);
        });

        it('should extract number from sessionMaxDurationDays with extra characters', () => {
            mockEnvConfigService.sessionMaxDurationDays = 'abc45days';
            const baseDate = new Date('2024-01-01');
            const result = service.calculateSessionExpirationDate(baseDate, false);

            const expected = new Date('2024-01-01');
            expected.setDate(expected.getDate() + 45);

            expect(result).toEqual(expected);
        });

        it('should handle rememberMe undefined (default to config value)', () => {
            mockEnvConfigService.sessionMaxDurationDays = '90d';
            const baseDate = new Date('2024-01-01');
            const result = service.calculateSessionExpirationDate(baseDate);

            const expected = new Date('2024-01-01');
            expected.setDate(expected.getDate() + 90);

            expect(result).toEqual(expected);
        });
    });

    describe('generateToken', () => {
        it('should generate a JWT token with correct payload', () => {
            const session = {
                id: 'session-123',
                tokenVersion: 1,
            } as UserSessionEntity;

            const mockToken = 'generated.jwt.token';
            mockJwt.sign.mockReturnValue(mockToken);

            const result = service.generateToken(session, 'user', 'user-456');

            expect(mockJwt.sign).toHaveBeenCalledWith(
                {
                    sub: 'user-456',
                    role: 'user',
                    sid: 'session-123',
                    ver: 1,
                    type: 'access',
                },
                {
                    secret: 'test-secret',
                    expiresIn: '15m',
                },
            );
            expect(result).toBe(mockToken);
        });

        it('should generate token with different roles', () => {
            const session = {
                id: 'session-456',
                tokenVersion: 2,
            } as UserSessionEntity;

            const mockToken = 'admin.jwt.token';
            mockJwt.sign.mockReturnValue(mockToken);

            const result = service.generateToken(session, 'admin', 'admin-789');

            expect(mockJwt.sign).toHaveBeenCalledWith(
                expect.objectContaining({
                    role: 'admin',
                    sub: 'admin-789',
                }),
                expect.any(Object),
            );
            expect(result).toBe(mockToken);
        });

        it('should generate token with different token versions', () => {
            const session = {
                id: 'session-789',
                tokenVersion: 5,
            } as UserSessionEntity;

            mockJwt.sign.mockReturnValue('token');

            service.generateToken(session, 'user', 'user-123');

            expect(mockJwt.sign).toHaveBeenCalledWith(
                expect.objectContaining({
                    ver: 5,
                }),
                expect.any(Object),
            );
        });
    });

    describe('retrieveSessionByCriteria', () => {
        it('should retrieve session successfully', async () => {
            const criteria = { id: 'session-1' };
            const mockSession = { id: 'session-1' } as UserSessionEntity;

            mockUserSessionRepo.findActiveOne.mockResolvedValue(mockSession);

            const result = await service.retrieveSessionByCriteria(criteria);

            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.stringContaining('Find a session by'),
            );
            expect(mockUserSessionRepo.findActiveOne).toHaveBeenCalledWith(
                mockUserSessionRepo,
                criteria,
                undefined,
            );
            expect(result).toBe(mockSession);
        });

        it('should throw not found error when session does not exist', async () => {
            const criteria = { id: 'non-existent' };

            mockUserSessionRepo.findActiveOne.mockResolvedValue(null);
            mockErrorHandlerService.notFound.mockImplementation(() => {
                throw new Error('Not Found');
            });

            await expect(service.retrieveSessionByCriteria(criteria)).rejects.toThrow();

            expect(mockErrorHandlerService.notFound).toHaveBeenCalledWith(
                expect.stringContaining('Data not found with'),
                'Data not found',
            );
        });

        it('should pass relations to repository', async () => {
            const criteria = { id: 'session-1' };
            const relations = ['user', 'device'];
            const mockSession = { id: 'session-1' } as UserSessionEntity;

            mockUserSessionRepo.findActiveOne.mockResolvedValue(mockSession);

            await service.retrieveSessionByCriteria(criteria, relations);

            expect(mockUserSessionRepo.findActiveOne).toHaveBeenCalledWith(
                mockUserSessionRepo,
                criteria,
                relations,
            );
        });

        it('should format criteria for logging', async () => {
            const criteria = { id: 'session-1', userId: 'user-123' };
            const mockSession = { id: 'session-1' } as UserSessionEntity;

            mockUserSessionRepo.findActiveOne.mockResolvedValue(mockSession);

            await service.retrieveSessionByCriteria(criteria);

            expect(mockGlobalUtils.others.formatCriteria).toHaveBeenCalledWith(criteria);
        });
    });

    describe('buildSessionEntity', () => {
        it('should build session entities with required fields only', () => {
            const user = { id: 'user-1' } as UserEntity;
            const now = new Date();

            const required = {
                refreshTokenHash: 'hash123',
                deviceName: 'Chrome',
                lastActivityAt: now,
                expiredAt: now,
                user,
            };

            const result = service.buildSessionEntity(required);

            expect(result).toBeInstanceOf(UserSessionEntity);
            expect(result.refreshTokenHash).toBe('hash123');
            expect(result.deviceName).toBe('Chrome');
            expect(result.user).toBe(user);
            expect(result.lastActivityAt).toBe(now);
            expect(result.expiredAt).toBe(now);
        });

        it('should build session entities with optional fields', () => {
            const user = { id: 'user-1' } as UserEntity;
            const now = new Date();

            const required = {
                refreshTokenHash: 'hash123',
                deviceName: 'Chrome',
                lastActivityAt: now,
                expiredAt: now,
                user,
            };

            const optional = {
                revokedAt: new Date(),
                ipAddress: '192.168.1.1',
                userAgent: 'Mozilla/5.0',
            };

            const result = service.buildSessionEntity(required, optional);

            expect(result.ipAddress).toBe('192.168.1.1');
            expect(result.userAgent).toBe('Mozilla/5.0');
            expect(result.revokedAt).toEqual(optional.revokedAt);
        });

        it('should build session entities without optional parameter', () => {
            const user = { id: 'user-2' } as UserEntity;
            const now = new Date();

            const required = {
                refreshTokenHash: 'hash456',
                deviceName: 'Firefox',
                lastActivityAt: now,
                expiredAt: now,
                user,
            };

            const result = service.buildSessionEntity(required);

            expect(result).toBeInstanceOf(UserSessionEntity);
            expect(result.refreshTokenHash).toBe('hash456');
        });
    });

    describe('initializeSession', () => {
        it('should initialize a new session with all fields', () => {
            const user = { id: 'user-1' } as UserEntity;
            const refreshToken = 'refresh-token-123';
            const userAgent = 'Mozilla/5.0';
            const ipAddress = '192.168.1.1';

            const result = service.initializeSession(
                user,
                refreshToken,
                false,
                userAgent,
                ipAddress,
            );

            expect(result).toBeInstanceOf(UserSessionEntity);
            expect(result.refreshTokenHash).toBe('hashed_refresh-token-123');
            expect(result.deviceName).toBe(userAgent);
            expect(result.ipAddress).toBe(ipAddress);
            expect(result.userAgent).toBe(userAgent);
            expect(result.user).toBe(user);
            expect(result.lastActivityAt).toBeInstanceOf(Date);
            expect(result.expiredAt).toBeInstanceOf(Date);

            expect(mockGlobalUtils.auth.hashToken).toHaveBeenCalledWith(refreshToken);
            expect(mockGlobalUtils.auth.parseDeviceName).toHaveBeenCalledWith(userAgent);
        });

        it('should initialize session without optional parameters', () => {
            const user = { id: 'user-1' } as UserEntity;
            const refreshToken = 'refresh-token-123';

            const result = service.initializeSession(user, refreshToken);

            expect(result).toBeInstanceOf(UserSessionEntity);
            expect(result.refreshTokenHash).toBe('hashed_refresh-token-123');
            expect(result.user).toBe(user);
            expect(result.ipAddress).toBeUndefined();
            expect(result.userAgent).toBeUndefined();
        });

        it('should initialize session with rememberMe true', () => {
            const user = { id: 'user-2' } as UserEntity;
            const refreshToken = 'refresh-token-456';

            const result = service.initializeSession(
                user,
                refreshToken,
                true,
                'Safari/1.0',
                '10.0.0.1',
            );

            expect(result).toBeInstanceOf(UserSessionEntity);
            // expiredAt should be 30 days from now when rememberMe is true
            const expectedDate = new Date();
            expectedDate.setDate(expectedDate.getDate() + 30);

            // Allow 1 second difference for test execution time
            const timeDiff = Math.abs(result.expiredAt.getTime() - expectedDate.getTime());
            expect(timeDiff).toBeLessThan(1000);
        });

        it('should use default device name when userAgent is not provided', () => {
            const user = { id: 'user-3' } as UserEntity;
            const refreshToken = 'refresh-token-789';

            mockGlobalUtils.auth.parseDeviceName.mockReturnValue('Unknown Device');

            const result = service.initializeSession(user, refreshToken, false);

            expect(result.deviceName).toBe('Unknown Device');
        });
    });

    describe('updateSession', () => {
        it('should return session when no updates provided', async () => {
            const session = { id: 'session-1' } as UserSessionEntity;

            const result = await service.updateSession(session);

            expect(result).toBe(session);
            expect(mockUserSessionRepo.update).not.toHaveBeenCalled();
        });

        it('should return session when empty updates object provided', async () => {
            const session = { id: 'session-1' } as UserSessionEntity;

            const result = await service.updateSession(session, {});

            expect(result).toBe(session);
            expect(mockUserSessionRepo.update).not.toHaveBeenCalled();
        });

        it('should return session when updates is undefined', async () => {
            const session = { id: 'session-1' } as UserSessionEntity;

            const result = await service.updateSession(session, undefined);

            expect(result).toBe(session);
            expect(mockUserSessionRepo.update).not.toHaveBeenCalled();
        });

        it('should update string fields', async () => {
            const session = { id: 'session-1' } as UserSessionEntity;
            const updatedSession = {
                id: 'session-1',
                deviceName: 'Firefox',
            } as UserSessionEntity;
            const updates = {
                refreshTokenHash: 'new-hash',
                deviceName: 'Firefox',
                ipAddress: '10.0.0.1',
                userAgent: 'New User Agent',
            };

            mockUserSessionRepo.update.mockResolvedValue(updatedSession);

            const result = await service.updateSession(session, updates);

            expect(mockUserSessionRepo.update).toHaveBeenCalledWith({ id: 'session-1' }, updates);
            expect(result).toBe(updatedSession);
        });

        it('should update date and number fields', async () => {
            const session = { id: 'session-1' } as UserSessionEntity;
            const updatedSession = { id: 'session-1' } as UserSessionEntity;
            const now = new Date();
            const updates = {
                lastActivityAt: now,
                expiredAt: now,
                revokedAt: now,
                tokenVersion: 2,
            };

            mockUserSessionRepo.update.mockResolvedValue(updatedSession);

            const result = await service.updateSession(session, updates);

            expect(mockUserSessionRepo.update).toHaveBeenCalledWith({ id: 'session-1' }, updates);
            expect(result).toBe(updatedSession);
        });

        it('should ignore empty string fields', async () => {
            const session = { id: 'session-1' } as UserSessionEntity;
            const updatedSession = { id: 'session-1' } as UserSessionEntity;
            const updates = {
                refreshTokenHash: '  ',
                deviceName: 'Firefox',
            };

            mockUserSessionRepo.update.mockResolvedValue(updatedSession);

            await service.updateSession(session, updates);

            expect(mockUserSessionRepo.update).toHaveBeenCalledWith(
                { id: 'session-1' },
                { deviceName: 'Firefox' },
            );
        });

        it('should trim string fields', async () => {
            const session = { id: 'session-1' } as UserSessionEntity;
            const updatedSession = { id: 'session-1' } as UserSessionEntity;
            const updates = {
                refreshTokenHash: '  hash  ',
                deviceName: '  Chrome  ',
                ipAddress: '  192.168.1.1  ',
                userAgent: '  Mozilla  ',
            };

            mockUserSessionRepo.update.mockResolvedValue(updatedSession);

            await service.updateSession(session, updates);

            expect(mockUserSessionRepo.update).toHaveBeenCalledWith(
                { id: 'session-1' },
                {
                    refreshTokenHash: 'hash',
                    deviceName: 'Chrome',
                    ipAddress: '192.168.1.1',
                    userAgent: 'Mozilla',
                },
            );
        });

        it('should update mixed fields', async () => {
            const session = { id: 'session-1' } as UserSessionEntity;
            const updatedSession = { id: 'session-1' } as UserSessionEntity;
            const now = new Date();
            const updates = {
                deviceName: 'Safari',
                tokenVersion: 3,
                lastActivityAt: now,
            };

            mockUserSessionRepo.update.mockResolvedValue(updatedSession);

            await service.updateSession(session, updates);

            expect(mockUserSessionRepo.update).toHaveBeenCalledWith(
                { id: 'session-1' },
                {
                    deviceName: 'Safari',
                    tokenVersion: 3,
                    lastActivityAt: now,
                },
            );
        });
    });

    describe('userSessions', () => {
        it('should return count of active user sessions', async () => {
            const user = { id: 'user-1' } as UserEntity;
            mockUserSessionRepo.count.mockResolvedValue(3);

            const result = await service.userSessions(user);

            expect(result).toBe(3);
            expect(mockUserSessionRepo.count).toHaveBeenCalledWith({
                where: {
                    revokedAt: IsNull(),
                    deleted: false,
                    user: { id: 'user-1' },
                },
            });
        });

        it('should return 0 when no active sessions', async () => {
            const user = { id: 'user-2' } as UserEntity;
            mockUserSessionRepo.count.mockResolvedValue(0);

            const result = await service.userSessions(user);

            expect(result).toBe(0);
        });

        it('should count sessions for different users', async () => {
            const user1 = { id: 'user-1' } as UserEntity;
            const user2 = { id: 'user-2' } as UserEntity;

            mockUserSessionRepo.count.mockResolvedValueOnce(5).mockResolvedValueOnce(2);

            const result1 = await service.userSessions(user1);
            const result2 = await service.userSessions(user2);

            expect(result1).toBe(5);
            expect(result2).toBe(2);
        });
    });

    describe('revokeOldSession', () => {
        it('should not revoke session when below max limit', async () => {
            const user = { id: 'user-1' } as UserEntity;
            mockUserSessionRepo.count.mockResolvedValue(3);

            await service.revokeOldSession(user);

            expect(mockUserSessionRepo.findOne).not.toHaveBeenCalled();
            expect(mockUserSessionRepo.update).not.toHaveBeenCalled();
        });

        it('should revoke oldest session when at max limit', async () => {
            const user = { id: 'user-1' } as UserEntity;
            const oldestSession = {
                id: 'old-session',
                lastActivityAt: new Date('2024-01-01'),
            } as UserSessionEntity;

            mockUserSessionRepo.count.mockResolvedValue(5);
            mockUserSessionRepo.findOne.mockResolvedValue(oldestSession);
            mockUserSessionRepo.update.mockResolvedValue(oldestSession);

            await service.revokeOldSession(user);

            expect(mockUserSessionRepo.findOne).toHaveBeenCalledWith({
                where: {
                    user: { id: 'user-1' },
                    revokedAt: IsNull(),
                    deleted: false,
                },
                order: { lastActivityAt: 'ASC' },
            });

            expect(mockLogger.info).toHaveBeenCalledWith(
                'Revoking oldest session old-session for user user-1',
            );

            expect(mockUserSessionRepo.update).toHaveBeenCalledWith(
                { id: 'old-session' },
                expect.objectContaining({
                    revokedAt: expect.any(Date),
                }),
            );
        });

        it('should revoke oldest session when exceeding max limit', async () => {
            const user = { id: 'user-2' } as UserEntity;
            const oldestSession = {
                id: 'oldest-session',
                lastActivityAt: new Date('2023-12-01'),
            } as UserSessionEntity;

            mockUserSessionRepo.count.mockResolvedValue(7);
            mockUserSessionRepo.findOne.mockResolvedValue(oldestSession);
            mockUserSessionRepo.update.mockResolvedValue(oldestSession);

            await service.revokeOldSession(user);

            expect(mockUserSessionRepo.findOne).toHaveBeenCalled();
            expect(mockUserSessionRepo.update).toHaveBeenCalled();
        });

        it('should handle case when no oldest session found', async () => {
            const user = { id: 'user-1' } as UserEntity;

            mockUserSessionRepo.count.mockResolvedValue(5);
            mockUserSessionRepo.findOne.mockResolvedValue(null);

            await service.revokeOldSession(user);

            expect(mockUserSessionRepo.update).not.toHaveBeenCalled();
            expect(mockLogger.info).not.toHaveBeenCalled();
        });

        it('should handle case when exactly at max limit', async () => {
            const user = { id: 'user-3' } as UserEntity;
            const oldestSession = {
                id: 'session-to-revoke',
                lastActivityAt: new Date('2024-01-15'),
            } as UserSessionEntity;

            mockEnvConfigService.maxUserSession = 5;
            mockUserSessionRepo.count.mockResolvedValue(5);
            mockUserSessionRepo.findOne.mockResolvedValue(oldestSession);
            mockUserSessionRepo.update.mockResolvedValue(oldestSession);

            await service.revokeOldSession(user);

            expect(mockUserSessionRepo.findOne).toHaveBeenCalled();
            expect(mockUserSessionRepo.update).toHaveBeenCalledWith(
                { id: 'session-to-revoke' },
                expect.objectContaining({
                    revokedAt: expect.any(Date),
                }),
            );
        });
    });
});
