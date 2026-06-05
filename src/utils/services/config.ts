import { ConfigService } from '@nestjs/config';
import { Global, Injectable } from '@nestjs/common';
import { ConfigUtils } from './tools';

@Global()
@Injectable()
export class EnvConfigService {
    readonly getConfig: any;
    readonly port: number;

    readonly dbHost: string;
    readonly dbName: string;
    readonly dbUser: string;
    readonly dbPassword?: string;
    readonly dbPort: number;

    readonly storageDriver: string;

    readonly maxUserSession: number;
    readonly accessTokenSecret: string;
    readonly accessTokenExpiry: any;
    readonly sessionMaxDurationDays: any;

    readonly googleClientID: string;
    readonly googleClientSecret: string;
    readonly googleCallbackUrl: string;

    readonly cryptoSecret: string;
    readonly cryptoIv: string;

    readonly stagingPassword: string;

    readonly sAdminRole: string;
    readonly adminRole: string;
    readonly userRole: string;
    readonly supportRole: string;

    readonly mailType: string;

    readonly mailHost: string;
    readonly mailPort: string;
    readonly mailSecure: string;
    readonly mailUser: string;
    readonly mailPassword: string;

    readonly sendgridApiKey: string;
    readonly sendgridFrom: string;

    readonly googleFrontEndpoint: string;
    readonly userResetPasswordLink: string;
    readonly adminResetPasswordLink: string;
    readonly userSupportLink: string;
    readonly adminSupportLink: string;
    readonly dashboardLink: string;
    readonly subFailedLink: string;

    readonly gCFinance: string;
    readonly gCREstate: string;

    readonly cacheMaxElement: number;
    readonly segmentSize: number;
    readonly defaultTTL: number;
    readonly shortTTL: number;

    readonly sCodeOther: string;

    readonly rentalCastCashBaseUrl: string;
    readonly rentalCastCashApiKey: string;

    readonly cardSecret: string;

    readonly stripeSecretKey: string;
    readonly stripeWebhookSecret: string;
    readonly freeTrialDays: number;

    readonly stripePriceStarterMonthly: string;
    readonly stripePriceStarterYearly: string;

    readonly monthlySPrice: number;
    readonly yearlySPrice: number;

    constructor(
        private readonly configService: ConfigService,
        private readonly configUtils: ConfigUtils,
    ) {
        this.getConfig = this.configUtils.getConfig.bind(this.configUtils);
        [
            this.port,

            this.dbHost,
            this.dbName,
            this.dbUser,
            this.dbPassword,
            this.dbPort,

            this.storageDriver,

            this.maxUserSession,
            this.accessTokenSecret,
            this.accessTokenExpiry,
            this.sessionMaxDurationDays,

            this.googleClientID,
            this.googleClientSecret,
            this.googleCallbackUrl,

            this.cryptoSecret,
            this.cryptoIv,

            this.stagingPassword,

            this.sAdminRole,
            this.adminRole,
            this.userRole,
            this.supportRole,

            this.mailType,

            this.mailHost,
            this.mailPort,
            this.mailSecure,
            this.mailUser,
            this.mailPassword,

            this.sendgridApiKey,
            this.sendgridFrom,

            this.googleFrontEndpoint,
            this.userResetPasswordLink,
            this.adminResetPasswordLink,
            this.userSupportLink,
            this.adminSupportLink,
            this.dashboardLink,
            this.subFailedLink,

            this.gCFinance,
            this.gCREstate,

            this.cacheMaxElement,
            this.segmentSize,
            this.defaultTTL,
            this.shortTTL,

            this.sCodeOther,

            this.rentalCastCashBaseUrl,
            this.rentalCastCashApiKey,

            this.cardSecret,

            this.stripeSecretKey,
            this.stripeWebhookSecret,
            this.freeTrialDays,

            this.stripePriceStarterMonthly,
            this.stripePriceStarterYearly,

            this.monthlySPrice,
            this.yearlySPrice,
        ] = [
            this.getConfig(this.configService, 'PORT', { type: 'number' }),

            this.getConfig(this.configService, 'DB_HOST'),
            this.getConfig(this.configService, 'DB_NAME'),
            this.getConfig(this.configService, 'DB_USER'),
            this.getConfig(this.configService, 'DB_PASSWORD'),
            this.getConfig(this.configService, 'DB_PORT', { type: 'number' }),

            this.getConfig(this.configService, 'STORAGE_TYPE', {
                normalize: true,
            }),

            this.getConfig(this.configService, 'MAX_SESSIONS_PER_USER', {
                type: 'number',
            }),
            this.getConfig(this.configService, 'ACCESS_TOKEN_SECRET'),
            this.getConfig(this.configService, 'ACCESS_TOKEN_EXPIRY'),
            this.getConfig(this.configService, 'USER_SESSION_EXPIRY'),

            this.getConfig(this.configService, 'GOOGLE_CLIENT_ID'),
            this.getConfig(this.configService, 'GOOGLE_CLIENT_SECRET'),
            this.getConfig(this.configService, 'GOOGLE_CALLBACK_URL'),

            this.getConfig(this.configService, 'CRYPTO_SECRET'),
            this.getConfig(this.configService, 'CRYPTO_IV'),

            this.getConfig(this.configService, 'STAGING_PASSWORD'),

            this.getConfig(this.configService, 'SUPER_ADMIN_ROLE', {
                normalize: true,
            }),
            this.getConfig(this.configService, 'ADMIN_ROLE', {
                normalize: true,
            }),
            this.getConfig(this.configService, 'USER_ROLE', {
                normalize: true,
            }),
            this.getConfig(this.configService, 'SUPPORT_ROLE', {
                normalize: true,
            }),

            this.getConfig(this.configService, 'MAILER_TYPE'),

            this.getConfig(this.configService, 'MAIL_HOST', { optional: true }),
            this.getConfig(this.configService, 'MAIL_PORT', {
                type: 'number',
                optional: true,
            }),
            this.getConfig(this.configService, 'MAIL_SECURE', {
                type: 'boolean',
                optional: true,
            }),
            this.getConfig(this.configService, 'MAIL_USER', { optional: true }),
            this.getConfig(this.configService, 'MAIL_PASSWORD', {
                optional: true,
            }),

            this.getConfig(this.configService, 'SENDGRID_API_KEY', {
                optional: true,
            }),
            this.getConfig(this.configService, 'SENDGRID_FROM', {
                optional: true,
            }),

            this.getConfig(this.configService, 'FRONTEND_GOOGLE_AUTH_REDIRECT_URL'),
            this.getConfig(this.configService, 'USER_RESET_PASSWORD_LINK'),
            this.getConfig(this.configService, 'ADMIN_RESET_PASSWORD_LINK'),
            this.getConfig(this.configService, 'USER_HELP_SUPPORT_LINK'),
            this.getConfig(this.configService, 'ADMIN_HELP_SUPPORT_LINK'),
            this.getConfig(this.configService, 'DASHBOARD_LINK'),
            this.getConfig(this.configService, 'FAILED_SUBSCRIPTION_LINK'),

            this.getConfig(this.configService, 'GC_FINANCES'),
            this.getConfig(this.configService, 'GC_R_ESTATE'),

            this.getConfig(this.configService, 'CACHE_MAX_ELEMENTS', {
                type: 'number',
            }),
            this.getConfig(this.configService, 'CACHE_SEGMENT_SIZE', {
                type: 'number',
            }),
            this.getConfig(this.configService, 'REDIS_CACHE_TTL_LONG', {
                type: 'number',
            }),
            this.getConfig(this.configService, 'REDIS_CACHE_TTL_SHORT', {
                type: 'number',
            }),

            this.getConfig(this.configService, 'SUPPORT_CODE_OTHER', {
                normalize: true,
            }),

            this.getConfig(this.configService, 'RENTALCASTCASH_BASE_URL'),
            this.getConfig(this.configService, 'RENTALCASTCASH_API_KEY'),

            this.getConfig(this.configService, 'CARD_SECRET'),

            this.getConfig(this.configService, 'STRIPE_SECRET_KEY'),
            this.getConfig(this.configService, 'STRIPE_WEBHOOK_SECRET'),
            this.getConfig(this.configService, 'STRIPE_TRIAL_DAYS', {
                type: 'number',
            }),

            this.getConfig(this.configService, 'STRIPE_PRICE_STARTER_MONTHLY'),
            this.getConfig(this.configService, 'STRIPE_PRICE_STARTER_YEARLY'),

            this.getConfig(this.configService, 'MONTHLY_SUSCRIPTION_FEES', { type: 'number' }),
            this.getConfig(this.configService, 'YEARLY_SUSCRIPTION_FEES', { type: 'number' }),
        ];
    }
}
