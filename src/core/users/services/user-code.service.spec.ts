import { Test, TestingModule } from '@nestjs/testing';
import { UserCodeService } from './user-code.service';
import { UsersService } from './users.service';
import { UsersCodeEntity } from '../entities/user-code.entity';
import { UserEntity } from '../entities/user.entity';
import { VerifyUserCodeDto } from '../dto';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('UserCodeService', () => {
    let service: UserCodeService;

    const mockLogger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    };

    const mockErrorHandlerService = {
        notFound: jest.fn((_message: string, userMessage: string) => {
            throw new Error(userMessage);
        }),
        badRequest: jest.fn((_message: string, userMessage: string) => {
            throw new Error(userMessage);
        }),
        conflict: jest.fn((_message: string, userMessage: string) => {
            throw new Error(userMessage);
        }),
    };

    const mockUserCodeRepo = {
        findOne: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockHashService = {
        comparePassword: jest.fn(),
        hashPassword: jest.fn(),
    };

    const mockOtherUtils = {
        generateNumber: jest.fn(),
    };

    const mockUsersService = {
        logger: mockLogger,
        errorHandlerService: mockErrorHandlerService,
        userCodeRepo: mockUserCodeRepo,
        hashService: mockHashService,
        otherUtils: mockOtherUtils,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserCodeService,
                {
                    provide: UsersService,
                    useValue: mockUsersService,
                },
            ],
        }).compile();

        service = module.get<UserCodeService>(UserCodeService);
        module.get(UsersService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getUserCodeByUserId', () => {
        const userId = 'user-123';

        it('should return user code when found', async () => {
            const mockUserCode = {
                id: 'code-123',
                code: 'hashed-code',
                user: { id: userId },
                deleted: false,
            } as UsersCodeEntity;

            mockUserCodeRepo.findOne.mockResolvedValue(mockUserCode);

            const result = await service.getUserCodeByUserId(userId);

            expect(mockLogger.info).toHaveBeenCalledWith(
                `Searching for user code with user id: ${userId}`,
            );
            expect(mockUserCodeRepo.findOne).toHaveBeenCalledWith({
                where: { user: { id: userId }, deleted: false },
                relations: ['user'],
            });
            expect(result).toEqual(mockUserCode);
        });

        it('should throw error when user code not found', async () => {
            mockUserCodeRepo.findOne.mockResolvedValue(null);

            await expect(service.getUserCodeByUserId(userId)).rejects.toThrow('OTP not found');

            expect(mockErrorHandlerService.notFound).toHaveBeenCalledWith(
                `User code with user id ${userId} not found`,
                'OTP not found',
            );
        });

        it('should log info before searching', async () => {
            mockUserCodeRepo.findOne.mockResolvedValue({
                id: 'code-123',
            } as UsersCodeEntity);

            await service.getUserCodeByUserId(userId);

            expect(mockLogger.info).toHaveBeenCalledWith(
                `Searching for user code with user id: ${userId}`,
            );
        });

        it('should handle different user IDs', async () => {
            const differentUserId = 'user-456';
            mockUserCodeRepo.findOne.mockResolvedValue({
                id: 'code-456',
            } as UsersCodeEntity);

            await service.getUserCodeByUserId(differentUserId);

            expect(mockUserCodeRepo.findOne).toHaveBeenCalledWith({
                where: { user: { id: differentUserId }, deleted: false },
                relations: ['user'],
            });
        });
    });

    describe('getUserCodeByUserEmail', () => {
        const email = 'test@example.com';

        it('should return user code when found', async () => {
            const mockUserCode = {
                id: 'code-123',
                code: 'hashed-code',
                user: { email, deleted: false },
                deleted: false,
            } as UsersCodeEntity;

            mockUserCodeRepo.findOne.mockResolvedValue(mockUserCode);

            const result = await service.getUserCodeByUserEmail(email);

            expect(mockLogger.info).toHaveBeenCalledWith(
                `Searching for user code with user email: ${email}`,
            );
            expect(mockUserCodeRepo.findOne).toHaveBeenCalledWith({
                where: {
                    user: { email: email.trim(), deleted: false },
                    deleted: false,
                },
                relations: ['user'],
            });
            expect(result).toEqual(mockUserCode);
        });

        it('should trim email before searching', async () => {
            const emailWithSpaces = '  test@example.com  ';
            mockUserCodeRepo.findOne.mockResolvedValue({
                id: 'code-123',
            } as UsersCodeEntity);

            await service.getUserCodeByUserEmail(emailWithSpaces);

            expect(mockUserCodeRepo.findOne).toHaveBeenCalledWith({
                where: {
                    user: { email: 'test@example.com', deleted: false },
                    deleted: false,
                },
                relations: ['user'],
            });
        });

        it('should throw error when user code not found', async () => {
            mockUserCodeRepo.findOne.mockResolvedValue(null);

            await expect(service.getUserCodeByUserEmail(email)).rejects.toThrow('OTP not found');

            expect(mockErrorHandlerService.notFound).toHaveBeenCalledWith(
                `User code with user email ${email} not found`,
                'OTP not found',
            );
        });
    });

    describe('verifyUserCode', () => {
        const verifyDto: VerifyUserCodeDto = {
            email: 'test@example.com',
            code: '123456',
        };

        it('should verify valid user code successfully', async () => {
            const mockUserCode = {
                id: 'code-123',
                code: 'hashed-code',
                expireAt: new Date(Date.now() + 60000),
                user: { email: verifyDto.email },
            } as UsersCodeEntity;

            const getUserCodeByUserEmailSpy = jest
                .spyOn(service, 'getUserCodeByUserEmail')
                .mockResolvedValue(mockUserCode);
            mockHashService.comparePassword.mockResolvedValue(true);

            const result = await service.verifyUserCode(verifyDto);

            expect(mockLogger.info).toHaveBeenCalledWith(
                `Verifying user code with data: ${JSON.stringify(verifyDto)}`,
            );
            expect(getUserCodeByUserEmailSpy).toHaveBeenCalledWith(verifyDto.email);
            expect(mockHashService.comparePassword).toHaveBeenCalledWith(
                verifyDto.code,
                mockUserCode.code,
            );
            expect(result).toEqual(mockUserCode);
        });

        it('should throw error when code has expired', async () => {
            const expiredDate = new Date(Date.now() - 60000);
            const mockUserCode = {
                id: 'code-123',
                code: 'hashed-code',
                expireAt: expiredDate,
                user: { email: verifyDto.email },
            } as UsersCodeEntity;

            jest.spyOn(service, 'getUserCodeByUserEmail').mockResolvedValue(mockUserCode);

            await expect(service.verifyUserCode(verifyDto)).rejects.toThrow('OTP expired');

            expect(mockErrorHandlerService.badRequest).toHaveBeenCalledWith(
                `User code has expired at ${expiredDate.toISOString()}`,
                'OTP expired',
            );
        });

        it('should throw error when code does not match', async () => {
            const mockUserCode = {
                id: 'code-123',
                code: 'hashed-code',
                expireAt: new Date(Date.now() + 60000),
                user: { email: verifyDto.email },
            } as UsersCodeEntity;

            jest.spyOn(service, 'getUserCodeByUserEmail').mockResolvedValue(mockUserCode);
            mockHashService.comparePassword.mockResolvedValue(false);

            await expect(service.verifyUserCode(verifyDto)).rejects.toThrow('Invalid OTP');

            expect(mockErrorHandlerService.badRequest).toHaveBeenCalledWith(
                'User code is not valid',
                'Invalid OTP',
            );
        });

        it('should log verification attempt', async () => {
            const mockUserCode = {
                id: 'code-123',
                code: 'hashed-code',
                expireAt: new Date(Date.now() + 60000),
                user: { email: verifyDto.email },
            } as UsersCodeEntity;

            jest.spyOn(service, 'getUserCodeByUserEmail').mockResolvedValue(mockUserCode);
            mockHashService.comparePassword.mockResolvedValue(true);

            await service.verifyUserCode(verifyDto);

            expect(mockLogger.info).toHaveBeenCalledWith(
                `Verifying user code with data: ${JSON.stringify(verifyDto)}`,
            );
        });
    });

    describe('incrementCountAndSetDelayDate', () => {
        const mockUser = { id: 'user-123' } as UserEntity;

        it('should increment count and generate new code when count is less than 5', async () => {
            const userCode = {
                id: 'code-123',
                count: 2,
                code: 'old-hashed-code',
                user: mockUser,
            } as UsersCodeEntity;

            const newCode = '654321';
            mockOtherUtils.generateNumber.mockReturnValue(newCode);
            mockHashService.hashPassword.mockResolvedValue('new-hashed-code');
            mockUserCodeRepo.update.mockResolvedValue({ affected: 1 });

            const updatedUserCode = {
                ...userCode,
                count: 3,
                code: 'new-hashed-code',
                expireAt: expect.any(Date),
            };
            jest.spyOn(service, 'getUserCodeByUserId').mockResolvedValue(updatedUserCode);

            const result = await service.incrementCountAndSetDelayDate(userCode);

            expect(mockLogger.info).toHaveBeenCalledWith(
                'Incrementing user code count and setting delay date',
            );
            expect(userCode.count).toBe(3);
            expect(mockOtherUtils.generateNumber).toHaveBeenCalledWith(6);
            expect(mockHashService.hashPassword).toHaveBeenCalledWith(newCode);
            expect(userCode.code).toBe('new-hashed-code');
            expect(userCode.expireAt).toBeInstanceOf(Date);
            expect(userCode.delayDate).toBeUndefined();
            expect(mockUserCodeRepo.update).toHaveBeenCalledWith({ id: userCode.id }, userCode);
            expect(result.code).toBe(newCode);
            expect(result.data).toEqual(updatedUserCode);
        });

        it('should set delay date when count reaches 5', async () => {
            const userCode = {
                id: 'code-123',
                count: 4,
                code: 'old-hashed-code',
                user: mockUser,
            } as UsersCodeEntity;

            mockOtherUtils.generateNumber.mockReturnValue('123456');
            mockHashService.hashPassword.mockResolvedValue('new-hashed-code');
            mockUserCodeRepo.update.mockResolvedValue({ affected: 1 });

            const updatedUserCode = {
                ...userCode,
                count: 5,
                delayDate: expect.any(Date),
            };
            jest.spyOn(service, 'getUserCodeByUserId').mockResolvedValue(updatedUserCode);

            await service.incrementCountAndSetDelayDate(userCode);

            expect(userCode.count).toBe(5);
            expect(userCode.delayDate).toBeInstanceOf(Date);
            expect(mockLogger.info).toHaveBeenCalledWith(
                'User code count is 5, setting delay date',
            );
        });

        it('should set expireAt to 6 minutes from now', async () => {
            const userCode = {
                id: 'code-123',
                count: 1,
                user: mockUser,
            } as UsersCodeEntity;

            mockOtherUtils.generateNumber.mockReturnValue('123457');
            mockHashService.hashPassword.mockResolvedValue('hashed-code');
            mockUserCodeRepo.update.mockResolvedValue({ affected: 1 });
            jest.spyOn(service, 'getUserCodeByUserId').mockResolvedValue(userCode);

            const beforeCall = Date.now();
            await service.incrementCountAndSetDelayDate(userCode);
            const afterCall = Date.now();

            const expectedExpireTime = 6 * 60 * 1000;
            const actualExpireTime = userCode.expireAt.getTime() - beforeCall;

            expect(actualExpireTime).toBeGreaterThanOrEqual(expectedExpireTime - 100);
            expect(actualExpireTime).toBeLessThanOrEqual(
                expectedExpireTime + (afterCall - beforeCall) + 100,
            );
        });

        it('should set delay date to 24 hours from now when count is 5', async () => {
            const userCode = {
                id: 'code-123',
                count: 4,
                user: mockUser,
            } as UsersCodeEntity;

            mockOtherUtils.generateNumber.mockReturnValue('123456');
            mockHashService.hashPassword.mockResolvedValue('hashed-code');
            mockUserCodeRepo.update.mockResolvedValue({ affected: 1 });
            jest.spyOn(service, 'getUserCodeByUserId').mockResolvedValue(userCode);

            const beforeCall = Date.now();
            await service.incrementCountAndSetDelayDate(userCode);
            const afterCall = Date.now();

            const expectedDelayTime = 24 * 60 * 60 * 1000;
            const actualDelayTime = userCode.delayDate!.getTime() - beforeCall;

            expect(actualDelayTime).toBeGreaterThanOrEqual(expectedDelayTime - 100);
            expect(actualDelayTime).toBeLessThanOrEqual(
                expectedDelayTime + (afterCall - beforeCall) + 100,
            );
        });
    });

    describe('createUserCode', () => {
        const mockUser = {
            id: 'user-123',
            email: 'test@example.com',
        } as UserEntity;

        it('should create new user code when none exists', async () => {
            const generatedCode = '123456';
            const savedUserCode = {
                id: 'code-123',
                code: 'hashed-code',
                user: mockUser,
                rememberMe: false,
                expireAt: expect.any(Date),
            } as UsersCodeEntity;

            mockUserCodeRepo.findOne.mockResolvedValue(null);
            mockOtherUtils.generateNumber.mockReturnValue(generatedCode);
            mockHashService.hashPassword.mockResolvedValue('hashed-code');
            mockUserCodeRepo.save.mockResolvedValue(savedUserCode);

            const result = await service.createUserCode(mockUser, false);

            expect(mockLogger.info).toHaveBeenCalledWith(
                `Creating user code with data: ${mockUser.id}`,
            );
            expect(mockUserCodeRepo.findOne).toHaveBeenCalledWith({
                where: { user: { id: mockUser.id }, deleted: false },
            });
            expect(mockOtherUtils.generateNumber).toHaveBeenCalledWith(6);
            expect(mockHashService.hashPassword).toHaveBeenCalledWith(generatedCode);
            const saveCall = mockUserCodeRepo.save.mock.calls[0][0];
            expect(saveCall.user).toEqual(mockUser);
            expect(saveCall.rememberMe).toBe(false);
            expect(saveCall.expireAt).toBeInstanceOf(Date);
            expect(result.code).toBe(generatedCode);
            expect(result.data).toEqual(savedUserCode);
        });

        it('should call askNewCode when user code already exists', async () => {
            const existingCode = {
                id: 'code-123',
                user: mockUser,
            } as UsersCodeEntity;

            const askNewCodeResult = {
                data: existingCode,
                code: '654321',
            };

            mockUserCodeRepo.findOne.mockResolvedValue(existingCode);
            const askNewCodeSpy = jest
                .spyOn(service, 'askNewCode')
                .mockResolvedValue(askNewCodeResult);

            const result = await service.createUserCode(mockUser, true);

            expect(askNewCodeSpy).toHaveBeenCalledWith(mockUser);
            expect(result).toEqual(askNewCodeResult);
        });

        it('should set rememberMe to true when provided', async () => {
            mockUserCodeRepo.findOne.mockResolvedValue(null);
            mockOtherUtils.generateNumber.mockReturnValue('123456');
            mockHashService.hashPassword.mockResolvedValue('hashed-code');
            const savedUserCode = {
                id: 'code-123',
                rememberMe: true,
            } as UsersCodeEntity;
            mockUserCodeRepo.save.mockResolvedValue(savedUserCode);

            const result = await service.createUserCode(mockUser, true);

            expect(result.data.rememberMe).toBe(true);
        });

        it('should set rememberMe to false when provided', async () => {
            mockUserCodeRepo.findOne.mockResolvedValue(null);
            mockOtherUtils.generateNumber.mockReturnValue('123456');
            mockHashService.hashPassword.mockResolvedValue('hashed-code');
            const savedUserCode = {
                id: 'code-123',
                rememberMe: false,
            } as UsersCodeEntity;
            mockUserCodeRepo.save.mockResolvedValue(savedUserCode);

            const result = await service.createUserCode(mockUser, false);

            expect(result.data.rememberMe).toBe(false);
        });
    });

    describe('askNewCode', () => {
        const mockUser = {
            id: 'user-123',
            email: 'test@example.com',
        } as UserEntity;

        it('should increment count when no delay date is set and count is less than 5', async () => {
            const userCode = {
                id: 'code-123',
                count: 2,
                delayDate: null,
                user: mockUser,
            } as any;

            const incrementResult = {
                data: userCode,
                code: '123456',
            };

            jest.spyOn(service, 'getUserCodeByUserId').mockResolvedValue(userCode);
            const incrementSpy = jest
                .spyOn(service, 'incrementCountAndSetDelayDate')
                .mockResolvedValue(incrementResult);

            const result = await service.askNewCode(mockUser);

            expect(mockLogger.info).toHaveBeenCalledWith(
                'User code count is less than 5, incrementing count',
            );
            expect(incrementSpy).toHaveBeenCalledWith(userCode);
            expect(result).toEqual(incrementResult);
        });

        it('should throw conflict error when delay date is in future', async () => {
            const futureDate = new Date(Date.now() + 10 * 60 * 60 * 1000);
            const userCode = {
                id: 'code-123',
                delayDate: futureDate,
                user: mockUser,
            } as UsersCodeEntity;

            jest.spyOn(service, 'getUserCodeByUserId').mockResolvedValue(userCode);

            await expect(service.askNewCode(mockUser)).rejects.toThrow();

            expect(mockLogger.warn).toHaveBeenCalledWith('User must wait until delay date');
            expect(mockErrorHandlerService.conflict).toHaveBeenCalled();
        });

        it('should calculate correct delay hours when throwing conflict', async () => {
            const hoursToWait = 5;
            const futureDate = new Date(Date.now() + hoursToWait * 60 * 60 * 1000);
            const userCode = {
                id: 'code-123',
                delayDate: futureDate,
                user: mockUser,
            } as UsersCodeEntity;

            jest.spyOn(service, 'getUserCodeByUserId').mockResolvedValue(userCode);

            await expect(service.askNewCode(mockUser)).rejects.toThrow();

            const conflictCall = mockErrorHandlerService.conflict.mock.calls[0];
            expect(conflictCall[0]).toContain(`retry in ${hoursToWait} hours`);
        });

        it('should reset count and delay when delay date has passed', async () => {
            const pastDate = new Date(Date.now() - 60000);
            const userCode = {
                id: 'code-123',
                count: 5,
                delayDate: pastDate,
                user: mockUser,
            } as UsersCodeEntity;

            const incrementResult = {
                data: userCode,
                code: '123456',
            };

            jest.spyOn(service, 'getUserCodeByUserId').mockResolvedValue(userCode);
            const incrementSpy = jest
                .spyOn(service, 'incrementCountAndSetDelayDate')
                .mockResolvedValue(incrementResult);

            await service.askNewCode(mockUser);

            expect(mockLogger.info).toHaveBeenCalledWith(
                'User code delay date has passed, resetting count and delay date',
            );
            expect(userCode.delayDate).toBeNull();
            expect(userCode.count).toBe(0);
            expect(incrementSpy).toHaveBeenCalledWith(userCode);
        });

        it('should handle case when delay date is null and count is exactly 5', async () => {
            const userCode = {
                id: 'code-123',
                count: 5,
                delayDate: null,
                user: mockUser,
            } as any;

            const incrementResult = {
                data: userCode,
                code: '123456',
            };

            jest.spyOn(service, 'getUserCodeByUserId').mockResolvedValue(userCode);
            const incrementSpy = jest
                .spyOn(service, 'incrementCountAndSetDelayDate')
                .mockResolvedValue(incrementResult);

            await service.askNewCode(mockUser);

            expect(mockLogger.info).toHaveBeenCalledWith(
                'User code count is less than 5, incrementing count',
            );
            expect(incrementSpy).toHaveBeenCalledWith(userCode);
        });
    });

    describe('deleteUserCode', () => {
        const userId = 'user-123';

        it('should delete user code successfully', async () => {
            mockUserCodeRepo.delete.mockResolvedValue({ affected: 1 });

            const result = await service.deleteUserCode(userId);

            expect(mockLogger.info).toHaveBeenCalledWith(
                `Deleting user code with user ID: ${userId}`,
            );
            expect(mockUserCodeRepo.delete).toHaveBeenCalledWith({
                user: { id: userId, deleted: false },
            });
            expect(result).toEqual({ message: 'Code deleted successfully' });
        });

        it('should handle different user IDs', async () => {
            const differentUserId = 'user-456';
            mockUserCodeRepo.delete.mockResolvedValue({ affected: 1 });

            await service.deleteUserCode(differentUserId);

            expect(mockUserCodeRepo.delete).toHaveBeenCalledWith({
                user: { id: differentUserId, deleted: false },
            });
        });
    });
});
