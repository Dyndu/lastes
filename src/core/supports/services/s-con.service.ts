import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { SupportsService } from './supports.service';
import { SAdminConEntity, SConEntity, SMessagesEntity } from '../entities';
import { UserEntity } from '../../users/entities/user.entity';
import { SCodeEntity } from '../../s-codes/entities/s-code.entity';
import { SConStatusEnum, SocketEventEnum } from '../../../common/enum';
import { Brackets, SelectQueryBuilder } from 'typeorm';

type ApplyUnreadFn = (qb: SelectQueryBuilder<SConEntity>) => void;

@Injectable()
export class SConService {
    /**
     * Service responsible for handling support conversation operation
     */

    constructor(
        @Inject(forwardRef(() => SupportsService))
        private readonly supportsService: SupportsService,
    ) {}

    /**
     * Constructs and returns a new SConEntity (Support Conversation Entity) by merging required fields (label, createdBy)
     * with optional fields (lastMessage) into a new entities instance.
     */
    buildSConEntity(
        required: {
            label: string;
            createdBy: UserEntity;
            code: SCodeEntity;
        },
        optional: {
            lastMessage?: SMessagesEntity;
            lastReadMessage?: SMessagesEntity;
        },
    ): SConEntity {
        const con = new SConEntity();
        Object.assign(con, required, optional);
        return con;
    }

    /**
     * Validates that either a conversation ID or a support code ID is provided,
     * but not both. Throws a bad request error if the input is invalid.
     */
    validateConversationInput(conId?: string, codeId?: string) {
        if ((!conId && !codeId) || (conId && codeId))
            this.supportsService.errorHandler.badRequest(
                `Either create a new conversation or send a message, can't do both`,
                `Forbidden: create a conversation or send a message`,
            );
    }

    /**
     * Retrieves a single active support conversation entities based on the provided criteria and optional relations.
     * Logs the search criteria and throws a not found error if no matching conversation exists.
     */
    async retrieveSConByCriteria(
        criteria: Record<string, any>,
        relations?: string[],
    ): Promise<SConEntity> {
        const entries = this.supportsService.otherUtils.formatCriteria(criteria);
        this.supportsService.logger.info(`Find a support conversation by ${entries}`);

        const isConExist = await this.supportsService.sConRepo.findActiveOne(
            this.supportsService.sConRepo,
            criteria,
            relations,
        );

        if (!isConExist)
            this.supportsService.errorHandler.notFound(
                `Support conversation not found with ${entries}`,
                `Support conversation not found`,
            );

        return isConExist;
    }

    /**
     * Generates a unique label for a support conversation by creating an 8-digit random number.
     * Checks if the generated label already exists in the database (non-deleted entries).
     * Returns the unique label.
     */
    async generateConLabel(): Promise<string> {
        let conLabel: string;
        let isConLabelExist: SConEntity | null;

        do {
            conLabel = this.supportsService.otherUtils.generateNumber(8);
            isConLabelExist = await this.supportsService.sConRepo.findOne({
                where: { label: conLabel, deleted: false },
            });
        } while (isConLabelExist);

        return conLabel;
    }

    /**
     * Creates a new support conversation for the specified user.
     * Generates a unique label for the conversation and builds a new SConEntity.
     * Returns the newly created support conversation entities.
     */
    async createSCon(createdBy: UserEntity, code: SCodeEntity): Promise<SConEntity> {
        return await this.supportsService.sConRepo.create(
            this.buildSConEntity({ createdBy, code, label: await this.generateConLabel() }, {}),
        );
    }

    /**
     * Retrieves an existing support conversation by ID or creates a new one using a support code.
     * Validates input to ensure either a conversation ID or a code ID is provided, but not both.
     * Returns the retrieved or newly created conversation entities.
     */
    async getOrCreateCon(
        createdBy: UserEntity,
        conId?: string,
        codeId?: string,
    ): Promise<SConEntity> {
        this.validateConversationInput(conId, codeId);

        let conIdToFetch: string;

        if (conId) conIdToFetch = conId;
        else {
            const code = await this.supportsService.sCodeService.retrieveSCodeByCriteria({
                id: codeId,
            });
            const newCon = await this.createSCon(createdBy, code);
            conIdToFetch = newCon.id;
        }

        return await this.retrieveSConByCriteria(
            { id: conIdToFetch },
            this.supportsService.sTransformService.conEntities(),
        );
    }

    /**
     * Updates a support conversation with the provided changes, such as label, status, or related entities.
     * Validates and trims string fields, and directly assigns other fields if provided.
     * Returns the result of the update operation.
     */
    async updateCon(
        con: SConEntity,
        cUpdates?: Partial<{
            label?: string;
            status?: SConStatusEnum;
            createdBy?: UserEntity;
            code?: SCodeEntity;
            lastMessage?: SMessagesEntity;
            lastReadMessage?: SMessagesEntity;
        }>,
    ) {
        if (!cUpdates || Object.keys(cUpdates).length === 0)
            return { message: 'No updates provided for support conversation' };

        const updatePayload: Partial<SMessagesEntity> = {};

        const stringFields = ['label'] as const;

        stringFields.forEach((field) => {
            if (cUpdates[field]?.trim()) updatePayload[field] = cUpdates[field].trim();
        });

        const otherFields = ['status'];

        otherFields.forEach((field) => {
            if (cUpdates[field] !== undefined) updatePayload[field] = cUpdates[field] as any;
        });

        const entityFields = ['createdBy', 'code', 'lastMessage', 'lastReadMessage'] as const;

        entityFields.forEach((field) => {
            if (cUpdates[field] !== undefined) updatePayload[field] = cUpdates[field] as any;
        });

        return await this.supportsService.sConRepo.update({ id: con.id }, updatePayload);
    }

    /**
     * Constructs a base query for support conversations with optional filters.
     * Joins related entities like the creator, last message, and sender.
     * Selects specific fields for efficiency and applies filters for conversation ID, user ID, status, and search term.
     * Returns the configured query builder for further use.
     */
    baseConsQuery(filters: {
        conId?: string;
        userId?: string;
        status?: SConStatusEnum;
        searchTerm?: string;
    }) {
        const { conId, userId, searchTerm, status } = filters;

        const query = this.supportsService.sConRepo
            .getRepository()
            .createQueryBuilder('cons')
            .leftJoin('cons.createdBy', 'createdBy')
            .leftJoin('cons.lastMessage', 'lastMessage')
            .leftJoin('lastMessage.sentBy', 'sentBy')
            .leftJoin('lastMessage.files', 'files')
            .addSelect([
                'createdBy.id',
                'createdBy.fullname',
                'lastMessage.id',
                'lastMessage.content',
                'lastMessage.isModified',
                'lastMessage.createdAt',
                'sentBy.id',
                'sentBy.fullname',
            ])
            .andWhere('cons.deleted = false');

        if (conId) query.andWhere('cons.id = :conId', { conId });
        if (userId) query.andWhere('createdBy.id = :userId', { userId });
        if (status) query.andWhere('cons.status = :status', { status });

        if (searchTerm) {
            query.andWhere(
                `
            (
                cons.label ILIKE :searchTerm
                OR lastMessage.content ILIKE :searchTerm
            )
            `,
                { searchTerm: `%${searchTerm}%` },
            );
        }

        return query;
    }

    /**
     * Enhances a support conversation query to include a count of unread messages for a specific user.
     * Uses a subquery to count messages sent by others and not yet read by the user.
     * Adds the unread count as a selected field in the main query.
     */
    applyUserUnread(qb: SelectQueryBuilder<SConEntity>, userId: string) {
        qb.addSelect((subQuery) => {
            return subQuery
                .select('COUNT(m.id)', 'unreadCount')
                .from(SMessagesEntity, 'm')
                .where('m.conId = cons.id')
                .andWhere('m.sentBy != :userId', { userId })
                .andWhere(
                    new Brackets((qb) => {
                        qb.where('cons.lastReadMessageId IS NULL').orWhere(
                            'm.createdAt > (SELECT lrm."createdAt" FROM support_messages lrm WHERE lrm.id = cons.lastReadMessageId)',
                        );
                    }),
                );
        }, 'unreadCount');
    }

    /**
     * Enhances a support conversation query to include a count of unread messages for a specific admin.
     * Uses a subquery to count messages sent by others and not yet read by the admin.
     * Checks if the admin is associated with the conversation and compares message timestamps with the admin's last read message.
     * Adds the unread count as a selected field in the main query.
     */
    applyAdminUnread(qb: SelectQueryBuilder<SConEntity>, adminId: string) {
        qb.addSelect((subQuery) => {
            return subQuery
                .select('COUNT(m.id)', 'unreadCount')
                .from(SMessagesEntity, 'm')
                .leftJoin(
                    SAdminConEntity,
                    'suc',
                    'suc."conId" = m."conId" AND suc."adminId" = :adminId',
                    {
                        adminId,
                    },
                )
                .leftJoin(SMessagesEntity, 'lrm', 'lrm.id = suc."lastReadMessageId"')
                .where('m."conId" = cons.id')
                .andWhere('m."sentBy" != :adminId', { adminId })
                .andWhere(
                    new Brackets((qb) => {
                        qb.where('suc.id IS NULL')
                            .orWhere('lrm.id IS NULL')

                            .orWhere('m."serialId" > lrm."serialId"');
                    }),
                );
        }, 'unreadCount');
    }

    /**
     * Constructs a paginated query for support conversations, applying filters and sorting by the last message's creation date in descending order.
     * Skips a specified number of records and limits the result set to the given number of items.
     * Returns the configured query builder for executing the paginated query.
     */
    paginatedConsQuery(
        limit: number,
        offset: number,
        filters: {
            userId?: string;
            status?: SConStatusEnum;
            searchTerm?: string;
        },
    ) {
        const { userId, searchTerm, status } = filters;

        const query = this.baseConsQuery({ userId, searchTerm, status });

        return query
            .orderBy('lastMessage.createdAt', 'DESC', 'NULLS LAST')
            .skip(offset)
            .take(limit);
    }

    /**
     * Lists support conversations using a custom query builder and applies an unread count function.
     * Retrieves both entities and raw results, then paginates the transformed results.
     * Returns paginated conversation data with unread counts.
     */
    async listConversations(
        buildQuery: () => SelectQueryBuilder<SConEntity>,
        applyUnread: ApplyUnreadFn,
        page: number,
        limit: number,
    ) {
        const qb = buildQuery();

        applyUnread(qb);

        const [{ entities, raw }, total] = await Promise.all([
            qb.getRawAndEntities(),
            qb.getCount(),
        ]);

        return this.supportsService.otherUtils.paginateResultsFromCache(
            this.supportsService.sTransformService.transformConsWithUnread(entities, raw),
            total,
            page,
            limit,
        );
    }

    /**
     * Retrieves a paginated list of support conversations for a specific user.
     * Optionally filters by conversation status and search term.
     * Applies unread message count logic for the user and returns paginated results.
     */
    async userConversations(
        userId: string,
        status?: SConStatusEnum,
        searchTerm?: string,
        page = 1,
        limit = 20,
    ) {
        const offset = (page - 1) * limit;

        return this.listConversations(
            () =>
                this.paginatedConsQuery(limit, offset, {
                    userId,
                    status,
                    searchTerm,
                }),
            (qb) => this.applyUserUnread(qb, userId),
            page,
            limit,
        );
    }

    /**
     * Retrieves a paginated list of support conversations for an admin user.
     * Optionally filters by conversation status and search term.
     * Applies unread message count logic for the admin and returns paginated results.
     */
    async adminConversations(
        adminId: string,
        status?: SConStatusEnum,
        searchTerm?: string,
        page = 1,
        limit = 20,
    ) {
        const offset = (page - 1) * limit;

        return this.listConversations(
            () =>
                this.paginatedConsQuery(limit, offset, {
                    status,
                    searchTerm,
                }),
            (qb) => this.applyAdminUnread(qb, adminId),
            page,
            limit,
        );
    }

    /**
     * Emits a support conversation update to a specific viewer via WebSocket.
     * Fetches the conversation with unread count applied, transforms the data,
     * and sends it to the viewer using the specified event type.
     */
    async emitToViewer(
        viewerId: string,
        conId: string,
        lastMessage: SMessagesEntity,
        event: SocketEventEnum,
        applyUnread: (qb: SelectQueryBuilder<SConEntity>) => void,
    ) {
        const qb = this.baseConsQuery({ conId });

        applyUnread(qb);

        const { raw } = await qb.getRawAndEntities();
        const row = raw[0];

        if (!row) return;

        this.supportsService.socketService.sendDataToUser(viewerId, '/supports/cons', event, {
            payload: [
                this.supportsService.sTransformService.transformCon(
                    row,
                    lastMessage,
                    Number(row.unreadCount ?? 0),
                ),
            ],
        });
    }

    /**
     * Emits a conversation update to both the conversation creator and all associated admins via WebSocket.
     * Applies unread message count logic for each recipient and sends the updated conversation data.
     */
    async emitConversationUpdate(con: SConEntity, lastMessage: SMessagesEntity) {
        await this.emitToViewer(
            con.createdBy.id,
            con.id,
            lastMessage,
            SocketEventEnum.SUPPORT_CONVERSATION_UPDATED,
            (qb) => this.applyUserUnread(qb, con.createdBy.id),
        );

        const adminCons = await this.supportsService.sAdminConRepo.find({
            where: { conversation: { id: con.id } },
            relations: ['admin'],
        });

        for (const { admin } of adminCons) {
            await this.emitToViewer(
                admin.id,
                con.id,
                lastMessage,
                SocketEventEnum.SUPPORT_CONVERSATION_UPDATED,
                (qb) => this.applyAdminUnread(qb, admin.id),
            );
        }
    }
}
