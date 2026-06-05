import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from './mailer.service';
import { MAIL_PROVIDER } from '../mailer.constants';
import { MailProviderInterface } from '../../../interface';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

describe('MailerService', () => {
    let service: MailerService;
    let mockMailProvider: jest.Mocked<MailProviderInterface>;
    let mockLogger: jest.Mocked<Logger>;

    beforeEach(async () => {
        mockMailProvider = {
            sendMail: jest.fn(),
        };

        mockLogger = {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MailerService,
                {
                    provide: MAIL_PROVIDER,
                    useValue: mockMailProvider,
                },
                {
                    provide: WINSTON_MODULE_PROVIDER,
                    useValue: mockLogger,
                },
            ],
        }).compile();

        service = module.get<MailerService>(MailerService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('sendMail', () => {
        const mockMailOptions = {
            to: 'recipient@example.com',
            subject: 'Test Subject',
            html: '<h1>Test Email</h1>',
        };

        it('should call provider sendMail with correct parameters', async () => {
            mockMailProvider.sendMail.mockResolvedValue({ messageId: '12345' });

            await service.sendMail(
                mockMailOptions.to,
                mockMailOptions.subject,
                mockMailOptions.html,
            );

            expect(mockMailProvider.sendMail).toHaveBeenCalledWith(
                'recipient@example.com',
                'Test Subject',
                '<h1>Test Email</h1>',
            );
        });

        it('should return the result from provider sendMail', async () => {
            const mockResult = { messageId: '12345', status: 'sent' };
            mockMailProvider.sendMail.mockResolvedValue(mockResult);

            const result = await service.sendMail(
                mockMailOptions.to,
                mockMailOptions.subject,
                mockMailOptions.html,
            );

            expect(result).toEqual(mockResult);
        });

        it('should call provider sendMail only once', async () => {
            mockMailProvider.sendMail.mockResolvedValue({ messageId: '12345' });

            await service.sendMail(
                mockMailOptions.to,
                mockMailOptions.subject,
                mockMailOptions.html,
            );

            expect(mockMailProvider.sendMail).toHaveBeenCalledTimes(1);
        });

        it('should handle successful email sending', async () => {
            mockMailProvider.sendMail.mockResolvedValue({
                messageId: 'abc123',
                accepted: ['recipient@example.com'],
                rejected: [],
            });

            const result = await service.sendMail(
                'recipient@example.com',
                'Welcome',
                '<p>Welcome message</p>',
            );

            expect(result.messageId).toBe('abc123');
            expect(result.accepted).toContain('recipient@example.com');
        });

        it('should propagate errors from provider', async () => {
            const error = new Error('Email sending failed');
            mockMailProvider.sendMail.mockRejectedValue(error);

            await expect(
                service.sendMail(mockMailOptions.to, mockMailOptions.subject, mockMailOptions.html),
            ).rejects.toThrow('Email sending failed');
        });

        it('should handle provider throwing SMTP errors', async () => {
            const smtpError = new Error('SMTP connection failed');
            mockMailProvider.sendMail.mockRejectedValue(smtpError);

            await expect(
                service.sendMail('user@example.com', 'Test', '<p>Test</p>'),
            ).rejects.toThrow('SMTP connection failed');
        });

        it('should handle provider throwing authentication errors', async () => {
            const authError = new Error('Invalid credentials');
            mockMailProvider.sendMail.mockRejectedValue(authError);

            await expect(
                service.sendMail('user@example.com', 'Test', '<p>Test</p>'),
            ).rejects.toThrow('Invalid credentials');
        });

        it('should pass through to parameter correctly', async () => {
            mockMailProvider.sendMail.mockResolvedValue({ sent: true });

            await service.sendMail('test@example.com', 'Subject', '<p>Content</p>');

            const callArgs = mockMailProvider.sendMail.mock.calls[0];
            expect(callArgs[0]).toBe('test@example.com');
        });

        it('should pass through subject parameter correctly', async () => {
            mockMailProvider.sendMail.mockResolvedValue({ sent: true });

            await service.sendMail('test@example.com', 'Test Subject', '<p>Content</p>');

            const callArgs = mockMailProvider.sendMail.mock.calls[0];
            expect(callArgs[1]).toBe('Test Subject');
        });

        it('should pass through html parameter correctly', async () => {
            mockMailProvider.sendMail.mockResolvedValue({ sent: true });

            await service.sendMail('test@example.com', 'Subject', '<h1>HTML Content</h1>');

            const callArgs = mockMailProvider.sendMail.mock.calls[0];
            expect(callArgs[2]).toBe('<h1>HTML Content</h1>');
        });

        it('should handle multiple recipients', async () => {
            mockMailProvider.sendMail.mockResolvedValue({ sent: true });

            await service.sendMail(
                'user1@example.com, user2@example.com',
                'Bulk Email',
                '<p>Message</p>',
            );

            expect(mockMailProvider.sendMail).toHaveBeenCalledWith(
                'user1@example.com, user2@example.com',
                'Bulk Email',
                '<p>Message</p>',
            );
        });

        it('should handle complex HTML content', async () => {
            const complexHtml = `
                <html lang="">
                    <head><title>Email</title></head>
                    <body>
                        <h1>Welcome</h1>
                        <p>Click <a href="https://example.com">here</a></p>
                    </body>
                </html>
            `;
            mockMailProvider.sendMail.mockResolvedValue({ sent: true });

            await service.sendMail('user@example.com', 'Complex Email', complexHtml);

            expect(mockMailProvider.sendMail).toHaveBeenCalledWith(
                'user@example.com',
                'Complex Email',
                complexHtml,
            );
        });

        it('should handle empty subject', async () => {
            mockMailProvider.sendMail.mockResolvedValue({ sent: true });

            await service.sendMail('user@example.com', '', '<p>Content</p>');

            expect(mockMailProvider.sendMail).toHaveBeenCalledWith(
                'user@example.com',
                '',
                '<p>Content</p>',
            );
        });

        it('should handle empty HTML content', async () => {
            mockMailProvider.sendMail.mockResolvedValue({ sent: true });

            await service.sendMail('user@example.com', 'Subject', '');

            expect(mockMailProvider.sendMail).toHaveBeenCalledWith(
                'user@example.com',
                'Subject',
                '',
            );
        });

        it('should handle subject with special characters', async () => {
            mockMailProvider.sendMail.mockResolvedValue({ sent: true });

            await service.sendMail(
                'user@example.com',
                'Test: "Subject" with chars & symbols!',
                '<p>Content</p>',
            );

            expect(mockMailProvider.sendMail).toHaveBeenCalledWith(
                'user@example.com',
                'Test: "Subject" with chars & symbols!',
                '<p>Content</p>',
            );
        });
    });

    describe('Dependency Injection', () => {
        it('should inject mail provider using MAIL_PROVIDER token', () => {
            expect(service).toBeDefined();
            expect(mockMailProvider).toBeDefined();
        });

        it('should be injectable', () => {
            const metadata = Reflect.getMetadata('__injectable__', MailerService);
            expect(metadata).toBeDefined();
        });

        it('should work with any MailProviderInterface implementation', async () => {
            const alternativeProvider: MailProviderInterface = {
                sendMail: jest.fn().mockResolvedValue({ provider: 'alternative' }),
            };

            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    MailerService,
                    {
                        provide: MAIL_PROVIDER,
                        useValue: alternativeProvider,
                    },
                    {
                        provide: WINSTON_MODULE_PROVIDER,
                        useValue: mockLogger,
                    },
                ],
            }).compile();

            const serviceWithAltProvider = module.get<MailerService>(MailerService);
            const result = await serviceWithAltProvider.sendMail(
                'test@example.com',
                'Test',
                '<p>Test</p>',
            );

            expect(result.provider).toBe('alternative');
        });
    });

    describe('Provider abstraction', () => {
        it('should delegate all email sending to provider', async () => {
            mockMailProvider.sendMail.mockResolvedValue({ sent: true });

            await service.sendMail('test@example.com', 'Test', '<p>Content</p>');

            expect(mockMailProvider.sendMail).toHaveBeenCalled();
        });

        it('should not modify parameters before passing to provider', async () => {
            const to = 'original@example.com';
            const subject = 'Original Subject';
            const html = '<p>Original Content</p>';

            mockMailProvider.sendMail.mockResolvedValue({ sent: true });

            await service.sendMail(to, subject, html);

            expect(mockMailProvider.sendMail).toHaveBeenCalledWith(to, subject, html);
        });

        it('should return provider response without modification', async () => {
            const providerResponse = {
                messageId: 'unique-id',
                status: 'delivered',
                customField: 'custom-value',
            };
            mockMailProvider.sendMail.mockResolvedValue(providerResponse);

            const result = await service.sendMail('test@example.com', 'Test', '<p>Test</p>');

            expect(result).toEqual(providerResponse);
        });
    });

    describe('emailSend', () => {
        beforeEach(() => {
            mockMailProvider.sendMail.mockResolvedValue({ sent: true });
        });

        it('should log info before sending email', () => {
            service.emailSend('user@example.com', 'Test', '<p>Content</p>');

            expect(mockLogger.info).toHaveBeenCalledWith('Sending email to user@example.com');
        });

        it('should trim email address before sending', async () => {
            service.emailSend('  user@example.com  ', 'Test', '<p>Content</p>');

            // Wait for async operation
            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(mockMailProvider.sendMail).toHaveBeenCalledWith(
                'user@example.com',
                'Test',
                '<p>Content</p>',
            );
        });

        it('should call sendMail with correct parameters', async () => {
            service.emailSend('user@example.com', 'Subject', '<h1>HTML</h1>');

            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(mockMailProvider.sendMail).toHaveBeenCalledWith(
                'user@example.com',
                'Subject',
                '<h1>HTML</h1>',
            );
        });

        it('should not await sendMail (fire and forget)', () => {
            const result = service.emailSend('user@example.com', 'Test', '<p>Content</p>');

            expect(result).toBeUndefined();
        });

        it('should catch and log errors from sendMail', async () => {
            const error = new Error('Email sending failed');
            mockMailProvider.sendMail.mockRejectedValue(error);

            service.emailSend('user@example.com', 'Test', '<p>Content</p>');

            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(mockLogger.info).toHaveBeenCalledWith(
                'Email send failed: Error: Email sending failed',
            );
        });

        it('should log SMTP errors', async () => {
            const smtpError = new Error('SMTP connection failed');
            mockMailProvider.sendMail.mockRejectedValue(smtpError);

            service.emailSend('user@example.com', 'Test', '<p>Content</p>');

            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(mockLogger.info).toHaveBeenCalledWith(
                'Email send failed: Error: SMTP connection failed',
            );
        });

        it('should log authentication errors', async () => {
            const authError = new Error('Invalid credentials');
            mockMailProvider.sendMail.mockRejectedValue(authError);

            service.emailSend('user@example.com', 'Test', '<p>Content</p>');

            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(mockLogger.info).toHaveBeenCalledWith(
                'Email send failed: Error: Invalid credentials',
            );
        });

        it('should not throw error when sendMail fails', async () => {
            mockMailProvider.sendMail.mockRejectedValue(new Error('Failed'));

            expect(() => {
                service.emailSend('user@example.com', 'Test', '<p>Content</p>');
            }).not.toThrow();
        });

        it('should handle email with leading and trailing spaces', async () => {
            service.emailSend('   test@example.com   ', 'Subject', '<p>Content</p>');

            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(mockMailProvider.sendMail).toHaveBeenCalledWith(
                'test@example.com',
                'Subject',
                '<p>Content</p>',
            );
        });

        it('should handle multiple spaces in email', async () => {
            service.emailSend('  user@example.com  ', 'Test', '<p>Content</p>');

            await new Promise((resolve) => setTimeout(resolve, 10));

            const callArgs = mockMailProvider.sendMail.mock.calls[0];
            expect(callArgs[0]).toBe('user@example.com');
        });

        it('should log info exactly once per call', () => {
            service.emailSend('user@example.com', 'Test', '<p>Content</p>');

            expect(mockLogger.info).toHaveBeenCalledTimes(1);
            expect(mockLogger.info).toHaveBeenCalledWith('Sending email to user@example.com');
        });

        it('should handle empty subject', async () => {
            service.emailSend('user@example.com', '', '<p>Content</p>');

            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(mockMailProvider.sendMail).toHaveBeenCalledWith(
                'user@example.com',
                '',
                '<p>Content</p>',
            );
        });

        it('should handle empty HTML content', async () => {
            service.emailSend('user@example.com', 'Subject', '');

            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(mockMailProvider.sendMail).toHaveBeenCalledWith(
                'user@example.com',
                'Subject',
                '',
            );
        });

        it('should handle complex HTML content', async () => {
            const complexHtml = '<html lang=""><body><h1>Test</h1></body></html>';
            service.emailSend('user@example.com', 'Subject', complexHtml);

            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(mockMailProvider.sendMail).toHaveBeenCalledWith(
                'user@example.com',
                'Subject',
                complexHtml,
            );
        });
    });

    describe('sendBulkMail', () => {
        beforeEach(() => {
            mockMailProvider.sendMail.mockResolvedValue({ sent: true });
        });

        it('should log bulk email info with correct recipient count', async () => {
            const emails = ['user1@example.com', 'user2@example.com', 'user3@example.com'];

            await service.sendBulkMail(emails, 'Bulk Subject', '<p>Content</p>');

            expect(mockLogger.info).toHaveBeenCalledWith('Sending bulk email to 3 users');
        });

        it('should send email to all recipients', async () => {
            const emails = ['user1@example.com', 'user2@example.com'];

            await service.sendBulkMail(emails, 'Test Subject', '<p>Content</p>');

            expect(mockMailProvider.sendMail).toHaveBeenCalledTimes(2);
            expect(mockMailProvider.sendMail).toHaveBeenCalledWith(
                'user1@example.com',
                'Test Subject',
                '<p>Content</p>',
            );
            expect(mockMailProvider.sendMail).toHaveBeenCalledWith(
                'user2@example.com',
                'Test Subject',
                '<p>Content</p>',
            );
        });

        it('should trim email addresses before sending', async () => {
            const emails = ['  user1@example.com  ', '  user2@example.com  '];

            await service.sendBulkMail(emails, 'Test', '<p>Content</p>');

            expect(mockMailProvider.sendMail).toHaveBeenCalledWith(
                'user1@example.com',
                'Test',
                '<p>Content</p>',
            );
            expect(mockMailProvider.sendMail).toHaveBeenCalledWith(
                'user2@example.com',
                'Test',
                '<p>Content</p>',
            );
        });

        it('should handle empty emails array', async () => {
            await service.sendBulkMail([], 'Test Subject', '<p>Content</p>');

            expect(mockLogger.info).toHaveBeenCalledWith('Sending bulk email to 0 users');
            expect(mockMailProvider.sendMail).not.toHaveBeenCalled();
        });

        it('should handle single email in array', async () => {
            const emails = ['single@example.com'];

            await service.sendBulkMail(emails, 'Test', '<p>Content</p>');

            expect(mockLogger.info).toHaveBeenCalledWith('Sending bulk email to 1 users');
            expect(mockMailProvider.sendMail).toHaveBeenCalledTimes(1);
        });

        it('should send emails in parallel using Promise.all', async () => {
            const emails = ['user1@example.com', 'user2@example.com', 'user3@example.com'];
            const sendMailSpy = jest.spyOn(service, 'sendMail');

            await service.sendBulkMail(emails, 'Test', '<p>Content</p>');

            expect(sendMailSpy).toHaveBeenCalledTimes(3);
        });

        it('should continue sending to other recipients if one fails', async () => {
            const emails = ['user1@example.com', 'user2@example.com', 'user3@example.com'];

            mockMailProvider.sendMail
                .mockResolvedValueOnce({ sent: true }) // user1 succeeds
                .mockRejectedValueOnce(new Error('Failed for user2')) // user2 fails
                .mockResolvedValueOnce({ sent: true }); // user3 succeeds

            await service.sendBulkMail(emails, 'Test', '<p>Content</p>');

            expect(mockMailProvider.sendMail).toHaveBeenCalledTimes(3);
        });

        it('should log error for failed email sends', async () => {
            const emails = ['user1@example.com', 'user2@example.com'];
            const error = new Error('SMTP Error');

            mockMailProvider.sendMail
                .mockResolvedValueOnce({ sent: true })
                .mockRejectedValueOnce(error);

            await service.sendBulkMail(emails, 'Test', '<p>Content</p>');

            expect(mockLogger.error).toHaveBeenCalledWith(
                'Failed to send email to user2@example.com: Error: SMTP Error',
            );
        });

        it('should log errors for all failed emails', async () => {
            const emails = ['user1@example.com', 'user2@example.com', 'user3@example.com'];

            mockMailProvider.sendMail
                .mockRejectedValueOnce(new Error('Error 1'))
                .mockRejectedValueOnce(new Error('Error 2'))
                .mockRejectedValueOnce(new Error('Error 3'));

            await service.sendBulkMail(emails, 'Test', '<p>Content</p>');

            expect(mockLogger.error).toHaveBeenCalledTimes(3);
            expect(mockLogger.error).toHaveBeenCalledWith(
                'Failed to send email to user1@example.com: Error: Error 1',
            );
            expect(mockLogger.error).toHaveBeenCalledWith(
                'Failed to send email to user2@example.com: Error: Error 2',
            );
            expect(mockLogger.error).toHaveBeenCalledWith(
                'Failed to send email to user3@example.com: Error: Error 3',
            );
        });

        it('should not throw error even if all emails fail', async () => {
            const emails = ['user1@example.com', 'user2@example.com'];
            mockMailProvider.sendMail.mockRejectedValue(new Error('All failed'));

            await expect(
                service.sendBulkMail(emails, 'Test', '<p>Content</p>'),
            ).resolves.not.toThrow();
        });

        it('should handle large number of recipients', async () => {
            const emails = Array.from({ length: 100 }, (_, i) => `user${i}@example.com`);

            await service.sendBulkMail(emails, 'Bulk', '<p>Content</p>');

            expect(mockLogger.info).toHaveBeenCalledWith('Sending bulk email to 100 users');
            expect(mockMailProvider.sendMail).toHaveBeenCalledTimes(100);
        });

        it('should pass same subject to all recipients', async () => {
            const emails = ['user1@example.com', 'user2@example.com'];
            const subject = 'Same Subject For All';

            await service.sendBulkMail(emails, subject, '<p>Content</p>');

            emails.forEach((email) => {
                expect(mockMailProvider.sendMail).toHaveBeenCalledWith(
                    email,
                    subject,
                    '<p>Content</p>',
                );
            });
        });

        it('should pass same HTML content to all recipients', async () => {
            const emails = ['user1@example.com', 'user2@example.com'];
            const html = '<html lang=""><body><h1>Newsletter</h1></body></html>';

            await service.sendBulkMail(emails, 'Newsletter', html);

            emails.forEach((email) => {
                expect(mockMailProvider.sendMail).toHaveBeenCalledWith(email, 'Newsletter', html);
            });
        });

        it('should handle complex HTML in bulk emails', async () => {
            const emails = ['user1@example.com', 'user2@example.com'];
            const complexHtml = `
            <html lang="">
                <head><title>Complex Email</title></head>
                <body>
                    <div style="color: red;">
                        <h1>Welcome</h1>
                        <p>Click <a href="https://example.com">here</a></p>
                    </div>
                </body>
            </html>
        `;

            await service.sendBulkMail(emails, 'Complex', complexHtml);

            emails.forEach((email) => {
                expect(mockMailProvider.sendMail).toHaveBeenCalledWith(
                    email,
                    'Complex',
                    complexHtml,
                );
            });
        });

        it('should handle emails with mixed whitespace', async () => {
            const emails = [
                'user1@example.com',
                '  user2@example.com',
                'user3@example.com  ',
                '  user4@example.com  ',
            ];

            await service.sendBulkMail(emails, 'Test', '<p>Content</p>');

            expect(mockMailProvider.sendMail).toHaveBeenCalledWith(
                'user1@example.com',
                'Test',
                '<p>Content</p>',
            );
            expect(mockMailProvider.sendMail).toHaveBeenCalledWith(
                'user2@example.com',
                'Test',
                '<p>Content</p>',
            );
            expect(mockMailProvider.sendMail).toHaveBeenCalledWith(
                'user3@example.com',
                'Test',
                '<p>Content</p>',
            );
            expect(mockMailProvider.sendMail).toHaveBeenCalledWith(
                'user4@example.com',
                'Test',
                '<p>Content</p>',
            );
        });

        it('should complete successfully when all emails are sent', async () => {
            const emails = ['user1@example.com', 'user2@example.com'];
            mockMailProvider.sendMail.mockResolvedValue({ sent: true });

            await expect(
                service.sendBulkMail(emails, 'Test', '<p>Content</p>'),
            ).resolves.not.toThrow();

            expect(mockLogger.error).not.toHaveBeenCalled();
        });

        it('should handle SMTP errors gracefully', async () => {
            const emails = ['user1@example.com', 'user2@example.com'];
            const smtpError = new Error('SMTP connection timeout');

            mockMailProvider.sendMail
                .mockResolvedValueOnce({ sent: true })
                .mockRejectedValueOnce(smtpError);

            await service.sendBulkMail(emails, 'Test', '<p>Content</p>');

            expect(mockLogger.error).toHaveBeenCalledWith(
                'Failed to send email to user2@example.com: Error: SMTP connection timeout',
            );
        });

        it('should handle authentication errors gracefully', async () => {
            const emails = ['user1@example.com'];
            const authError = new Error('Invalid authentication credentials');

            mockMailProvider.sendMail.mockRejectedValueOnce(authError);

            await service.sendBulkMail(emails, 'Test', '<p>Content</p>');

            expect(mockLogger.error).toHaveBeenCalledWith(
                'Failed to send email to user1@example.com: Error: Invalid authentication credentials',
            );
        });

        it('should handle network errors gracefully', async () => {
            const emails = ['user1@example.com', 'user2@example.com'];
            const networkError = new Error('Network timeout');

            mockMailProvider.sendMail.mockRejectedValue(networkError);

            await service.sendBulkMail(emails, 'Test', '<p>Content</p>');

            expect(mockLogger.error).toHaveBeenCalledTimes(2);
        });

        it('should log info before sending any emails', async () => {
            const emails = ['user1@example.com'];

            await service.sendBulkMail(emails, 'Test', '<p>Content</p>');

            const infoCallOrder = mockLogger.info.mock.invocationCallOrder[0];
            const sendMailCallOrder = mockMailProvider.sendMail.mock.invocationCallOrder[0];

            expect(infoCallOrder).toBeLessThan(sendMailCallOrder);
        });

        it('should wait for all emails to complete before resolving', async () => {
            const emails = ['user1@example.com', 'user2@example.com', 'user3@example.com'];
            let resolvedCount = 0;

            mockMailProvider.sendMail.mockImplementation(() => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolvedCount++;
                        resolve({ sent: true });
                    }, 10);
                });
            });

            await service.sendBulkMail(emails, 'Test', '<p>Content</p>');

            expect(resolvedCount).toBe(3);
        });

        it('should handle mixture of success and failure', async () => {
            const emails = [
                'success1@example.com',
                'fail1@example.com',
                'success2@example.com',
                'fail2@example.com',
            ];

            mockMailProvider.sendMail
                .mockResolvedValueOnce({ sent: true })
                .mockRejectedValueOnce(new Error('Error 1'))
                .mockResolvedValueOnce({ sent: true })
                .mockRejectedValueOnce(new Error('Error 2'));

            await service.sendBulkMail(emails, 'Test', '<p>Content</p>');

            expect(mockMailProvider.sendMail).toHaveBeenCalledTimes(4);
            expect(mockLogger.error).toHaveBeenCalledTimes(2);
        });

        it('should preserve email order in sendMail calls', async () => {
            const emails = ['first@example.com', 'second@example.com', 'third@example.com'];

            await service.sendBulkMail(emails, 'Test', '<p>Content</p>');

            const calls = mockMailProvider.sendMail.mock.calls;
            expect(calls[0][0]).toBe('first@example.com');
            expect(calls[1][0]).toBe('second@example.com');
            expect(calls[2][0]).toBe('third@example.com');
        });

        it('should handle empty subject in bulk emails', async () => {
            const emails = ['user1@example.com', 'user2@example.com'];

            await service.sendBulkMail(emails, '', '<p>Content</p>');

            emails.forEach((email) => {
                expect(mockMailProvider.sendMail).toHaveBeenCalledWith(email, '', '<p>Content</p>');
            });
        });

        it('should handle empty HTML content in bulk emails', async () => {
            const emails = ['user1@example.com', 'user2@example.com'];

            await service.sendBulkMail(emails, 'Subject', '');

            emails.forEach((email) => {
                expect(mockMailProvider.sendMail).toHaveBeenCalledWith(email, 'Subject', '');
            });
        });
    });
});
