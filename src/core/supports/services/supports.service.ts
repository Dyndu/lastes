import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { SocketService } from '../../../helpers/socket/socket.service';
import { ErrorHandlerService } from '../../../common/response';
import { FileLinksService } from '../../files/services/file-links.service';
import { UsersEntityTransformService, UsersService } from '../../users/services';
import { SAdminConRepository, SConRepository, SMessagesRepository } from '../repositories';
import { TransformSEntitiesService } from './transform-s-entities.service';
import { OtherUtils } from '../../../utils/services/tools';
import { SCodesService } from '../../s-codes/s-codes.service';
import { CurrentUserInterface } from '../../../interface';
import { UserEntity } from '../../users/entities/user.entity';
import { AdminSendMessageDto, BaseSendMessageDto, CreateConDto } from '../dto';
import { SConService } from './s-con.service';
import { SMessagesService } from './s-messages.service';
import { NotificationSubjectTypeEnum, SConStatusEnum, SocketEventEnum } from '../../../common/enum';
import { SAdminConService } from './s-admin-con.service';
import { SConEntity, SMessagesEntity } from '../entities';
import { NotificationsService } from '../../notifications/services';
import { MailerService } from '../../../libs/mailer/services';
import { EnvConfigService } from '../../../utils/services/config';
import { Not } from 'typeorm';

@Injectable()
export class SupportsService {
    /**
     * Service responsible for orchestrating support chats operations
     */

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        @Inject(forwardRef(() => TransformSEntitiesService))
        readonly sTransformService: TransformSEntitiesService,
        @Inject(forwardRef(() => SConService))
        readonly sConsService: SConService,
        @Inject(forwardRef(() => SMessagesService))
        readonly sMessagesService: SMessagesService,
        @Inject(forwardRef(() => SAdminConService))
        readonly sAdminConService: SAdminConService,
        readonly socketService: SocketService,
        readonly errorHandler: ErrorHandlerService,
        readonly fileLinkService: FileLinksService,
        readonly sAdminConRepo: SAdminConRepository,
        readonly sMessageRepo: SMessagesRepository,
        readonly envConfigService: EnvConfigService,
        readonly sConRepo: SConRepository,
        readonly sCodeService: SCodesService,
        readonly otherUtils: OtherUtils,
        readonly notifService: NotificationsService,
        readonly userService: UsersService,
        readonly mailerService: MailerService,
        readonly transformService: UsersEntityTransformService,
    ) {}

    /**
     * Validates that a chat connection is open and not closed.
     * Throws a forbidden error if the chat status is CLOSED,
     * preventing further actions on a closed chat.
     */
    assertChatIsOpen(con: SConEntity) {
        if (con.status === SConStatusEnum.CLOSED)
            this.errorHandler.forbidden(
                `This chat with id ${con.id} is already closed, no any further action allowed`,
                `Forbidden, chat already closed`,
            );
    }

    /**
     * Retrieves a user by their unique identifier, including their associated role.
     */
    async getUser(id: string): Promise<UserEntity> {
        return await this.userService.preUserService.retrieveUserByCriteria({ id }, [
            'role',
            'avatar',
            'avatar.file',
        ]);
    }

    /**
     * Retrieves the count of closed and active support conversations for a user.
     * Admins see all conversations, while regular users only see their own.
     * Returns an object with the counts of closed and active conversations.
     */
    async badgeCount(user: CurrentUserInterface): Promise<{ closed: number; active: number }> {
        const isAdmin = user.role !== this.envConfigService.userRole;

        const whereClause = isAdmin ? {} : { createdBy: { id: user.id } };

        const result = await this.sConRepo
            .getRepository()
            .createQueryBuilder('scon')
            .select('scon.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .where(whereClause)
            .groupBy('scon.status')
            .getRawMany();

        return {
            closed: Number(result.find((r) => r.status === SConStatusEnum.CLOSED)?.count ?? 0),
            active: Number(result.find((r) => r.status === SConStatusEnum.ACTIVE)?.count ?? 0),
        };
    }

    /**
     * Retrieves a paginated list of user's connected conversations, optionally filtered by status and search term.
     */
    async userConList(
        user: CurrentUserInterface,
        page: number,
        limit: number,
        status?: SConStatusEnum,
        searchTerm?: string,
    ) {
        this.logger.info(`Get user connected conversations`);

        return await this.sConsService.userConversations(user.id, status, searchTerm, page, limit);
    }

    /**
     * Retrieves a paginated list of conversations for an admin user, optionally filtered by status and search term.
     */
    async adminConList(
        user: CurrentUserInterface,
        page: number,
        limit: number,
        status?: SConStatusEnum,
        searchTerm?: string,
    ) {
        this.logger.info(`Get ${user.role} connected conversations`);

        return await this.sConsService.adminConversations(user.id, status, searchTerm, page, limit);
    }

    /**
     * Retrieves the details of a conversation by its ID and formats the response with a ticket label.
     */
    async conDetails(id: string) {
        this.logger.info(`Get conversation details from ${id}`);

        const con = await this.sConsService.retrieveSConByCriteria(
            { id },
            this.sTransformService.conDetailsEntity(),
        );
        return {
            id: con.id,
            label: `Ticket id: #${con.label}`,
            createdBy: con.createdBy
                ? {
                      id: con.createdBy.id,
                      fullname: con.createdBy.fullname,
                      email: con.createdBy.email,
                  }
                : null,
        };
    }

    /**
     * Sends an email notification to the user confirming the initiation of a help and support chat.
     * Uses a predefined template to include user details, ticket ID, code label, and support link.
     */
    sendEmailToUser(user: UserEntity, con: SConEntity) {
        this.mailerService.emailSend(
            user.email,
            'Help and Support chat initiated',
            this.otherUtils.buildEmailTemplate('../../../src/utils/templates/h-support-user.hbs', {
                fullname: user.fullname,
                label: `Ticket id: #${con.label}`,
                cLabel: con.code.label,
                createdAt: con.createdAt,
                link: this.envConfigService.userSupportLink,
                currentYear: new Date().getFullYear(),
            }),
        );
    }

    /**
     * Sends a bulk email notification to administrators about a newly initiated help and support chat.
     * Uses a predefined template to include the requesting user's details, ticket ID, code label, and admin support link.
     */
    async sendEmailToAdmins(users: UserEntity[], sentBy: UserEntity, con: SConEntity) {
        await this.mailerService.sendBulkMail(
            users.map((u) => u.email),
            'Help and Support chat initiated',
            this.otherUtils.buildEmailTemplate('../../../src/utils/templates/h-support-admin.hbs', {
                fullname: sentBy.fullname,
                avatar: sentBy.avatar?.file?.path,
                email: sentBy.email,
                label: `Ticket id: #${con.label}`,
                cLabel: con.code.label,
                createdAt: con.createdAt,
                link: this.envConfigService.adminSupportLink,
                currentYear: new Date().getFullYear(),
            }),
        );
    }

    /**
     * Notifies administrators and super admins when a new support chat connection is created.
     * Creates a notification for the support request, sends it to all relevant admins,
     * and dispatches emails to both admins and the requesting user.
     */
    async notifyAdminWhenConCreated(user: UserEntity, con: SConEntity) {
        const [admins, sAdmin] = await Promise.all([
            this.userService.preUserService.adminByPermissions('help_support', 'view'),
            this.userService.preUserService.retrieveUserByCriteria({
                role: { label: this.userService.envConfigService.sAdminRole },
            }),
        ]);

        const notification = await this.notifService.createNotification(
            'Support Request Received',
            `A new help request has been submitted by ${user.fullname}`,
            NotificationSubjectTypeEnum.HELP_AND_SUPPORT,
            {
                subjectId: con.id,
                route: '/supports/cons',
                sentBy: user,
            },
        );

        const allAdmins = [...admins, sAdmin];

        await Promise.all([
            this.notifService.sendNotificationToUsers(notification, allAdmins),
            this.sendEmailToAdmins(allAdmins, user, con),
        ]);
        this.sendEmailToUser(user, con);
    }

    /**
     * Creates a new conversation based on a provided code ID, user content, and optional files.
     * Retrieves or creates the conversation, sends the initial message, and triggers
     * real-time updates and admin notifications asynchronously.
     * Returns the transformed conversation object.
     */
    async createConversation(currentUser: CurrentUserInterface, createConDto: CreateConDto) {
        const { codeId, files, content } = createConDto;
        this.logger.info(
            `Create a new conversation with code: ${codeId} by user ${currentUser.id}`,
        );
        const sentBy = await this.getUser(currentUser.id);

        const con = await this.sConsService.getOrCreateCon(sentBy, undefined, codeId);

        const message = await this.sMessagesService.sendMessage(
            con,
            sentBy,
            undefined,
            content,
            files,
        );

        setImmediate(async () => {
            await this.sConsService.emitConversationUpdate(con, message);
            await this.notifyAdminWhenConCreated(sentBy, con);
        });

        return this.sTransformService.transformCon(con);
    }

    async notifyAdminsNewMessage(user: UserEntity, message: SMessagesEntity) {
        const [notification, admins] = await Promise.all([
            this.notifService.createNotification(
                'New Message',
                `You've receive a new message from ${user.fullname}`,
                NotificationSubjectTypeEnum.NEWSLETTER,
                {
                    subjectId: message.id,
                    route: 'new-message',
                    sentBy: user,
                },
            ),
            this.userService.userRepo.find({
                where: { role: { label: Not(this.envConfigService.userRole) } },
            }),
        ]);
        await this.notifService.sendNotificationToUsers(notification, admins);
    }

    /**
     * Sends a new message in a conversation, either as an admin or regular user.
     * Creates or retrieves the conversation, validates ownership (for non-admins),
     * sends the message, and emits a conversation update event.
     */
    async sendMessageGeneric(
        currentUser: CurrentUserInterface,
        dto: BaseSendMessageDto & Partial<{ conId?: string }>,
        isAdmin = false,
    ): Promise<{ message: SMessagesEntity; sentBy: UserEntity }> {
        this.logger.info(`Send a new message by ${currentUser.role} with id: ${currentUser.id}`);

        const { conId, messagesId, content, files } = dto;

        const con = await this.sConsService.retrieveSConByCriteria(
            {
                id: conId,
            },
            this.sTransformService.conEntities(),
        );

        this.assertChatIsOpen(con);

        const sentBy = await this.getUser(currentUser.id);
        if (!isAdmin) this.sMessagesService.checkUserIsConOwner(sentBy, con);

        const message = await this.sMessagesService.sendMessage(
            con,
            sentBy,
            messagesId,
            content,
            files,
        );

        setImmediate(async () => {
            await this.sConsService.emitConversationUpdate(con, message);
        });

        return { message, sentBy };
    }

    /**
     * Sends a message on behalf of a user, determining admin privileges based on the user's role.
     */
    async sendMessageByUser(user: CurrentUserInterface, sendMDto: AdminSendMessageDto) {
        const { message, sentBy } = await this.sendMessageGeneric(user, sendMDto, false);
        await this.notifyAdminsNewMessage(sentBy, message);
        return { message: 'Message sent successfully' };
    }

    /**
     * Sends a message on behalf of an admin, enforcing admin privileges based on the admin's role.
     */
    async sendMessageByAdmin(admin: CurrentUserInterface, sendMDto: AdminSendMessageDto) {
        await this.sendMessageGeneric(admin, sendMDto, true);
        return { message: 'Message sent successfully' };
    }

    /**
     * Notifies a user about an update in a conversation, sending the transformed conversation data via socket.
     * Executes asynchronously to avoid blocking the main thread.
     */
    notifyConversationUpdate(userId: string, con: SConEntity, lastMessage?: SMessagesEntity) {
        setImmediate(() => {
            this.socketService.sendDataToUser(
                userId,
                '/supports/cons',
                SocketEventEnum.SUPPORT_CONVERSATION_UPDATED,
                {
                    payload: [this.sTransformService.transformCon(con, lastMessage)],
                },
            );
        });
    }

    /**
     * Retrieves a conversation by its ID along with its last message, marking the conversation as read.
     */
    async getConWithLastMessage(
        conId: string,
    ): Promise<{ con: SConEntity; lastMessage: SMessagesEntity | undefined }> {
        const con = await this.sConsService.retrieveSConByCriteria(
            { id: conId },
            this.sTransformService.markAsReadConEntities(),
        );
        const lastMessage = con.lastMessage;

        return { con, lastMessage };
    }

    /**
     * Marks all messages in a conversation as read for a user, updates the conversation's last read message,
     * and notifies the user about the conversation update.
     */
    async markAsReadByUser(user: CurrentUserInterface, conId: string) {
        this.logger.info(`Mark conversation messages as read by ${user.role} with id: ${user.id}`);

        const { con, lastMessage } = await this.getConWithLastMessage(conId);

        if (!lastMessage) return { message: 'Messages read successfully' };
        await this.sConsService.updateCon(con, {
            lastReadMessage: lastMessage,
        });

        this.notifyConversationUpdate(user.id, con, con.lastMessage);
        return { message: 'Messages read successfully' };
    }

    /**
     * Marks a conversation as read by an admin, updating or creating the admin-conversation link.
     * Notifies the admin about the conversation update after processing.
     */
    async markAsReadyAdmin(admin: CurrentUserInterface, conId: string) {
        this.logger.info(
            `Mark conversation messages as read by ${admin.role} with id: ${admin.id}`,
        );

        const [{ con, lastMessage }, isLinkExist, user] = await Promise.all([
            this.getConWithLastMessage(conId),
            this.sAdminConRepo.findOne({
                where: { admin: { id: admin.id }, conversation: { id: conId } },
            }),
            this.getUser(admin.id),
        ]);

        if (isLinkExist)
            await this.sAdminConRepo.update(
                { id: isLinkExist.id },
                { lastReadMessage: lastMessage! },
            );
        else await this.sAdminConService.associateAdminCon(user, con, lastMessage);

        this.notifyConversationUpdate(user.id, con, con.lastMessage);
        return { message: 'Messages read successfully' };
    }

    /**
     * Opens a conversation and loads its initial messages for a user,
     * using the conversation ID and a limit for the number of messages to fetch.
     */
    async openConMessagesByUser(user: CurrentUserInterface, conId: string, limit: number) {
        const userEntity = await this.getUser(user.id);
        const con = await this.sConsService.retrieveSConByCriteria(
            { id: conId },
            this.sTransformService.openChatEntities(),
        );
        this.assertChatIsOpen(con);
        return await this.sMessagesService.loadInitial(con, userEntity, limit, con.lastReadMessage);
    }

    /**
     * Opens a conversation and loads its initial messages for an admin,
     * using the admin's ID, conversation ID, and a limit for the number of messages to fetch.
     * Resolves the last read message for the admin before loading messages.
     */
    async openConMessagesByAdmin(admin: CurrentUserInterface, conId: string, limit: number) {
        const user = await this.getUser(admin.id);
        const con = await this.sConsService.retrieveSConByCriteria({
            id: conId,
        });
        this.assertChatIsOpen(con);
        const lastMessage = await this.sMessagesService.resolveAdminLastReadMessage(con, user);
        return await this.sMessagesService.loadInitialForAdmin(con, user, limit, lastMessage);
    }

    /**
     * Loads additional messages in a conversation based on a cursor (message ID),
     * supporting pagination in both 'before' and 'after' directions.
     * Useful for infinite scroll or "load more" functionality in chat interfaces.
     */
    async scrollMessage(
        conId: string,
        cursorId: string,
        limit: number,
        cursorDirection: 'before' | 'after' = 'before',
    ) {
        const con = await this.sConsService.retrieveSConByCriteria({
            id: conId,
        });

        return await this.sMessagesService.loadMore(con.id, cursorId, cursorDirection, limit);
    }

    /**
     * Closes a support chat by its ID, ensuring the requesting user is the owner and the chat are open.
     * Updates the chat status to CLOSED and emits a real-time update to reflect the change.
     * Returns a success message upon completion.
     */
    async closeChat(user: CurrentUserInterface, id: string) {
        this.logger.info(`Closing support chat with id: ${id} by user with id: ${user.id}`);

        const con = await this.sConsService.retrieveSConByCriteria(
            { id },
            this.sTransformService.conEntities(),
        );
        this.assertChatIsOpen(con);

        await this.sConsService.updateCon(con, {
            status: SConStatusEnum.CLOSED,
        });

        setImmediate(async () => {
            await this.sConsService.emitConversationUpdate(con, con.lastMessage!);
        });

        return { message: 'Chat closed successfully' };
    }
}
