import { Test, TestingModule } from '@nestjs/testing';
import { EnvConfigService } from '../../../utils/services/config';
import * as nodemailer from 'nodemailer';
import { SmtpMailerService } from './ smtp-mailer.service';

jest.mock('nodemailer');

describe('SmtpMailerService', () => {
    let service: SmtpMailerService;
    let envConfigService: EnvConfigService;
    let mockTransporter: any;

    const mockEnvConfigService = {
        mailHost: 'smtp.example.com',
        mailPort: '587',
        mailSecure: 'true',
        mailUser: 'test@example.com',
        mailPassword: 'password123',
    };

    beforeEach(async () => {
        mockTransporter = {
            sendMail: jest.fn(),
        };

        (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SmtpMailerService,
                {
                    provide: EnvConfigService,
                    useValue: mockEnvConfigService,
                },
            ],
        }).compile();

        service = module.get<SmtpMailerService>(SmtpMailerService);
        envConfigService = module.get<EnvConfigService>(EnvConfigService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('constructor', () => {
        it('should create transporter with correct configuration', () => {
            expect(nodemailer.createTransport).toHaveBeenCalledWith({
                host: 'smtp.example.com',
                port: 587,
                secure: true,
                auth: {
                    user: 'test@example.com',
                    pass: 'password123',
                },
            });
        });

        it('should convert mailPort to number', () => {
            expect(nodemailer.createTransport).toHaveBeenCalledWith(
                expect.objectContaining({
                    port: 587,
                }),
            );
        });

        it('should set secure to true when mailSecure is "true"', () => {
            expect(nodemailer.createTransport).toHaveBeenCalledWith(
                expect.objectContaining({
                    secure: true,
                }),
            );
        });

        it('should handle mailSecure as false when not "true"', async () => {
            const customEnvConfig = {
                ...mockEnvConfigService,
                mailSecure: 'false',
            };

            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    SmtpMailerService,
                    {
                        provide: EnvConfigService,
                        useValue: customEnvConfig,
                    },
                ],
            }).compile();

            module.get<SmtpMailerService>(SmtpMailerService);

            expect(nodemailer.createTransport).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    secure: false,
                }),
            );
        });

        it('should use correct host from environment config', () => {
            expect(nodemailer.createTransport).toHaveBeenCalledWith(
                expect.objectContaining({
                    host: 'smtp.example.com',
                }),
            );
        });

        it('should use correct auth credentials from environment config', () => {
            expect(nodemailer.createTransport).toHaveBeenCalledWith(
                expect.objectContaining({
                    auth: {
                        user: 'test@example.com',
                        pass: 'password123',
                    },
                }),
            );
        });
    });

    describe('sendMail', () => {
        const mockMailOptions = {
            to: 'recipient@example.com',
            subject: 'Test Subject',
            html: '<h1>Test Email</h1>',
        };

        it('should send email with correct parameters', async () => {
            mockTransporter.sendMail.mockResolvedValue({ messageId: '12345' });

            await service.sendMail(
                mockMailOptions.to,
                mockMailOptions.subject,
                mockMailOptions.html,
            );

            expect(mockTransporter.sendMail).toHaveBeenCalledWith({
                from: 'test@example.com',
                to: 'recipient@example.com',
                subject: 'Test Subject',
                html: '<h1>Test Email</h1>',
            });
        });

        it('should use sender email from environment config', async () => {
            mockTransporter.sendMail.mockResolvedValue({ messageId: '12345' });

            await service.sendMail(
                mockMailOptions.to,
                mockMailOptions.subject,
                mockMailOptions.html,
            );

            expect(mockTransporter.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    from: envConfigService.mailUser,
                }),
            );
        });

        it('should return the result from transporter.sendMail', async () => {
            const mockResult = {
                messageId: '12345',
                accepted: ['recipient@example.com'],
            };
            mockTransporter.sendMail.mockResolvedValue(mockResult);

            const result = await service.sendMail(
                mockMailOptions.to,
                mockMailOptions.subject,
                mockMailOptions.html,
            );

            expect(result).toEqual(mockResult);
        });

        it('should handle successful email sending', async () => {
            mockTransporter.sendMail.mockResolvedValue({
                messageId: 'abc123',
                accepted: ['recipient@example.com'],
                rejected: [],
                response: '250 Message accepted',
            });

            const result = await service.sendMail(
                'recipient@example.com',
                'Welcome',
                '<p>Welcome to our service</p>',
            );

            expect(result.messageId).toBe('abc123');
            expect(result.accepted).toContain('recipient@example.com');
        });

        it('should throw error when email sending fails', async () => {
            const error = new Error('SMTP connection failed');
            mockTransporter.sendMail.mockRejectedValue(error);

            await expect(
                service.sendMail(mockMailOptions.to, mockMailOptions.subject, mockMailOptions.html),
            ).rejects.toThrow('SMTP connection failed');
        });

        it('should handle HTML content with complex markup', async () => {
            const complexHtml = `
                <html>
                    <body>
                        <h1>Welcome</h1>
                        <p>Click <a href="https://example.com">here</a></p>
                    </body>
                </html>
            `;
            mockTransporter.sendMail.mockResolvedValue({ messageId: '12345' });

            await service.sendMail('user@example.com', 'Complex Email', complexHtml);

            expect(mockTransporter.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    html: complexHtml,
                }),
            );
        });

        it('should handle multiple recipients', async () => {
            mockTransporter.sendMail.mockResolvedValue({ messageId: '12345' });

            await service.sendMail(
                'user1@example.com, user2@example.com',
                'Bulk Email',
                '<p>Message</p>',
            );

            expect(mockTransporter.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'user1@example.com, user2@example.com',
                }),
            );
        });

        it('should handle subject with special characters', async () => {
            mockTransporter.sendMail.mockResolvedValue({ messageId: '12345' });

            await service.sendMail(
                'user@example.com',
                'Test: "Subject" with special chars & symbols!',
                '<p>Content</p>',
            );

            expect(mockTransporter.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    subject: 'Test: "Subject" with special chars & symbols!',
                }),
            );
        });

        it('should call sendMail only once per invocation', async () => {
            mockTransporter.sendMail.mockResolvedValue({ messageId: '12345' });

            await service.sendMail(
                mockMailOptions.to,
                mockMailOptions.subject,
                mockMailOptions.html,
            );

            expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
        });

        it('should handle network timeout errors', async () => {
            const timeoutError = new Error('Connection timeout');
            mockTransporter.sendMail.mockRejectedValue(timeoutError);

            await expect(
                service.sendMail('user@example.com', 'Test', '<p>Test</p>'),
            ).rejects.toThrow('Connection timeout');
        });

        it('should handle authentication errors', async () => {
            const authError = new Error('Invalid login credentials');
            mockTransporter.sendMail.mockRejectedValue(authError);

            await expect(
                service.sendMail('user@example.com', 'Test', '<p>Test</p>'),
            ).rejects.toThrow('Invalid login credentials');
        });

        it('should handle empty subject', async () => {
            mockTransporter.sendMail.mockResolvedValue({ messageId: '12345' });

            await service.sendMail('user@example.com', '', '<p>Content</p>');

            expect(mockTransporter.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    subject: '',
                }),
            );
        });

        it('should handle empty HTML content', async () => {
            mockTransporter.sendMail.mockResolvedValue({ messageId: '12345' });

            await service.sendMail('user@example.com', 'Subject', '');

            expect(mockTransporter.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    html: '',
                }),
            );
        });
    });

    describe('MailProviderInterface implementation', () => {
        it('should implement sendMail method from MailProviderInterface', () => {
            expect(service.sendMail).toBeDefined();
            expect(typeof service.sendMail).toBe('function');
        });

        it('should be injectable', () => {
            const metadata = Reflect.getMetadata('__injectable__', SmtpMailerService);
            expect(metadata).toBeDefined();
        });
    });

    describe('Transporter initialization', () => {
        it('should initialize transporter on service creation', () => {
            expect(nodemailer.createTransport).toHaveBeenCalled();
        });

        it('should create transporter only once', () => {
            const callCount = (nodemailer.createTransport as jest.Mock).mock.calls.length;
            expect(callCount).toBe(1);
        });
    });
});
