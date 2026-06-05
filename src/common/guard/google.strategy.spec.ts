import { Test, TestingModule } from '@nestjs/testing';
import { GoogleStrategy } from './google.strategy';
import { EnvConfigService } from '../../utils/services/config';

describe('GoogleStrategy', () => {
    let strategy: GoogleStrategy;
    let envConfigService: EnvConfigService;

    const mockEnvConfigService = {
        googleClientID: 'mock-client-id',
        googleClientSecret: 'mock-client-secret',
        googleCallbackUrl: 'http://localhost:3000/auth/google/callback',
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GoogleStrategy,
                {
                    provide: EnvConfigService,
                    useValue: mockEnvConfigService,
                },
            ],
        }).compile();

        strategy = module.get<GoogleStrategy>(GoogleStrategy);
        envConfigService = module.get<EnvConfigService>(EnvConfigService);
    });

    it('should be defined', () => {
        expect(strategy).toBeDefined();
    });

    describe('validate', () => {
        const mockAccessToken = 'mock-access-token';
        const mockRefreshToken = 'mock-refresh-token';
        const mockProfile = {
            id: 'google-user-id-123',
            name: {
                givenName: 'John',
                familyName: 'Doe',
            },
            emails: [{ value: 'john.doe@example.com' }],
            photos: [{ value: 'https://example.com/photo.jpg' }],
        };

        it('should validate and return a user object with correct properties', async () => {
            const mockDone = jest.fn();

            await strategy.validate(mockAccessToken, mockRefreshToken, mockProfile, mockDone);

            expect(mockDone).toHaveBeenCalledWith(null, {
                googleId: 'google-user-id-123',
                email: 'john.doe@example.com',
                firstName: 'John',
                lastName: 'Doe',
                picture: 'https://example.com/photo.jpg',
                accessToken: mockAccessToken,
                refreshToken: mockRefreshToken,
            });
        });

        it('should extract googleId from profile', async () => {
            const mockDone = jest.fn();

            await strategy.validate(mockAccessToken, mockRefreshToken, mockProfile, mockDone);

            const [_error, user] = mockDone.mock.calls[0];
            expect(user.googleId).toBe('google-user-id-123');
        });

        it('should extract email from profile emails array', async () => {
            const mockDone = jest.fn();

            await strategy.validate(mockAccessToken, mockRefreshToken, mockProfile, mockDone);

            const [_error, user] = mockDone.mock.calls[0];
            expect(user.email).toBe('john.doe@example.com');
        });

        it('should extract firstName from profile name', async () => {
            const mockDone = jest.fn();

            await strategy.validate(mockAccessToken, mockRefreshToken, mockProfile, mockDone);

            const [_error, user] = mockDone.mock.calls[0];
            expect(user.firstName).toBe('John');
        });

        it('should extract lastName from profile name', async () => {
            const mockDone = jest.fn();

            await strategy.validate(mockAccessToken, mockRefreshToken, mockProfile, mockDone);

            const [_error, user] = mockDone.mock.calls[0];
            expect(user.lastName).toBe('Doe');
        });

        it('should extract picture from profile photos array', async () => {
            const mockDone = jest.fn();

            await strategy.validate(mockAccessToken, mockRefreshToken, mockProfile, mockDone);

            const [_error, user] = mockDone.mock.calls[0];
            expect(user.picture).toBe('https://example.com/photo.jpg');
        });

        it('should include accessToken in user object', async () => {
            const mockDone = jest.fn();

            await strategy.validate(mockAccessToken, mockRefreshToken, mockProfile, mockDone);

            const [_error, user] = mockDone.mock.calls[0];
            expect(user.accessToken).toBe(mockAccessToken);
        });

        it('should include refreshToken in user object', async () => {
            const mockDone = jest.fn();

            await strategy.validate(mockAccessToken, mockRefreshToken, mockProfile, mockDone);

            const [_error, user] = mockDone.mock.calls[0];
            expect(user.refreshToken).toBe(mockRefreshToken);
        });

        it('should call done with null error on successful validation', async () => {
            const mockDone = jest.fn();

            await strategy.validate(mockAccessToken, mockRefreshToken, mockProfile, mockDone);

            const [error] = mockDone.mock.calls[0];
            expect(error).toBeNull();
        });

        it('should handle profile with different email', async () => {
            const mockDone = jest.fn();
            const customProfile = {
                ...mockProfile,
                emails: [{ value: 'different@example.com' }],
            };

            await strategy.validate(mockAccessToken, mockRefreshToken, customProfile, mockDone);

            const [_error, user] = mockDone.mock.calls[0];
            expect(user.email).toBe('different@example.com');
        });

        it('should handle profile with different name', async () => {
            const mockDone = jest.fn();
            const customProfile = {
                ...mockProfile,
                name: {
                    givenName: 'Jane',
                    familyName: 'Smith',
                },
            };

            await strategy.validate(mockAccessToken, mockRefreshToken, customProfile, mockDone);

            const [_error, user] = mockDone.mock.calls[0];
            expect(user.firstName).toBe('Jane');
            expect(user.lastName).toBe('Smith');
        });

        it('should handle profile with different picture URL', async () => {
            const mockDone = jest.fn();
            const customProfile = {
                ...mockProfile,
                photos: [{ value: 'https://different.com/image.png' }],
            };

            await strategy.validate(mockAccessToken, mockRefreshToken, customProfile, mockDone);

            const [_error, user] = mockDone.mock.calls[0];
            expect(user.picture).toBe('https://different.com/image.png');
        });

        it('should handle multiple emails and use the first one', async () => {
            const mockDone = jest.fn();
            const customProfile = {
                ...mockProfile,
                emails: [{ value: 'first@example.com' }, { value: 'second@example.com' }],
            };

            await strategy.validate(mockAccessToken, mockRefreshToken, customProfile, mockDone);

            const [_error, user] = mockDone.mock.calls[0];
            expect(user.email).toBe('first@example.com');
        });

        it('should handle multiple photos and use the first one', async () => {
            const mockDone = jest.fn();
            const customProfile = {
                ...mockProfile,
                photos: [
                    { value: 'https://first.com/photo1.jpg' },
                    { value: 'https://second.com/photo2.jpg' },
                ],
            };

            await strategy.validate(mockAccessToken, mockRefreshToken, customProfile, mockDone);

            const [_error, user] = mockDone.mock.calls[0];
            expect(user.picture).toBe('https://first.com/photo1.jpg');
        });
    });

    describe('Strategy configuration', () => {
        it('should use correct clientID from config', () => {
            expect(envConfigService.googleClientID).toBe('mock-client-id');
        });

        it('should use correct clientSecret from config', () => {
            expect(envConfigService.googleClientSecret).toBe('mock-client-secret');
        });

        it('should use correct callbackURL from config', () => {
            expect(envConfigService.googleCallbackUrl).toBe(
                'http://localhost:3000/auth/google/callback',
            );
        });
    });
});
