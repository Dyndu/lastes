import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { SConEntity, SMessagesEntity } from '../entities';
import { SupportsService } from './supports.service';

@Injectable()
export class TransformSEntitiesService {
    /**
     * Service responsible for transforming support entities to ui views and queries related support entities relations
     */

    constructor(
        @Inject(forwardRef(() => SupportsService))
        private readonly supportsService: SupportsService,
    ) {}

    /**
     * Defines the full set of relations to eager-load when fetching a message,
     * including sender details, files, and reply-to message with its files.
     */
    messageFullRelations = () => [
        'sentBy',
        'sentBy.avatar',
        'sentBy.avatar.file',

        'files',
        'files.file',

        'replyToMessage',
        'replyToMessage.files',
        'replyToMessage.files.file',
    ];

    conDetailsEntity = () => ['createdBy'];

    /**
     * Defines the relations to eager-load when fetching admin conversation entities,
     * including admin, conversation, and last read message.
     */
    adminConEntities = () => ['admin', 'conversation', 'lastReadMessage'];

    /**
     * Defines the relations to eager-load when fetching open chat entities,
     * including last read message and last message.
     */
    openChatEntities = () => ['lastReadMessage', 'lastMessage'];

    /**
     * Defines the relations to eager-load when fetching conversation entities,
     * including code, last message, and creator.
     */
    conEntities = () => [
        'code',
        'lastMessage',
        'createdBy',
        'lastMessage.files',
        'lastMessage.sentBy',
    ];

    /**
     * Defines the relations to eager-load when marking conversation messages as read,
     * including the last message, its files, and the sender.
     */
    markAsReadConEntities = () => ['lastMessage', 'lastMessage.files', 'lastMessage.sentBy'];

    /**
     * Defines the relations to eager-load when fetching sent message entities,
     * including reply-to message (with files), files, and sender details (with avatar).
     */
    messageSentEntities = () => [
        'replyToMessage',
        'replyToMessage.files',
        'replyToMessage.files.file',
        'files',
        'files.file',
        'sentBy',
        'sentBy.avatar',
        'sentBy.avatar.file',
    ];

    /**
     * Transforms the "sentBy" field of a message entities, formatting the sender's details
     * (ID, full name, and avatar file) for API responses.
     */
    transformSentBy = (m: SMessagesEntity) => ({
        sentBy: m.sentBy
            ? {
                  id: m.sentBy.id,
                  fullname: m.sentBy.fullname,
                  avatar: m.sentBy.avatar
                      ? this.supportsService.transformService.transformFiles(m.sentBy.avatar.file)
                      : null,
              }
            : null,
    });

    /**
     * Transforms the "files" field of a message entities, converting each file attachment
     * into a standardized format for API responses.
     */
    transformMFiles = (m: SMessagesEntity) => ({
        files: m.files
            ? m.files.map((f) => this.supportsService.transformService.transformFiles(f.file))
            : [],
    });

    /**
     * Transforms a message entities into a structured format for API responses,
     * including message details, sender information, files, and reply-to message (if any).
     */
    transformMessage = (m: SMessagesEntity) => ({
        id: m.id,
        content: m.content,
        isModified: m.isModified,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        ...this.transformMFiles(m),
        ...this.transformSentBy(m),
        replyToMessage: m.replyToMessage
            ? {
                  id: m.replyToMessage.id,
                  content: m.replyToMessage.content,
                  ...this.transformMFiles(m.replyToMessage),
              }
            : null,
    });

    /**
     * Transforms an array of message entities into a structured format for API responses.
     */
    transformMessages = (ms: SMessagesEntity[]) => ms.map((m) => this.transformMessage(m));

    /**
     * Transforms the last message of a conversation into a simplified format for API responses,
     * including basic message details and sender information, with a flag for file attachments.
     */
    transformLastMessage = (m: SMessagesEntity) => ({
        id: m.id,
        content: m.content,
        isModified: m.isModified,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        hasFiles: Boolean(m.files && m.files.length > 0),
        sentBy: { id: m.sentBy.id, fullname: m.sentBy.fullname },
    });

    /**
     * Transforms a conversation entities into a structured format for API responses,
     * including ticket ID, last message (if provided), color, and unread message count.
     */
    transformCon = (c: SConEntity, lastMessage?: SMessagesEntity, unreadCount = 0) => ({
        id: c.id,
        label: `Ticket id: #${c.label}`,
        lastMessage: lastMessage ? this.transformLastMessage(lastMessage) : null,
        color: c.color,
        createdBy: c.createdBy
            ? {
                  id: c.createdBy.id,
                  fullname: c.createdBy.fullname,
                  email: c.createdBy.email,
              }
            : null,
        unreadCount,
    });

    /**
     * Transforms an array of conversation entities, including their unread message counts,
     * into a structured format for API responses.
     */
    transformConsWithUnread = (cs: SConEntity[], raw: any[]) =>
        cs.map((c, i) => this.transformCon(c, c.lastMessage, Number(raw[i]?.unreadCount ?? 0)));
}
