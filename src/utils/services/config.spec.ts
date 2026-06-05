import { Test, TestingModule } from '@nestjs/testing';
import { EnvConfigService } from './config';
import { ConfigUtils } from './tools';
import { ConfigService } from '@nestjs/config';

describe('EnvConfigService', () => {
    let service: EnvConfigService;
    let configService: ConfigService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ConfigUtils,
                EnvConfigService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => {
                            const mockEnv: Record<string, string> = {
                                PORT: '3000',
                                DB_HOST: 'localhost',
                                DB_NAME: 'test_db',
                                DB_USER: 'test_user',
                                DB_PASSWORD: 'secret',
                                DB_PORT: '5432',
                                STORAGE_TYPE: 'local',
                                MAX_SESSIONS_PER_USER: '5',
                                ACCESS_TOKEN_SECRET: 'test_secret',
                                ACCESS_TOKEN_EXPIRY: '15m',
                                USER_SESSION_EXPIRY: '30d',
                                SUPER_ADMIN_ROLE: 'SUPER_ADMIN',
                                ADMIN_ROLE: 'ADMIN',
                                USER_ROLE: 'USER',
                                GOOGLE_CLIENT_ID: 'test-google_clientId',
                                GOOGLE_CLIENT_SECRET: 'test-google_secret',
                                GOOGLE_CALLBACK_URL: 'test-google_clientId',
                                CRYPTO_SECRET: '111111111111111111111111111111111111111',
                                CRYPTO_IV: '2222222222222222222222222222',
                                MAIL_HOST: 'localhost',
                                MAIL_PORT: '5432',
                                MAIL_SECURE: 'true',
                                MAIL_USER: 'the-user',
                                MAIL_PASSWORD: 'the_password',
                                SENDGRID_API_KEY: 'send-api-key',
                                SENDGRID_FROM: 'sagbohan@gmail.com',
                                MAILER_TYPE: 'nodemailer',
                                FRONTEND_GOOGLE_AUTH_REDIRECT_URL: 'http://localhost:3000',
                                USER_RESET_PASSWORD_LINK: 'user-reset-password',
                                GC_FINANCES: 'Finances',
                                GC_R_ESTATE: 'Real Estate',
                                CACHE_MAX_ELEMENTS: '1',
                                CACHE_SEGMENT_SIZE: '2',
                                REDIS_CACHE_TTL_LONG: '3',
                                REDIS_CACHE_TTL_SHORT: '4',
                                USER_HELP_SUPPORT_LINK: 'user-help-support',
                                ADMIN_HELP_SUPPORT_LINK: 'admin-help-support',
                                CARD_SECRET: 'CARD_SECRET',
                            };

                            return mockEnv[key] || 'dummy_value';
                        }),
                    },
                },
            ],
        }).compile();

        service = module.get<EnvConfigService>(EnvConfigService);
        configService = module.get<ConfigService>(ConfigService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should load all config values correctly', () => {
        expect(service.port).toBe(3000);
        expect(service.dbHost).toBe('localhost');
        expect(service.dbPort).toBe(5432);
        expect(service.maxUserSession).toBe(5);
        expect(service.storageDriver).toBe('local');
        expect(service.sAdminRole).toBe('super_admin');
    });

    it('getConfig method should work via service', () => {
        expect(service.getConfig(configService, 'DB_HOST')).toBe('localhost');

        expect(service.getConfig(configService, 'PORT', { type: 'number' })).toBe(3000);

        expect(
            service.getConfig(configService, 'SUPER_ADMIN_ROLE', {
                normalize: true,
            }),
        ).toBe('super_admin');
    });

    it('should throw if required key is missing', () => {
        jest.spyOn(configService, 'get').mockReturnValueOnce(undefined);
        expect(() => service.getConfig(configService, 'MISSING_KEY')).toThrow(
            'Missing required configuration: MISSING_KEY',
        );
    });
});
