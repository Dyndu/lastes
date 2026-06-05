import { Test, TestingModule } from '@nestjs/testing';
import { PreNotificationsService } from './pre-notifications.service';
import { NotificationsService } from './notifications.service';
import { NotificationSubjectTypeEnum, SocketEventEnum } from '../../../common/enum';
import { NotificationEntity } from '../entities/notification.entity';
import { NUsersEntity } from '../entities/n-users.entity';
import { UserEntity } from '../../users/entities/user.entity';

describe('PreNotificationsService', () => {
    let service: PreNotificationsService;

    const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    };

    const mockOtherUtils = {
        formatCriteria: jest.fn(),
    };

    const mockNotifsRepo = {
        findActiveOne: jest.fn(),
    };

    const mockErrorHandler = {
        notFound: jest.fn(),
    };

    const mockCacheService = {
        deleteKeysByBase: jest.fn(),
    };

    const mockSocketService = {
        sendDataToUser: jest.fn(),
    };

    const mockNUsersService = {
        userUnreadNs: jest.fn(),
    };

    const mockNotificationsService = {
        logger: mockLogger,
        otherUtils: mockOtherUtils,
        notifsRepo: mockNotifsRepo,
        errorHandler: mockErrorHandler,
        cacheService: mockCacheService,
        socketService: mockSocketService,
        nUsersService: mockNUsersService,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PreNotificationsService,
                {
                    provide: NotificationsService,
                    useValue: mockNotificationsService,
                },
            ],
        }).compile();

        service = module.get<PreNotificationsService>(PreNotificationsService);
        module.get(NotificationsService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('transformNotification', () => {
        it('should transform notification entities to simplified object', () => {
            const mockNotification = {
                id: 'notif-123',
                label: 'Test Label',
                content: 'Test Content',
                subjectType: NotificationSubjectTypeEnum.NONE,
                subjectId: 'subject-123',
                route: '/test-route',
                sentBy: { id: 'user-123', name: 'John' } as any,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as NotificationEntity;

            const result = service.transformNotification(mockNotification);

            expect(result).toEqual({
                id: 'notif-123',
                label: 'Test Label',
                content: 'Test Content',
                subjectType: NotificationSubjectTypeEnum.NONE,
                subjectId: 'subject-123',
                route: '/test-route',
                sentBy: mockNotification.sentBy,
            });
        });

        it('should transform notification without optional fields', () => {
            const mockNotification = {
                id: 'notif-123',
                label: 'Test Label',
                content: 'Test Content',
                subjectType: NotificationSubjectTypeEnum.NONE,
                subjectId: undefined,
                route: undefined,
                sentBy: undefined,
            } as any;

            const result = service.transformNotification(mockNotification);

            expect(result).toEqual({
                id: 'notif-123',
                label: 'Test Label',
                content: 'Test Content',
                subjectType: NotificationSubjectTypeEnum.NONE,
                subjectId: undefined,
                route: undefined,
                sentBy: undefined,
            });
        });
    });

    describe('transformNotificationReceiver', () => {
        it('should transform notification receiver with notification', () => {
            const mockNotification = {
                id: 'notif-123',
                label: 'Test Label',
                content: 'Test Content',
                subjectType: NotificationSubjectTypeEnum.NONE,
                subjectId: 'subject-123',
                route: '/test',
                sentBy: { id: 'user-1' } as UserEntity,
            } as NotificationEntity;

            const mockNReceiver = {
                id: 'nr-123',
                isNew: true,
                notification: mockNotification,
                user: { id: 'user-123' } as UserEntity,
            } as NUsersEntity;

            const result = service.transformNotificationReceiver(mockNReceiver);

            expect(result).toEqual({
                id: mockNotification.id,
                isNew: true,
                notification: {
                    id: 'notif-123',
                    label: 'Test Label',
                    content: 'Test Content',
                    subjectType: NotificationSubjectTypeEnum.NONE,
                    subjectId: 'subject-123',
                    route: '/test',
                    sentBy: mockNotification.sentBy,
                },
            });
        });
    });

    describe('transformNotificationReceivers', () => {
        it('should transform array of notification receivers', () => {
            const mockNotification1 = {
                id: 'notif-1',
                label: 'Label 1',
                content: 'Content 1',
                subjectType: NotificationSubjectTypeEnum.NONE,
                subjectId: undefined,
                route: undefined,
                sentBy: undefined,
            } as any;

            const mockNotification2 = {
                id: 'notif-2',
                label: 'Label 2',
                content: 'Content 2',
                subjectType: NotificationSubjectTypeEnum.NONE,
                subjectId: undefined,
                route: undefined,
                sentBy: undefined,
            } as any;

            const mockNReceivers = [
                {
                    isNew: true,
                    notification: mockNotification1,
                } as NUsersEntity,
                {
                    isNew: false,
                    notification: mockNotification2,
                } as NUsersEntity,
            ];

            const result = service.transformNotificationReceivers(mockNReceivers);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                id: 'notif-1',
                isNew: true,
                notification: service.transformNotification(mockNotification1),
            });
            expect(result[1]).toEqual({
                id: 'notif-2',
                isNew: false,
                notification: service.transformNotification(mockNotification2),
            });
        });

        it('should transform empty array', () => {
            const result = service.transformNotificationReceivers([]);
            expect(result).toEqual([]);
        });
    });

    describe('buildNotificationEntity', () => {
        it('should build notification entities with all fields', () => {
            const required = {
                label: 'Test Label',
                content: 'Test Content',
                subjectType: NotificationSubjectTypeEnum.NONE,
            };

            const optional = {
                subjectId: 'subject-123',
                route: '/test-route',
                sentBy: { id: 'user-123' } as UserEntity,
            };

            const result = service.buildNotificationEntity(required, optional);

            expect(result).toBeInstanceOf(NotificationEntity);
            expect(result.label).toBe('Test Label');
            expect(result.content).toBe('Test Content');
            expect(result.subjectType).toBe(NotificationSubjectTypeEnum.NONE);
            expect(result.subjectId).toBe('subject-123');
            expect(result.route).toBe('/test-route');
            expect(result.sentBy).toEqual(optional.sentBy);
        });

        it('should build notification entities with only required fields', () => {
            const required = {
                label: 'Test Label',
                content: 'Test Content',
                subjectType: NotificationSubjectTypeEnum.NONE,
            };

            const optional = {};

            const result = service.buildNotificationEntity(required, optional);

            expect(result).toBeInstanceOf(NotificationEntity);
            expect(result.label).toBe('Test Label');
            expect(result.content).toBe('Test Content');
            expect(result.subjectType).toBe(NotificationSubjectTypeEnum.NONE);
            expect(result.subjectId).toBeUndefined();
            expect(result.route).toBeUndefined();
            expect(result.sentBy).toBeUndefined();
        });

        it('should build notification entities with partial optional fields', () => {
            const required = {
                label: 'Test Label',
                content: 'Test Content',
                subjectType: NotificationSubjectTypeEnum.NONE,
            };

            const optional = {
                subjectId: 'subject-123',
            };

            const result = service.buildNotificationEntity(required, optional);

            expect(result.label).toBe('Test Label');
            expect(result.subjectId).toBe('subject-123');
            expect(result.route).toBeUndefined();
            expect(result.sentBy).toBeUndefined();
        });
    });

    describe('retrieveNotificationByCriteria', () => {
        it('should retrieve notification when it exists', async () => {
            const criteria = { id: 'notif-123' };
            const relations = ['sentBy'];
            const mockNotification = {
                id: 'notif-123',
                label: 'Test',
            } as NotificationEntity;

            mockOtherUtils.formatCriteria.mockReturnValue('id=notif-123');
            mockNotifsRepo.findActiveOne.mockResolvedValue(mockNotification);

            const result = await service.retrieveNotificationByCriteria(criteria, relations);

            expect(mockOtherUtils.formatCriteria).toHaveBeenCalledWith(criteria);
            expect(mockLogger.info).toHaveBeenCalledWith('Find a notification by id=notif-123');
            expect(mockNotifsRepo.findActiveOne).toHaveBeenCalledWith(
                mockNotifsRepo,
                criteria,
                relations,
            );
            expect(result).toEqual(mockNotification);
        });

        it('should retrieve notification without relations', async () => {
            const criteria = { id: 'notif-123' };
            const mockNotification = {
                id: 'notif-123',
                label: 'Test',
            } as NotificationEntity;

            mockOtherUtils.formatCriteria.mockReturnValue('id=notif-123');
            mockNotifsRepo.findActiveOne.mockResolvedValue(mockNotification);

            const result = await service.retrieveNotificationByCriteria(criteria);

            expect(mockNotifsRepo.findActiveOne).toHaveBeenCalledWith(
                mockNotifsRepo,
                criteria,
                undefined,
            );
            expect(result).toEqual(mockNotification);
        });

        it('should throw error when notification not found', async () => {
            const criteria = { id: 'notif-123' };
            const relations = ['sentBy'];

            mockOtherUtils.formatCriteria.mockReturnValue('id=notif-123');
            mockNotifsRepo.findActiveOne.mockResolvedValue(null);
            mockErrorHandler.notFound.mockImplementation(() => {
                throw new Error('Notification not found');
            });

            await expect(
                service.retrieveNotificationByCriteria(criteria, relations),
            ).rejects.toThrow('Notification not found');

            expect(mockErrorHandler.notFound).toHaveBeenCalledWith(
                'Notification not found with id=notif-123',
                'Notification not found',
            );
        });

        it('should throw error with different criteria when notification not found', async () => {
            const criteria = { label: 'Test Label', content: 'Test Content' };

            mockOtherUtils.formatCriteria.mockReturnValue('label=Test Label, content=Test Content');
            mockNotifsRepo.findActiveOne.mockResolvedValue(null);
            mockErrorHandler.notFound.mockImplementation(() => {
                throw new Error('Not found');
            });

            await expect(service.retrieveNotificationByCriteria(criteria)).rejects.toThrow(
                'Not found',
            );

            expect(mockErrorHandler.notFound).toHaveBeenCalledWith(
                'Notification not found with label=Test Label, content=Test Content',
                'Notification not found',
            );
        });
    });

    describe('clearNotificationCaches', () => {
        it('should clear notification caches for user', async () => {
            const userId = 'user-123';

            mockCacheService.deleteKeysByBase.mockResolvedValue(undefined);

            await service.clearNotificationCaches(userId);

            expect(mockCacheService.deleteKeysByBase).toHaveBeenCalledWith(
                'notifications:userId=user-123*',
            );
        });

        it('should clear notification caches for different user', async () => {
            const userId = 'user-456';

            mockCacheService.deleteKeysByBase.mockResolvedValue(undefined);

            await service.clearNotificationCaches(userId);

            expect(mockCacheService.deleteKeysByBase).toHaveBeenCalledWith(
                'notifications:userId=user-456*',
            );
        });
    });

    describe('wsSendNewNotif', () => {
        it('should send new notification via websocket', () => {
            const userId = 'user-123';
            const payload = {
                id: 'nr-1',
                isNew: true,
                notification: { id: 'notif-1', label: 'Test' },
            };

            service.wsSendNewNotif(userId, payload);

            expect(mockSocketService.sendDataToUser).toHaveBeenCalledWith(
                userId,
                '/notifications',
                SocketEventEnum.NEW_NOTIFICATION,
                { payload: [payload] },
            );
        });

        it('should send new notification with different payload', () => {
            const userId = 'user-456';
            const payload = {
                id: 'nr-2',
                isNew: false,
                notification: null,
            };

            service.wsSendNewNotif(userId, payload);

            expect(mockSocketService.sendDataToUser).toHaveBeenCalledWith(
                userId,
                '/notifications',
                SocketEventEnum.NEW_NOTIFICATION,
                { payload: [payload] },
            );
        });
    });

    describe('wsSendUserBadgeCount', () => {
        it('should send badge count via websocket', () => {
            const userId = 'user-123';
            const count = 5;

            service.wsSendUserBadgeCount(userId, count);

            expect(mockSocketService.sendDataToUser).toHaveBeenCalledWith(
                userId,
                '/notifications',
                SocketEventEnum.NOTIFICATION_BADGE_COUNT,
                { payload: count },
            );
        });

        it('should send zero badge count', () => {
            const userId = 'user-123';
            const count = 0;

            service.wsSendUserBadgeCount(userId, count);

            expect(mockSocketService.sendDataToUser).toHaveBeenCalledWith(
                userId,
                '/notifications',
                SocketEventEnum.NOTIFICATION_BADGE_COUNT,
                { payload: 0 },
            );
        });

        it('should send large badge count', () => {
            const userId = 'user-456';
            const count = 99;

            service.wsSendUserBadgeCount(userId, count);

            expect(mockSocketService.sendDataToUser).toHaveBeenCalledWith(
                userId,
                '/notifications',
                SocketEventEnum.NOTIFICATION_BADGE_COUNT,
                { payload: 99 },
            );
        });
    });

    describe('sendNotification', () => {
        it('should send notification to multiple users', async () => {
            const mockNotification = {
                id: 'notif-123',
                label: 'Test',
                content: 'Test Content',
                subjectType: NotificationSubjectTypeEnum.NONE,
            } as NotificationEntity;

            const mockNReceivers = [
                {
                    id: 'nr-1',
                    isNew: true,
                    notification: mockNotification,
                    user: { id: 'user-1' } as UserEntity,
                } as NUsersEntity,
                {
                    id: 'nr-2',
                    isNew: true,
                    notification: mockNotification,
                    user: { id: 'user-2' } as UserEntity,
                } as NUsersEntity,
            ];

            mockNUsersService.userUnreadNs.mockResolvedValueOnce(5);
            mockNUsersService.userUnreadNs.mockResolvedValueOnce(3);

            const wsSendNewNotifSpy = jest.spyOn(service, 'wsSendNewNotif');
            const wsSendUserBadgeCountSpy = jest.spyOn(service, 'wsSendUserBadgeCount');

            await service.sendNotification(mockNReceivers);

            expect(mockLogger.info).toHaveBeenCalledWith(
                'Sending notification notif-123 to 2 users',
            );
            expect(mockNUsersService.userUnreadNs).toHaveBeenCalledTimes(2);
            expect(mockNUsersService.userUnreadNs).toHaveBeenCalledWith('user-1');
            expect(mockNUsersService.userUnreadNs).toHaveBeenCalledWith('user-2');

            expect(wsSendNewNotifSpy).toHaveBeenCalledTimes(2);
            expect(wsSendUserBadgeCountSpy).toHaveBeenCalledTimes(2);
            expect(wsSendUserBadgeCountSpy).toHaveBeenCalledWith('user-1', 5);
            expect(wsSendUserBadgeCountSpy).toHaveBeenCalledWith('user-2', 3);
        });

        it('should send notification to single user', async () => {
            const mockNotification = {
                id: 'notif-456',
                label: 'Single Test',
                content: 'Test Content',
                subjectType: NotificationSubjectTypeEnum.NONE,
            } as NotificationEntity;

            const mockNReceivers = [
                {
                    id: 'nr-1',
                    isNew: true,
                    notification: mockNotification,
                    user: { id: 'user-1' } as UserEntity,
                } as NUsersEntity,
            ];

            mockNUsersService.userUnreadNs.mockResolvedValue(10);

            const wsSendNewNotifSpy = jest.spyOn(service, 'wsSendNewNotif');
            const wsSendUserBadgeCountSpy = jest.spyOn(service, 'wsSendUserBadgeCount');

            await service.sendNotification(mockNReceivers);

            expect(mockLogger.info).toHaveBeenCalledWith(
                'Sending notification notif-456 to 1 users',
            );
            expect(mockNUsersService.userUnreadNs).toHaveBeenCalledTimes(1);
            expect(wsSendNewNotifSpy).toHaveBeenCalledTimes(1);
            expect(wsSendUserBadgeCountSpy).toHaveBeenCalledTimes(1);
            expect(wsSendUserBadgeCountSpy).toHaveBeenCalledWith('user-1', 10);
        });

        it('should handle notification with zero unread count', async () => {
            const mockNotification = {
                id: 'notif-789',
                label: 'Zero Count',
                content: 'Test Content',
                subjectType: NotificationSubjectTypeEnum.NONE,
            } as NotificationEntity;

            const mockNReceivers = [
                {
                    id: 'nr-1',
                    isNew: false,
                    notification: mockNotification,
                    user: { id: 'user-1' } as UserEntity,
                } as NUsersEntity,
            ];

            mockNUsersService.userUnreadNs.mockResolvedValue(0);

            const wsSendUserBadgeCountSpy = jest.spyOn(service, 'wsSendUserBadgeCount');

            await service.sendNotification(mockNReceivers);

            expect(wsSendUserBadgeCountSpy).toHaveBeenCalledWith('user-1', 0);
        });

        it('should send notifications in parallel to multiple users', async () => {
            const mockNotification = {
                id: 'notif-parallel',
                label: 'Parallel Test',
                content: 'Test Content',
                subjectType: NotificationSubjectTypeEnum.NONE,
            } as NotificationEntity;

            const mockNReceivers = [
                {
                    id: 'nr-1',
                    isNew: true,
                    notification: mockNotification,
                    user: { id: 'user-1' } as UserEntity,
                } as NUsersEntity,
                {
                    id: 'nr-2',
                    isNew: true,
                    notification: mockNotification,
                    user: { id: 'user-2' } as UserEntity,
                } as NUsersEntity,
                {
                    id: 'nr-3',
                    isNew: true,
                    notification: mockNotification,
                    user: { id: 'user-3' } as UserEntity,
                } as NUsersEntity,
            ];

            mockNUsersService.userUnreadNs.mockResolvedValueOnce(1);
            mockNUsersService.userUnreadNs.mockResolvedValueOnce(2);
            mockNUsersService.userUnreadNs.mockResolvedValueOnce(3);

            await service.sendNotification(mockNReceivers);

            expect(mockLogger.info).toHaveBeenCalledWith(
                'Sending notification notif-parallel to 3 users',
            );
            expect(mockNUsersService.userUnreadNs).toHaveBeenCalledTimes(3);
        });
    });
});
