import { Test, TestingModule } from '@nestjs/testing';
import { UserEmailSendingService } from './user-email-sending.service';
import { UsersService } from './users.service';
import { UserEntity } from '../entities/user.entity';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('UserEmailSendingService', () => {
    let service: UserEmailSendingService;
    let usersService: jest.Mocked<UsersService>;

    const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    };

    const mockMailerService = {
        emailSend: jest.fn(),
    };

    const mockOtherUtils = {
        buildEmailTemplate: jest.fn(),
    };

    const mockEnvConfigService = {
        adminResetPasswordLink: 'https://admin.example.com/reset/',
        userResetPasswordLink: 'https://user.example.com/reset/',
        userRole: 'USER',
    };

    const mockUsersService = {
        logger: mockLogger,
        mailerService: mockMailerService,
        otherUtils: mockOtherUtils,
        envConfigService: mockEnvConfigService,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserEmailSendingService,
                {
                    provide: UsersService,
                    useValue: mockUsersService,
                },
            ],
        }).compile();

        service = module.get<UserEmailSendingService>(UserEmailSendingService);
        usersService = module.get(UsersService) as jest.Mocked<UsersService>;

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('sendWelcomeEmail', () => {
        it('should send welcome email with correct parameters', () => {
            const mockUser: UserEntity = {
                email: 'test@example.com',
                firstName: 'John',
                lastName: 'Doe',
            } as any;

            const mockTemplate = '<html lang="">Welcome Email Template</html>';
            mockOtherUtils.buildEmailTemplate.mockReturnValue(mockTemplate);

            const currentYear = new Date().getFullYear();

            service.sendWelcomeEmail(mockUser);

            // Assert
            expect(mockLogger.info).toHaveBeenCalledWith(
                `Sending welcome email to ${mockUser.email}`,
            );
            expect(mockOtherUtils.buildEmailTemplate).toHaveBeenCalledWith(
                '../../../src/utils/templates/register-email.hbs',
                { currentYear },
            );
            expect(mockMailerService.emailSend).toHaveBeenCalledWith(
                mockUser.email,
                'Welcome Email',
                mockTemplate,
            );
        });
    });

    describe('sendWelcomeEmailToAdmin', () => {
        it('should send welcome email to admin with password setup link', () => {
            const mockUser: UserEntity = {
                email: 'admin@example.com',
                firstName: 'Admin',
                lastName: 'User',
            } as any;

            const userId = 'admin-123';
            const mockTemplate = '<html lang="">Admin Welcome Email Template</html>';
            mockOtherUtils.buildEmailTemplate.mockReturnValue(mockTemplate);

            const currentYear = new Date().getFullYear();
            const expectedLink = `${mockEnvConfigService.adminResetPasswordLink}${userId}`;

            service.sendWelcomeEmailToAdmin(mockUser, userId);

            expect(mockLogger.info).toHaveBeenCalledWith(
                `Sending welcome email to ${mockUser.email}`,
            );
            expect(mockOtherUtils.buildEmailTemplate).toHaveBeenCalledWith(
                '../../../src/utils/templates/admin-register.hbs',
                {
                    link: expectedLink,
                    currentYear,
                },
            );
            expect(mockMailerService.emailSend).toHaveBeenCalledWith(
                mockUser.email,
                'Welcome and set your password',
                mockTemplate,
            );
        });
    });

    describe('sendUserOTP', () => {
        it('should send OTP email with 6-digit code', () => {
            const mockUser: UserEntity = {
                email: 'user@example.com',
                firstName: 'Jane',
                lastName: 'Doe',
            } as any;

            const userCode = '123456';
            const mockTemplate = '<html lang="">OTP Email Template</html>';
            mockOtherUtils.buildEmailTemplate.mockReturnValue(mockTemplate);

            const currentYear = new Date().getFullYear();

            service.sendUserOTP(mockUser, userCode);

            expect(mockOtherUtils.buildEmailTemplate).toHaveBeenCalledWith(
                '../../../src/utils/templates/verify-code-email.hbs',
                {
                    number1: '1',
                    number2: '2',
                    number3: '3',
                    number4: '4',
                    number5: '5',
                    number6: '6',
                    currentYear,
                },
            );
            expect(mockMailerService.emailSend).toHaveBeenCalledWith(
                mockUser.email,
                'Login code',
                mockTemplate,
            );
        });

        it('should handle different OTP codes correctly', () => {
            const mockUser: UserEntity = {
                email: 'user@example.com',
            } as UserEntity;

            const userCode = '987654';
            mockOtherUtils.buildEmailTemplate.mockReturnValue('<html lang=""></html>');

            // Act
            service.sendUserOTP(mockUser, userCode);

            // Assert
            expect(mockOtherUtils.buildEmailTemplate).toHaveBeenCalledWith(
                '../../../src/utils/templates/verify-code-email.hbs',
                expect.objectContaining({
                    number1: '9',
                    number2: '8',
                    number3: '7',
                    number4: '6',
                    number5: '5',
                    number6: '4',
                }),
            );
        });
    });

    describe('sendResetPasswordMail', () => {
        it('should send reset password email to regular user with user reset link', () => {
            const mockUser: UserEntity = {
                email: 'user@example.com',
                firstName: 'John',
                lastName: 'Doe',
                role: {
                    label: 'USER',
                },
            } as any;

            const userId = 'user-123';
            const mockTemplate = '<html lang="">Reset Password Template</html>';
            mockOtherUtils.buildEmailTemplate.mockReturnValue(mockTemplate);

            const currentYear = new Date().getFullYear();
            const expectedLink = `${mockEnvConfigService.userResetPasswordLink}${userId}`;

            service.sendResetPasswordMail(mockUser, userId);

            expect(mockLogger.info).toHaveBeenCalledWith(
                `Sending reset password email to ${mockUser.email}`,
            );
            expect(mockOtherUtils.buildEmailTemplate).toHaveBeenCalledWith(
                '../../../src/utils/templates/reset-password.hbs',
                {
                    link: expectedLink,
                    currentYear,
                },
            );
            expect(mockMailerService.emailSend).toHaveBeenCalledWith(
                mockUser.email,
                'Reset password',
                mockTemplate,
            );
        });

        it('should send reset password email to admin user with admin reset link', () => {
            const mockUser: UserEntity = {
                email: 'admin@example.com',
                firstName: 'Admin',
                lastName: 'User',
                role: {
                    label: 'ADMIN',
                },
            } as any;

            const userId = 'admin-456';
            const mockTemplate = '<html lang="">Reset Password Template</html>';
            mockOtherUtils.buildEmailTemplate.mockReturnValue(mockTemplate);

            const currentYear = new Date().getFullYear();
            const expectedLink = `${mockEnvConfigService.adminResetPasswordLink}${userId}`;

            service.sendResetPasswordMail(mockUser, userId);

            expect(mockLogger.info).toHaveBeenCalledWith(
                `Sending reset password email to ${mockUser.email}`,
            );
            expect(mockOtherUtils.buildEmailTemplate).toHaveBeenCalledWith(
                '../../../src/utils/templates/reset-password.hbs',
                {
                    link: expectedLink,
                    currentYear,
                },
            );
            expect(mockMailerService.emailSend).toHaveBeenCalledWith(
                mockUser.email,
                'Reset password',
                mockTemplate,
            );
        });

        it('should return void', () => {
            const mockUser: UserEntity = {
                email: 'user@example.com',
                role: { label: 'USER' },
            } as UserEntity;

            mockOtherUtils.buildEmailTemplate.mockReturnValue('<html lang=""></html>');

            const result = service.sendResetPasswordMail(mockUser, 'test-id');
            expect(result).toBeUndefined();
        });
    });
});
