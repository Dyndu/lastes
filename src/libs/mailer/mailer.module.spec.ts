import { Test, TestingModule } from '@nestjs/testing';
import { MailerModule } from './mailer.module';
import { MailerService, SendGridMailerService, SmtpMailerService } from './services';
import { MAIL_PROVIDER } from './mailer.constants';
import { EnvConfigService } from '../../utils/services/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

// Mock SendGrid
jest.mock('@sendgrid/mail', () => ({
    setApiKey: jest.fn(),
    send: jest.fn(),
}));

// Mock Nodemailer
jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn(),
    }),
}));

describe('MailerModule', () => {
    let module: TestingModule;
    let mockConfigService: any;
    let mockLogger: any;

    const createTestModule = async (mailType: string = 'NODEMAILER') => {
        mockConfigService = {
            mailType,
            sendgridApiKey: 'test-sendgrid-key',
            smtpHost: 'smtp.example.com',
            smtpPort: 587,
            smtpUser: 'test@example.com',
            smtpPassword: 'password',
            smtpFromEmail: 'noreply@example.com',
        };

        mockLogger = {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
        };

        return await Test.createTestingModule({
            providers: [
                {
                    provide: MAIL_PROVIDER,
                    inject: [EnvConfigService],
                    useFactory: (configService: EnvConfigService) => {
                        const provider = configService.mailType;

                        switch (provider) {
                            case 'SENDGRID':
                                return new SendGridMailerService(configService);
                            case 'NODEMAILER':
                            default:
                                return new SmtpMailerService(configService);
                        }
                    },
                },
                MailerService,
                {
                    provide: EnvConfigService,
                    useValue: mockConfigService,
                },
                {
                    provide: WINSTON_MODULE_PROVIDER,
                    useValue: mockLogger,
                },
            ],
        }).compile();
    };

    beforeEach(() => {
        mockConfigService = {
            mailType: 'NODEMAILER',
            sendgridApiKey: 'test-sendgrid-key',
            smtpHost: 'smtp.example.com',
            smtpPort: 587,
            smtpUser: 'test@example.com',
            smtpPassword: 'password',
            smtpFromEmail: 'noreply@example.com',
        };
    });

    afterEach(async () => {
        if (module) {
            await module.close();
        }
        jest.clearAllMocks();
    });

    describe('Module compilation', () => {
        it('should compile the module successfully', async () => {
            module = await createTestModule('NODEMAILER');
            expect(module).toBeDefined();
        });

        it('should be a global module', () => {
            const moduleMetadata = Reflect.getMetadata('__module:global__', MailerModule);
            expect(moduleMetadata).toBe(true);
        });
    });

    describe('Provider registration', () => {
        it('should provide MailerService', async () => {
            module = await createTestModule('NODEMAILER');

            const mailerService = module.get<MailerService>(MailerService);
            expect(mailerService).toBeDefined();
            expect(mailerService).toBeInstanceOf(MailerService);
        });

        it('should provide MAIL_PROVIDER', async () => {
            module = await createTestModule('NODEMAILER');

            const mailProvider = module.get(MAIL_PROVIDER);
            expect(mailProvider).toBeDefined();
        });
    });

    describe('Mail provider factory - NODEMAILER', () => {
        it('should create SmtpMailerService when mailType is NODEMAILER', async () => {
            module = await createTestModule('NODEMAILER');

            const mailProvider = module.get(MAIL_PROVIDER);
            expect(mailProvider).toBeInstanceOf(SmtpMailerService);
        });

        it('should inject EnvConfigService into SmtpMailerService', async () => {
            module = await createTestModule('NODEMAILER');

            const mailProvider = module.get(MAIL_PROVIDER);
            expect(mailProvider).toBeDefined();
        });
    });

    describe('Mail provider factory - SENDGRID', () => {
        it('should create SendGridMailerService when mailType is SENDGRID', async () => {
            module = await createTestModule('SENDGRID');

            const mailProvider = module.get(MAIL_PROVIDER);
            expect(mailProvider).toBeInstanceOf(SendGridMailerService);
        });

        it('should inject EnvConfigService into SendGridMailerService', async () => {
            module = await createTestModule('SENDGRID');

            const mailProvider = module.get(MAIL_PROVIDER);
            expect(mailProvider).toBeDefined();
        });
    });

    describe('Mail provider factory - Default case', () => {
        it('should default to SmtpMailerService when mailType is undefined', async () => {
            module = await createTestModule(undefined as any);

            const mailProvider = module.get(MAIL_PROVIDER);
            expect(mailProvider).toBeInstanceOf(SmtpMailerService);
        });

        it('should default to SmtpMailerService when mailType is unknown', async () => {
            module = await createTestModule('UNKNOWN_PROVIDER');

            const mailProvider = module.get(MAIL_PROVIDER);
            expect(mailProvider).toBeInstanceOf(SmtpMailerService);
        });

        it('should default to SmtpMailerService when mailType is empty string', async () => {
            module = await createTestModule('');

            const mailProvider = module.get(MAIL_PROVIDER);
            expect(mailProvider).toBeInstanceOf(SmtpMailerService);
        });

        it('should default to SmtpMailerService when mailType is null', async () => {
            module = await createTestModule(null as any);

            const mailProvider = module.get(MAIL_PROVIDER);
            expect(mailProvider).toBeInstanceOf(SmtpMailerService);
        });
    });

    describe('Module exports', () => {
        it('should export MailerService', async () => {
            module = await createTestModule('NODEMAILER');

            const mailerService = module.get<MailerService>(MailerService);
            expect(mailerService).toBeDefined();
        });

        it('should make MailerService available globally', async () => {
            const moduleMetadata = Reflect.getMetadata('__module:global__', MailerModule);
            expect(moduleMetadata).toBe(true);
        });
    });

    describe('Provider factory injection', () => {
        it('should inject EnvConfigService into provider factory', async () => {
            module = await createTestModule('NODEMAILER');
            const mailProvider = module.get(MAIL_PROVIDER);

            expect(mailProvider).toBeDefined();
            expect(mailProvider).toBeInstanceOf(SmtpMailerService);
        });
    });

    describe('Integration with MailerService', () => {
        it('should wire MAIL_PROVIDER to MailerService correctly', async () => {
            module = await createTestModule('SENDGRID');

            const mailerService = module.get<MailerService>(MailerService);
            const mailProvider = module.get(MAIL_PROVIDER);

            expect(mailerService).toBeDefined();
            expect(mailProvider).toBeInstanceOf(SendGridMailerService);
        });
    });

    describe('Provider instantiation', () => {
        it('should create new instance of SmtpMailerService for NODEMAILER', async () => {
            module = await createTestModule('NODEMAILER');
            const provider1 = module.get(MAIL_PROVIDER);

            const module2 = await createTestModule('NODEMAILER');
            const provider2 = module2.get(MAIL_PROVIDER);

            expect(provider1).toBeInstanceOf(SmtpMailerService);
            expect(provider2).toBeInstanceOf(SmtpMailerService);
            expect(provider1).not.toBe(provider2);

            await module2.close();
        });

        it('should create new instance of SendGridMailerService for SENDGRID', async () => {
            module = await createTestModule('SENDGRID');
            const provider1 = module.get(MAIL_PROVIDER);

            const module2 = await createTestModule('SENDGRID');
            const provider2 = module2.get(MAIL_PROVIDER);

            expect(provider1).toBeInstanceOf(SendGridMailerService);
            expect(provider2).toBeInstanceOf(SendGridMailerService);
            expect(provider1).not.toBe(provider2);

            await module2.close();
        });
    });

    describe('Case sensitivity', () => {
        it('should handle uppercase SENDGRID', async () => {
            module = await createTestModule('SENDGRID');

            const mailProvider = module.get(MAIL_PROVIDER);
            expect(mailProvider).toBeInstanceOf(SendGridMailerService);
        });

        it('should handle uppercase NODEMAILER', async () => {
            module = await createTestModule('NODEMAILER');

            const mailProvider = module.get(MAIL_PROVIDER);
            expect(mailProvider).toBeInstanceOf(SmtpMailerService);
        });

        it('should not match lowercase sendgrid (should default)', async () => {
            module = await createTestModule('sendgrid');

            const mailProvider = module.get(MAIL_PROVIDER);
            expect(mailProvider).toBeInstanceOf(SmtpMailerService);
        });
    });
});
