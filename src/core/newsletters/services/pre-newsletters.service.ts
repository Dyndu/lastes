import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { NewslettersService } from './newsletters.service';
import { NewsletterEntity } from '../entities/newsletter.entity';
import {
    NewsletterAudienceEnum,
    NewsletterChannelEnum,
    NewsletterSendModeEnum,
    NewsletterStatusEnum,
    NotificationSubjectTypeEnum,
    SocketEventEnum,
    UserStatusEnum,
} from '../../../common/enum';
import { UserEntity } from '../../users/entities/user.entity';

@Injectable()
export class PreNewslettersService {
    /**
     * Service responsible for handling pre new letters operation
     */

    constructor(
        @Inject(forwardRef(() => NewslettersService))
        private readonly nlService: NewslettersService,
    ) {}

    /**
     * Builds a query for newsletters by applying optional filters for channel, status, and a search term,
     * while excluding deleted newsletters. Also includes related file links and file details in the result.
     */
    buildNLettersQuery(filters: {
        channel: NewsletterChannelEnum;
        status?: NewsletterStatusEnum;
        searchTerm?: string;
    }) {
        const { channel, status, searchTerm } = filters;

        const query = this.nlService.newLetterRepo
            .getRepository()
            .createQueryBuilder('news')
            .andWhere('news.deleted = false');

        if (channel) query.andWhere('news.channel = :channel', { channel });
        if (status) query.andWhere('news.status = :status', { status });

        if (searchTerm) {
            const likePattern = `%${searchTerm.toLowerCase()}%`;

            query.andWhere(
                `
        (
            news.label ILIKE :searchTerm
            OR news.content ILIKE :searchTerm
            OR ("news"."sendMode"::text) ILIKE :searchTerm
            OR ("news"."audience"::text) ILIKE :searchTerm
        )
        `,
                { searchTerm: likePattern },
            );
        }

        return query;
    }

    /**
     * Builds and returns a paginated query for retrieving newsletters, applying filters (channel, status, search term),
     * ordering results by update date (descending), and limiting the results by offset and limit.
     */
    retrieveNewsLettersQuery(
        offset: number,
        limit: number,
        filters: {
            channel: NewsletterChannelEnum;
            status?: NewsletterStatusEnum;
            searchTerm?: string;
        },
    ) {
        const queryBuilder = this.buildNLettersQuery(filters);

        queryBuilder.orderBy('news.updatedAt', 'DESC').skip(offset).take(limit);

        return queryBuilder;
    }

    /**
     * Retrieves a newsletter by specified criteria after formatting them.
     * Logs the search attempt and checks for an active newsletter matching the criteria.
     * Throws a "not found" error if no matching newsletter is found.
     */
    async retrieveNewLetterByCriteria(criteria: Record<string, any>): Promise<NewsletterEntity> {
        const entry = this.nlService.otherUtils.formatCriteria(criteria);
        this.nlService.logger.info(`Finding a new letter by ${entry}`);

        const isNewExist = await this.nlService.newLetterRepo.findActiveOne(
            this.nlService.newLetterRepo,
            criteria,
        );

        if (!isNewExist)
            this.nlService.errorHandler.notFound(
                `Newsletter not found with entry ${entry}`,
                `Newsletter not found`,
            );

        return isNewExist;
    }

    /**
     * Constructs and returns a new NewsletterEntity by merging required fields (label, content, status, channel, sendMode, audience)
     * with optional fields (scheduledAt) into a new entities instance.
     */
    buildNewLetterEntity(
        required: {
            label: string;
            content: string;
            status: NewsletterStatusEnum;
            channel: NewsletterChannelEnum;
            sendMode: NewsletterSendModeEnum;
            audience: NewsletterAudienceEnum;
        },
        optional: {
            scheduledAt?: Date;
        },
    ) {
        const newsLetter = new NewsletterEntity();
        Object.assign(newsLetter, required, optional);
        return newsLetter;
    }

    /**
     * Updates a newsletter entities with provided partial updates, trimming string fields (label, content)
     * and applying non-string updates (status, channel, sendMode, audience, scheduledAt) if provided.
     * Returns the result of the update operation. Skips if no updates are provided.
     */
    async updateNewsLetter(
        newLetter: NewsletterEntity,
        newUpdates?: Partial<{
            label?: string;
            content?: string;
            status?: NewsletterStatusEnum;
            channel?: NewsletterChannelEnum;
            sendMode?: NewsletterSendModeEnum;
            audience?: NewsletterAudienceEnum;
            scheduledAt?: Date;
        }>,
    ) {
        if (!newUpdates || Object.keys(newUpdates).length === 0)
            return { message: 'No newsLetter updates provided for ads' };

        const stringFields = ['label', 'content'] as const;

        const updatePayload: Partial<NewsletterEntity> = {};

        stringFields.forEach((field) => {
            if (newUpdates[field]?.trim()) updatePayload[field] = newUpdates[field].trim();
        });

        const otherFields = ['status', 'channel', 'sendMode', 'audience', 'scheduledAt'] as const;

        otherFields.forEach((field) => {
            if (newUpdates[field] !== undefined) updatePayload[field] = newUpdates[field] as any;
        });

        return await this.nlService.newLetterRepo.update({ id: newLetter.id }, updatePayload);
    }

    /**
     * Ensures the uniqueness of a newsletter label by checking if an active newsletter with the same label already exists.
     * Throws a validation error if a duplicate label is found.
     */
    async ensureLabelUnique(label: string) {
        const errors: Record<string, string> = {};
        await this.nlService.newLetterRepo.assertUniqueActive(
            this.nlService.newLetterRepo,
            errors,
            { label },
            'News letter',
        );

        if (Object.keys(errors).length > 0) throw this.nlService.errorHandler.validation(errors);
    }

    /**
     * Ensures the uniqueness of a newsletter label during an update by checking if another active newsletter (excluding the current one) already uses the same label.
     * Throws a validation error if a duplicate label is found.
     */
    async ensureLabelUniqueForUpdate(label: string, news: NewsletterEntity) {
        const errors: Record<string, string> = {};
        await this.nlService.newLetterRepo.assertUniqueActive(
            this.nlService.newLetterRepo,
            errors,
            { label },
            'News letter',
            news.id,
        );

        if (Object.keys(errors).length > 0) throw this.nlService.errorHandler.validation(errors);
    }

    /**
     * Schedules the invalidation of newsletter-related cache entries by deleting all keys with the 'newsletter' base.
     */
    async scheduleInvalidateNewsCache() {
        await this.nlService.cacheService.deleteKeysByBase('newsletter');
    }

    /**
     * Notifies clients about changes to a newsletter by sending the transformed newsletter data
     * via socket to the '/newsletter' route with the specified event type.
     */
    notifyAdsChange(news: NewsletterEntity, event: SocketEventEnum): void {
        this.nlService.socketService.sendDataToRoute('/newsletter', event, {
            payload: [this.nlService.transformNewsLetter(news)],
        });
    }

    /**
     * Throws a validation error using the provided error record.
     */
    private throwValidation(error: Record<string, string>) {
        throw this.nlService.errorHandler.validation(error);
    }

    /**
     * Validates that the actual send mode of a newsletter matches the expected send mode for its current status.
     * Throws a validation error if the send modes do not match.
     */
    private requireSendMode(
        actual: NewsletterSendModeEnum,
        expected: NewsletterSendModeEnum,
        status: NewsletterStatusEnum,
    ) {
        if (actual !== expected)
            this.throwValidation({
                sendMode: `${status} newsletters must use ${expected} send mode`,
            });
    }

    /**
     * Ensures that a newsletter with the given status cannot have a scheduled date.
     * Throws a validation error if a scheduled date is provided.
     */
    private forbidSchedule(status: NewsletterStatusEnum, scheduledAt?: Date | null) {
        if (scheduledAt)
            this.throwValidation({
                scheduledAt: `${status} newsletters cannot be scheduled`,
            });
    }

    /**
     * Validates that a scheduled date is provided and is set to a future date for SCHEDULED newsletters.
     * Throws a validation error if the date is missing or not in the future.
     */
    private requireFutureSchedule(scheduledAt?: Date | null) {
        if (!scheduledAt)
            return this.throwValidation({
                scheduledAt: 'scheduledAt is required for SCHEDULED newsletters',
            });

        const scheduledMs = new Date(scheduledAt).getTime();
        const nowMs = Date.now();

        if (Number.isNaN(scheduledMs))
            this.throwValidation({
                scheduledAt: 'scheduledAt is not a valid date',
            });

        if (scheduledMs <= nowMs)
            this.throwValidation({
                scheduledAt: 'scheduledAt must be a future date',
            });
    }

    /**
     * Validates the constraints of a newsletter's status by enforcing rules for send mode and scheduled date:
     * - DRAFT: Requires MANUAL send mode and forbids scheduling.
     * - SCHEDULED: Requires TO BE SCHEDULED send mode and a future scheduled date.
     * - PENDING: Requires IMMEDIATE send mode and forbids scheduling.
     * - SENT/FAILED: Forbids scheduling.
     * Throws an error for unhandled statuses.
     */
    validateStatusConstraints(payload: {
        status: NewsletterStatusEnum;
        sendMode: NewsletterSendModeEnum;
        scheduledAt?: Date | null;
    }) {
        const { status, sendMode, scheduledAt } = payload;

        switch (status) {
            case NewsletterStatusEnum.DRAFT:
                this.requireSendMode(sendMode, NewsletterSendModeEnum.MANUAL, status);
                this.forbidSchedule(status, scheduledAt);
                return;

            case NewsletterStatusEnum.SCHEDULED:
                this.requireSendMode(sendMode, NewsletterSendModeEnum.SCHEDULED, status);
                this.requireFutureSchedule(scheduledAt);
                return;

            case NewsletterStatusEnum.PENDING:
                this.requireSendMode(sendMode, NewsletterSendModeEnum.IMMEDIATE, status);
                this.forbidSchedule(status, scheduledAt);
                return;

            case NewsletterStatusEnum.SENT:
            case NewsletterStatusEnum.FAILED:
                this.forbidSchedule(status, scheduledAt);
                return;

            default:
                throw new Error(`Unhandled status: ${status}`);
        }
    }

    /**
     * Determines the newsletter status based on the provided payload (status, scheduledAt, sendMode).
     * Returns DRAFT if explicitly set, SCHEDULED if a date is provided, or PENDING/SENT based on the send mode.
     */
    resolveStatus(payload: {
        status?: NewsletterStatusEnum | null;
        scheduledAt?: Date | null;
        sendMode?: NewsletterSendModeEnum | null;
    }): NewsletterStatusEnum {
        const { status, scheduledAt, sendMode } = payload;

        if (status === NewsletterStatusEnum.DRAFT) return NewsletterStatusEnum.DRAFT;
        if (scheduledAt) return NewsletterStatusEnum.SCHEDULED;

        switch (sendMode) {
            case NewsletterSendModeEnum.MANUAL:
                return NewsletterStatusEnum.PENDING;

            case NewsletterSendModeEnum.IMMEDIATE:
                return NewsletterStatusEnum.SENT;

            default:
                return NewsletterStatusEnum.DRAFT;
        }
    }

    /**
     * Returns a filter object for querying active and non-deleted users.
     */
    activeUserWhere = () => ({
        deleted: false,
        status: UserStatusEnum.ACTIVE,
    });

    /**
     * Retrieves all active and non-deleted users with a specific role, selecting only their id and email.
     */
    async findAllActiveUsersByRole(roleLabel: string) {
        return this.nlService.userRepository.find({
            where: {
                ...this.activeUserWhere(),
                role: { label: roleLabel },
            },
            select: ['id', 'email', 'fullname'],
        });
    }

    /**
     * Retrieves active users matching a given list of user IDs and a specific role label.
     * Only non-deleted, active users are considered, and the result set is limited to
     * basic identifying fields.
     */
    async findActiveUsersByIds(ids: string[], roleLabel: string) {
        return this.nlService.userRepository.find({
            where: {
                id: In(ids),
                ...this.activeUserWhere(),
                role: { label: roleLabel },
            },
            select: ['id', 'email', 'fullname'],
        });
    }

    /**
     * Retrieves all active premium users.
     * Returns their IDs, emails, and full names.
     */
    async findPremiumUser() {
        return this.nlService.userRepository.find({
            where: {
                ...this.activeUserWhere(),
            },
            select: ['id', 'email', 'fullname'],
        });
    }

    /**
     * Resolves the list of newsletter recipients based on the selected audience type.
     * Supports predefined audiences and custom user lists, validating required inputs
     * and returning only active users matching the configured role.
     * Throws a validation error for invalid custom lists and fails for unsupported audiences.
     */
    async resolveAudienceRecipients(params: {
        audience: NewsletterAudienceEnum;
        customUserIds?: string[];
    }): Promise<UserEntity[]> {
        const { audience, customUserIds } = params;

        switch (audience) {
            case NewsletterAudienceEnum.ALL_USERS:
                return this.findAllActiveUsersByRole(this.nlService.config.userRole);

            case NewsletterAudienceEnum.PREMIUM_USERS:
                return this.findPremiumUser();

            case NewsletterAudienceEnum.CUSTOM_LIST:
                if (!customUserIds?.length)
                    throw this.nlService.errorHandler.validation({
                        audience: 'CUSTOM_LIST requires at least one user id',
                    });

                return this.findActiveUsersByIds(customUserIds, this.nlService.config.userRole);

            default:
                this.nlService.errorHandler.fail(
                    `Unsupported audience: ${audience}`,
                    `Unsupported audience: ${audience}`,
                );
        }
    }

    /**
     * Creates and dispatches a newsletter notification to a list of users.
     * The notification is attributed to the sender and categorized under
     * the newsletter notification subject.
     */
    async sendNewsLByNotification(
        sentBy: UserEntity,
        label: string,
        content: string,
        users: UserEntity[],
    ): Promise<void> {
        const notification = await this.nlService.notifService.createNotification(
            label,
            content,
            NotificationSubjectTypeEnum.NEWSLETTER,
            { sentBy },
        );

        await this.nlService.notifService.sendNotificationToUsers(notification, users);
    }

    /**
     * Builds the newsletter email content from a predefined template and
     * sends it to a list of users via bulk email delivery.
     */
    async sendNewsLByEmail(label: string, content: string, users: UserEntity[]): Promise<void> {
        for (const user of users) {
            const html = this.nlService.otherUtils.buildEmailTemplate(
                '../../../src/utils/templates/news-letter.hbs',
                {
                    label,
                    content,
                    fullname: user.fullname,
                    currentYear: new Date().getFullYear(),
                },
            );

            await this.nlService.mailerService.sendMail(user.email, 'Newsletter', html);
        }
    }

    /**
     * Orchestrates the delivery of a newsletter by resolving its recipients
     * and dispatching it through the configured communication channel.
     * Handles empty audiences gracefully and rejects unsupported channels.
     */
    async sendNewsLetter(
        sentBy: UserEntity,
        news: NewsletterEntity,
        usersIds?: string[],
    ): Promise<void> {
        const { label, content, audience, channel } = news;

        try {
            const users = await this.resolveAudienceRecipients({
                audience,
                customUserIds: usersIds,
            });

            if (!users.length) {
                this.nlService.logger.warn(`No recipients resolved for newsletter ${news.id}`);
                return;
            }

            const handlers: Record<NewsletterChannelEnum, (users: UserEntity[]) => Promise<void>> =
                {
                    [NewsletterChannelEnum.NOTIFICATION]: (u) =>
                        this.sendNewsLByNotification(sentBy, label, content, u),

                    [NewsletterChannelEnum.EMAIL]: (u) => this.sendNewsLByEmail(label, content, u),
                };

            const handler = handlers[channel];

            if (!handler)
                this.nlService.errorHandler.forbidden(
                    `Unsupported newsletter channel: ${channel}`,
                    `Unsupported newsletter channel: ${channel}`,
                );

            await handler(users);

            await this.nlService.newLetterRepo.update(
                { id: news.id },
                { status: NewsletterStatusEnum.SENT },
            );
        } catch (err) {
            await this.nlService.newLetterRepo.update(
                { id: news.id },
                { status: NewsletterStatusEnum.FAILED },
            );

            this.nlService.errorHandler.fail(`Failed to send newsletter ${news.id}`, `${err}`);
        }
    }

    /**
     * Cancels a scheduled newsletter job.
     * Retrieves the queued job by newsletter identifier and removes it if it exists.
     */
    async cancelScheduledJob(newsletterId: string) {
        const job = await this.nlService.newsletterQueue.getJob(`newsletter-${newsletterId}`);
        if (job) await job.remove();
    }
}
