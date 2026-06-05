import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { GuidesService } from './guides.service';
import { GuideEntity } from '../entities';
import {
    FileUsageEnum,
    GuideReactionEnum,
    GuideStatusEnum,
    SocketEventEnum,
} from '../../../common/enum';
import { CategoryEntity } from '../../categories/entities/category.entity';
import { FileLinksEntity } from '../../files/entities/file-links.entity';
import { CreateGuideDto, UpdateGuideDto } from '../dto';

@Injectable()
export class PreGuideService {
    /**
     * Service responsible for handling pre guide operations
     */

    constructor(
        @Inject(forwardRef(() => GuidesService))
        private readonly guidesService: GuidesService,
    ) {}

    /**
     * Asynchronously retrieves a guide entities based on specified criteria and optional relations.
     * Logs the retrieval attempt, queries the repository for an active guide,
     * and throws a "not found" error if the guide does not exist.
     * Returns the guide entities if found.
     */
    async retrieveGuideByCriteria(
        criteria: Record<string, any>,
        relations?: string[],
    ): Promise<GuideEntity> {
        const entry = this.guidesService.otherUtils.formatCriteria(criteria);
        this.guidesService.logger.info(`Find guide by criteria: ${entry}`);

        const isGuideExist = await this.guidesService.guidesRepo.findActiveOne(
            this.guidesService.guidesRepo,
            criteria,
            relations,
        );

        if (!isGuideExist)
            this.guidesService.errorHandler.notFound(
                `Guide not found with criteria: ${entry}`,
                `Guide not found`,
            );

        return isGuideExist;
    }

    /**
     * Builds a query for retrieving guides based on optional filters for status and search term.
     * Creates a base query excluding deleted guides, joins related file links and files,
     * and applies filters for status and search term if provided.
     * Returns the constructed query.
     */
    buildGuideQuery(filters: { status?: GuideStatusEnum; searchTerm?: string }) {
        const { searchTerm, status } = filters;

        const query = this.guidesService.guidesRepo
            .getRepository()
            .createQueryBuilder('guides')
            .andWhere('guides.deleted = false')
            .leftJoinAndSelect('guides.category', 'category')
            .leftJoinAndSelect('guides.file', 'fileLinks')
            .leftJoinAndSelect('fileLinks.file', 'file');

        if (status) query.andWhere('guides.status = :status', { status });

        if (searchTerm) {
            const likePattern = `%${searchTerm}%`;
            query.andWhere(
                `(guides.label ILIKE :searchTerm
              OR guides.description ILIKE :searchTerm)`,
                { searchTerm: likePattern },
            );
        }

        return query;
    }

    /**
     * Constructs a paginated query for retrieving guides based on offset, limit, and optional filters (status, search term).
     * Builds the base query, applies sorting by update date (descending), and sets pagination parameters.
     * Returns the configured query builder.
     */
    retrieveGuidesQuery(
        offset: number,
        limit: number,
        filters: {
            status?: GuideStatusEnum;
            searchTerm?: string;
        },
    ) {
        const queryBuilder = this.buildGuideQuery(filters);

        queryBuilder.orderBy('guides.updatedAt', 'DESC').skip(offset).take(limit);

        return queryBuilder;
    }

    /**
     * Retrieves a paginated list of published user guides, optionally filtered by a search term.
     * Joins with user likes to include the current user's reaction (if any) for each guide.
     * Orders results by update date (newest first) and applies offset/limit for pagination.
     */
    retrieveUserGuide(
        userId: string,
        offset: number,
        limit: number,
        filters: {
            liked?: boolean;
            searchTerm?: string;
            isVideo?: boolean;
            categories?: string[];
        },
    ) {
        const { searchTerm, categories, isVideo, liked } = filters;
        const queryBuilder = this.buildGuideQuery({
            status: GuideStatusEnum.PUBLISHED,
            searchTerm,
        });

        if (categories && categories.length > 0)
            queryBuilder.andWhere('category.id IN (:...categories)', {
                categories,
            });

        if (typeof isVideo === 'boolean')
            queryBuilder.andWhere('guides.isVideo = :isVideo', { isVideo });

        if (liked) {
            queryBuilder.innerJoin(
                'guides.likes',
                'ugl',
                'ugl.userId = :userId AND ugl.reaction = :reaction',
                {
                    userId,
                    reaction: GuideReactionEnum.LIKE,
                },
            );
        }

        return queryBuilder.orderBy('guides.updatedAt', 'DESC').skip(offset).take(limit);
    }

    /**
     * Constructs and returns a new GuideEntity object using required fields (label, status, category, file)
     * and optional fields (description).
     * Merges the provided properties into the entities and returns the result.
     */
    buildGuideEntity(
        required: {
            label: string;
            status: GuideStatusEnum;
            category: CategoryEntity;
            file: FileLinksEntity;
            isVideo: boolean;
        },
        optional: {
            description: string;
            content: string;
        },
    ) {
        const guide = new GuideEntity();
        Object.assign(guide, required, optional);
        return guide;
    }

    /**
     * Asynchronously updates the details of a guide entities using the provided partial updates.
     * Validates and trims string fields (label, description), includes non-string fields (status),
     * and handles entities relations (category, file) if provided.
     * Applies the updates to the guide repository and returns the result.
     */
    async updateGuideDetails(
        guide: GuideEntity,
        gUpdates?: Partial<{
            label: string;
            description: string;
            content: string;
            status: GuideStatusEnum;
            isVideo: boolean;
            category: CategoryEntity;
            file: FileLinksEntity;
        }>,
    ) {
        if (!gUpdates || Object.keys(gUpdates).length === 0)
            return { message: 'No updates provided for guide' };

        const [requiredFields, otherFields, stringFields] = [
            ['label'] as const,
            ['status', 'category', 'file', 'isVideo'] as const,
            ['description', 'content'] as const,
        ];

        const updatePayload: Partial<GuideEntity> = {};

        requiredFields.forEach((field) => {
            if (gUpdates[field]?.trim()) updatePayload[field] = gUpdates[field].trim();
        });

        stringFields.forEach((field) => {
            const value = gUpdates[field];

            if (value === null) updatePayload[field] = null!;
            else if (typeof value === 'string') updatePayload[field] = value.trim();
        });

        otherFields.forEach((field) => {
            if (gUpdates[field] !== undefined) updatePayload[field] = gUpdates[field] as any;
        });

        return await this.guidesService.guidesRepo.update({ id: guide.id }, updatePayload);
    }

    /**
     * Asynchronously checks if a guide label is unique among active guides.
     * Validates the uniqueness of the label and collects any errors encountered.
     * Throws a validation error if the label is not unique.
     */
    async ensureUniqueGuideLabel(label: string) {
        const errors: Record<string, string> = {};
        await this.guidesService.guidesRepo.assertUniqueActive(
            this.guidesService.guidesRepo,
            errors,
            { label },
            'Guide',
        );

        if (Object.keys(errors).length > 0)
            throw this.guidesService.errorHandler.validation(errors);
    }

    /**
     * Asynchronously checks if a guide label is unique among active guides, excluding the current guide during an update.
     * Validates the uniqueness of the label and collects any errors encountered.
     * Throws a validation error if the label is not unique.
     */
    async ensureUniqueGuideLabelForUpdate(label: string, guide: GuideEntity) {
        const errors: Record<string, string> = {};
        await this.guidesService.guidesRepo.assertUniqueActive(
            this.guidesService.guidesRepo,
            errors,
            { label },
            'Guide',
            guide.id,
        );

        if (Object.keys(errors).length > 0)
            throw this.guidesService.errorHandler.validation(errors);
    }

    /**
     * Asynchronously prepares the data required to create a new guide.
     * Retrieves the associated category and links the specified file to the guide,
     * then returns an object containing the trimmed label, optional description,
     * status, category, and file links.
     */
    async prepareGuideData(createDto: CreateGuideDto) {
        const { label, fileId, description, status, categoryId, isVideo, content } = createDto;

        const [category, fileLinks] = await Promise.all([
            this.guidesService.categoryService.retrieveCategoryByCriteria({
                id: categoryId,
            }),
            this.guidesService.fileLinkService.linkFileToEntity(fileId, FileUsageEnum.GUIDES),
        ]);

        return {
            label: label.trim(),
            description: description ? description.trim() : null!,
            content: content ? content.trim() : null!,
            status,
            isVideo,
            category,
            file: fileLinks,
        };
    }

    /**
     * Asynchronously persists a new guide to the repository.
     * Uses the provided guide data to build a GuideEntity and saves it.
     * Returns the created guide entities.
     */
    async persistGuide(guideData: any) {
        return await this.guidesService.guidesRepo.create(
            this.buildGuideEntity(
                {
                    label: guideData.label,
                    status: guideData.status,
                    category: guideData.category,
                    file: guideData.file,
                    isVideo: guideData.isVideo,
                },
                {
                    description: guideData.description,
                    content: guideData.content,
                },
            ),
        );
    }

    /**
     * Notifies relevant clients about a change in a guide (e.g., creation, update, deletion)
     * by sending the transformed guide data via socket to the 'guides' route.
     * Uses the provided event type to specify the nature of the change.
     */
    notifyGuideChange(guide: GuideEntity, event: SocketEventEnum): void {
        this.guidesService.socketService.sendDataToRoute('/guides', event, {
            payload: [this.guidesService.transformGuide(guide)],
        });
    }

    /**
     * Notifies relevant clients about updated guide statistics
     * by sending the stats data via socket to the 'guides' route.
     * Uses the GUIDE_BADGE_COUNT event to indicate a statistics update.
     */
    notifyStatsUpdated(stats: any): void {
        this.guidesService.socketService.sendDataToRoute(
            '/guides/badge-count',
            SocketEventEnum.GUIDE_BADGE_COUNT,
            { payload: this.guidesService.transformGStats(stats) },
        );
    }

    /**
     * Asynchronously schedules the invalidation of cache entries related to guides
     * by deleting all cache keys with the base 'guides'.
     */
    async scheduleInvalidateCache() {
        await this.guidesService.cacheService.deleteKeysByBase('guides');
    }

    /**
     * Asynchronously handles post-creation actions for a guide.
     * Updates guide statistics based on the guide's status,
     * notifies relevant clients about the new guide creation,
     * and broadcasts updated statistics.
     */
    async handlePostCreation(guide: GuideEntity, status: GuideStatusEnum): Promise<void> {
        const stats = await this.guidesService.guideStatsService.onCreate(status);

        this.notifyGuideChange(guide, SocketEventEnum.NEW_GUIDE_CREATED);
        this.notifyStatsUpdated(stats);
    }

    /**
     * Asynchronously prepares updates for a guide entities based on the provided UpdateGuideDto.
     * Validates the uniqueness of the label (if provided), and constructs a partial update object
     * including label, description, status, category, and file updates as specified in the DTO.
     * Returns the prepared update object for the guide.
     */
    async prepareGuideUpdates(
        updateDto: UpdateGuideDto,
        guide: GuideEntity,
    ): Promise<
        Partial<{
            label: string;
            description: string;
            content: string;
            status: GuideStatusEnum;
            category: CategoryEntity;
            isVideo: boolean;
            file: FileLinksEntity;
        }>
    > {
        const { label, description, status, fileId, categoryId, isVideo, content } = updateDto;

        const gUpdates: Partial<{
            label: string;
            description: string;
            content: string;
            status: GuideStatusEnum;
            isVideo: boolean;
            category: CategoryEntity;
            file: FileLinksEntity;
        }> = {};

        if (label) {
            await this.ensureUniqueGuideLabelForUpdate(label, guide);
            gUpdates.label = label;
        }

        if (description !== undefined) gUpdates.description = description;
        if (content !== undefined) gUpdates.content = content;
        if (isVideo !== undefined) gUpdates.isVideo = isVideo;
        if (status !== undefined) gUpdates.status = status;
        if (categoryId)
            gUpdates.category = await this.guidesService.categoryService.retrieveCategoryByCriteria(
                {
                    id: categoryId,
                },
            );
        if (fileId)
            gUpdates.file = await this.guidesService.fileLinkService.linkFileToEntity(
                fileId,
                FileUsageEnum.GUIDES,
            );

        return gUpdates;
    }

    /**
     * Asynchronously handles post-update actions for a guide, especially when its status changes.
     * Updates guide statistics based on the old and new status,
     * notifies relevant clients about the guide update,
     * and broadcasts updated statistics.
     */
    async handlePostUpdate(
        guide: GuideEntity,
        oldStatus: GuideStatusEnum,
        status?: GuideStatusEnum,
    ): Promise<void> {
        const stats = await this.guidesService.guideStatsService.onStatusChange(oldStatus, status);
        this.notifyGuideChange(guide, SocketEventEnum.GUIDE_UPDATED);
        this.notifyStatsUpdated(stats);
    }

    /**
     * Asynchronously handles post-deletion actions for a guide.
     * Updates guide statistics based on the guide's previous status,
     * notifies relevant clients about the guide deletion via socket,
     * and broadcasts updated statistics.
     */
    async handlePostDelete(guide: GuideEntity, oldStatus: GuideStatusEnum): Promise<void> {
        const stats = await this.guidesService.guideStatsService.onDelete(oldStatus);
        this.guidesService.socketService.sendDataToRoute('/guides', SocketEventEnum.GUIDE_DELETED, {
            payload: [{ id: guide.id }],
        });
        this.notifyStatsUpdated(stats);
    }
}
