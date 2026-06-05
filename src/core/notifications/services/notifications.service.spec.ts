import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { NUsersService } from './n-users.service';
import { PreNotificationsService } from './pre-notifications.service';
import { NotificationsRepository } from '../repositories/notifications.repository';
import { NUsersRepository } from '../repositories/n-users.repository';
import { OtherUtils } from '../../../utils/services/tools';
import { CacheService } from '../../../helpers/cache/cache.service';
import { SocketService } from '../../../helpers/socket/socket.service';
import { ErrorHandlerService } from '../../../common/response';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { NotificationSubjectTypeEnum } from '../../../common/enum';
import { In } from 'typeorm';

describe('NotificationsService', () => {
    let service: NotificationsService;
    let logger: any;

    const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    };

    const mockNUsersService = {
        userUnreadNs: jest.fn(),
        retrieveNotificationQuery: jest.fn(),
        retrieveNUsersByCriteria: jest.fn(),
        buildNReceiversForUsers: jest.fn(),
    };

    const mockPreNService = {
        transformNotificationReceivers: jest.fn(),
        retrieveNotificationByCriteria: jest.fn(),
        transformNotification: jest.fn(),
        buildNotificationEntity: jest.fn(),
        sendNotification: jest.fn(),
        wsSendUserBadgeCount: jest.fn(),
        clearNotificationCaches: jest.fn(),
    };

    const mockNotifsRepo = {
        create: jest.fn(),
    };

    const mockNUserRepo = {
        createMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
    };

    const mockCacheService = {
        generateRedisKey: jest.fn(),
        retrieveGenericPaginated: jest.fn(),
    };

    const mockOtherUtils = {
        formatCriteria: jest.fn(),
    };

    const mockSocketService = {};

    const mockErrorHandler = {
        notFound: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationsService,
                {
                    provide: WINSTON_MODULE_PROVIDER,
                    useValue: mockLogger,
                },
                {
                    provide: NUsersService,
                    useValue: mockNUsersService,
                },
                {
                    provide: PreNotificationsService,
                    useValue: mockPreNService,
                },
                {
                    provide: NotificationsRepository,
                    useValue: mockNotifsRepo,
                },
                {
                    provide: NUsersRepository,
                    useValue: mockNUserRepo,
                },
                {
                    provide: OtherUtils,
                    useValue: mockOtherUtils,
                },
                {
                    provide: CacheService,
                    useValue: mockCacheService,
                },
                {
                    provide: SocketService,
                    useValue: mockSocketService,
                },
                {
                    provide: ErrorHandlerService,
                    useValue: mockErrorHandler,
                },
            ],
        }).compile();

        service = module.get<NotificationsService>(NotificationsService);
        module.get<NUsersService>(NUsersService);
        module.get<PreNotificationsService>(PreNotificationsService);
        module.get<NotificationsRepository>(NotificationsRepository);
        module.get<NUsersRepository>(NUsersRepository);
        module.get<CacheService>(CacheService);
        logger = module.get(WINSTON_MODULE_PROVIDER);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('retrieveUserNotifications', () => {
        it('should retrieve user notifications with all filters', async () => {
            const userId = 'user-123';
            const page = 1;
            const limit = 10;
            const filterItems = { isNew: true, searchTerm: 'test' };
            const baseKey = 'notifications:user-123:isNew:true:search:test';
            const mockResult = { data: [], total: 0, page: 1, limit: 10 };

            mockCacheService.generateRedisKey.mockReturnValue(baseKey);
            mockCacheService.retrieveGenericPaginated.mockResolvedValue(mockResult);

            const result = await service.retrieveUserNotifications(
                page,
                limit,
                userId,
                filterItems,
            );

            expect(logger.info).toHaveBeenCalledWith('Retrieve user connected notification');
            expect(mockCacheService.generateRedisKey).toHaveBeenCalledWith('notifications', {
                userId,
                isNew: true,
                search: 'test',
            });
            expect(mockCacheService.retrieveGenericPaginated).toHaveBeenCalled();
            expect(result).toEqual(mockResult);
        });

        it('should retrieve user notifications without isNew filter', async () => {
            const userId = 'user-123';
            const page = 1;
            const limit = 10;
            const filterItems = { searchTerm: 'test' };
            const baseKey = 'notifications:user-123:search:test';
            const mockResult = { data: [], total: 0, page: 1, limit: 10 };

            mockCacheService.generateRedisKey.mockReturnValue(baseKey);
            mockCacheService.retrieveGenericPaginated.mockResolvedValue(mockResult);

            const result = await service.retrieveUserNotifications(
                page,
                limit,
                userId,
                filterItems,
            );

            expect(mockCacheService.generateRedisKey).toHaveBeenCalledWith('notifications', {
                userId,
                search: 'test',
            });
            expect(result).toEqual(mockResult);
        });

        it('should retrieve user notifications without searchTerm filter', async () => {
            const userId = 'user-123';
            const page = 1;
            const limit = 10;
            const filterItems = { isNew: false };
            const baseKey = 'notifications:user-123:isNew:false';
            const mockResult = { data: [], total: 0, page: 1, limit: 10 };

            mockCacheService.generateRedisKey.mockReturnValue(baseKey);
            mockCacheService.retrieveGenericPaginated.mockResolvedValue(mockResult);

            const result = await service.retrieveUserNotifications(
                page,
                limit,
                userId,
                filterItems,
            );

            expect(mockCacheService.generateRedisKey).toHaveBeenCalledWith('notifications', {
                userId,
                isNew: false,
            });
            expect(result).toEqual(mockResult);
        });

        it('should retrieve user notifications without any filters', async () => {
            const userId = 'user-123';
            const page = 1;
            const limit = 10;
            const filterItems = {};
            const baseKey = 'notifications:user-123';
            const mockResult = { data: [], total: 0, page: 1, limit: 10 };

            mockCacheService.generateRedisKey.mockReturnValue(baseKey);
            mockCacheService.retrieveGenericPaginated.mockResolvedValue(mockResult);

            const result = await service.retrieveUserNotifications(
                page,
                limit,
                userId,
                filterItems,
            );

            expect(mockCacheService.generateRedisKey).toHaveBeenCalledWith('notifications', {
                userId,
            });
            expect(result).toEqual(mockResult);
        });
    });

    describe('nDetails', () => {
        it('should retrieve notification details', async () => {
            const notificationId = 'notif-123';
            const mockNotification = { id: notificationId, label: 'Test' };
            const transformedNotif = {
                id: notificationId,
                label: 'Test',
                transformed: true,
            };

            mockPreNService.retrieveNotificationByCriteria.mockResolvedValue(mockNotification);
            mockPreNService.transformNotification.mockReturnValue(transformedNotif);

            const result = await service.nDetails(notificationId);

            expect(logger.info).toHaveBeenCalledWith(
                `Retrieving notification with id: ${notificationId} details`,
            );
            expect(mockPreNService.retrieveNotificationByCriteria).toHaveBeenCalledWith(
                { id: notificationId },
                ['sentBy'],
            );
            expect(mockPreNService.transformNotification).toHaveBeenCalledWith(mockNotification);
            expect(result).toEqual(transformedNotif);
        });
    });

    describe('createNotification', () => {
        it('should create notification with all optional fields', async () => {
            const label = 'Test Notification';
            const content = 'Test Content';
            const subjectType = NotificationSubjectTypeEnum.NONE;
            const optional = {
                subjectId: 'subject-123',
                route: '/test',
                sentBy: { id: 'user-123' } as any,
            };
            const mockEntity = { label, content, subjectType, ...optional };
            const createdNotif = { id: 'notif-123', ...mockEntity };

            mockPreNService.buildNotificationEntity.mockReturnValue(mockEntity);
            mockNotifsRepo.create.mockResolvedValue(createdNotif);

            const result = await service.createNotification(label, content, subjectType, optional);

            expect(logger.info).toHaveBeenCalledWith(`Creating notification with label: ${label}`);
            expect(mockPreNService.buildNotificationEntity).toHaveBeenCalledWith(
                { label, content, subjectType },
                optional,
            );
            expect(mockNotifsRepo.create).toHaveBeenCalledWith(mockEntity);
            expect(result).toEqual(createdNotif);
        });

        it('should create notification without optional fields', async () => {
            const label = 'Test Notification';
            const content = 'Test Content';
            const subjectType = NotificationSubjectTypeEnum.NONE;
            const optional = {};
            const mockEntity = { label, content, subjectType };
            const createdNotif = { id: 'notif-123', ...mockEntity };

            mockPreNService.buildNotificationEntity.mockReturnValue(mockEntity);
            mockNotifsRepo.create.mockResolvedValue(createdNotif);

            const result = await service.createNotification(label, content, subjectType, optional);

            expect(mockPreNService.buildNotificationEntity).toHaveBeenCalledWith(
                { label, content, subjectType },
                optional,
            );
            expect(result).toEqual(createdNotif);
        });
    });

    describe('sendNotificationToUsers', () => {
        it('should send notification to users and clear caches', async () => {
            const notification = { id: 'notif-123' } as any;
            const users = [{ id: 'user-1' } as any, { id: 'user-2' } as any];
            const nReceivers = [
                { id: 'nr-1', user: users[0], notification },
                { id: 'nr-2', user: users[1], notification },
            ];

            mockNUsersService.buildNReceiversForUsers.mockReturnValue(nReceivers);
            mockNUserRepo.createMany.mockResolvedValue(nReceivers);
            mockPreNService.sendNotification.mockResolvedValue(undefined);
            mockPreNService.clearNotificationCaches.mockResolvedValue(undefined);

            const result = await service.sendNotificationToUsers(notification, users);

            expect(logger.info).toHaveBeenCalledWith('Sending notification to users');
            expect(mockNUsersService.buildNReceiversForUsers).toHaveBeenCalledWith(
                notification,
                users,
            );
            expect(mockNUserRepo.createMany).toHaveBeenCalledWith(nReceivers);
            expect(mockPreNService.sendNotification).toHaveBeenCalledWith(nReceivers);
            expect(result).toEqual({
                message: 'Notification sent successfully',
            });

            // Wait for setImmediate to execute
            await new Promise(setImmediate);

            expect(mockPreNService.clearNotificationCaches).toHaveBeenCalledTimes(2);
            expect(mockPreNService.clearNotificationCaches).toHaveBeenCalledWith('user-1');
            expect(mockPreNService.clearNotificationCaches).toHaveBeenCalledWith('user-2');
        });
    });

    describe('refreshUserNotificationState', () => {
        it('should refresh user notification state', async () => {
            const userId = 'user-123';
            const count = 5;

            mockNUsersService.userUnreadNs.mockResolvedValue(count);
            mockPreNService.wsSendUserBadgeCount.mockReturnValue(undefined);
            mockPreNService.clearNotificationCaches.mockResolvedValue(undefined);

            await service.refreshUserNotificationState(userId);

            expect(mockNUsersService.userUnreadNs).toHaveBeenCalledWith(userId);
            expect(mockPreNService.wsSendUserBadgeCount).toHaveBeenCalledWith(userId, count);
            expect(mockPreNService.clearNotificationCaches).toHaveBeenCalledWith(userId);
        });
    });

    describe('updateNotifications', () => {
        it('should update notifications when they exist', async () => {
            const userId = 'user-123';
            const ids = ['notif-1', 'notif-2'];
            const searchCriteria = { isNew: true };
            const updateData = { isNew: false };
            const successMessage = 'Success';
            const notifications = [{ id: 'notif-1' }, { id: 'notif-2' }];
            const count = 3;

            mockNUsersService.retrieveNUsersByCriteria.mockResolvedValue(notifications);
            mockNUserRepo.update.mockResolvedValue({ affected: 2 });
            mockNUsersService.userUnreadNs.mockResolvedValue(count);
            mockPreNService.wsSendUserBadgeCount.mockReturnValue(undefined);
            mockPreNService.clearNotificationCaches.mockResolvedValue(undefined);

            const result = await service.updateNotifications(
                userId,
                ids,
                searchCriteria,
                updateData,
                successMessage,
            );

            expect(mockNUsersService.retrieveNUsersByCriteria).toHaveBeenCalledWith({
                notification: { id: In(ids) },
                user: { id: userId },
                ...searchCriteria,
            });
            expect(mockNUserRepo.update).toHaveBeenCalledWith({ id: In(ids) }, updateData);
            expect(mockNUsersService.userUnreadNs).toHaveBeenCalledWith(userId);
            expect(mockPreNService.wsSendUserBadgeCount).toHaveBeenCalledWith(userId, count);
            expect(mockPreNService.clearNotificationCaches).toHaveBeenCalledWith(userId);
            expect(result).toEqual({ message: successMessage });
        });

        it('should return message when no notifications found', async () => {
            const userId = 'user-123';
            const ids = ['notif-1'];
            const searchCriteria = { isNew: true };
            const updateData = { isNew: false };
            const successMessage = 'Success';

            mockNUsersService.retrieveNUsersByCriteria.mockResolvedValue([]);

            const result = await service.updateNotifications(
                userId,
                ids,
                searchCriteria,
                updateData,
                successMessage,
            );

            expect(mockNUserRepo.update).not.toHaveBeenCalled();
            expect(mockNUsersService.userUnreadNs).not.toHaveBeenCalled();
            expect(result).toEqual({ message: successMessage });
        });

        it('should handle empty notifications array', async () => {
            const userId = 'user-123';
            const ids = ['notif-1'];
            const searchCriteria = {};
            const updateData = { deleted: true };
            const successMessage = 'Deleted';

            mockNUsersService.retrieveNUsersByCriteria.mockResolvedValue(null);

            const result = await service.updateNotifications(
                userId,
                ids,
                searchCriteria,
                updateData,
                successMessage,
            );

            expect(mockNUserRepo.update).not.toHaveBeenCalled();
            expect(result).toEqual({ message: successMessage });
        });
    });

    describe('markAsRead', () => {
        it('should mark notifications as read', async () => {
            const userId = 'user-123';
            const ids = ['notif-1', 'notif-2'];
            const notifs = [{ id: 'notif-1' }, { id: 'notif-2' }];
            const count = 3;

            mockNUsersService.retrieveNUsersByCriteria.mockResolvedValue(notifs);
            mockNUserRepo.update.mockResolvedValue({ affected: 2 });
            mockNUsersService.userUnreadNs.mockResolvedValue(count);
            mockPreNService.wsSendUserBadgeCount.mockReturnValue(undefined);
            mockPreNService.clearNotificationCaches.mockResolvedValue(undefined);

            const result = await service.markAsRead(userId, ids);

            expect(logger.info).toHaveBeenCalledWith(
                `Marking notifications with ids: ${JSON.stringify(ids)} as read for user with id: ${userId}`,
            );
            expect(mockNUsersService.retrieveNUsersByCriteria).toHaveBeenCalledWith({
                notification: { id: In(ids) },
                user: { id: userId },
                isNew: true,
            });
            expect(mockNUserRepo.update).toHaveBeenCalledWith({ id: In(ids) }, { isNew: false });
            expect(result).toEqual({
                message: 'Notifications marked as read successfully',
            });
        });

        it('should return message when no notifications to mark as read', async () => {
            const userId = 'user-123';
            const ids = ['notif-1'];

            mockNUsersService.retrieveNUsersByCriteria.mockResolvedValue([]);

            const result = await service.markAsRead(userId, ids);

            expect(mockNUserRepo.update).not.toHaveBeenCalled();
            expect(result).toEqual({
                message: 'Notifications marked as read successfully',
            });
        });
    });

    describe('clearNotifs', () => {
        it('should clear notifications', async () => {
            const userId = 'user-123';
            const ids = ['notif-1', 'notif-2'];
            const notifications = [{ id: 'notif-1' }, { id: 'notif-2' }];
            const count = 5;

            mockNUsersService.retrieveNUsersByCriteria.mockResolvedValue(notifications);
            mockNUserRepo.update.mockResolvedValue({ affected: 2 });
            mockNUsersService.userUnreadNs.mockResolvedValue(count);
            mockPreNService.wsSendUserBadgeCount.mockReturnValue(undefined);
            mockPreNService.clearNotificationCaches.mockResolvedValue(undefined);

            const result = await service.clearNotifs(userId, ids);

            expect(logger.info).toHaveBeenCalledWith(
                `Deleting notifications with ids: ${JSON.stringify(ids)} for user with id: ${userId}`,
            );
            expect(mockNUsersService.retrieveNUsersByCriteria).toHaveBeenCalledWith({
                notification: { id: In(ids) },
                user: { id: userId },
            });
            expect(mockNUserRepo.update).toHaveBeenCalledWith({ id: In(ids) }, { deleted: true });
            expect(result).toEqual({
                message: 'Notifications deleted successfully',
            });
        });

        it('should return message when no notifications to clear', async () => {
            const userId = 'user-123';
            const ids = ['notif-1'];

            mockNUsersService.retrieveNUsersByCriteria.mockResolvedValue([]);

            const result = await service.clearNotifs(userId, ids);

            expect(mockNUserRepo.update).not.toHaveBeenCalled();
            expect(result).toEqual({
                message: 'Notifications deleted successfully',
            });
        });
    });

    describe('clearAllNotifs', () => {
        it('should clear all notifications for user', async () => {
            const userId = 'user-123';
            const count = 0;

            mockNUserRepo.update.mockResolvedValue({ affected: 10 });
            mockNUsersService.userUnreadNs.mockResolvedValue(count);
            mockPreNService.wsSendUserBadgeCount.mockReturnValue(undefined);
            mockPreNService.clearNotificationCaches.mockResolvedValue(undefined);

            const result = await service.clearAllNotifs(userId);

            expect(logger.info).toHaveBeenCalledWith(
                `Deleting all notifications for user with id: ${userId}`,
            );
            expect(mockNUserRepo.update).toHaveBeenCalledWith(
                { user: { id: userId } },
                { deleted: true },
            );
            expect(mockNUsersService.userUnreadNs).toHaveBeenCalledWith(userId);
            expect(mockPreNService.wsSendUserBadgeCount).toHaveBeenCalledWith(userId, count);
            expect(mockPreNService.clearNotificationCaches).toHaveBeenCalledWith(userId);
            expect(result).toEqual({ message: 'All notifications cleared' });
        });
    });
});
