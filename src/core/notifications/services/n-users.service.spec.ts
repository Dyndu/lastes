import { Test, TestingModule } from '@nestjs/testing';
import { NUsersService } from './n-users.service';
import { NotificationsService } from './notifications.service';
import { NUsersEntity } from '../entities/n-users.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { NotificationEntity } from '../entities/notification.entity';
import { NotificationSubjectTypeEnum } from '../../../common/enum';
import { In } from 'typeorm';

describe('NUsersService', () => {
    let service: NUsersService;

    const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    };

    const mockOtherUtils = {
        formatCriteria: jest.fn(),
    };

    const mockErrorHandler = {
        notFound: jest.fn(),
    };

    const mockQueryBuilder = {
        createQueryBuilder: jest.fn(),
        leftJoinAndSelect: jest.fn(),
        andWhere: jest.fn(),
        orderBy: jest.fn(),
        skip: jest.fn(),
        take: jest.fn(),
    };

    const mockRepository = {
        createQueryBuilder: jest.fn(),
    };

    const mockNUserRepo = {
        count: jest.fn(),
        update: jest.fn(),
        getRepository: jest.fn(),
        findActiveMany: jest.fn(),
    };

    const mockPreNService = {
        wsSendUserBadgeCount: jest.fn(),
        clearNotificationCaches: jest.fn().mockResolvedValue(undefined),
    };

    const mockNotificationsService = {
        logger: mockLogger,
        otherUtils: mockOtherUtils,
        errorHandler: mockErrorHandler,
        nUserRepo: mockNUserRepo,
        preNService: mockPreNService,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NUsersService,
                {
                    provide: NotificationsService,
                    useValue: mockNotificationsService,
                },
            ],
        }).compile();

        service = module.get<NUsersService>(NUsersService);
        module.get(NotificationsService);

        mockQueryBuilder.leftJoinAndSelect.mockReturnThis();
        mockQueryBuilder.andWhere.mockReturnThis();
        mockQueryBuilder.orderBy.mockReturnThis();
        mockQueryBuilder.skip.mockReturnThis();
        mockQueryBuilder.take.mockReturnThis();
        mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockNUserRepo.getRepository.mockReturnValue(mockRepository);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('userUnreadNs', () => {
        it('should count unread notifications for user', async () => {
            const userId = 'user-123';
            const expectedCount = 5;

            mockNUserRepo.count.mockResolvedValue(expectedCount);

            const result = await service.userUnreadNs(userId);

            expect(mockLogger.info).toHaveBeenCalledWith(
                `Calculated unread notifications for user ${userId}`,
            );
            expect(mockNUserRepo.count).toHaveBeenCalledWith({
                where: { user: { id: userId }, isNew: true },
            });
            expect(result).toBe(expectedCount);
        });

        it('should return zero when no unread notifications', async () => {
            const userId = 'user-456';

            mockNUserRepo.count.mockResolvedValue(0);

            const result = await service.userUnreadNs(userId);

            expect(mockNUserRepo.count).toHaveBeenCalledWith({
                where: { user: { id: userId }, isNew: true },
            });
            expect(result).toBe(0);
        });

        it('should count unread notifications for different users', async () => {
            const userId1 = 'user-1';
            const userId2 = 'user-2';

            mockNUserRepo.count.mockResolvedValueOnce(3);
            mockNUserRepo.count.mockResolvedValueOnce(7);

            const result1 = await service.userUnreadNs(userId1);
            const result2 = await service.userUnreadNs(userId2);

            expect(result1).toBe(3);
            expect(result2).toBe(7);
            expect(mockLogger.info).toHaveBeenCalledTimes(2);
        });
    });

    describe('buildNotificationBaseQuery', () => {
        it('should build base query with only userId', () => {
            const filters = { userId: 'user-123' };

            const result = service.buildNotificationBaseQuery(filters);

            expect(mockNUserRepo.getRepository).toHaveBeenCalled();
            expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('nReceiver');
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
                'nReceiver.user',
                'user',
            );
            expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
                'nReceiver.notification',
                'notification',
            );
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('(user.id = :userId)', {
                userId: 'user-123',
            });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('nReceiver.deleted = false');
            expect(result).toBe(mockQueryBuilder);
        });

        it('should build query with isNew filter set to true', () => {
            const filters = { userId: 'user-123', isNew: true };

            service.buildNotificationBaseQuery(filters);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('nReceiver.isNew = :isNew', {
                isNew: true,
            });
        });

        it('should build query with isNew filter set to false', () => {
            const filters = { userId: 'user-123', isNew: false };

            service.buildNotificationBaseQuery(filters);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('nReceiver.isNew = :isNew', {
                isNew: false,
            });
        });

        it('should not add isNew filter when undefined', () => {
            const filters = { userId: 'user-123', isNew: undefined };

            service.buildNotificationBaseQuery(filters);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(2);
            expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
                'nReceiver.isNew = :isNew',
                expect.anything(),
            );
        });

        it('should build query with searchTerm', () => {
            const filters = { userId: 'user-123', searchTerm: 'test' };

            service.buildNotificationBaseQuery(filters);

            const expectedPattern = '%t%e%s%t%';
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                `(LOWER(notification.label) ILIKE :searchTerm
                OR LOWER(notification.content) ILIKE :searchTerm)`,
                { searchTerm: expectedPattern },
            );
        });

        it('should build query with complex searchTerm', () => {
            const filters = { userId: 'user-123', searchTerm: 'Hello World' };

            service.buildNotificationBaseQuery(filters);

            const expectedPattern = '%h%e%l%l%o% %w%o%r%l%d%';
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                expect.stringContaining('ILIKE'),
                {
                    searchTerm: expectedPattern,
                },
            );
        });

        it('should build query with all filters', () => {
            const filters = {
                userId: 'user-123',
                isNew: true,
                searchTerm: 'notification',
            };

            service.buildNotificationBaseQuery(filters);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('(user.id = :userId)', {
                userId: 'user-123',
            });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('nReceiver.deleted = false');
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('nReceiver.isNew = :isNew', {
                isNew: true,
            });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                expect.stringContaining('ILIKE'),
                expect.objectContaining({ searchTerm: expect.any(String) }),
            );
        });

        it('should not add searchTerm filter when empty string', () => {
            const filters = { userId: 'user-123', searchTerm: '' };

            service.buildNotificationBaseQuery(filters);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(2);
        });

        it('should handle special characters in searchTerm', () => {
            const filters = { userId: 'user-123', searchTerm: 'test@123' };

            service.buildNotificationBaseQuery(filters);

            const expectedPattern = '%t%e%s%t%@%1%2%3%';
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                expect.stringContaining('ILIKE'),
                {
                    searchTerm: expectedPattern,
                },
            );
        });
    });

    describe('retrieveNotificationQuery', () => {
        it('should build paginated query with all filters', () => {
            const offset = 0;
            const limit = 10;
            const filters = {
                userId: 'user-123',
                isNew: true,
                searchTerm: 'test',
            };

            const result = service.retrieveNotificationQuery(offset, limit, filters);

            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('nReceiver.createdAt', 'DESC');
            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(offset);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(limit);
            expect(result).toBe(mockQueryBuilder);
        });

        it('should build paginated query with different offset and limit', () => {
            const offset = 20;
            const limit = 50;
            const filters = { userId: 'user-123' };

            service.retrieveNotificationQuery(offset, limit, filters);

            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('nReceiver.createdAt', 'DESC');
            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(20);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(50);
        });

        it('should build paginated query without optional filters', () => {
            const offset = 0;
            const limit = 10;
            const filters = { userId: 'user-456' };

            service.retrieveNotificationQuery(offset, limit, filters);

            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('nReceiver.createdAt', 'DESC');
            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
        });
    });

    describe('retrieveNUsersByCriteria', () => {
        it('should retrieve user notifications by criteria', async () => {
            const criteria = { id: 'notif-123' };
            const mockResults = [
                { id: 'nr-1', notification: { id: 'notif-123' } },
            ] as NUsersEntity[];

            mockOtherUtils.formatCriteria.mockReturnValue('id=notif-123');
            mockNUserRepo.findActiveMany.mockResolvedValue(mockResults);

            const result = await service.retrieveNUsersByCriteria(criteria);

            expect(mockOtherUtils.formatCriteria).toHaveBeenCalledWith(criteria);
            expect(mockLogger.info).toHaveBeenCalledWith(
                'Retrieving user notifications by id=notif-123',
            );
            expect(mockNUserRepo.findActiveMany).toHaveBeenCalledWith(mockNUserRepo, criteria, [
                'user',
                'notification',
            ]);
            expect(result).toEqual(mockResults);
        });

        it('should handle criteria with In operator and matching results', async () => {
            const criteria = {
                notification: {
                    id: { _type: 'in', _value: ['notif-1', 'notif-2'] },
                },
            };
            const mockResults = [
                { id: 'nr-1', notification: { id: 'notif-1' } },
                { id: 'nr-2', notification: { id: 'notif-2' } },
            ] as NUsersEntity[];

            mockOtherUtils.formatCriteria.mockReturnValue('notification.id In [notif-1, notif-2]');
            mockNUserRepo.findActiveMany.mockResolvedValue(mockResults);

            const result = await service.retrieveNUsersByCriteria(criteria);

            expect(result).toEqual(mockResults);
            expect(mockErrorHandler.notFound).not.toHaveBeenCalled();
        });

        it('should not throw error when no array value in criteria', async () => {
            const criteria = { id: 'notif-123' };
            const mockResults = [
                { id: 'nr-1', notification: { id: 'notif-123' } },
                { id: 'nr-2', notification: { id: 'notif-123' } },
            ] as NUsersEntity[];

            mockOtherUtils.formatCriteria.mockReturnValue('id=notif-123');
            mockNUserRepo.findActiveMany.mockResolvedValue(mockResults);

            const result = await service.retrieveNUsersByCriteria(criteria);

            expect(result).toEqual(mockResults);
            expect(mockErrorHandler.notFound).not.toHaveBeenCalled();
        });

        it('should handle empty results without array criteria', async () => {
            const criteria = { id: 'notif-999' };
            const mockResults = [] as NUsersEntity[];

            mockOtherUtils.formatCriteria.mockReturnValue('id=notif-999');
            mockNUserRepo.findActiveMany.mockResolvedValue(mockResults);

            const result = await service.retrieveNUsersByCriteria(criteria);

            expect(result).toEqual([]);
            expect(mockErrorHandler.notFound).not.toHaveBeenCalled();
        });

        it('should handle criteria without _value property', async () => {
            const criteria = {
                notification: {
                    id: { _type: 'in' },
                },
            };
            const mockResults = [] as NUsersEntity[];

            mockOtherUtils.formatCriteria.mockReturnValue('notification.id In []');
            mockNUserRepo.findActiveMany.mockResolvedValue(mockResults);

            const result = await service.retrieveNUsersByCriteria(criteria);

            expect(result).toEqual([]);
            expect(mockErrorHandler.notFound).not.toHaveBeenCalled();
        });

        it('should handle criteria with non-array _value', async () => {
            const criteria = {
                notification: {
                    id: { _value: 'not-an-array' },
                },
            };
            const mockResults = [{ id: 'nr-1' }] as NUsersEntity[];

            mockOtherUtils.formatCriteria.mockReturnValue('notification.id=not-an-array');
            mockNUserRepo.findActiveMany.mockResolvedValue(mockResults);

            const result = await service.retrieveNUsersByCriteria(criteria);

            expect(result).toEqual(mockResults);
            expect(mockErrorHandler.notFound).not.toHaveBeenCalled();
        });
    });

    describe('buildNReceiversForUsers', () => {
        it('should return an empty array when users list is empty', () => {
            const notification = {
                id: 'notif-empty',
                label: 'Empty',
                content: 'Empty',
                subjectType: NotificationSubjectTypeEnum.NONE,
            } as NotificationEntity;

            const result = service.buildNReceiversForUsers(notification, []);

            expect(result).toEqual([]);
        });

        it('should build one receiver per user', () => {
            const notification = {
                id: 'notif-1',
                label: 'Test',
                content: 'Test',
                subjectType: NotificationSubjectTypeEnum.NONE,
            } as NotificationEntity;

            const users = [{ id: 'user-1' } as UserEntity, { id: 'user-2' } as UserEntity];

            const result = service.buildNReceiversForUsers(notification, users);

            expect(result).toHaveLength(2);
            result.forEach((receiver) => {
                expect(receiver).toBeInstanceOf(NUsersEntity);
            });
        });

        it('should correctly link each receiver to its user and notification', () => {
            const notification = {
                id: 'notif-2',
                label: 'Link Test',
                content: 'Content',
                subjectType: NotificationSubjectTypeEnum.NONE,
            } as NotificationEntity;

            const users = [
                { id: 'user-1', email: 'u1@test.com' } as UserEntity,
                { id: 'user-2', email: 'u2@test.com' } as UserEntity,
            ];

            const result = service.buildNReceiversForUsers(notification, users);

            expect(result[0].user).toBe(users[0]);
            expect(result[1].user).toBe(users[1]);

            result.forEach((receiver) => {
                expect(receiver.notification).toBe(notification);
            });
        });

        it('should mark all receivers as new', () => {
            const notification = {
                id: 'notif-3',
                label: 'isNew Test',
                content: 'Content',
                subjectType: NotificationSubjectTypeEnum.NONE,
            } as NotificationEntity;

            const users = [{ id: 'user-1' } as UserEntity];

            const result = service.buildNReceiversForUsers(notification, users);

            expect(result[0].isNew).toBe(true);
        });

        it('should NOT copy user id into receiver id (anti-regression)', () => {
            const notification = {
                id: 'notif-4',
                label: 'ID Safety',
                content: 'Content',
                subjectType: NotificationSubjectTypeEnum.NONE,
            } as NotificationEntity;

            const users = [{ id: 'user-danger', email: 'danger@test.com' } as UserEntity];

            const result = service.buildNReceiversForUsers(notification, users);

            expect(result[0].id).toBeUndefined();

            expect(result[0].user.id).toBe('user-danger');
        });

        it('should not mutate user objects', () => {
            const notification = {
                id: 'notif-5',
                label: 'Immutability',
                content: 'Content',
                subjectType: NotificationSubjectTypeEnum.NONE,
            } as NotificationEntity;

            const user = {
                id: 'user-immut',
                email: 'immut@test.com',
            } as UserEntity;

            const originalUserSnapshot = { ...user };

            service.buildNReceiversForUsers(notification, [user]);

            expect(user).toEqual(originalUserSnapshot);
        });

        it('should handle large number of users safely', () => {
            const notification = {
                id: 'notif-large',
                label: 'Large',
                content: 'Content',
                subjectType: NotificationSubjectTypeEnum.NONE,
            } as NotificationEntity;

            const users = Array.from({ length: 100 }, (_, i) => ({
                id: `user-${i}`,
            })) as UserEntity[];

            const result = service.buildNReceiversForUsers(notification, users);

            expect(result).toHaveLength(100);
            result.forEach((receiver, index) => {
                expect(receiver.user.id).toBe(`user-${index}`);
                expect(receiver.notification).toBe(notification);
                expect(receiver.isNew).toBe(true);
                expect(receiver.id).toBeUndefined();
            });
        });
    });

    describe('markNAsRead', () => {
        const userId = 'user-123';
        const ids = ['notif-1', 'notif-2'];
        const mockNotifications = [
            { id: 'nr-1', isNew: true },
            { id: 'nr-2', isNew: true },
        ] as NUsersEntity[];

        const mockPreNService = {
            wsSendUserBadgeCount: jest.fn(),
            clearNotificationCaches: jest.fn().mockResolvedValue(undefined),
        };

        beforeEach(() => {
            mockNotificationsService.nUserRepo.update = jest
                .fn()
                .mockResolvedValue({ affected: 2 });
            mockNotificationsService.preNService = mockPreNService;
            mockOtherUtils.formatCriteria.mockReturnValue('criteria-string');
            mockNUserRepo.findActiveMany.mockResolvedValue(mockNotifications);
            mockNUserRepo.count.mockResolvedValue(3);
        });

        it('should mark notifications as read and return success message', async () => {
            const result = await service.markNAsRead(userId, ids);

            expect(mockLogger.info).toHaveBeenCalledWith(
                `Marking notifications as for user ${userId}`,
            );
            expect(mockNUserRepo.findActiveMany).toHaveBeenCalled();
            expect(mockNUserRepo.update).toHaveBeenCalledWith(
                { id: In(['nr-1', 'nr-2']) },
                { isNew: false },
            );
            expect(mockNUserRepo.count).toHaveBeenCalledWith({
                where: { user: { id: userId }, isNew: true },
            });
            expect(mockPreNService.wsSendUserBadgeCount).toHaveBeenCalledWith(userId, 3);
            expect(mockPreNService.clearNotificationCaches).toHaveBeenCalledWith(userId);
            expect(result).toEqual({
                message: 'Notifications marked as read successfully',
            });
        });

        it('should call wsSendUserBadgeCount with updated unread count after marking as read', async () => {
            mockNUserRepo.count.mockResolvedValue(0);

            await service.markNAsRead(userId, ids);

            expect(mockPreNService.wsSendUserBadgeCount).toHaveBeenCalledWith(userId, 0);
        });
    });
});
