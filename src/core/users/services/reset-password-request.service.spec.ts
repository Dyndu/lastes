import { Test, TestingModule } from '@nestjs/testing';
import { ResetPasswordRequestService } from './reset-password-request.service';
import { UsersService } from './users.service';
import { ResetPasswordRequestEntity } from '../entities/reset-password-request.entity';
import { UserEntity } from '../entities/user.entity';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('ResetPasswordRequestService', () => {
    let service: ResetPasswordRequestService;

    const mockLogger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    };

    const mockErrorHandlerService = {
        notFound: jest.fn((_message: string, publicMessage: string) => {
            throw new Error(publicMessage);
        }),
        badRequest: jest.fn((_message: string, publicMessage: string) => {
            throw new Error(publicMessage);
        }),
        forbidden: jest.fn((_message: string, publicMessage: string) => {
            throw new Error(publicMessage);
        }),
    };

    const mockRPRequestRepo = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockUsersService = {
        logger: mockLogger,
        errorHandlerService: mockErrorHandlerService,
        rPRequestRepo: mockRPRequestRepo,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ResetPasswordRequestService,
                {
                    provide: UsersService,
                    useValue: mockUsersService,
                },
            ],
        }).compile();

        service = module.get<ResetPasswordRequestService>(ResetPasswordRequestService);
        module.get<UsersService>(UsersService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('retrieveResetPasswordById', () => {
        const requestId = 'request-123';

        it('should retrieve reset password request when found', async () => {
            const mockRequest = {
                id: requestId,
                user: { id: 'user-123' },
                deleted: false,
            } as ResetPasswordRequestEntity;

            mockRPRequestRepo.findOne.mockResolvedValue(mockRequest);

            const result = await service.retrieveResetPasswordById(requestId);

            expect(mockLogger.info).toHaveBeenCalledWith(
                `Retrieve a reset password request by id: ${requestId}`,
            );
            expect(mockRPRequestRepo.findOne).toHaveBeenCalledWith({
                where: { id: requestId, deleted: false },
                relations: ['user'],
            });
            expect(result).toEqual(mockRequest);
        });

        it('should throw error when request not found', async () => {
            mockRPRequestRepo.findOne.mockResolvedValue(null);

            await expect(service.retrieveResetPasswordById(requestId)).rejects.toThrow(
                "Can't reset or update password",
            );

            expect(mockErrorHandlerService.notFound).toHaveBeenCalledWith(
                `Reset password request not found with id: ${requestId}`,
                "Can't reset or update password",
            );
        });

        it('should include user relations in query', async () => {
            mockRPRequestRepo.findOne.mockResolvedValue({
                id: requestId,
            } as ResetPasswordRequestEntity);

            await service.retrieveResetPasswordById(requestId);

            const callArgs = mockRPRequestRepo.findOne.mock.calls[0][0];
            expect(callArgs.relations).toEqual(['user']);
        });

        it('should log before retrieving', async () => {
            mockRPRequestRepo.findOne.mockResolvedValue({
                id: requestId,
            } as ResetPasswordRequestEntity);

            await service.retrieveResetPasswordById(requestId);

            expect(mockLogger.info).toHaveBeenCalledWith(
                `Retrieve a reset password request by id: ${requestId}`,
            );
        });
    });

    describe('createNewRequest', () => {
        const mockUser = {
            id: 'user-123',
            email: 'test@example.com',
        } as UserEntity;

        const passwordExpireAt = new Date(Date.now() + 6 * 60 * 1000);

        it('should create new reset password request', async () => {
            const mockCreatedRequest = {
                id: 'request-123',
                user: mockUser,
                expireAt: passwordExpireAt,
                count: 1,
            } as ResetPasswordRequestEntity;

            mockRPRequestRepo.create.mockReturnValue(mockCreatedRequest);

            const result = await service.createNewRequest(mockUser, passwordExpireAt);

            expect(mockLogger.info).toHaveBeenCalledWith(
                `Create a new reset password request for user ${mockUser.id}`,
            );
            expect(mockRPRequestRepo.create).toHaveBeenCalled();
            expect(result).toEqual(mockCreatedRequest);
        });

        it('should set count to 1', async () => {
            mockRPRequestRepo.create.mockImplementation((entity) => entity);

            await service.createNewRequest(mockUser, passwordExpireAt);

            const createdEntity = mockRPRequestRepo.create.mock.calls[0][0];
            expect(createdEntity.count).toBe(1);
        });

        it('should set user and expireAt correctly', async () => {
            mockRPRequestRepo.create.mockImplementation((entity) => entity);

            await service.createNewRequest(mockUser, passwordExpireAt);

            const createdEntity = mockRPRequestRepo.create.mock.calls[0][0];
            expect(createdEntity.user).toEqual(mockUser);
            expect(createdEntity.expireAt).toEqual(passwordExpireAt);
        });

        it('should log creation', async () => {
            mockRPRequestRepo.create.mockReturnValue({} as ResetPasswordRequestEntity);

            await service.createNewRequest(mockUser, passwordExpireAt);

            expect(mockLogger.info).toHaveBeenCalledWith(
                `Create a new reset password request for user ${mockUser.id}`,
            );
        });
    });

    describe('handleResetPasswordRequest', () => {
        const mockUser = {
            id: 'user-123',
            email: 'test@example.com',
        } as UserEntity;

        it('should create new request when none exists', async () => {
            mockRPRequestRepo.findOne.mockResolvedValue(null);
            const mockCreatedRequest = {
                id: 'request-123',
                user: mockUser,
                count: 1,
            } as ResetPasswordRequestEntity;
            mockRPRequestRepo.create.mockReturnValue(mockCreatedRequest);

            const result = await service.handleResetPasswordRequest(mockUser);

            expect(mockRPRequestRepo.findOne).toHaveBeenCalledWith({
                where: { user: { id: mockUser.id }, deleted: false },
            });
            expect(mockRPRequestRepo.create).toHaveBeenCalled();
            expect(result).toEqual(mockCreatedRequest);
        });

        it('should increment count when request exists', async () => {
            const existingRequest = {
                id: 'request-123',
                count: 2,
                user: mockUser,
                delayDate: null,
            };

            mockRPRequestRepo.findOne.mockResolvedValue(existingRequest);

            await service.handleResetPasswordRequest(mockUser);

            expect(existingRequest.count).toBe(3);
            expect(mockRPRequestRepo.update).toHaveBeenCalledWith(
                { id: existingRequest.id },
                existingRequest,
            );
        });

        it('should set delay date when count reaches 5', async () => {
            const existingRequest = {
                id: 'request-123',
                count: 4,
                user: mockUser,
                delayDate: null,
            };

            mockRPRequestRepo.findOne.mockResolvedValue(existingRequest);

            await service.handleResetPasswordRequest(mockUser);

            expect(existingRequest.count).toBe(5);
            expect(existingRequest.delayDate).toBeInstanceOf(Date);
            expect(mockRPRequestRepo.update).toHaveBeenCalled();
        });

        it('should update expireAt to 6 minutes from now', async () => {
            const existingRequest = {
                id: 'request-123',
                count: 1,
                user: mockUser,
            } as ResetPasswordRequestEntity;

            mockRPRequestRepo.findOne.mockResolvedValue(existingRequest);

            const beforeCall = Date.now();
            await service.handleResetPasswordRequest(mockUser);
            const afterCall = Date.now();

            const expectedExpireTime = 6 * 60 * 1000;
            const actualExpireTime = existingRequest.expireAt.getTime() - beforeCall;

            expect(actualExpireTime).toBeGreaterThanOrEqual(expectedExpireTime - 100);
            expect(actualExpireTime).toBeLessThanOrEqual(
                expectedExpireTime + (afterCall - beforeCall) + 100,
            );
        });

        it('should throw error when delay date is in future', async () => {
            const futureDate = new Date(Date.now() + 10 * 60 * 60 * 1000);
            const existingRequest = {
                id: 'request-123',
                count: 5,
                delayDate: futureDate,
            } as ResetPasswordRequestEntity;

            mockRPRequestRepo.findOne.mockResolvedValue(existingRequest);

            await expect(service.handleResetPasswordRequest(mockUser)).rejects.toThrow();

            expect(mockErrorHandlerService.forbidden).toHaveBeenCalled();
        });

        it('should calculate correct wait time in error message', async () => {
            const hoursToWait = 5;
            const minutesToWait = 30;
            const futureDate = new Date(
                Date.now() + hoursToWait * 60 * 60 * 1000 + minutesToWait * 60 * 1000,
            );
            const existingRequest = {
                id: 'request-123',
                count: 5,
                delayDate: futureDate,
            } as ResetPasswordRequestEntity;

            mockRPRequestRepo.findOne.mockResolvedValue(existingRequest);

            await expect(service.handleResetPasswordRequest(mockUser)).rejects.toThrow();

            const forbiddenCall = mockErrorHandlerService.forbidden.mock.calls[0];
            expect(forbiddenCall[1]).toContain(`${hoursToWait} hours`);
        });
    });

    describe('getResetPasswordRequestById', () => {
        const requestId = 'request-123';

        it('should return user when request is valid', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
            } as UserEntity;

            const mockRequest = {
                id: requestId,
                user: mockUser,
                expireAt: new Date(Date.now() + 60000),
                deleted: false,
            } as ResetPasswordRequestEntity;

            mockRPRequestRepo.findOne.mockResolvedValue(mockRequest);

            const result = await service.getResetPasswordRequestById(requestId);

            expect(mockLogger.info).toHaveBeenCalledWith(
                "Check if a reset password request exist && link hasn't expired to generate another one",
            );
            expect(result).toEqual(mockUser);
        });

        it('should throw error when request has expired', async () => {
            const mockRequest = {
                id: requestId,
                user: { id: 'user-123' },
                expireAt: new Date(Date.now() - 60000),
                deleted: false,
            } as ResetPasswordRequestEntity;

            mockRPRequestRepo.findOne.mockResolvedValue(mockRequest);

            await expect(service.getResetPasswordRequestById(requestId)).rejects.toThrow(
                'Reset password request expired',
            );

            expect(mockErrorHandlerService.notFound).toHaveBeenCalledWith(
                `Reset password request expired with id: ${requestId}`,
                'Reset password request expired',
            );
        });

        it('should throw error when request not found', async () => {
            mockRPRequestRepo.findOne.mockResolvedValue(null);

            await expect(service.getResetPasswordRequestById(requestId)).rejects.toThrow(
                "Can't reset or update password",
            );
        });

        it('should log before checking request', async () => {
            const mockRequest = {
                id: requestId,
                user: { id: 'user-123' },
                expireAt: new Date(Date.now() + 60000),
            } as ResetPasswordRequestEntity;

            mockRPRequestRepo.findOne.mockResolvedValue(mockRequest);

            await service.getResetPasswordRequestById(requestId);

            expect(mockLogger.info).toHaveBeenCalledWith(
                "Check if a reset password request exist && link hasn't expired to generate another one",
            );
        });
    });

    describe('deleteResetPasswordRequest', () => {
        const userId = 'user-123';

        it('should delete reset password request successfully', async () => {
            mockRPRequestRepo.delete.mockResolvedValue({ affected: 1 });

            const result = await service.deleteResetPasswordRequest(userId);

            expect(mockLogger.info).toHaveBeenCalledWith(
                `Deleting reset password request for user ID: ${userId}`,
            );
            expect(mockRPRequestRepo.delete).toHaveBeenCalledWith({
                user: { id: userId, deleted: false },
            });
            expect(result).toEqual({ message: 'Request deleted successfully' });
        });

        it('should log before deleting', async () => {
            mockRPRequestRepo.delete.mockResolvedValue({ affected: 1 });

            await service.deleteResetPasswordRequest(userId);

            expect(mockLogger.info).toHaveBeenCalledWith(
                `Deleting reset password request for user ID: ${userId}`,
            );
        });

        it('should return success message', async () => {
            mockRPRequestRepo.delete.mockResolvedValue({ affected: 1 });

            const result = await service.deleteResetPasswordRequest(userId);

            expect(result).toMatchObject({
                message: 'Request deleted successfully',
            });
        });

        it('should delete only non-deleted requests for user', async () => {
            mockRPRequestRepo.delete.mockResolvedValue({ affected: 1 });

            await service.deleteResetPasswordRequest(userId);

            expect(mockRPRequestRepo.delete).toHaveBeenCalledWith({
                user: { id: userId, deleted: false },
            });
        });
    });

    describe('validateRequestDates (private method)', () => {
        it('should not throw error when delay date is null', async () => {
            const mockUser = {
                id: 'user-123',
            } as UserEntity;

            const existingRequest = {
                id: 'request-123',
                count: 3,
                delayDate: null,
            };

            mockRPRequestRepo.findOne.mockResolvedValue(existingRequest);
            mockRPRequestRepo.create.mockReturnValue({} as ResetPasswordRequestEntity);

            await expect(service.handleResetPasswordRequest(mockUser)).resolves.toBeDefined();
        });

        it('should not throw error when delay date is in past', async () => {
            const mockUser = {
                id: 'user-123',
            } as UserEntity;

            const pastDate = new Date(Date.now() - 60000);
            const existingRequest = {
                id: 'request-123',
                count: 3,
                delayDate: pastDate,
            } as ResetPasswordRequestEntity;

            mockRPRequestRepo.findOne.mockResolvedValue(existingRequest);

            await expect(service.handleResetPasswordRequest(mockUser)).resolves.toBeDefined();
        });

        it('should throw error when delay date is in future', async () => {
            const mockUser = {
                id: 'user-123',
            } as UserEntity;

            const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
            const existingRequest = {
                id: 'request-123',
                count: 5,
                delayDate: futureDate,
            } as ResetPasswordRequestEntity;

            mockRPRequestRepo.findOne.mockResolvedValue(existingRequest);

            await expect(service.handleResetPasswordRequest(mockUser)).rejects.toThrow();
        });
    });

    describe('ensureResetPasswordRequestIsValid (private method)', () => {
        it('should not throw error when request is not expired', async () => {
            const mockRequest = {
                id: 'request-123',
                user: { id: 'user-123' },
                expireAt: new Date(Date.now() + 60000),
            } as ResetPasswordRequestEntity;

            mockRPRequestRepo.findOne.mockResolvedValue(mockRequest);

            await expect(service.getResetPasswordRequestById('request-123')).resolves.toBeDefined();
        });

        it('should throw error when request is expired', async () => {
            const mockRequest = {
                id: 'request-123',
                user: { id: 'user-123' },
                expireAt: new Date(Date.now() - 60000),
            } as ResetPasswordRequestEntity;

            mockRPRequestRepo.findOne.mockResolvedValue(mockRequest);

            await expect(service.getResetPasswordRequestById('request-123')).rejects.toThrow(
                'Reset password request expired',
            );
        });
    });
});
