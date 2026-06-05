import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { UsersService } from '../services';
import { CurrentUserInterface } from '../../../interface';
import { Response } from 'express';
import { FieldDto } from '../../../common/dto';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('AuthController', () => {
    let controller: AuthController;
    let usersService: any;

    const mockCurrentUser: CurrentUserInterface = {
        id: 'user-123',
        email: 'test@example.com',
        sessionId: 'session-123',
    } as any;

    const mockRequest = {
        user: {
            email: 'google@example.com',
            firstName: 'John',
            lastName: 'Doe',
            picture: 'https://example.com/photo.jpg',
        },
        headers: {
            'user-agent': 'Mozilla/5.0',
            'x-forwarded-for': '192.168.1.1',
        },
        ip: '127.0.0.1',
    };

    const mockResponse = {
        redirect: jest.fn(),
    } as unknown as Response;

    beforeEach(async () => {
        const mockLogger = {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
        };

        const mockAuthService = {
            renewAccessToken: jest.fn(),
            getActiveSessionsForUser: jest.fn(),
            revokeSession: jest.fn(),
            revokeAllSessions: jest.fn(),
        };

        const mockEnvConfigService = {
            googleFrontEndpoint: 'https://example.com/auth/callback?',
        };

        const mockUsersService = {
            logger: mockLogger,
            authService: mockAuthService,
            envConfigService: mockEnvConfigService,
            authenticateWithGoogle: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: UsersService,
                    useValue: mockUsersService,
                },
            ],
        }).compile();

        controller = module.get<AuthController>(AuthController);
        usersService = module.get(UsersService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getClientIp', () => {
        it('should return first IP from x-forwarded-for array', () => {
            const req = {
                headers: { 'x-forwarded-for': ['192.168.1.1', '10.0.0.1'] },
                ip: '127.0.0.1',
            };

            const result = controller.getClientIp(req);

            expect(result).toBe('192.168.1.1');
        });

        it('should return first IP from x-forwarded-for string', () => {
            const req = {
                headers: {
                    'x-forwarded-for': '192.168.1.1, 10.0.0.1, 172.16.0.1',
                },
                ip: '127.0.0.1',
            };

            const result = controller.getClientIp(req);

            expect(result).toBe('192.168.1.1');
        });

        it('should trim whitespace from forwarded IP', () => {
            const req = {
                headers: { 'x-forwarded-for': '  192.168.1.1  , 10.0.0.1' },
                ip: '127.0.0.1',
            };

            const result = controller.getClientIp(req);

            expect(result).toBe('192.168.1.1');
        });

        it('should return req.ip when x-forwarded-for is not present', () => {
            const req = {
                headers: {},
                ip: '127.0.0.1',
            };

            const result = controller.getClientIp(req);

            expect(result).toBe('127.0.0.1');
        });

        it('should return undefined when no IP is available', () => {
            const req = {
                headers: {},
            };

            const result = controller.getClientIp(req);

            expect(result).toBeUndefined();
        });
    });

    describe('googleAuth', () => {
        it('should log the start of google auth service', async () => {
            await controller.googleAuth();

            expect(usersService.logger.info).toHaveBeenCalledWith('Starting google auth service');
        });
    });

    describe('googleAuthRedirect', () => {
        it('should authenticate with google and redirect with tokens', async () => {
            const tokens = {
                accessToken: 'access-token-123',
                refreshToken: 'refresh-token-456',
            };

            usersService.authenticateWithGoogle.mockResolvedValue(tokens);

            await controller.googleAuthRedirect(mockRequest, mockResponse);

            expect(usersService.authenticateWithGoogle).toHaveBeenCalledWith(
                mockRequest.user,
                'Mozilla/5.0',
                '192.168.1.1',
            );

            expect(mockResponse.redirect).toHaveBeenCalledWith(
                'https://example.com/auth/callback?accessToken=access-token-123&refreshToken=refresh-token-456',
            );
        });

        it('should use req.ip when x-forwarded-for is not present', async () => {
            const reqWithoutForwarded = {
                user: mockRequest.user,
                headers: {
                    'user-agent': 'Chrome/1.0',
                },
                ip: '127.0.0.1',
            };

            const tokens = {
                accessToken: 'access-token-789',
                refreshToken: 'refresh-token-012',
            };

            usersService.authenticateWithGoogle.mockResolvedValue(tokens);

            await controller.googleAuthRedirect(reqWithoutForwarded, mockResponse);

            expect(usersService.authenticateWithGoogle).toHaveBeenCalledWith(
                mockRequest.user,
                'Chrome/1.0',
                '127.0.0.1',
            );
        });

        it('should handle x-forwarded-for as array', async () => {
            const reqWithArrayForwarded = {
                user: mockRequest.user,
                headers: {
                    'user-agent': 'Safari/1.0',
                    'x-forwarded-for': ['10.0.0.5', '172.16.0.1'],
                },
                ip: '127.0.0.1',
            };

            const tokens = {
                accessToken: 'access-token-abc',
                refreshToken: 'refresh-token-def',
            };

            usersService.authenticateWithGoogle.mockResolvedValue(tokens);

            await controller.googleAuthRedirect(reqWithArrayForwarded, mockResponse);

            expect(usersService.authenticateWithGoogle).toHaveBeenCalledWith(
                mockRequest.user,
                'Safari/1.0',
                '10.0.0.5',
            );
        });

        it('should handle x-forwarded-for as comma-separated string', async () => {
            const reqWithStringForwarded = {
                user: mockRequest.user,
                headers: {
                    'user-agent': 'Firefox/1.0',
                    'x-forwarded-for': '192.168.10.10, 10.0.0.1',
                },
                ip: '127.0.0.1',
            };

            const tokens = {
                accessToken: 'access-token-xyz',
                refreshToken: 'refresh-token-uvw',
            };

            usersService.authenticateWithGoogle.mockResolvedValue(tokens);

            await controller.googleAuthRedirect(reqWithStringForwarded, mockResponse);

            expect(usersService.authenticateWithGoogle).toHaveBeenCalledWith(
                mockRequest.user,
                'Firefox/1.0',
                '192.168.10.10',
            );
        });
    });

    describe('refreshToken', () => {
        it('should refresh access token successfully', async () => {
            const dto: FieldDto = {
                field: 'refresh-token-123',
            };

            const newTokens = {
                accessToken: 'new-access-token',
            };

            usersService.authService.renewAccessToken.mockResolvedValue(newTokens);

            const result = await controller.refreshToken(dto);

            expect(usersService.authService.renewAccessToken).toHaveBeenCalledWith(
                'refresh-token-123',
            );
            expect(result).toEqual(newTokens);
        });

        it('should handle different refresh tokens', async () => {
            const dto: FieldDto = {
                field: 'different-refresh-token',
            };

            const newTokens = {
                accessToken: 'another-access-token',
            };

            usersService.authService.renewAccessToken.mockResolvedValue(newTokens);

            const result = await controller.refreshToken(dto);

            expect(usersService.authService.renewAccessToken).toHaveBeenCalledWith(
                'different-refresh-token',
            );
            expect(result).toEqual(newTokens);
        });
    });

    describe('activeSessions', () => {
        it('should return all active sessions for user', async () => {
            const mockSessions = [
                {
                    id: 'session-1',
                    userAgent: 'Chrome/1.0',
                    ipAddress: '192.168.1.1',
                    createdAt: new Date(),
                },
                {
                    id: 'session-2',
                    userAgent: 'Firefox/1.0',
                    ipAddress: '192.168.1.2',
                    createdAt: new Date(),
                },
            ];

            usersService.authService.getActiveSessionsForUser.mockResolvedValue(mockSessions);

            const result = await controller.activeSessions(mockCurrentUser);

            expect(usersService.authService.getActiveSessionsForUser).toHaveBeenCalledWith(
                mockCurrentUser,
            );
            expect(result).toEqual(mockSessions);
        });

        it('should return empty array when no active sessions', async () => {
            usersService.authService.getActiveSessionsForUser.mockResolvedValue([]);

            const result = await controller.activeSessions(mockCurrentUser);

            expect(result).toEqual([]);
        });

        it('should handle different users', async () => {
            const anotherUser: CurrentUserInterface = {
                id: 'user-456',
                email: 'another@example.com',
                sessionId: 'session-456',
            } as any;

            const mockSessions = [
                {
                    id: 'session-3',
                    userAgent: 'Safari/1.0',
                    ipAddress: '10.0.0.1',
                    createdAt: new Date(),
                },
            ];

            usersService.authService.getActiveSessionsForUser.mockResolvedValue(mockSessions);

            const result = await controller.activeSessions(anotherUser);

            expect(usersService.authService.getActiveSessionsForUser).toHaveBeenCalledWith(
                anotherUser,
            );
            expect(result).toEqual(mockSessions);
        });
    });

    describe('revokeSession', () => {
        it('should revoke a specific session', async () => {
            const sessionId = 'session-to-revoke';
            const mockResponse = {
                message: 'Session revoked successfully',
            };

            usersService.authService.revokeSession.mockResolvedValue(mockResponse);

            const result = await controller.revokeSession(mockCurrentUser, sessionId);

            expect(usersService.authService.revokeSession).toHaveBeenCalledWith(
                mockCurrentUser,
                sessionId,
            );
            expect(result).toEqual(mockResponse);
        });

        it('should handle different session IDs', async () => {
            const sessionId = 'another-session-id';
            const mockResponse = {
                message: 'Session revoked successfully',
            };

            usersService.authService.revokeSession.mockResolvedValue(mockResponse);

            const result = await controller.revokeSession(mockCurrentUser, sessionId);

            expect(usersService.authService.revokeSession).toHaveBeenCalledWith(
                mockCurrentUser,
                sessionId,
            );
            expect(result).toEqual(mockResponse);
        });

        it('should revoke session for different users', async () => {
            const anotherUser: CurrentUserInterface = {
                id: 'user-789',
                email: 'user789@example.com',
                sessionId: 'session-789',
            } as any;

            const sessionId = 'session-xyz';
            const mockResponse = {
                message: 'Session revoked successfully',
            };

            usersService.authService.revokeSession.mockResolvedValue(mockResponse);

            await controller.revokeSession(anotherUser, sessionId);

            expect(usersService.authService.revokeSession).toHaveBeenCalledWith(
                anotherUser,
                sessionId,
            );
        });
    });

    describe('revokeSessions', () => {
        it('should revoke all sessions for user', async () => {
            const mockResponse = {
                message: 'All sessions revoked successfully',
                count: 3,
            };

            usersService.authService.revokeAllSessions.mockResolvedValue(mockResponse);

            const result = await controller.revokeSessions(mockCurrentUser);

            expect(usersService.authService.revokeAllSessions).toHaveBeenCalledWith(
                mockCurrentUser,
            );
            expect(result).toEqual(mockResponse);
        });

        it('should handle revoking sessions for different users', async () => {
            const anotherUser: CurrentUserInterface = {
                id: 'user-999',
                email: 'user999@example.com',
                sessionId: 'session-999',
            } as any;

            const mockResponse = {
                message: 'All sessions revoked successfully',
                count: 5,
            };

            usersService.authService.revokeAllSessions.mockResolvedValue(mockResponse);

            const result = await controller.revokeSessions(anotherUser);

            expect(usersService.authService.revokeAllSessions).toHaveBeenCalledWith(anotherUser);
            expect(result).toEqual(mockResponse);
        });

        it('should handle case when no sessions to revoke', async () => {
            const mockResponse = {
                message: 'No active sessions to revoke',
                count: 0,
            };

            usersService.authService.revokeAllSessions.mockResolvedValue(mockResponse);

            const result = await controller.revokeSessions(mockCurrentUser);

            expect(result).toEqual(mockResponse);
        });
    });
});
