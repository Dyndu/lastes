import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './services';
import { PaginationDto, UuidsArrayDto } from '../../common/dto';
import type { CurrentUserInterface } from '../../interface';

describe('NotificationsController', () => {
    let controller: NotificationsController;
    let service: NotificationsService;

    const mockNotificationsService = {
        nUsersService: {
            markNAsRead: jest.fn(),
            userUnreadNs: jest.fn(),
        },
        retrieveUserNotifications: jest.fn(),
        nDetails: jest.fn(),
        clearNotifs: jest.fn(),
        clearAllNotifs: jest.fn(),
    };

    const mockCurrentUser: CurrentUserInterface = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
    } as any;

    const mockNotification = {
        id: 'notif-1',
        userId: 'user-123',
        title: 'Test Notification',
        message: 'This is a test notification',
        isNew: true,
        createdAt: new Date('2024-01-01'),
    };

    const mockNotifications = [
        mockNotification,
        {
            id: 'notif-2',
            userId: 'user-123',
            title: 'Another Notification',
            message: 'Another test notification',
            isNew: false,
            createdAt: new Date('2024-01-02'),
        },
    ];

    const mockPaginatedResponse = {
        data: mockNotifications,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [NotificationsController],
            providers: [
                {
                    provide: NotificationsService,
                    useValue: mockNotificationsService,
                },
            ],
        }).compile();

        controller = module.get<NotificationsController>(NotificationsController);
        service = module.get<NotificationsService>(NotificationsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('badgeCount', () => {
        it('should return unread notifications count for user', async () => {
            const unreadCount = 5;
            mockNotificationsService.nUsersService.userUnreadNs.mockResolvedValue(unreadCount);

            const result = await controller.badgeCount(mockCurrentUser);

            expect(result).toBe(unreadCount);
            expect(service.nUsersService.userUnreadNs).toHaveBeenCalledTimes(1);
            expect(service.nUsersService.userUnreadNs).toHaveBeenCalledWith('user-123');
        });

        it('should return 0 when user has no unread notifications', async () => {
            mockNotificationsService.nUsersService.userUnreadNs.mockResolvedValue(0);

            const result = await controller.badgeCount(mockCurrentUser);

            expect(result).toBe(0);
            expect(service.nUsersService.userUnreadNs).toHaveBeenCalledWith('user-123');
        });

        it('should handle different user IDs', async () => {
            const differentUser = { ...mockCurrentUser, id: 'user-456' };
            mockNotificationsService.nUsersService.userUnreadNs.mockResolvedValue(3);

            const result = await controller.badgeCount(differentUser);

            expect(result).toBe(3);
            expect(service.nUsersService.userUnreadNs).toHaveBeenCalledWith('user-456');
        });

        it('should propagate service errors', async () => {
            const error = new Error('Database error');
            mockNotificationsService.nUsersService.userUnreadNs.mockRejectedValue(error);

            await expect(controller.badgeCount(mockCurrentUser)).rejects.toThrow('Database error');
        });
    });

    describe('allNotifications', () => {
        let paginationDto: PaginationDto;

        beforeEach(() => {
            paginationDto = new PaginationDto();
            paginationDto.page = 1;
            paginationDto.limit = 10;
        });

        it('should retrieve all user notifications without filters', async () => {
            mockNotificationsService.retrieveUserNotifications.mockResolvedValue(
                mockPaginatedResponse,
            );

            const result = await controller.allNotifications(
                mockCurrentUser,
                paginationDto,
                undefined,
                undefined,
            );

            expect(result).toEqual(mockPaginatedResponse);
            expect(service.retrieveUserNotifications).toHaveBeenCalledTimes(1);
            expect(service.retrieveUserNotifications).toHaveBeenCalledWith(1, 10, 'user-123', {
                isNew: undefined,
                searchTerm: undefined,
            });
        });

        it('should retrieve notifications with isNew filter', async () => {
            const newNotifications = {
                ...mockPaginatedResponse,
                data: [mockNotification],
                total: 1,
            };
            mockNotificationsService.retrieveUserNotifications.mockResolvedValue(newNotifications);

            const result = await controller.allNotifications(
                mockCurrentUser,
                paginationDto,
                true,
                undefined,
            );

            expect(result).toEqual(newNotifications);
            expect(service.retrieveUserNotifications).toHaveBeenCalledWith(1, 10, 'user-123', {
                isNew: true,
                searchTerm: undefined,
            });
        });

        it('should retrieve notifications with search term', async () => {
            mockNotificationsService.retrieveUserNotifications.mockResolvedValue(
                mockPaginatedResponse,
            );

            const result = await controller.allNotifications(
                mockCurrentUser,
                paginationDto,
                undefined,
                'test',
            );

            expect(result).toEqual(mockPaginatedResponse);
            expect(service.retrieveUserNotifications).toHaveBeenCalledWith(1, 10, 'user-123', {
                isNew: undefined,
                searchTerm: 'test',
            });
        });

        it('should retrieve notifications with both isNew and search filters', async () => {
            mockNotificationsService.retrieveUserNotifications.mockResolvedValue(
                mockPaginatedResponse,
            );

            const result = await controller.allNotifications(
                mockCurrentUser,
                paginationDto,
                true,
                'important',
            );

            expect(result).toEqual(mockPaginatedResponse);
            expect(service.retrieveUserNotifications).toHaveBeenCalledWith(1, 10, 'user-123', {
                isNew: true,
                searchTerm: 'important',
            });
        });

        it('should handle different pagination values', async () => {
            paginationDto.page = 2;
            paginationDto.limit = 25;
            mockNotificationsService.retrieveUserNotifications.mockResolvedValue(
                mockPaginatedResponse,
            );

            const result = await controller.allNotifications(
                mockCurrentUser,
                paginationDto,
                undefined,
                undefined,
            );

            expect(result).toEqual(mockPaginatedResponse);
            expect(service.retrieveUserNotifications).toHaveBeenCalledWith(2, 25, 'user-123', {
                isNew: undefined,
                searchTerm: undefined,
            });
        });

        it('should return empty results when no notifications match filters', async () => {
            const emptyResponse = {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
            };
            mockNotificationsService.retrieveUserNotifications.mockResolvedValue(emptyResponse);

            const result = await controller.allNotifications(
                mockCurrentUser,
                paginationDto,
                true,
                'nonexistent',
            );

            expect(result).toEqual(emptyResponse);
        });

        it('should propagate service errors', async () => {
            const error = new Error('Query failed');
            mockNotificationsService.retrieveUserNotifications.mockRejectedValue(error);

            await expect(
                controller.allNotifications(mockCurrentUser, paginationDto, undefined, undefined),
            ).rejects.toThrow('Query failed');
        });

        it('should handle isNew as false', async () => {
            mockNotificationsService.retrieveUserNotifications.mockResolvedValue(
                mockPaginatedResponse,
            );

            await controller.allNotifications(mockCurrentUser, paginationDto, false, undefined);

            expect(service.retrieveUserNotifications).toHaveBeenCalledWith(1, 10, 'user-123', {
                isNew: false,
                searchTerm: undefined,
            });
        });
    });

    describe('findOne', () => {
        it('should retrieve notification by id', async () => {
            mockNotificationsService.nDetails.mockResolvedValue(mockNotification);

            const result = await controller.findOne('notif-1');

            expect(result).toEqual(mockNotification);
            expect(service.nDetails).toHaveBeenCalledTimes(1);
            expect(service.nDetails).toHaveBeenCalledWith('notif-1');
        });

        it('should handle different notification IDs', async () => {
            const differentNotification = {
                ...mockNotification,
                id: 'notif-999',
            };
            mockNotificationsService.nDetails.mockResolvedValue(differentNotification);

            const result = await controller.findOne('notif-999');

            expect(result).toEqual(differentNotification);
            expect(service.nDetails).toHaveBeenCalledWith('notif-999');
        });

        it('should propagate not found errors', async () => {
            const error = new Error('Notification not found');
            mockNotificationsService.nDetails.mockRejectedValue(error);

            await expect(controller.findOne('invalid-id')).rejects.toThrow(
                'Notification not found',
            );
        });

        it('should propagate service errors', async () => {
            const error = new Error('Database error');
            mockNotificationsService.nDetails.mockRejectedValue(error);

            await expect(controller.findOne('notif-1')).rejects.toThrow('Database error');
        });
    });

    describe('delete', () => {
        it('should delete specified notifications', async () => {
            const uuidsDto: UuidsArrayDto = {
                ids: ['notif-1', 'notif-2'],
            };
            const deleteResponse = {
                message: 'Notifications deleted successfully',
                count: 2,
            };
            mockNotificationsService.clearNotifs.mockResolvedValue(deleteResponse);

            const result = await controller.delete(mockCurrentUser, uuidsDto);

            expect(result).toEqual(deleteResponse);
            expect(service.clearNotifs).toHaveBeenCalledTimes(1);
            expect(service.clearNotifs).toHaveBeenCalledWith('user-123', ['notif-1', 'notif-2']);
        });

        it('should delete single notification', async () => {
            const uuidsDto: UuidsArrayDto = {
                ids: ['notif-1'],
            };
            const deleteResponse = {
                message: 'Notification deleted successfully',
                count: 1,
            };
            mockNotificationsService.clearNotifs.mockResolvedValue(deleteResponse);

            const result = await controller.delete(mockCurrentUser, uuidsDto);

            expect(result).toEqual(deleteResponse);
            expect(service.clearNotifs).toHaveBeenCalledWith('user-123', ['notif-1']);
        });

        it('should delete multiple notifications', async () => {
            const uuidsDto: UuidsArrayDto = {
                ids: ['notif-1', 'notif-2', 'notif-3', 'notif-4', 'notif-5'],
            };
            const deleteResponse = {
                message: 'Notifications deleted successfully',
                count: 5,
            };
            mockNotificationsService.clearNotifs.mockResolvedValue(deleteResponse);

            const result = await controller.delete(mockCurrentUser, uuidsDto);

            expect(result).toEqual(deleteResponse);
            expect(service.clearNotifs).toHaveBeenCalledWith('user-123', uuidsDto.ids);
        });

        it('should handle empty ids array', async () => {
            const uuidsDto: UuidsArrayDto = {
                ids: [],
            };
            const deleteResponse = {
                message: 'No notifications to delete',
                count: 0,
            };
            mockNotificationsService.clearNotifs.mockResolvedValue(deleteResponse);

            const result = await controller.delete(mockCurrentUser, uuidsDto);

            expect(result).toEqual(deleteResponse);
            expect(service.clearNotifs).toHaveBeenCalledWith('user-123', []);
        });

        it('should propagate not found errors', async () => {
            const uuidsDto: UuidsArrayDto = {
                ids: ['invalid-id'],
            };
            const error = new Error('Notifications not found');
            mockNotificationsService.clearNotifs.mockRejectedValue(error);

            await expect(controller.delete(mockCurrentUser, uuidsDto)).rejects.toThrow(
                'Notifications not found',
            );
        });

        it('should propagate service errors', async () => {
            const uuidsDto: UuidsArrayDto = {
                ids: ['notif-1'],
            };
            const error = new Error('Delete failed');
            mockNotificationsService.clearNotifs.mockRejectedValue(error);

            await expect(controller.delete(mockCurrentUser, uuidsDto)).rejects.toThrow(
                'Delete failed',
            );
        });
    });

    describe('deleteAll', () => {
        it('should delete all user notifications', async () => {
            const deleteResponse = {
                message: 'All notifications deleted successfully',
                count: 10,
            };
            mockNotificationsService.clearAllNotifs.mockResolvedValue(deleteResponse);

            const result = await controller.deleteAll(mockCurrentUser);

            expect(result).toEqual(deleteResponse);
            expect(service.clearAllNotifs).toHaveBeenCalledTimes(1);
            expect(service.clearAllNotifs).toHaveBeenCalledWith('user-123');
        });

        it('should handle user with no notifications', async () => {
            const deleteResponse = {
                message: 'No notifications to delete',
                count: 0,
            };
            mockNotificationsService.clearAllNotifs.mockResolvedValue(deleteResponse);

            const result = await controller.deleteAll(mockCurrentUser);

            expect(result).toEqual(deleteResponse);
            expect(service.clearAllNotifs).toHaveBeenCalledWith('user-123');
        });

        it('should handle different user IDs', async () => {
            const differentUser = { ...mockCurrentUser, id: 'user-789' };
            const deleteResponse = {
                message: 'All notifications deleted successfully',
                count: 5,
            };
            mockNotificationsService.clearAllNotifs.mockResolvedValue(deleteResponse);

            const result = await controller.deleteAll(differentUser);

            expect(result).toEqual(deleteResponse);
            expect(service.clearAllNotifs).toHaveBeenCalledWith('user-789');
        });

        it('should propagate service errors', async () => {
            const error = new Error('Delete all failed');
            mockNotificationsService.clearAllNotifs.mockRejectedValue(error);

            await expect(controller.deleteAll(mockCurrentUser)).rejects.toThrow(
                'Delete all failed',
            );
        });

        it('should handle large number of deletions', async () => {
            const deleteResponse = {
                message: 'All notifications deleted successfully',
                count: 1000,
            };
            mockNotificationsService.clearAllNotifs.mockResolvedValue(deleteResponse);

            const result = await controller.deleteAll(mockCurrentUser);

            expect(result).toEqual(deleteResponse);
            expect(result.message).toBe('All notifications deleted successfully');
        });
    });

    describe('Decorator metadata', () => {
        it('should have correct controller path', () => {
            const path = Reflect.getMetadata('path', NotificationsController);
            expect(path).toBe('notifications');
        });

        it('should have GET method metadata on badgeCount', () => {
            const path = Reflect.getMetadata('path', controller.badgeCount);
            expect(path).toBeDefined();
        });

        it('should have GET method metadata on allNotifications', () => {
            const path = Reflect.getMetadata('path', controller.allNotifications);
            expect(path).toBeDefined();
        });

        it('should have GET method with param metadata on findOne', () => {
            const path = Reflect.getMetadata('path', controller.findOne);
            expect(path).toBeDefined();
        });

        it('should have DELETE method metadata on delete', () => {
            const path = Reflect.getMetadata('path', controller.delete);
            expect(path).toBeDefined();
        });

        it('should have DELETE method metadata on deleteAll', () => {
            const path = Reflect.getMetadata('path', controller.deleteAll);
            expect(path).toBeDefined();
        });
    });

    describe('Integration scenarios', () => {
        it('should handle complete notification flow', async () => {
            const paginationDto = new PaginationDto();
            paginationDto.page = 1;
            paginationDto.limit = 10;

            mockNotificationsService.nUsersService.userUnreadNs.mockResolvedValue(2);
            const badgeCount = await controller.badgeCount(mockCurrentUser);
            expect(badgeCount).toBe(2);

            mockNotificationsService.retrieveUserNotifications.mockResolvedValue(
                mockPaginatedResponse,
            );
            const allNotifs = await controller.allNotifications(
                mockCurrentUser,
                paginationDto,
                undefined,
                undefined,
            );
            expect(allNotifs).toEqual(mockPaginatedResponse);

            mockNotificationsService.nDetails.mockResolvedValue(mockNotification);
            const oneNotif = await controller.findOne('notif-1');
            expect(oneNotif).toEqual(mockNotification);

            const uuidsDto: UuidsArrayDto = { ids: ['notif-1'] };
            mockNotificationsService.clearNotifs.mockResolvedValue({
                message: 'Deleted',
                count: 1,
            });
            const deleteResult = await controller.delete(mockCurrentUser, uuidsDto);
            expect(deleteResult.message).toBe('Deleted');

            mockNotificationsService.clearAllNotifs.mockResolvedValue({
                message: 'All deleted',
                count: 1,
            });
            const deleteAllResult = await controller.deleteAll(mockCurrentUser);
            expect(deleteAllResult.message).toBe('All deleted');
        });

        it('should handle concurrent requests correctly', async () => {
            mockNotificationsService.nUsersService.userUnreadNs.mockResolvedValue(3);
            mockNotificationsService.nDetails.mockResolvedValue(mockNotification);

            const [count1, count2, detail1, detail2] = await Promise.all([
                controller.badgeCount(mockCurrentUser),
                controller.badgeCount(mockCurrentUser),
                controller.findOne('notif-1'),
                controller.findOne('notif-2'),
            ]);

            expect(count1).toBe(3);
            expect(count2).toBe(3);
            expect(detail1).toEqual(mockNotification);
            expect(detail2).toEqual(mockNotification);
            expect(service.nUsersService.userUnreadNs).toHaveBeenCalledTimes(2);
            expect(service.nDetails).toHaveBeenCalledTimes(2);
        });
    });

    describe('markAsRead', () => {
        it('should mark notifications as read and return success message', async () => {
            const uuidsDto: UuidsArrayDto = { ids: ['notif-1', 'notif-2'] };
            const markResponse = {
                message: 'Notifications marked as read successfully',
            };
            mockNotificationsService.nUsersService.markNAsRead = jest
                .fn()
                .mockResolvedValue(markResponse);

            const result = await controller.markAsRead(mockCurrentUser, uuidsDto);

            expect(result).toEqual(markResponse);
            expect(service.nUsersService.markNAsRead).toHaveBeenCalledWith('user-123', [
                'notif-1',
                'notif-2',
            ]);
        });

        it('should handle single notification', async () => {
            const uuidsDto: UuidsArrayDto = { ids: ['notif-1'] };
            mockNotificationsService.nUsersService.markNAsRead = jest.fn().mockResolvedValue({
                message: 'Notifications marked as read successfully',
            });

            await controller.markAsRead(mockCurrentUser, uuidsDto);

            expect(service.nUsersService.markNAsRead).toHaveBeenCalledWith('user-123', ['notif-1']);
        });

        it('should propagate service errors', async () => {
            const uuidsDto: UuidsArrayDto = { ids: ['notif-1'] };
            mockNotificationsService.nUsersService.markNAsRead = jest
                .fn()
                .mockRejectedValue(new Error('Not found'));

            await expect(controller.markAsRead(mockCurrentUser, uuidsDto)).rejects.toThrow(
                'Not found',
            );
        });
    });
});
