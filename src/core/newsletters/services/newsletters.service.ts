import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ErrorHandlerService } from '../../../common/response';
import { NewslettersRepository } from '../newsletters.repository';
import { OtherUtils } from '../../../utils/services/tools';
import { NewsletterEntity } from '../entities/newsletter.entity';
import { SocketService } from '../../../helpers/socket/socket.service';
import { CacheService } from '../../../helpers/cache/cache.service';
import {
    NewsletterChannelEnum,
    NewsletterSendModeEnum,
    NewsletterStatusEnum,
    SocketEventEnum,
} from '../../../common/enum';
import { PreNewslettersService } from './pre-newsletters.service';
import { NewsCreateDto } from '../dto/news-create.dto';
import { NewsUpdateDto } from '../dto/news-update.dto';
import { UsersRepository } from '../../users/repositories';
import { EnvConfigService } from '../../../utils/services/config';
import { NotificationsService } from '../../notifications/services';
import { MailerService } from '../../../libs/mailer/services';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class NewslettersService {
    /**
     * Service responsible for handling main new letters operations
     */

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        @Inject(forwardRef(() => PreNewslettersService))
        readonly preNLService: PreNewslettersService,
        @InjectQueue('newsletter')
        readonly newsletterQueue: Queue,
        readonly newLetterRepo: NewslettersRepository,
        readonly cacheService: CacheService,
        readonly socketService: SocketService,
        readonly otherUtils: OtherUtils,
        readonly config: EnvConfigService,
        readonly userRepository: UsersRepository,
        readonly mailerService: MailerService,
        readonly notifService: NotificationsService,
        readonly errorHandler: ErrorHandlerService,
    ) {}

    /**
     * Transforms a NewsletterEntity into a simplified object with essential fields:
     * id, label, content, recipient (audience), deliver_time (sendMode), sentAt (scheduledAt), and status.
     */
    transformNewsLetter = (n: NewsletterEntity) => ({
        id: n.id,
        label: n.label,
        content: n.content,
        recipient: n.audience,
        deliver_time: n.sendMode,
        sentAt: n.scheduledAt,
        status: n.status,
    });

    /**
     * Transforms an array of NewsletterEntity objects into an array of simplified newsletter objects
     * using the transformNewsLetter method for each entity.
     */
    transformNewLetters = (ns: NewsletterEntity[]) => ns.map((n) => this.transformNewsLetter(n));

    /**
     * Retrieves a paginated list of newsletters, either from cache or the database, based on provided filters (channel, status, search term).
     * Generates a cache key using the filters, and fetches or caches the results using a paginated query.
     * Transforms the retrieved newsletter entities into simplified objects before returning.
     */
    async getAllNewsletters(
        page: number,
        limit: number,
        filterItems: {
            channel: NewsletterChannelEnum;
            status?: NewsletterStatusEnum;
            searchTerm?: string;
        },
    ) {
        this.logger.info(`Getting all newsletters from cache or database`);

        const baseKey = this.cacheService.generateRedisKey('newsletter', {
            ...(filterItems.channel ? { channel: filterItems.channel } : {}),
            ...(filterItems.status ? { status: filterItems.status } : {}),
            ...(filterItems.searchTerm ? { search: filterItems.searchTerm.toLowerCase() } : {}),
        });

        return await this.cacheService.retrieveGenericPaginated(
            baseKey,
            page,
            limit,
            {
                channel: filterItems.channel,
                status: filterItems.status,
                searchTerm: filterItems.searchTerm,
            },
            (offset: number, limit: number) =>
                this.preNLService.retrieveNewsLettersQuery(offset, limit, {
                    channel: filterItems.channel,
                    status: filterItems.status,
                    searchTerm: filterItems.searchTerm,
                }),
            (items: NewsletterEntity[]) => this.transformNewLetters(items),
        );
    }

    /**
     * Retrieves the details of a newsletter by its identifier.
     * Logs the operation, validates the newsletter existence, and
     * returns the transformed newsletter representation.
     */
    async newsLetterDetails(id: string) {
        this.logger.info(`Getting newsletter details with id: ${id}`);
        const isNewExist = await this.preNLService.retrieveNewLetterByCriteria({
            id,
        });
        return this.transformNewsLetter(isNewExist);
    }

    /**
     * Retrieves the sender user by identifier, ensuring the user is not deleted.
     * Throws a not-found error when the sender does not exist.
     */
    async getSender(senderId: string) {
        const sentBy = await this.userRepository.findOne({
            where: { id: senderId, deleted: false },
        });
        if (!sentBy) this.errorHandler.notFound('User not found', 'User not found');
        return sentBy;
    }

    /**
     * Handles post-save operations for a newsletter, including notifying
     * advertisement changes, scheduling cache invalidation, and sending
     * the newsletter immediately if configured to do so.
     * Executes asynchronous follow-up tasks without blocking the main flow.
     */
    async handlePostSave(
        news: NewsletterEntity,
        sentBy: any,
        event: SocketEventEnum,
        usersIds?: string[],
    ) {
        this.preNLService.notifyAdsChange(news, event);

        setImmediate(async () => {
            await this.preNLService.scheduleInvalidateNewsCache();
            if (news.sendMode === NewsletterSendModeEnum.IMMEDIATE) {
                await this.preNLService.sendNewsLetter(sentBy, news, usersIds);
                await this.preNLService.scheduleInvalidateNewsCache();
            }
            if (news.sendMode === NewsletterSendModeEnum.SCHEDULED && news.scheduledAt) {
                const delay = new Date(news.scheduledAt).getTime() - Date.now();

                if (delay > 0)
                    await this.newsletterQueue.add(
                        'send-newsletter',
                        { newsletterId: news.id },
                        {
                            delay,
                            attempts: 1,
                            backoff: { type: 'exponential', delay: 5000 },
                            jobId: `newsletter-${news.id}`,
                        },
                    );
            }
        });
    }

    /**
     * Creates a new newsletter with the provided data and sender.
     * Validates uniqueness of the label, enforces status and scheduling constraints,
     * persists the newsletter entities, and triggers post-save operations such as
     * notifications and conditional immediate sending.
     */
    async createNewsletter(senderId: string, createDto: NewsCreateDto) {
        this.logger.info(`Create news letter with data ${JSON.stringify(createDto)}`);

        const { label, content, channel, scheduledAt, sendMode, audience, usersIds } = createDto;

        const sentBy = await this.getSender(senderId);

        await this.preNLService.ensureLabelUnique(label);

        const resolvedStatus = this.preNLService.resolveStatus({
            status: createDto.status,
            scheduledAt,
            sendMode,
        });

        this.preNLService.validateStatusConstraints({
            status: resolvedStatus,
            sendMode,
            scheduledAt,
        });
        const news = await this.newLetterRepo.create(
            this.preNLService.buildNewLetterEntity(
                {
                    label: label.trim(),
                    content: content.trim(),
                    channel,
                    status: resolvedStatus,
                    audience,
                    sendMode,
                },
                { scheduledAt },
            ),
        );

        await this.handlePostSave(news, sentBy, SocketEventEnum.NEW_LETTER_CREATED, usersIds);
        return { message: 'News letter created successfully.' };
    }

    /**
     * Updates an existing newsletter with the provided data and sender.
     * Ensures label uniqueness when changed, validates status and scheduling constraints,
     * persists updates, and triggers post-save operations including notifications
     * and conditional immediate sending.
     */
    async updateNewsletter(senderId: string, id: string, updateDto: NewsUpdateDto) {
        this.logger.info(`Update news letter with data ${JSON.stringify(updateDto)}`);

        const { label, content, channel, scheduledAt, sendMode, audience, usersIds } = updateDto;

        const [sentBy, isNewExist] = await Promise.all([
            this.getSender(senderId),
            this.preNLService.retrieveNewLetterByCriteria({
                id,
            }),
        ]);

        if (label) await this.preNLService.ensureLabelUniqueForUpdate(label, isNewExist);

        const resolvedStatus = this.preNLService.resolveStatus({
            status: updateDto.status,
            scheduledAt,
            sendMode: sendMode ?? isNewExist.sendMode,
        });

        let normalizedScheduledAt = scheduledAt ?? null;

        if (sendMode && sendMode !== NewsletterSendModeEnum.SCHEDULED) {
            normalizedScheduledAt = null;
        }

        this.preNLService.validateStatusConstraints({
            status: resolvedStatus,
            sendMode: sendMode ?? isNewExist.sendMode,
            scheduledAt: normalizedScheduledAt,
        });

        await this.preNLService.updateNewsLetter(isNewExist, {
            label,
            content,
            channel,
            status: resolvedStatus,
            scheduledAt: normalizedScheduledAt!,
            sendMode,
            audience,
        });

        const news = await this.preNLService.retrieveNewLetterByCriteria({
            id,
        });

        await this.preNLService.cancelScheduledJob(id);
        await this.handlePostSave(news, sentBy, SocketEventEnum.NEW_LETTER_UPDATED, usersIds);
        return { message: 'News letter updated successfully.' };
    }

    /**
     * Deletes a newsletter by its identifier, notifies related advertisement changes,
     * schedules cache invalidation, and logs the operation.
     * Returns a confirmation message upon successful deletion.
     */
    async deleteNewLetter(id: string) {
        this.logger.info(`Delete a news letter with id: ${id}`);

        const isNewsLetterExist = await this.preNLService.retrieveNewLetterByCriteria({ id });
        await this.preNLService.cancelScheduledJob(id);

        await this.newLetterRepo.delete({ id });

        this.preNLService.notifyAdsChange(isNewsLetterExist, SocketEventEnum.NEW_LETTER_DELETED);

        await this.preNLService.scheduleInvalidateNewsCache();

        return { message: 'News letter deleted successfully.' };
    }
}
