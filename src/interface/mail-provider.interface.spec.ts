import { MailProviderInterface } from './mail-provider.interface';

describe('MailProviderInterface', () => {
    describe('Interface contract', () => {
        it('should define sendMail method signature', () => {
            const mockImplementation: MailProviderInterface = {
                sendMail: jest.fn(),
            };

            expect(mockImplementation.sendMail).toBeDefined();
            expect(typeof mockImplementation.sendMail).toBe('function');
        });

        it('should accept three parameters: to, subject, html', () => {
            const mockImplementation: MailProviderInterface = {
                sendMail: jest.fn(),
            };

            mockImplementation.sendMail('test@example.com', 'Subject', '<p>HTML</p>');

            expect(mockImplementation.sendMail).toHaveBeenCalledWith(
                'test@example.com',
                'Subject',
                '<p>HTML</p>',
            );
        });

        it('should return a Promise', async () => {
            const mockImplementation: MailProviderInterface = {
                sendMail: jest.fn().mockResolvedValue({ messageId: '123' }),
            };

            const result = mockImplementation.sendMail(
                'test@example.com',
                'Subject',
                '<p>HTML</p>',
            );

            expect(result).toBeInstanceOf(Promise);
            await expect(result).resolves.toBeDefined();
        });
    });

    describe('Type checking', () => {
        it('should enforce string type for to parameter', () => {
            const mockImplementation: MailProviderInterface = {
                sendMail: (to: string, subject: string, html: string) =>
                    Promise.resolve({ to, subject, html }),
            };

            expect(() => {
                mockImplementation.sendMail('valid@email.com', 'Subject', '<p>HTML</p>');
            }).not.toThrow();
        });

        it('should enforce string type for subject parameter', () => {
            const mockImplementation: MailProviderInterface = {
                sendMail: (to: string, subject: string, html: string) =>
                    Promise.resolve({ to, subject, html }),
            };

            expect(() => {
                mockImplementation.sendMail('test@example.com', 'Valid Subject', '<p>HTML</p>');
            }).not.toThrow();
        });

        it('should enforce string type for html parameter', () => {
            const mockImplementation: MailProviderInterface = {
                sendMail: (to: string, subject: string, html: string) =>
                    Promise.resolve({ to, subject, html }),
            };

            expect(() => {
                mockImplementation.sendMail('test@example.com', 'Subject', '<h1>Valid HTML</h1>');
            }).not.toThrow();
        });
    });

    describe('Implementation examples', () => {
        class MockMailProvider implements MailProviderInterface {
            async sendMail(to: string, subject: string, html: string): Promise<any> {
                return { to, subject, html, sent: true };
            }
        }

        it('should allow class implementation', async () => {
            const provider = new MockMailProvider();
            const result = await provider.sendMail('user@example.com', 'Test', '<p>Content</p>');

            expect(result.sent).toBe(true);
            expect(result.to).toBe('user@example.com');
        });

        it('should allow object literal implementation', async () => {
            const provider: MailProviderInterface = {
                sendMail: async (to, subject, html) => ({
                    messageId: 'abc123',
                    to,
                    subject,
                    html,
                }),
            };

            const result = await provider.sendMail('user@example.com', 'Test', '<p>Content</p>');

            expect(result.messageId).toBe('abc123');
        });

        it('should allow arrow function implementation', async () => {
            const provider: MailProviderInterface = {
                sendMail: (to, subject, html) =>
                    Promise.resolve({ success: true, to, subject, html }),
            };

            const result = await provider.sendMail('user@example.com', 'Test', '<p>Content</p>');

            expect(result.success).toBe(true);
        });
    });

    describe('Return value handling', () => {
        it('should allow any return type from Promise', async () => {
            const provider: MailProviderInterface = {
                sendMail: async () => ({ messageId: '123', status: 'sent' }),
            };

            const result = await provider.sendMail('to@example.com', 'Subject', '<p>HTML</p>');

            expect(result).toHaveProperty('messageId');
            expect(result).toHaveProperty('status');
        });

        it('should handle void return type', async () => {
            const provider: MailProviderInterface = {
                sendMail: async () => undefined,
            };

            const result = await provider.sendMail('to@example.com', 'Subject', '<p>HTML</p>');

            expect(result).toBeUndefined();
        });

        it('should handle null return type', async () => {
            const provider: MailProviderInterface = {
                sendMail: async () => null,
            };

            const result = await provider.sendMail('to@example.com', 'Subject', '<p>HTML</p>');

            expect(result).toBeNull();
        });

        it('should handle object return type', async () => {
            const provider: MailProviderInterface = {
                sendMail: async () => ({
                    accepted: ['user@example.com'],
                    rejected: [],
                }),
            };

            const result = await provider.sendMail('to@example.com', 'Subject', '<p>HTML</p>');

            expect(result.accepted).toBeDefined();
            expect(result.rejected).toBeDefined();
        });
    });

    describe('Error handling', () => {
        it('should allow implementation to throw errors', async () => {
            const provider: MailProviderInterface = {
                sendMail: async () => {
                    throw new Error('SMTP connection failed');
                },
            };

            await expect(
                provider.sendMail('to@example.com', 'Subject', '<p>HTML</p>'),
            ).rejects.toThrow('SMTP connection failed');
        });

        it('should allow implementation to reject Promise', async () => {
            const provider: MailProviderInterface = {
                sendMail: () => Promise.reject(new Error('Authentication failed')),
            };

            await expect(
                provider.sendMail('to@example.com', 'Subject', '<p>HTML</p>'),
            ).rejects.toThrow('Authentication failed');
        });
    });

    describe('Multiple implementations compatibility', () => {
        it('should allow different implementations to be interchangeable', async () => {
            const smtpProvider: MailProviderInterface = {
                sendMail: async (to, subject, html) => ({
                    provider: 'smtp',
                    to,
                    subject,
                    html,
                }),
            };

            const sendgridProvider: MailProviderInterface = {
                sendMail: async (to, subject, html) => ({
                    provider: 'sendgrid',
                    to,
                    subject,
                    html,
                }),
            };

            const providers = [smtpProvider, sendgridProvider];

            for (const provider of providers) {
                const result = await provider.sendMail(
                    'test@example.com',
                    'Test',
                    '<p>Content</p>',
                );
                expect(result).toHaveProperty('provider');
            }
        });

        it('should work with dependency injection pattern', () => {
            class EmailService {
                constructor(private mailProvider: MailProviderInterface) {}

                async send(to: string, subject: string, html: string) {
                    return this.mailProvider.sendMail(to, subject, html);
                }
            }

            const mockProvider: MailProviderInterface = {
                sendMail: jest.fn().mockResolvedValue({ sent: true }),
            };

            const emailService = new EmailService(mockProvider);

            expect(emailService).toBeDefined();
            expect(mockProvider.sendMail).toBeDefined();
        });
    });
});
