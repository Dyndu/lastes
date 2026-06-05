import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ErrorHandlerService } from '../../../common/response';
import { UsersController } from './users.controller';
import { UsersService } from '../services';
import { UserStatusEnum } from '../../../common/enum';
import type { CurrentUserInterface } from '../../../interface';
import { UserRegisterDto, AdminRegisterDto, UserLoginDto } from '../dto';
import { EmailDto } from '../../../common/dto';
import { PermissionsGuard, JwtAuthGuard } from '../../../common/guard';
import { EnvConfigService } from '../../../utils/services/config';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('UsersController', () => {
    let controller: UsersController;

    const mockEnvConfigService = {
        sAdminRole: 'superadmin',
        adminRole: 'admin',
        userRole: 'user',
        supportRole: 'support',
    };

    const mockErrorHandlerService = {
        forbidden: jest.fn((_message, userMessage) => {
            throw new Error(userMessage);
        }),
    };

    const mockReflector = {
        get: jest.fn(),
    };

    const mockUsersService = {
        allAdminUsers: jest.fn(),
        userConnectedInfo: jest.fn(),
        ensureSuperAdminExist: jest.fn(),
        registerSuperAdmin: jest.fn(),
        registerAdmin: jest.fn(),
        registerUser: jest.fn(),
        loginUser: jest.fn(),
        verifyUserCode: jest.fn(),
        resendCode: jest.fn(),
        createResetPasswordRequest: jest.fn(),
        resetPassword: jest.fn(),
        updatePassword: jest.fn(),
        updateUserInfo: jest.fn(),
        updateAdminUser: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [
                {
                    provide: UsersService,
                    useValue: mockUsersService,
                },
                {
                    provide: EnvConfigService,
                    useValue: mockEnvConfigService,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandlerService,
                },
                {
                    provide: Reflector,
                    useValue: mockReflector,
                },
                {
                    provide: JwtAuthGuard,
                    useValue: { canActivate: jest.fn(() => true) },
                },
                {
                    provide: PermissionsGuard,
                    useValue: { canActivate: jest.fn(() => true) },
                },
            ],
        }).compile();

        controller = module.get<UsersController>(UsersController);
        module.get<UsersService>(UsersService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('allAdmins', () => {
        it('should return all admin users with default pagination', async () => {
            const mockResult = {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
            };
            mockUsersService.allAdminUsers.mockResolvedValue(mockResult);

            const result = await controller.allAdmins(1, 10);

            expect(result).toEqual(mockResult);
            expect(mockUsersService.allAdminUsers).toHaveBeenCalledWith(1, 10, {
                status: undefined,
                searchTerm: undefined,
            });
            expect(mockUsersService.allAdminUsers).toHaveBeenCalledTimes(1);
        });

        it('should handle custom page and limit parameters', async () => {
            const mockResult = {
                data: [],
                total: 0,
                page: 3,
                limit: 25,
            };
            mockUsersService.allAdminUsers.mockResolvedValue(mockResult);

            const result = await controller.allAdmins(3, 25);

            expect(result).toEqual(mockResult);
            expect(mockUsersService.allAdminUsers).toHaveBeenCalledWith(3, 25, {
                status: undefined,
                searchTerm: undefined,
            });
        });

        it('should filter by status', async () => {
            const mockResult = {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
            };
            mockUsersService.allAdminUsers.mockResolvedValue(mockResult);

            const result = await controller.allAdmins(1, 10, UserStatusEnum.ACTIVE);

            expect(result).toEqual(mockResult);
            expect(mockUsersService.allAdminUsers).toHaveBeenCalledWith(1, 10, {
                status: UserStatusEnum.ACTIVE,
                searchTerm: undefined,
            });
        });

        it('should filter by search term', async () => {
            const mockResult = {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
            };
            mockUsersService.allAdminUsers.mockResolvedValue(mockResult);

            const result = await controller.allAdmins(1, 10, undefined, 'john');

            expect(result).toEqual(mockResult);
            expect(mockUsersService.allAdminUsers).toHaveBeenCalledWith(1, 10, {
                status: undefined,
                searchTerm: 'john',
            });
        });

        it('should filter by both status and search term', async () => {
            const mockResult = {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
            };
            mockUsersService.allAdminUsers.mockResolvedValue(mockResult);

            const result = await controller.allAdmins(1, 10, UserStatusEnum.ACTIVE, 'jane');

            expect(result).toEqual(mockResult);
            expect(mockUsersService.allAdminUsers).toHaveBeenCalledWith(1, 10, {
                status: UserStatusEnum.ACTIVE,
                searchTerm: 'jane',
            });
        });

        it('should enforce minimum page value of 1', async () => {
            const mockResult = {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
            };
            mockUsersService.allAdminUsers.mockResolvedValue(mockResult);

            await controller.allAdmins(0, 10);

            expect(mockUsersService.allAdminUsers).toHaveBeenCalledWith(1, 10, {
                status: undefined,
                searchTerm: undefined,
            });
        });

        it('should enforce minimum page value of 1 for negative numbers', async () => {
            const mockResult = {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
            };
            mockUsersService.allAdminUsers.mockResolvedValue(mockResult);

            await controller.allAdmins(-5, 10);

            expect(mockUsersService.allAdminUsers).toHaveBeenCalledWith(1, 10, {
                status: undefined,
                searchTerm: undefined,
            });
        });

        it('should enforce maximum limit value of 100', async () => {
            const mockResult = {
                data: [],
                total: 0,
                page: 1,
                limit: 100,
            };
            mockUsersService.allAdminUsers.mockResolvedValue(mockResult);

            await controller.allAdmins(1, 150);

            expect(mockUsersService.allAdminUsers).toHaveBeenCalledWith(1, 100, {
                status: undefined,
                searchTerm: undefined,
            });
        });

        it('should enforce minimum limit value of 1', async () => {
            const mockResult = {
                data: [],
                total: 0,
                page: 1,
                limit: 1,
            };
            mockUsersService.allAdminUsers.mockResolvedValue(mockResult);

            await controller.allAdmins(1, 0);

            expect(mockUsersService.allAdminUsers).toHaveBeenCalledWith(1, 10, {
                status: undefined,
                searchTerm: undefined,
            });
        });

        it('should handle invalid page number and use default', async () => {
            const mockResult = {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
            };
            mockUsersService.allAdminUsers.mockResolvedValue(mockResult);

            await controller.allAdmins(NaN as any, 10);

            expect(mockUsersService.allAdminUsers).toHaveBeenCalledWith(1, 10, {
                status: undefined,
                searchTerm: undefined,
            });
        });

        it('should handle invalid limit number and use default', async () => {
            const mockResult = {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
            };
            mockUsersService.allAdminUsers.mockResolvedValue(mockResult);

            await controller.allAdmins(1, NaN as any);

            expect(mockUsersService.allAdminUsers).toHaveBeenCalledWith(1, 10, {
                status: undefined,
                searchTerm: undefined,
            });
        });
    });

    describe('getUserFromToken', () => {
        it('should return current user info', async () => {
            const mockUser: CurrentUserInterface = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                role: 'admin',
            } as any;

            const mockResult = {
                id: mockUser.id,
                role: mockUser.role,
            };

            mockUsersService.userConnectedInfo.mockResolvedValue(mockResult);

            const result = await controller.getUserFromToken(mockUser);

            expect(result).toEqual(mockResult);
            expect(mockUsersService.userConnectedInfo).toHaveBeenCalledWith(mockUser);
            expect(mockUsersService.userConnectedInfo).toHaveBeenCalledTimes(1);
        });

        it('should handle different user data', async () => {
            const mockUser: CurrentUserInterface = {
                id: '987e6543-e21b-12d3-a456-426614174999',
                role: 'user',
            } as any;

            const mockResult = {
                id: mockUser.id,
                role: mockUser.role,
            };

            mockUsersService.userConnectedInfo.mockResolvedValue(mockResult);

            const result = await controller.getUserFromToken(mockUser);

            expect(result).toEqual(mockResult);
            expect(mockUsersService.userConnectedInfo).toHaveBeenCalledWith(mockUser);
        });
    });

    describe('hasSuperAdmin', () => {
        it('should return true when super admin exists', async () => {
            mockUsersService.ensureSuperAdminExist.mockResolvedValue(true);

            const result = await controller.hasSuperAdmin();

            expect(result).toBe(true);
            expect(mockUsersService.ensureSuperAdminExist).toHaveBeenCalledTimes(1);
            expect(mockUsersService.ensureSuperAdminExist).toHaveBeenCalledWith();
        });

        it('should return false when super admin does not exist', async () => {
            mockUsersService.ensureSuperAdminExist.mockResolvedValue(false);

            const result = await controller.hasSuperAdmin();

            expect(result).toBe(false);
            expect(mockUsersService.ensureSuperAdminExist).toHaveBeenCalledTimes(1);
        });
    });

    describe('registerSAdmin', () => {
        it('should successfully register a super admin', async () => {
            const createUserDto: UserRegisterDto = {
                email: 'superadmin@example.com',
                password: 'StrongPass123!',
                fullname: 'Peter John',
                confirmPassword: 'StrongPass123!',
            };

            const mockResult = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                email: createUserDto.email,
                fullname: createUserDto.fullname,
                confirmPassword: createUserDto.confirmPassword,
                message: 'Super admin created successfully',
            };

            mockUsersService.registerSuperAdmin.mockResolvedValue(mockResult);

            const result = await controller.registerSAdmin(createUserDto);

            expect(result).toEqual(mockResult);
            expect(mockUsersService.registerSuperAdmin).toHaveBeenCalledWith(createUserDto);
            expect(mockUsersService.registerSuperAdmin).toHaveBeenCalledTimes(1);
        });

        it('should handle registration with different user data', async () => {
            const createUserDto: UserRegisterDto = {
                email: 'admin@test.com',
                password: 'AnotherPass456!',
                fullname: 'Peter John',
                confirmPassword: 'StrongPass123!',
            };

            const mockResult = {
                id: '987e6543-e21b-12d3-a456-426614174999',
                email: createUserDto.email,
                fullname: createUserDto.fullname,
                confirmPassword: createUserDto.confirmPassword,
                message: 'Super admin created successfully',
            };

            mockUsersService.registerSuperAdmin.mockResolvedValue(mockResult);

            const result = await controller.registerSAdmin(createUserDto);

            expect(result).toEqual(mockResult);
            expect(mockUsersService.registerSuperAdmin).toHaveBeenCalledWith(createUserDto);
        });
    });

    describe('registerAdmin', () => {
        it('should successfully register an admin user', async () => {
            const createAdminDto: AdminRegisterDto = {
                email: 'admin@example.com',
                role: 'admin',
                isAuthorized: true,
            } as AdminRegisterDto;

            const mockResult = {
                id: '123e4567-e89b-12d3-a456-426614174002',
                email: createAdminDto.email,
                role: createAdminDto.role,
                isAuthorized: createAdminDto.isAuthorized,
                message: 'Admin user created successfully',
            };

            mockUsersService.registerAdmin.mockResolvedValue(mockResult);

            const result = await controller.registerAdmin(createAdminDto);

            expect(result).toEqual(mockResult);
            expect(mockUsersService.registerAdmin).toHaveBeenCalledWith(createAdminDto);
            expect(mockUsersService.registerAdmin).toHaveBeenCalledTimes(1);
        });

        it('should handle admin registration with full data', async () => {
            const createAdminDto: AdminRegisterDto = {
                email: 'support@example.com',
                role: 'admin',
                isAuthorized: true,
            } as AdminRegisterDto;

            const mockResult = {
                id: '321e7654-e89b-12d3-a456-426614174005',
                email: createAdminDto.email,
                role: createAdminDto.role,
                isAuthorized: createAdminDto.isAuthorized,
                message: 'Admin user created successfully',
            };

            mockUsersService.registerAdmin.mockResolvedValue(mockResult);

            const result = await controller.registerAdmin(createAdminDto);

            expect(result).toEqual(mockResult);
            expect(mockUsersService.registerAdmin).toHaveBeenCalledWith(createAdminDto);
        });
    });

    describe('register', () => {
        it('should successfully register a regular user', async () => {
            const createUserDto: UserRegisterDto = {
                email: 'user@example.com',
                password: 'UserPass123!',
                confirmPassword: 'ConfirmPassword',
                fullname: 'New',
            };

            const mockResult = {
                id: '123e4567-e89b-12d3-a456-426614174006',
                email: createUserDto.email,
                fullname: createUserDto.fullname,
                confirmPassword: createUserDto.confirmPassword,
                message: 'User created successfully',
            };

            mockUsersService.registerUser.mockResolvedValue(mockResult);

            const result = await controller.register(createUserDto);

            expect(result).toEqual(mockResult);
            expect(mockUsersService.registerUser).toHaveBeenCalledWith(createUserDto);
            expect(mockUsersService.registerUser).toHaveBeenCalledTimes(1);
        });

        it('should handle user registration with additional fields', async () => {
            const createUserDto: UserRegisterDto = {
                email: 'newuser@example.com',
                password: 'NewUserPass456!',
                confirmPassword: 'ConfirmPassword',
                fullname: 'New',
            };

            const mockResult = {
                id: '987e6543-e21b-12d3-a456-426614174007',
                email: createUserDto.email,
                fullname: createUserDto.fullname,
                confirmPassword: createUserDto.confirmPassword,
                message: 'User created successfully',
            };

            mockUsersService.registerUser.mockResolvedValue(mockResult);

            const result = await controller.register(createUserDto);

            expect(result).toEqual(mockResult);
            expect(mockUsersService.registerUser).toHaveBeenCalledWith(createUserDto);
        });
    });

    describe('login', () => {
        it('should successfully login a user', async () => {
            const loginDto: UserLoginDto = {
                email: 'user@example.com',
                password: 'UserPass123!',
            };

            const mockResult = {
                accessToken: 'jwt-token-here',
                user: {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    email: loginDto.email,
                },
            };

            mockUsersService.loginUser.mockResolvedValue(mockResult);

            const result = await controller.login(loginDto);

            expect(result).toEqual(mockResult);
            expect(mockUsersService.loginUser).toHaveBeenCalledWith(loginDto);
            expect(mockUsersService.loginUser).toHaveBeenCalledTimes(1);
        });

        it('should handle login with different credentials', async () => {
            const loginDto: UserLoginDto = {
                email: 'admin@example.com',
                password: 'AdminPass456!',
            };

            const mockResult = {
                accessToken: 'another-jwt-token',
                user: {
                    id: '987e6543-e21b-12d3-a456-426614174999',
                    email: loginDto.email,
                },
            };

            mockUsersService.loginUser.mockResolvedValue(mockResult);

            const result = await controller.login(loginDto);

            expect(result).toEqual(mockResult);
            expect(mockUsersService.loginUser).toHaveBeenCalledWith(loginDto);
        });

        it('should pass exact login DTO to service', async () => {
            const loginDto: UserLoginDto = {
                email: 'test@test.com',
                password: 'Test123!',
            };

            mockUsersService.loginUser.mockResolvedValue({});

            await controller.login(loginDto);

            expect(mockUsersService.loginUser).toHaveBeenCalledWith(loginDto);
        });
    });

    describe('verifyUserCode', () => {
        it('should verify user code with user agent and ip from request', async () => {
            const verifyCodeDto = {
                email: 'user@example.com',
                code: '123456',
            };

            const mockReq = {
                headers: {
                    'user-agent': 'Mozilla/5.0 Chrome/91.0',
                },
                ip: '192.168.1.1',
                connection: {
                    remoteAddress: '192.168.1.100',
                },
            };

            const mockResult = {
                message: 'Code verified successfully',
                accessToken: 'jwt-token',
            };

            mockUsersService.verifyUserCode.mockResolvedValue(mockResult);

            const result = await controller.verifyUserCode(mockReq, verifyCodeDto);

            expect(result).toEqual(mockResult);
            expect(mockUsersService.verifyUserCode).toHaveBeenCalledWith(
                verifyCodeDto,
                'Mozilla/5.0 Chrome/91.0',
                '192.168.1.1',
            );
            expect(mockUsersService.verifyUserCode).toHaveBeenCalledTimes(1);
        });

        it('should use connection.remoteAddress when req.ip is undefined', async () => {
            const verifyCodeDto = {
                email: 'test@example.com',
                code: '654321',
            };

            const mockReq = {
                headers: {
                    'user-agent': 'Safari/14.0',
                },
                ip: undefined,
                connection: {
                    remoteAddress: '10.0.0.1',
                },
            };

            mockUsersService.verifyUserCode.mockResolvedValue({});

            await controller.verifyUserCode(mockReq, verifyCodeDto);

            expect(mockUsersService.verifyUserCode).toHaveBeenCalledWith(
                verifyCodeDto,
                'Safari/14.0',
                '10.0.0.1',
            );
        });

        it('should handle missing user-agent header', async () => {
            const verifyCodeDto = {
                email: 'user@test.com',
                code: '111111',
            };

            const mockReq = {
                headers: {},
                ip: '172.16.0.1',
                connection: {
                    remoteAddress: '172.16.0.2',
                },
            };

            mockUsersService.verifyUserCode.mockResolvedValue({});

            await controller.verifyUserCode(mockReq, verifyCodeDto);

            expect(mockUsersService.verifyUserCode).toHaveBeenCalledWith(
                verifyCodeDto,
                undefined,
                '172.16.0.1',
            );
        });

        it('should handle both ip and connection.remoteAddress being undefined', async () => {
            const verifyCodeDto = {
                email: 'user@test.com',
                code: '999999',
            };

            const mockReq = {
                headers: {
                    'user-agent': 'Edge/90.0',
                },
                ip: undefined,
                connection: {
                    remoteAddress: undefined,
                },
            };

            mockUsersService.verifyUserCode.mockResolvedValue({});

            await controller.verifyUserCode(mockReq, verifyCodeDto);

            expect(mockUsersService.verifyUserCode).toHaveBeenCalledWith(
                verifyCodeDto,
                'Edge/90.0',
                undefined,
            );
        });
    });

    describe('askForNewOtp', () => {
        it('should request new OTP for user email', async () => {
            const emailDto: EmailDto = {
                email: 'user@example.com',
            };

            const mockResult = {
                message: 'OTP sent successfully',
            };

            mockUsersService.resendCode.mockResolvedValue(mockResult);

            const result = await controller.askForNewOtp(emailDto);

            expect(result).toEqual(mockResult);
            expect(mockUsersService.resendCode).toHaveBeenCalledWith('user@example.com');
            expect(mockUsersService.resendCode).toHaveBeenCalledTimes(1);
        });

        it('should handle different email addresses', async () => {
            const emailDto: EmailDto = {
                email: 'admin@test.com',
            };

            const mockResult = {
                message: 'New OTP sent',
            };

            mockUsersService.resendCode.mockResolvedValue(mockResult);

            const result = await controller.askForNewOtp(emailDto);

            expect(result).toEqual(mockResult);
            expect(mockUsersService.resendCode).toHaveBeenCalledWith('admin@test.com');
        });
    });

    describe('forgotPassword', () => {
        it('should create reset password request', async () => {
            const emailDto: EmailDto = {
                email: 'user@example.com',
            };

            const mockResult = {
                message: 'Reset password link sent to email',
            };

            mockUsersService.createResetPasswordRequest.mockResolvedValue(mockResult);

            const result = await controller.forgotPassword(emailDto);

            expect(result).toEqual(mockResult);
            expect(mockUsersService.createResetPasswordRequest).toHaveBeenCalledWith(
                'user@example.com',
            );
            expect(mockUsersService.createResetPasswordRequest).toHaveBeenCalledTimes(1);
        });

        it('should handle different email for password reset', async () => {
            const emailDto: EmailDto = {
                email: 'forgot@test.com',
            };

            const mockResult = {
                message: 'Password reset email sent',
            };

            mockUsersService.createResetPasswordRequest.mockResolvedValue(mockResult);

            const result = await controller.forgotPassword(emailDto);

            expect(result).toEqual(mockResult);
            expect(mockUsersService.createResetPasswordRequest).toHaveBeenCalledWith(
                'forgot@test.com',
            );
        });
    });

    describe('resetPassword', () => {
        it('should reset password with valid id and dto', async () => {
            const resetId = '30ac88d4-7ffe-418c-9551-66eeec2e6783';
            const resetPasswordDto = {
                password: 'NewPassword123!',
                confirmPassword: 'NewPassword123!',
            };

            const mockResult = {
                message: 'Password reset successfully',
            };

            mockUsersService.resetPassword.mockResolvedValue(mockResult);

            const result = await controller.resetPassword(resetId, resetPasswordDto as any);

            expect(result).toEqual(mockResult);
            expect(mockUsersService.resetPassword).toHaveBeenCalledWith(resetId, resetPasswordDto);
            expect(mockUsersService.resetPassword).toHaveBeenCalledTimes(1);
        });

        it('should handle different reset password data', async () => {
            const resetId = '987e6543-e21b-12d3-a456-426614174888';
            const resetPasswordDto = {
                password: 'AnotherPass456!',
                confirmPassword: 'AnotherPass456!',
            };

            const mockResult = {
                message: 'Password changed successfully',
            };

            mockUsersService.resetPassword.mockResolvedValue(mockResult);

            const result = await controller.resetPassword(resetId, resetPasswordDto as any);

            expect(result).toEqual(mockResult);
            expect(mockUsersService.resetPassword).toHaveBeenCalledWith(resetId, resetPasswordDto);
        });
    });

    describe('updatePassword', () => {
        it('should update password for authenticated user', async () => {
            const mockUser: CurrentUserInterface = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                email: 'user@example.com',
            } as any;

            const passwordChangeDto = {
                currentPassword: 'OldPass123!',
                newPassword: 'NewPass456!',
                confirmPassword: 'NewPass456!',
            };

            const mockResult = {
                message: 'Password updated successfully',
            };

            mockUsersService.updatePassword.mockResolvedValue(mockResult);

            const result = await controller.updatePassword(mockUser, passwordChangeDto as any);

            expect(result).toEqual(mockResult);
            expect(mockUsersService.updatePassword).toHaveBeenCalledWith(
                '123e4567-e89b-12d3-a456-426614174000',
                passwordChangeDto,
            );
            expect(mockUsersService.updatePassword).toHaveBeenCalledTimes(1);
        });

        it('should handle password update for different user', async () => {
            const mockUser: CurrentUserInterface = {
                id: '987e6543-e21b-12d3-a456-426614174999',
                email: 'admin@example.com',
            } as any;

            const passwordChangeDto = {
                currentPassword: 'CurrentPass123!',
                newPassword: 'BrandNewPass789!',
                confirmPassword: 'BrandNewPass789!',
            };

            const mockResult = {
                message: 'Password changed',
            };

            mockUsersService.updatePassword.mockResolvedValue(mockResult);

            const result = await controller.updatePassword(mockUser, passwordChangeDto as any);

            expect(result).toEqual(mockResult);
            expect(mockUsersService.updatePassword).toHaveBeenCalledWith(
                '987e6543-e21b-12d3-a456-426614174999',
                passwordChangeDto,
            );
        });
    });

    describe('updateUserInfos', () => {
        it('should update user information for authenticated user', async () => {
            const mockUser: CurrentUserInterface = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                email: 'user@example.com',
            } as any;

            const updateDto = {
                fullname: 'Updated Name',
                phoneNumber: '+1234567890',
            };

            const mockResult = {
                id: mockUser.id,
                fullname: 'Updated Name',
                phoneNumber: '+1234567890',
                message: 'Information updated successfully',
            };

            mockUsersService.updateUserInfo.mockResolvedValue(mockResult);

            const result = await controller.updateUserInfos(mockUser, updateDto as any);

            expect(result).toEqual(mockResult);
            expect(mockUsersService.updateUserInfo).toHaveBeenCalledWith(mockUser, updateDto);
            expect(mockUsersService.updateUserInfo).toHaveBeenCalledTimes(1);
        });

        it('should handle partial user info updates', async () => {
            const mockUser: CurrentUserInterface = {
                id: '987e6543-e21b-12d3-a456-426614174999',
                email: 'test@example.com',
            } as any;

            const updateDto = {
                fullname: 'John Doe',
            };

            const mockResult = {
                id: mockUser.id,
                fullname: 'John Doe',
                message: 'Profile updated',
            };

            mockUsersService.updateUserInfo.mockResolvedValue(mockResult);

            const result = await controller.updateUserInfos(mockUser, updateDto as any);

            expect(result).toEqual(mockResult);
            expect(mockUsersService.updateUserInfo).toHaveBeenCalledWith(mockUser, updateDto);
        });
    });

    describe('updateAdminInfos', () => {
        it('should update admin user information by id', async () => {
            const adminId = '30ac88d4-7ffe-418c-9551-66eeec2e6783';
            const updateDto = {
                role: 'super_admin',
                isAuthorized: true,
            };

            const mockResult = {
                id: adminId,
                role: 'super_admin',
                isAuthorized: true,
                message: 'Admin updated successfully',
            };

            mockUsersService.updateAdminUser.mockResolvedValue(mockResult);

            const result = await controller.updateAdminInfos(adminId, updateDto as any);

            expect(result).toEqual(mockResult);
            expect(mockUsersService.updateAdminUser).toHaveBeenCalledWith(adminId, updateDto);
            expect(mockUsersService.updateAdminUser).toHaveBeenCalledTimes(1);
        });

        it('should handle different admin update scenarios', async () => {
            const adminId = '987e6543-e21b-12d3-a456-426614174777';
            const updateDto = {
                role: 'support',
                isAuthorized: false,
            };

            const mockResult = {
                id: adminId,
                role: 'support',
                isAuthorized: false,
                message: 'Admin info updated',
            };

            mockUsersService.updateAdminUser.mockResolvedValue(mockResult);

            const result = await controller.updateAdminInfos(adminId, updateDto as any);

            expect(result).toEqual(mockResult);
            expect(mockUsersService.updateAdminUser).toHaveBeenCalledWith(adminId, updateDto);
        });
    });
});
