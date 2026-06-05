import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { SupportsService } from './supports.service';
import { SConEntity, SMessagesEntity } from '../entities';
import { UserEntity } from '../../users/entities/user.entity';
import { FileLinksEntity } from '../../files/entities/file-links.entity';
import { ExistenceCheckModeEnum, FileUsageEnum, SocketEventEnum } from '../../../common/enum';

@Injectable()
export class SMessagesService {
    /**
     * Service responsible for handling support messages operations
     */

    constructor(
        @Inject(forwardRef(() => SupportsService))
        private readonly supportsService: SupportsService,
    ) {}

    /**
     * Constructs and returns a new SMessagesEntity instance using required and optional fields.
     * Required fields include the sender (UserEntity) and conversation (SConEntity).
     * Optional fields include message content, reply-to message, and attached files.
     */
    buildSMessage(
        required: {
            sentBy: UserEntity;
            con: SConEntity;
        },
        optional: {
            content?: string;
            replyToMessage?: SMessagesEntity;
            files?: FileLinksEntity[];
        },
    ): SMessagesEntity {
        const entity = new SMessagesEntity();
        Object.assign(entity, required, optional);
        return entity;
    }

    /**
     * Validates that the sender is the owner of the specified support conversation.
     * Throws an error if the sender's ID does not match the conversation's creator ID.
     */
    checkUserIsConOwner(sender: UserEntity, con: SConEntity) {
        this.supportsService.otherUtils.assertState(
            sender.id,
            con.createdBy.id,
            ExistenceCheckModeEnum.MUST_EXIST,
            { label: 'Conversation Owner', entityName: 'Support conversation' },
        );
    }

    /**
     * Retrieves a single active support message entities based on the provided criteria and optional relations.
     * Logs the search criteria and throws a not found error if no matching message exists.
     */
    async retrieveSMessageByCriteria(
        criteria: Record<string, any>,
        relations?: string[],
    ): Promise<SMessagesEntity> {
        const entries = this.supportsService.otherUtils.formatCriteria(criteria);
        this.supportsService.logger.info(`Find a support message by ${entries}`);

        const isMessageExist = await this.supportsService.sMessageRepo.findActiveOne(
            this.supportsService.sMessageRepo,
            criteria,
            relations,
        );

        if (!isMessageExist)
            this.supportsService.errorHandler.notFound(
                `Support message not found with ${entries}`,
                `Support message not found`,
            );

        return isMessageExist;
    }

    /**
     * Updates a support message with provided changes, such as content, reply-to message, or attached files.
     * Validates and trims string fields, and directly assigns entities fields if provided.
     * Returns the result of the update operation.
     */
    async updateMessage(
        message: SMessagesEntity,
        mUpdates?: Partial<{
            content?: string;
            replyToMessage?: SMessagesEntity;
            files?: FileLinksEntity[];
        }>,
    ) {
        if (!mUpdates || Object.keys(mUpdates).length === 0)
            return { message: 'No updates provided for support message' };

        const stringFields = ['content'] as const;

        const updatePayload: Partial<SMessagesEntity> = {};

        stringFields.forEach((field) => {
            if (mUpdates[field]?.trim()) updatePayload[field] = mUpdates[field].trim();
        });

        const entityFields = ['replyToMessage', 'files'] as const;

        entityFields.forEach((field) => {
            if (mUpdates[field] !== undefined) updatePayload[field] = mUpdates[field] as any;
        });

        return await this.supportsService.sMessageRepo.update({ id: message.id }, updatePayload);
    }

    /**
     * Sends a WebSocket message to a specific support conversation room.
     * Emits the provided data to the room identified by the conversation ID and event type.
     */
    wsMessage(con: SConEntity, event: SocketEventEnum, data: any) {
        this.supportsService.socketService.sendDataToRoom(
            `/supports`,
            `support-${con.id}-room`,
            event,
            {
                payload: [data],
            },
        );
    }

    /**
     * Retrieves a reply message by its ID if provided.
     * Returns undefined if no reply message ID is specified.
     */
    async getReplyMessage(replyMessageId?: string): Promise<SMessagesEntity | undefined> {
        if (!replyMessageId) return undefined;

        return await this.retrieveSMessageByCriteria({ id: replyMessageId });
    }

    /**
     * Creates a new support message in a conversation.
     * Constructs the message using the provided conversation, sender, content, and optional reply-to message.
     * Returns the newly created message entities.
     */
    async createMessage(
        con: SConEntity,
        sentBy: UserEntity,
        content?: string,
        replyToMessage?: SMessagesEntity,
    ): Promise<SMessagesEntity> {
        const message = await this.supportsService.sMessageRepo.create(
            this.buildSMessage({ con, sentBy }, { content, replyToMessage }),
        );

        await this.supportsService.sConsService.updateCon(con, {
            lastMessage: message,
        });
        return message;
    }

    /**
     * Attaches an array of files to a support message by linking them to the message entities.
     * Updates the message with the newly created file links.
     */
    async attachFilesToMessage(message: SMessagesEntity, fileIds: string[]): Promise<void> {
        await this.supportsService.fileLinkService.linkFilesToEntity(
            fileIds,
            FileUsageEnum.SUPPORT_MESSAGE,
            { message },
        );
    }

    /**
     * Retrieves a support message by its ID, including related entities,
     * and notifies the conversation room via WebSocket about the new message.
     * Returns the retrieved message entities.
     */
    async retrieveAndNotify(con: SConEntity, messageId: string): Promise<SMessagesEntity> {
        const result = await this.retrieveSMessageByCriteria(
            { id: messageId },
            this.supportsService.sTransformService.messageSentEntities(),
        );

        this.wsMessage(
            con,
            SocketEventEnum.NEW_SUPPORT_MESSAGE_SENT,
            this.supportsService.sTransformService.transformMessage(result),
        );

        return result;
    }

    /**
     * Sends a message in a support conversation, optionally with a reply-to message, content, and attached files.
     * Creates the message, attaches files if provided, and notifies the conversation room via WebSocket.
     * Returns a success message upon completion.
     */
    async sendMessage(
        con: SConEntity,
        sentBy: UserEntity,
        replyMessageId?: string,
        content?: string,
        fileIds?: string[],
    ): Promise<SMessagesEntity> {
        const replyToMessage = await this.getReplyMessage(replyMessageId);

        const message = await this.createMessage(con, sentBy, content, replyToMessage);

        if (fileIds) await this.attachFilesToMessage(message, fileIds);
        return await this.retrieveAndNotify(con, message.id);
    }

    /**
     * Builds a TypeORM query for fetching messages with all necessary relations,
     * including sender details (with avatar), files, and reply-to message (with files).
     * Useful for constructing complex queries in chat or messaging systems.
     */
    buildMessageQuery() {
        return this.supportsService.sMessageRepo
            .getRepository()
            .createQueryBuilder('m')
            .leftJoinAndSelect('m.sentBy', 'sentBy')
            .leftJoinAndSelect('sentBy.avatar', 'avatar')
            .leftJoinAndSelect('avatar.file', 'avatarFile')

            .leftJoinAndSelect('m.files', 'files')
            .leftJoinAndSelect('files.file', 'file')

            .leftJoinAndSelect('m.replyToMessage', 'reply')
            .leftJoinAndSelect('reply.files', 'replyFiles')
            .leftJoinAndSelect('replyFiles.file', 'replyFile');
    }

    /**
     * Checks if there are more messages before the first message in a conversation,
     * useful for implementing "load more" or infinite scroll functionality.
     */
    async hasMoreBefore(conId: string, firstMessage: SMessagesEntity) {
        const count = await this.supportsService.sMessageRepo
            .getRepository()
            .createQueryBuilder('m')
            .where('m.conId = :conId', { conId })
            .andWhere('m.serialId < :serialId', {
                serialId: firstMessage.serialId,
            })
            .limit(1)
            .getCount();

        return count > 0;
    }

    /**
     * Checks if there are more messages after the last message in a conversation,
     * useful for implementing real-time updates or "load more" functionality.
     */
    async hasMoreAfter(conId: string, lastMessage: SMessagesEntity) {
        const count = await this.supportsService.sMessageRepo
            .getRepository()
            .createQueryBuilder('m')
            .where('m.conId = :conId', { conId })
            .andWhere('m.serialId > :serialId', {
                serialId: lastMessage.serialId,
            })
            .limit(1)
            .getCount();

        return count > 0;
    }

    /**
     * Retrieves the last message sent by a specific user in a conversation.
     * Builds a query to find the most recent message based on the conversation ID and user ID,
     * ordered by message serial ID in descending order.
     */
    async findLastMessageByUser(conId: string, userId: string) {
        return this.buildMessageQuery()
            .where('m.conId = :conId', { conId })
            .andWhere('sentBy.id = :userId', { userId })
            .orderBy('m.serialId', 'DESC')
            .getOne();
    }

    /**
     * Retrieves the first message sent by any user other than the specified user in a conversation.
     * Builds a query to find the earliest message based on the conversation ID and excluding the specified user ID,
     * ordered by message serial ID in ascending order.
     */
    async findFirstMessageFromOthers(conId: string, userId: string) {
        return this.buildMessageQuery()
            .where('m.conId = :conId', { conId })
            .andWhere('sentBy.id != :userId', { userId })
            .orderBy('m.serialId', 'ASC')
            .getOne();
    }

    /**
     * Resolves the last read message for an admin in a specific conversation.
     * Associates the admin with the conversation if not already linked, and returns
     * the last message read by the admin, or null if none exists.
     */
    async resolveAdminLastReadMessage(
        con: SConEntity,
        admin: UserEntity,
    ): Promise<SMessagesEntity | null> {
        const result = await this.supportsService.sAdminConService.associateAdminCon(admin, con);
        return result.lastReadMessage ?? null;
    }

    /**
     * Finds the first unread message in a conversation, optionally based on the last message read by the user.
     * If a lastReadMessage is provided, only messages with a higher serial ID are considered.
     * Returns the most recent unread message or null if none are found.
     */
    async findFirstUnreadMessage(
        conId: string,
        lastReadMessage?: SMessagesEntity | null,
    ): Promise<SMessagesEntity | null> {
        const qb = this.buildMessageQuery()
            .where('m.conId = :conId', { conId })
            .orderBy('m.serialId', 'DESC')
            .limit(1);

        if (lastReadMessage)
            qb.andWhere('m.serialId > :serialId', {
                serialId: lastReadMessage.serialId,
            });

        return qb.getOne();
    }

    /**
     * Determines the anchor message for a conversation, used as a reference point for displaying messages.
     * If a lastReadMessage is provided, returns the first unread message or the last read message.
     * For admins, returns their last message or the first message in the conversation.
     * For non-admins, returns the first message from others or the last message in the conversation.
     * Returns null if no messages are found.
     */
    async resolveAnchorMessage(
        conId: string,
        user: UserEntity,
        lastReadMessage?: SMessagesEntity | null,
        isAdmin = false,
    ): Promise<SMessagesEntity | null> {
        if (lastReadMessage) {
            const firstUnread = await this.findFirstUnreadMessage(conId, lastReadMessage);
            if (firstUnread) return firstUnread;
            else return lastReadMessage;
        }

        if (!lastReadMessage) {
            if (isAdmin) {
                const lastAdminMessage = await this.findLastMessageByUser(conId, user.id);

                if (lastAdminMessage) return lastAdminMessage;

                return this.buildMessageQuery()
                    .where('m.conId = :conId', { conId })
                    .orderBy('m.serialId', 'ASC')
                    .getOne();
            }

            const firstFromOthers = await this.findFirstMessageFromOthers(conId, user.id);

            if (firstFromOthers) return firstFromOthers;

            return this.buildMessageQuery()
                .where('m.conId = :conId', { conId })
                .orderBy('m.serialId', 'DESC')
                .getOne();
        }

        return null;
    }

    /**
     * Retrieves a specific message by its cursor ID within a conversation.
     * Builds a query to find the message matching both the cursor ID and conversation ID.
     */
    async resolveCursorMessage(conId: string, cursorId: string) {
        return this.buildMessageQuery()
            .where('m.id = :cursorId', { cursorId })
            .andWhere('m.conId = :conId', { conId })
            .getOne();
    }

    /**
     * Loads messages around a specified anchor message in a conversation, either before or after the anchor.
     * If direction is 'before', retrieves messages with serial IDs less than or equal to the anchor's, in reverse order.
     * If direction is 'after', retrieves messages with serial IDs greater than the anchor's, in ascending order.
     * Returns the messages in the correct order based on the direction.
     */
    async loadMessagesAround(
        conId: string,
        anchor: SMessagesEntity,
        direction: 'before' | 'after',
        limit = 20,
    ) {
        const qb = this.buildMessageQuery().where('m.conId = :conId', { conId }).distinct(true);

        if (direction === 'before')
            qb.andWhere('m.serialId <= :serialId', {
                serialId: anchor.serialId,
            })
                .orderBy('m.serialId', 'DESC')
                .limit(limit);
        else
            qb.andWhere('m.serialId > :serialId', { serialId: anchor.serialId })
                .orderBy('m.serialId', 'ASC')
                .limit(limit);

        const messages = await qb.getMany();
        return direction === 'before' ? messages.reverse() : messages;
    }

    /**
     * Returns an empty message response object with default metadata indicating no messages are available.
     */
    emptyMessageResponse() {
        return {
            messages: [],
            meta: {
                hasMoreBefore: false,
                hasMoreAfter: false,
            },
        };
    }

    /**
     * Constructs a message response object from an array of message entities.
     * If no messages are provided, returns an empty response.
     * Determines if there are more messages before the first message and after the last message in the array.
     * Transforms the messages and returns them with metadata, including direction, cursors, and pagination flags.
     */
    async messageResponse(
        messages: SMessagesEntity[],
        conId: string,
        direction?: 'before' | 'after',
    ) {
        if (!messages.length) return this.emptyMessageResponse();
        const first = messages[0];
        const last = messages.at(-1)!;
        const [hasMoreBefore, hasMoreAfter] = await Promise.all([
            this.hasMoreBefore(conId, first),
            this.hasMoreAfter(conId, last),
        ]);
        return {
            messages: this.supportsService.sTransformService.transformMessages(messages),
            meta: {
                direction: direction ?? 'initial',
                cursorBefore: first.id,
                cursorAfter: last.id,
                hasMoreBefore,
                hasMoreAfter,
            },
        };
    }

    /**
     * Loads the initial set of messages for a conversation, using an anchor message as the reference point.
     * Resolves the anchor message based on the user's last read message or conversation context.
     * If no anchor is found, returns an empty response.
     * Loads messages before the anchor and constructs a message response with metadata.
     */
    async loadInitial(
        con: SConEntity,
        user: UserEntity,
        limit: number,
        lastReadMessage?: SMessagesEntity | null,
    ) {
        const anchor = await this.resolveAnchorMessage(con.id, user, lastReadMessage);

        if (!anchor) return this.emptyMessageResponse();

        const messages = await this.loadMessagesAround(con.id, anchor, 'before', limit);

        return this.messageResponse(messages, con.id);
    }

    /**
     * Loads the initial set of messages for an admin in a conversation.
     * If no lastReadMessage is provided, retrieves the first message in the conversation.
     * If a lastReadMessage is provided, delegates to the standard loadInitial method.
     * Returns a message response or an empty response if no messages are found.
     */
    async loadInitialForAdmin(
        con: SConEntity,
        admin: UserEntity,
        limit: number,
        lastReadMessage?: SMessagesEntity | null,
    ) {
        if (!lastReadMessage) {
            const first = await this.supportsService.sMessageRepo.findOne({
                where: { con: { id: con.id } },
                order: { serialId: 'ASC' },
                relations: this.supportsService.sTransformService.messageFullRelations(),
            });

            if (!first) return this.emptyMessageResponse();
            return this.messageResponse([first], con.id, 'before');
        }

        return await this.loadInitial(con, admin, limit, lastReadMessage);
    }

    /**
     * Loads additional messages in a conversation, either before or after a specified cursor message.
     * Resolves the cursor message as the anchor, then loads messages around it based on the direction.
     * Returns a message response with metadata or an empty response if the cursor message is not found.
     */
    async loadMore(conId: string, cursorId: string, direction: 'before' | 'after', limit: number) {
        const anchor = await this.resolveCursorMessage(conId, cursorId);
        if (!anchor) return this.emptyMessageResponse();

        const messages = await this.loadMessagesAround(conId, anchor, direction, limit);

        return this.messageResponse(messages, conId);
    }
}
