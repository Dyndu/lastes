import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NUsersEntity } from '../entities/n-users.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { NotificationEntity } from '../entities/notification.entity';
import { In } from 'typeorm';

@Injectable()
export class NUsersService {
    /**
     * Service responsible for handling user notifications operations
     */

    constructor(
        @Inject(forwardRef(() => NotificationsService))
        private readonly nsService: NotificationsService,
    ) {}

    /**
     * Counts and returns the number of unread notifications for a specific user.
     * Logs the action for tracking purposes.
     */
    async userUnreadNs(userId: string): Promise<number> {
        this.nsService.logger.info(`Calculated unread notifications for user ${userId}`);

        return await this.nsService.nUserRepo.count({
            where: { user: { id: userId }, isNew: true },
        });
    }

    /**
     * Builds a base query for retrieving user notifications, with optional filters for new/unread status and search term.
     * Joins the notification receiver, user, and notification entities, and applies filters for user ID, deletion status, and optional search term.
     */
    buildNotificationBaseQuery(filters: { userId: string; isNew?: boolean; searchTerm?: string }) {
        const { userId, isNew, searchTerm } = filters;
        const query = this.nsService.nUserRepo
            .getRepository()
            .createQueryBuilder('nReceiver')
            .leftJoinAndSelect('nReceiver.user', 'user')
            .leftJoinAndSelect('nReceiver.notification', 'notification')
            .andWhere('(user.id = :userId)', { userId })
            .andWhere('nReceiver.deleted = false');

        if (isNew !== undefined) query.andWhere('nReceiver.isNew = :isNew', { isNew });

        if (searchTerm) {
            const likePattern = `%${searchTerm.split('').join('%')}%`;
            query.andWhere(
                `(LOWER(notification.label) ILIKE :searchTerm
                OR LOWER(notification.content) ILIKE :searchTerm)`,
                { searchTerm: likePattern.toLowerCase() },
            );
        }

        return query;
    }

    /**
     * Constructs a paginated query for retrieving user notifications, sorted by update date in descending order.
     * Applies offset and limit for pagination, and uses the base query built with optional filters.
     */
    retrieveNotificationQuery(
        offset: number,
        limit: number,
        filters: {
            userId: string;
            isNew?: boolean;
            searchTerm?: string;
        },
    ) {
        const queryBuilder = this.buildNotificationBaseQuery(filters);

        queryBuilder.orderBy('nReceiver.createdAt', 'DESC').skip(offset).take(limit);

        return queryBuilder;
    }

    /**
     * Retrieves multiple user notification records matching the provided criteria,
     * including related user and notification entities. Validates that the number of
     * results matches the expected count if an array of IDs is provided in the criteria,
     * throwing a not found error if there's a mismatch.
     */
    async retrieveNUsersByCriteria(criteria: Record<string, any>): Promise<NUsersEntity[]> {
        const entries = this.nsService.otherUtils.formatCriteria(criteria);
        this.nsService.logger.info(`Retrieving user notifications by ${entries}`);

        const results = await this.nsService.nUserRepo.findActiveMany(
            this.nsService.nUserRepo,
            criteria,
            ['user', 'notification'],
        );

        const expectedSize = Object.values(criteria).find(
            (value) => value?._value && Array.isArray(value._value),
        )?._value?.length;

        if (expectedSize && results.length !== expectedSize)
            this.nsService.errorHandler.notFound(
                `Expected ${expectedSize} user notification but found ${results.length}. Some notification IDs do not exist.`,
                `Notifications not found`,
            );

        return results;
    }

    /**
     * Creates notification receiver entities for a list of users and a specific notification.
     * Maps each user to a new notification receiver entities, associating the user and notification.
     */
    buildNReceiversForUsers(n: NotificationEntity, users: UserEntity[]): NUsersEntity[] {
        return users.map((user) => {
            const nReceiver = new NUsersEntity();

            nReceiver.user = user;
            nReceiver.notification = n;
            nReceiver.isNew = true;

            return nReceiver;
        });
    }

    /**
     * Marks specified notifications as read for a user by updating their status in the database.
     * Retrieves unread notifications, updates them to mark as read, recalculates the unread count,
     * and sends the updated badge count to the user via WebSocket. Clears notification caches afterward.
     * Returns a success message upon completion.
     */
    async markNAsRead(userId: string, ids: string[]) {
        this.nsService.logger.info(`Marking notifications as for user ${userId}`);

        const notifications = await this.retrieveNUsersByCriteria({
            user: { id: userId },
            notification: { id: In(ids) },
            isNew: true,
        });

        await this.nsService.nUserRepo.update(
            { id: In(notifications.map((ns) => ns.id)) },
            { isNew: false },
        );

        const count = await this.userUnreadNs(userId);

        this.nsService.preNService.wsSendUserBadgeCount(userId, count);
        await this.nsService.preNService.clearNotificationCaches(userId);

        return { message: 'Notifications marked as read successfully' };
    }
}
