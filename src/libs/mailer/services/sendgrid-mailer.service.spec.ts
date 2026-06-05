import { Test, TestingModule } from '@nestjs/testing';
import { SendGridMailerService } from './sendgrid-mailer.service';
import { EnvConfigService } from '../../../utils/services/config';
import * as sendgrid from '@sendgrid/mail';

jest.mock('@sendgrid/mail');

describe('SendGridMailerService', () => {
    let service: SendGridMailerService;
    let envConfigService: EnvConfigService;

    const mockEnvConfigService = {
        sendgridApiKey: 'SG.test-api-key-12345',
        sendgridFrom: 'noreply@example.com',
    };

    beforeEach(async () => {
        jest.spyOn(sendgrid, 'setApiKey').mockImplementation(jest.fn());
        jest.spyOn(sendgrid, 'send').mockResolvedValue([
            {
                statusCode: 202,
                body: '',
                headers: {},
            },
            {},
        ] as any);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SendGridMailerService,
                {
                    provide: EnvConfigService,
                    useValue: mockEnvConfigService,
                },
            ],
        }).compile();

        service = module.get<SendGridMailerService>(SendGridMailerService);
        envConfigService = module.get<EnvConfigService>(EnvConfigService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('constructor', () => {
        it('should set SendGrid API key on initialization', () => {
            expect(sendgrid.setApiKey).toHaveBeenCalledWith('SG.test-api-key-12345');
        });

        it('should use API key from environment config', () => {
            expect(sendgrid.setApiKey).toHaveBeenCalledWith(mockEnvConfigService.sendgridApiKey);
        });

        it('should call setApiKey only once during initialization', () => {
            expect(sendgrid.setApiKey).toHaveBeenCalledTimes(1);
        });
    });

    describe('sendMail', () => {
        const mockMailOptions = {
            to: 'recipient@example.com',
            subject: 'Test Subject',
            html: '<h1>Test Email</h1>',
        };

        beforeEach(() => {
            (sendgrid.send as jest.Mock).mockResolvedValue([
                {
                    statusCode: 202,
                    body: '',
                    headers: {},
                },
                {},
            ]);
        });

        it('should send email with correct parameters', async () => {
            await service.sendMail(
                mockMailOptions.to,
                mockMailOptions.subject,
                mockMailOptions.html,
            );

            expect(sendgrid.send).toHaveBeenCalledWith({
                to: 'recipient@example.com',
                from: 'noreply@example.com',
                subject: 'Test Subject',
                html: '<h1>Test Email</h1>',
                trackingSettings: {
                    clickTracking: {
                        enable: false,
                    },
                },
            });
        });

        it('should use sender email from environment config', async () => {
            await service.sendMail(
                mockMailOptions.to,
                mockMailOptions.subject,
                mockMailOptions.html,
            );

            expect(sendgrid.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    from: envConfigService.sendgridFrom,
                }),
            );
        });

        it('should disable click tracking', async () => {
            await service.sendMail(
                mockMailOptions.to,
                mockMailOptions.subject,
                mockMailOptions.html,
            );

            expect(sendgrid.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    trackingSettings: {
                        clickTracking: {
                            enable: false,
                        },
                    },
                }),
            );
        });

        it('should return the result from SendGrid send', async () => {
            const mockResult = [
                {
                    statusCode: 202,
                    body: '',
                    headers: {},
                },
                {},
            ];
            (sendgrid.send as jest.Mock).mockResolvedValue(mockResult);

            const result = await service.sendMail(
                mockMailOptions.to,
                mockMailOptions.subject,
                mockMailOptions.html,
            );

            expect(result).toEqual(mockResult);
        });

        it('should handle successful email sending with 202 status', async () => {
            (sendgrid.send as jest.Mock).mockResolvedValue([
                {
                    statusCode: 202,
                    body: '',
                    headers: { 'x-message-id': 'abc123' },
                },
                {},
            ]);

            const result = await service.sendMail(
                'recipient@example.com',
                'Welcome',
                '<p>Welcome to our service</p>',
            );

            expect(result[0].statusCode).toBe(202);
        });

        it('should throw error when email sending fails', async () => {
            const error = new Error('SendGrid API error');
            (sendgrid.send as jest.Mock).mockRejectedValue(error);

            await expect(
                service.sendMail(mockMailOptions.to, mockMailOptions.subject, mockMailOptions.html),
            ).rejects.toThrow('SendGrid API error');
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

            await service.sendMail('user@example.com', 'Complex Email', complexHtml);

            expect(sendgrid.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    html: complexHtml,
                }),
            );
        });

        it('should handle multiple recipients', async () => {
            await service.sendMail(
                'user1@example.com, user2@example.com',
                'Bulk Email',
                '<p>Message</p>',
            );

            expect(sendgrid.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'user1@example.com, user2@example.com',
                }),
            );
        });

        it('should handle subject with special characters', async () => {
            await service.sendMail(
                'user@example.com',
                'Test: "Subject" with special chars & symbols!',
                '<p>Content</p>',
            );

            expect(sendgrid.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    subject: 'Test: "Subject" with special chars & symbols!',
                }),
            );
        });

        it('should call send only once per invocation', async () => {
            await service.sendMail(
                mockMailOptions.to,
                mockMailOptions.subject,
                mockMailOptions.html,
            );

            expect(sendgrid.send).toHaveBeenCalledTimes(1);
        });

        it('should handle API rate limit errors', async () => {
            const rateLimitError = new Error('Rate limit exceeded');
            (sendgrid.send as jest.Mock).mockRejectedValue(rateLimitError);

            await expect(
                service.sendMail('user@example.com', 'Test', '<p>Test</p>'),
            ).rejects.toThrow('Rate limit exceeded');
        });

        it('should handle invalid API key errors', async () => {
            const authError = new Error('Unauthorized: invalid API key');
            (sendgrid.send as jest.Mock).mockRejectedValue(authError);

            await expect(
                service.sendMail('user@example.com', 'Test', '<p>Test</p>'),
            ).rejects.toThrow('Unauthorized: invalid API key');
        });

        it('should handle invalid recipient email errors', async () => {
            const recipientError = new Error('Invalid recipient email');
            (sendgrid.send as jest.Mock).mockRejectedValue(recipientError);

            await expect(service.sendMail('invalid-email', 'Test', '<p>Test</p>')).rejects.toThrow(
                'Invalid recipient email',
            );
        });

        it('should handle empty subject', async () => {
            await service.sendMail('user@example.com', '', '<p>Content</p>');

            expect(sendgrid.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    subject: '',
                }),
            );
        });

        it('should handle empty HTML content', async () => {
            await service.sendMail('user@example.com', 'Subject', '');

            expect(sendgrid.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    html: '',
                }),
            );
        });

        it('should handle email with attachments (if extended)', async () => {
            // This test demonstrates extensibility
            await service.sendMail(
                'user@example.com',
                'Email with content',
                '<p>See attachment</p>',
            );

            expect(sendgrid.send).toHaveBeenCalled();
        });
    });

    describe('MailProviderInterface implementation', () => {
        it('should implement sendMail method from MailProviderInterface', () => {
            expect(service.sendMail).toBeDefined();
            expect(typeof service.sendMail).toBe('function');
        });

        it('should be injectable', () => {
            const metadata = Reflect.getMetadata('__injectable__', SendGridMailerService);
            expect(metadata).toBeDefined();
        });
    });

    describe('Privacy features', () => {
        it('should always disable click tracking for privacy', async () => {
            await service.sendMail('user@example.com', 'Privacy Email', '<p>Content</p>');

            const callArgs = (sendgrid.send as jest.Mock).mock.calls[0][0];
            expect(callArgs.trackingSettings.clickTracking.enable).toBe(false);
        });

        it('should maintain privacy settings across multiple emails', async () => {
            await service.sendMail('user1@example.com', 'Email 1', '<p>Content 1</p>');
            await service.sendMail('user2@example.com', 'Email 2', '<p>Content 2</p>');

            const calls = (sendgrid.send as jest.Mock).mock.calls;
            calls.forEach((call) => {
                expect(call[0].trackingSettings.clickTracking.enable).toBe(false);
            });
        });
    });

    describe('SendGrid API integration', () => {
        it('should use SendGrid send method', async () => {
            await service.sendMail('user@example.com', 'Test', '<p>Test</p>');

            expect(sendgrid.send).toHaveBeenCalled();
        });

        it('should handle SendGrid response format', async () => {
            const mockResponse = [
                {
                    statusCode: 202,
                    body: '',
                    headers: {
                        'x-message-id': 'message-123',
                        'content-type': 'text/plain',
                    },
                },
                {},
            ];
            (sendgrid.send as jest.Mock).mockResolvedValue(mockResponse);

            const result = await service.sendMail('user@example.com', 'Test', '<p>Test</p>');

            expect(result).toEqual(mockResponse);
            expect(result[0].statusCode).toBe(202);
        });
    });
});
