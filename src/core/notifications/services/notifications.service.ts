import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { In } from 'typeorm';
import { NotificationsRepository } from '../repositories/notifications.repository';
import { NUsersRepository } from '../repositories/n-users.repository';
import { ErrorHandlerService } from '../../../common/response';
import { OtherUtils } from '../../../utils/services/tools';
import { CacheService } from '../../../helpers/cache/cache.service';
import { SocketService } from '../../../helpers/socket/socket.service';
import { NUsersService } from './n-users.service';
import { PreNotificationsService } from './pre-notifications.service';
import { NUsersEntity } from '../entities/n-users.entity';
import { NotificationSubjectTypeEnum } from '../../../common/enum';
import { UserEntity } from '../../users/entities/user.entity';
import { NotificationEntity } from '../entities/notification.entity';

@Injectable()
export class NotificationsService {
    /**
     * Service responsible for handling notifications operations
     */

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        @Inject(forwardRef(() => NUsersService))
        readonly nUsersService: NUsersService,
        @Inject(forwardRef(() => PreNotificationsService))
        readonly preNService: PreNotificationsService,
        readonly notifsRepo: NotificationsRepository,
        readonly nUserRepo: NUsersRepository,
        readonly otherUtils: OtherUtils,
        readonly cacheService: CacheService,
        readonly socketService: SocketService,
        readonly errorHandler: ErrorHandlerService,
    ) {}

    /**
     * Retrieves paginated user notifications, applying optional filters for new/unread status and search term.
     * Uses a cache layer to store and retrieve results, and transforms the notification receivers before returning.
     * Logs the retrieval process for tracking.
     */
    async retrieveUserNotifications(
        page: number,
        limit: number,
        userId: string,
        filterItems: {
            isNew?: boolean;
            searchTerm?: string;
        },
    ) {
        this.logger.info(`Retrieve user connected notification`);

        const baseKey = this.cacheService.generateRedisKey('notifications', {
            userId,
            ...(filterItems.isNew === undefined ? {} : { isNew: filterItems.isNew }),
            ...(filterItems.searchTerm ? { search: filterItems.searchTerm.toLowerCase() } : {}),
        });

        return await this.cacheService.retrieveGenericPaginated(
            baseKey,
            page,
            limit,
            {
                userId,
                isNew: filterItems.isNew,
                searchTerm: filterItems.searchTerm,
            },
            (offset: number, limit: number) =>
                this.nUsersService.retrieveNotificationQuery(offset, limit, {
                    userId: userId,
                    isNew: filterItems.isNew,
                    searchTerm: filterItems.searchTerm,
                }),
            (items: NUsersEntity[]) => this.preNService.transformNotificationReceivers(items),
        );
    }

    /**
     * Retrieves detailed information for a specific notification by ID,
     * including the sender relationship, and returns the transformed
     * notification data.
     */
    async nDetails(id: string) {
        this.logger.info(`Retrieving notification with id: ${id} details`);

        const isNotificationExist = await this.preNService.retrieveNotificationByCriteria({ id }, [
            'sentBy',
        ]);

        return this.preNService.transformNotification(isNotificationExist);
    }

    /**
     * Creates a new notification with the specified label, content, and subject type,
     * along with optional parameters for subject ID, route, and sender information.
     * Returns the created notification entities.
     */
    async createNotification(
        label: string,
        content: string,
        subjectType: NotificationSubjectTypeEnum,
        optional: {
            subjectId?: string;
            route?: string;
            sentBy?: UserEntity;
        },
    ): Promise<NotificationEntity> {
        this.logger.info(`Creating notification with label: ${label}`);

        return await this.notifsRepo.create(
            this.preNService.buildNotificationEntity({ label, content, subjectType }, optional),
        );
    }

    /**
     * Sends a notification to multiple users by creating notification-user records,
     * triggering the notification delivery, and asynchronously clearing notification
     * caches for each recipient. Returns a success message upon completion.
     */
    async sendNotificationToUsers(notification: NotificationEntity, users: UserEntity[]) {
        this.logger.info(`Sending notification to users`);

        const data = await this.nUserRepo.createMany(
            this.nUsersService.buildNReceiversForUsers(notification, users),
        );

        await this.preNService.sendNotification(data);

        setImmediate(async () => {
            for (const result of data) {
                await this.preNService.clearNotificationCaches(result.user.id);
            }
        });

        return { message: 'Notification sent successfully' };
    }

    /**
     * Refreshes a user's notification state by retrieving their unread notification count,
     * broadcasting the updated badge count via WebSocket, and clearing the user's
     * notification caches.
     */
    async refreshUserNotificationState(userId: string) {
        const count = await this.nUsersService.userUnreadNs(userId);
        this.preNService.wsSendUserBadgeCount(userId, count);
        await this.preNService.clearNotificationCaches(userId);
    }

    /**
     * Updates multiple user notifications based on provided IDs and search criteria,
     * applies the update data to matching records, refreshes the user's notification
     * state, and returns a custom success message.
     */
    async updateNotifications(
        userId: string,
        ids: string[],
        searchCriteria: object,
        updateData: object,
        successMessage: string,
    ) {
        const notifications = await this.nUsersService.retrieveNUsersByCriteria({
            notification: { id: In(ids) },
            user: { id: userId },
            ...searchCriteria,
        });

        if (notifications?.length > 0) {
            await this.nUserRepo.update({ id: In(ids) }, updateData);
            await this.refreshUserNotificationState(userId);
        }

        return { message: successMessage };
    }

    /**
     * Marks specified notifications as read for a user by updating their 'isNew' status
     * from true to false, filtering only previously unread notifications, and returns
     * a success message.
     */
    async markAsRead(userId: string, ids: string[]) {
        this.logger.info(
            `Marking notifications with ids: ${JSON.stringify(ids)} as read for user with id: ${userId}`,
        );

        return this.updateNotifications(
            userId,
            ids,
            { isNew: true },
            { isNew: false },
            'Notifications marked as read successfully',
        );
    }

    /**
     * Soft deletes specified notifications for a user by marking them as deleted,
     * without additional filtering criteria, and returns a success message.
     */
    async clearNotifs(userId: string, ids: string[]) {
        this.logger.info(
            `Deleting notifications with ids: ${JSON.stringify(ids)} for user with id: ${userId}`,
        );

        return this.updateNotifications(
            userId,
            ids,
            {},
            { deleted: true },
            'Notifications deleted successfully',
        );
    }

    /**
     * Soft deletes all notifications for a specific user by marking them as deleted,
     * refreshes the user's notification state, and returns a success message.
     */
    async clearAllNotifs(userId: string) {
        this.logger.info(`Deleting all notifications for user with id: ${userId}`);

        await this.nUserRepo.update({ user: { id: userId } }, { deleted: true });

        await this.refreshUserNotificationState(userId);

        return { message: 'All notifications cleared' };
    }
}
