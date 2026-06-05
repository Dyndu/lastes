import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationSubjectTypeEnum, SocketEventEnum } from '../../../common/enum';
import { UserEntity } from '../../users/entities/user.entity';
import { NotificationEntity } from '../entities/notification.entity';
import { NUsersEntity } from '../entities/n-users.entity';

@Injectable()
export class PreNotificationsService {
    /**
     * Service responsible for handling pre notifications operations
     */

    constructor(
        @Inject(forwardRef(() => NotificationsService))
        private readonly notificationsService: NotificationsService,
    ) {}

    /**
     * Transforms a notification entities into a simplified object structure
     * containing its main details and related entities references.
     */
    transformNotification = (n: NotificationEntity) => ({
        id: n.id,
        label: n.label,
        content: n.content,
        subjectType: n.subjectType,
        subjectId: n.subjectId,
        route: n.route,
        sentBy: n.sentBy,
    });

    /**
     * Transforms a notification receiver entities into a structured object,
     * including its read status and associated notification details.
     */
    transformNotificationReceiver = (nr: NUsersEntity) => ({
        id: nr.notification.id,
        isNew: nr.isNew,
        notification: this.transformNotification(nr.notification),
    });

    /**
     * Transforms an array of notification receiver entities
     * into a structured list of simplified notification receiver objects.
     */
    transformNotificationReceivers = (nrs: NUsersEntity[]) =>
        nrs.map(this.transformNotificationReceiver);

    /**
     * Builds a new NotificationEntity using required label and content, and optional related entities.
     */
    buildNotificationEntity(
        required: {
            label: string;
            content: string;
            subjectType: NotificationSubjectTypeEnum;
        },
        optional: {
            subjectId?: string;
            route?: string;
            sentBy?: UserEntity;
        },
    ): NotificationEntity {
        const notification = new NotificationEntity();
        Object.assign(notification, required, optional);
        return notification;
    }

    /**
     * Retrieves a notification based on a specified key-value criteria,
     * optionally including related entities, and throws an error if not found.
     */
    async retrieveNotificationByCriteria(
        criteria: Record<string, any>,
        relations?: string[],
    ): Promise<NotificationEntity> {
        const entry = this.notificationsService.otherUtils.formatCriteria(criteria);
        this.notificationsService.logger.info(`Find a notification by ${entry}`);

        const isNExist = await this.notificationsService.notifsRepo.findActiveOne(
            this.notificationsService.notifsRepo,
            criteria,
            relations,
        );

        if (!isNExist)
            this.notificationsService.errorHandler.notFound(
                `Notification not found with ${entry}`,
                `Notification not found`,
            );

        return isNExist;
    }

    /**
     * Clears all cached notifications for a specific user by deleting cache keys matching the user's ID pattern.
     */
    async clearNotificationCaches(userId: string) {
        await this.notificationsService.cacheService.deleteKeysByBase(
            `notifications:userId=${userId}*`,
        );
    }

    /**
     * Sends a new notification to a specific user via WebSocket.
     * Uses the socket service to emit the notification payload to the user's notification route.
     */
    wsSendNewNotif(userId: string, payload: any): void {
        this.notificationsService.socketService.sendDataToUser(
            userId,
            '/notifications',
            SocketEventEnum.NEW_NOTIFICATION,
            { payload: [payload] },
        );
    }

    /**
     * Sends the unread notification badge count to a specific user via WebSocket.
     * Emits the count to the user's notification route for UI updates.
     */
    wsSendUserBadgeCount(userId: string, payload: number): void {
        this.notificationsService.socketService.sendDataToUser(
            userId,
            '/notifications',
            SocketEventEnum.NOTIFICATION_BADGE_COUNT,
            { payload },
        );
    }

    /**
     * Sends notifications to multiple users asynchronously.
     * For each user, emits the new notification and updates their unread notification badge count via WebSocket.
     * Logs the start of the notification process for tracking.
     */
    async sendNotification(ns: NUsersEntity[]): Promise<void> {
        this.notificationsService.logger.info(
            `Sending notification ${ns[0].notification.id} to ${ns.length} users`,
        );

        await Promise.all(
            ns.map(async (n) => {
                const userId = n.user.id;
                const count = await this.notificationsService.nUsersService.userUnreadNs(userId);

                this.wsSendNewNotif(userId, this.transformNotificationReceiver(n));
                this.wsSendUserBadgeCount(userId, count);
            }),
        );
    }
}
