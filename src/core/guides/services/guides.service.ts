import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { GuidesRepository, UserGuideLikeRepository } from '../repositories';
import { ErrorHandlerService } from '../../../common/response';
import { OtherUtils } from '../../../utils/services/tools';
import { CategoriesService } from '../../categories/categories.service';
import { CreateGuideDto, ReactGuideDto, UpdateGuideDto } from '../dto';
import { PreGuideService } from './pre-guide.service';
import { FileLinksService } from '../../files/services/file-links.service';
import { GuideStatusEnum } from '../../../common/enum';
import { SocketService } from '../../../helpers/socket/socket.service';
import { GuideEntity, GuidesStatsEntity } from '../entities';
import { UsersEntityTransformService, UsersService } from '../../users/services';
import { CacheService } from '../../../helpers/cache/cache.service';
import { GuidesStatsService } from './guides-stats.service';
import { CurrentUserInterface } from '../../../interface';
import { UserGuideLikeService } from './user-guide-like.service';

@Injectable()
export class GuidesService {
    /**
     * Service responsible for handling guides operations
     */

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        @Inject(forwardRef(() => PreGuideService))
        readonly preGuideService: PreGuideService,
        @Inject(forwardRef(() => GuidesStatsService))
        readonly guideStatsService: GuidesStatsService,
        @Inject(forwardRef(() => UserGuideLikeService))
        readonly uGLikeService: UserGuideLikeService,
        readonly userService: UsersService,
        readonly guidesRepo: GuidesRepository,
        readonly uGLikesRepo: UserGuideLikeRepository,
        readonly errorHandler: ErrorHandlerService,
        readonly otherUtils: OtherUtils,
        readonly fileLinkService: FileLinksService,
        readonly categoryService: CategoriesService,
        readonly socketService: SocketService,
        readonly transformService: UsersEntityTransformService,
        readonly cacheService: CacheService,
    ) {}

    /**
     * Transforms a GuideEntity object into a simplified object containing its ID, label, description, status,
     * and the transformed file associated with the guide.
     */
    transformGuide = (g: GuideEntity) => ({
        id: g.id,
        label: g.label,
        description: g.description,
        content: g.content,
        isVideo: g.isVideo,
        status: g.status,
        updatedAt: g.updatedAt,
        category: this.transformService.transformEntity(g.category),
        file: this.transformService.transformFiles(g.file.file),
    });

    /**
     * Transforms a GuidesStatsEntity into a simplified object containing
     * the total, draft, and published guide counts.
     */
    transformGStats = (g: GuidesStatsEntity) => ({
        total: g.total,
        draft: g.draft,
        published: g.published,
    });

    /**
     * Transforms an array of GuideEntity objects into an array of simplified guide objects
     * using the transformGuide method for each entities.
     */
    transformGuides = (gs: GuideEntity[]) => gs.map((g) => this.transformGuide(g));

    /**
     * Defines the default eager-loaded relationships for guide queries.
     * Ensures that associated file, file. File, and category data are loaded with the guide.
     */
    guideRelations = () => ['file', 'file.file', 'category'];

    /**
     * Returns an array of relation names to eager-load when querying user guides.
     * Includes file, nested file, category, likes, and user associations for likes.
     */
    userGuideRelations = () => ['file', 'file.file', 'category', 'likes', 'likes.user'];

    /**
     * Retrieves and transforms the global guide statistics.
     * Logs the retrieval process and returns the formatted statistics.
     */
    async guideStats() {
        this.logger.info(`Retrieving guide stats`);
        const stats = await this.guideStatsService.getSingleton();

        return this.transformGStats(stats);
    }

    /**
     * Asynchronously retrieves a paginated list of guides, either from cache or the database,
     * based on the provided page, limit, and optional filters (status, search term).
     * Generates a cache key, attempts to retrieve paginated results from cache,
     * and falls back to querying the database if necessary.
     * Transforms the retrieved guide entities before returning the paginated result.
     */
    async allGuides(
        page: number,
        limit: number,
        filterItems: {
            status?: GuideStatusEnum;
            searchTerm?: string;
        },
    ) {
        this.logger.info(`Retrieve guides from cache or database.`);
        const baseKey = this.cacheService.generateRedisKey('guides', {
            ...(filterItems.status ? { status: filterItems.status } : {}),
            ...(filterItems.searchTerm ? { search: filterItems.searchTerm.toLowerCase() } : {}),
        });

        return await this.cacheService.retrieveGenericPaginated(
            baseKey,
            page,
            limit,
            {
                status: filterItems.status,
                searchTerm: filterItems.searchTerm,
            },
            (offset: number, limit: number) =>
                this.preGuideService.retrieveGuidesQuery(offset, limit, {
                    status: filterItems.status,
                    searchTerm: filterItems.searchTerm,
                }),
            (items: GuideEntity[]) => this.transformGuides(items),
        );
    }

    /**
     * Retrieves a paginated list of user guides, applying optional filters for categories, video status, and search term.
     * Uses a cache layer for performance, generating a unique cache key based on the provided filters.
     * Falls back to database retrieval if cache is not available, and transforms the results before returning.
     */
    async userGuides(
        user: CurrentUserInterface,
        page: number,
        limit: number,
        filterItems: {
            categories?: string[];
            isVideo?: boolean;
            liked?: boolean;
            searchTerm?: string;
        },
    ) {
        this.logger.info(`Retrieve user guides from cache or database.`);

        const { searchTerm, isVideo, categories, liked } = filterItems;

        const baseKey = this.cacheService.generateRedisKey('guides', {
            ...(user.role ? { role: user.role } : {}),
            ...(typeof isVideo === 'boolean' ? { isVideo } : {}),
            ...(liked ? { liked: `${liked}-${user.id}` } : {}),
            ...(searchTerm ? { search: searchTerm.toLowerCase() } : {}),
            ...(categories?.length ? { categories: categories.join(',') } : {}),
        });

        return await this.cacheService.retrieveGenericPaginated(
            baseKey,
            page,
            limit,
            {
                searchTerm,
                isVideo,
                liked,
                categories,
            },
            (offset: number, limit: number) =>
                this.preGuideService.retrieveUserGuide(user.id, offset, limit, {
                    liked,
                    searchTerm,
                    isVideo,
                    categories,
                }),
            (items: GuideEntity[]) => this.transformGuides(items),
        );
    }

    /**
     * Asynchronously retrieves the details of a guide by its ID, including its associated file.
     * Logs the retrieval attempt, fetches the guide with its file relation,
     * and returns the guide in a simplified, transformed format.
     */
    async guideDetails(id: string) {
        this.logger.info(`Guide details for ${id}`);
        const guide = await this.preGuideService.retrieveGuideByCriteria(
            { id },
            this.guideRelations(),
        );

        return this.transformGuide(guide);
    }

    /**
     * Retrieves detailed information for a user guide by its ID, including the current user's reaction (if any).
     * Logs the retrieval attempt and transforms the guide data before returning it with the user's reaction.
     */
    async userGuideDetails(user: CurrentUserInterface, id: string) {
        this.logger.info(`User guide details for ${id}`);

        const guide = await this.preGuideService.retrieveGuideByCriteria(
            { id },
            this.userGuideRelations(),
        );

        return {
            ...this.transformGuide(guide),
            reaction: guide?.likes?.find((l) => l.user.id === user.id) ?? null,
        };
    }

    /**
     * Asynchronously creates a new guide using the provided CreateGuideDto.
     * Validates the uniqueness of the guide label, prepares the guide data,
     * persists the guide to the repository, and handles post-creation actions.
     * Schedules cache invalidation in the background.
     * Returns a success message upon completion.
     */
    async createGuide(createDto: CreateGuideDto) {
        this.logger.info(`Create a new guide ${JSON.stringify(createDto)}`);

        await this.preGuideService.ensureUniqueGuideLabel(createDto.label);
        const guideData = await this.preGuideService.prepareGuideData(createDto);
        const guide = await this.preGuideService.persistGuide(guideData);

        await this.preGuideService.handlePostCreation(guide, createDto.status);

        setImmediate(async () => {
            await this.preGuideService.scheduleInvalidateCache();
        });

        return { message: 'Guide created successfully' };
    }

    /**
     * Asynchronously loads a guide entities by its ID, including its related file, file details, and category.
     * Uses the preGuideService to retrieve the guide with the specified relations.
     * Returns the fully loaded GuideEntity.
     */
    async loadGuideWithRelations(id: string): Promise<GuideEntity> {
        return this.preGuideService.retrieveGuideByCriteria({ id }, this.guideRelations());
    }

    /**
     * Asynchronously updates a guide by its ID using the provided UpdateGuideDto.
     * Logs the update attempt, loads the guide with its relations, prepares the updates,
     * applies the updates to the guide, and notifies relevant clients via socket about the update.
     * Cleans up the old file link (if a new file is provided) and invalidates the guides cache.
     * Returns a success message upon completion.
     */
    async updateGuide(id: string, updateDto: UpdateGuideDto) {
        this.logger.info(`Update guide with id: ${id} with data ${JSON.stringify(updateDto)}`);

        const guide = await this.loadGuideWithRelations(id);
        const gUpdates = await this.preGuideService.prepareGuideUpdates(updateDto, guide);

        await this.preGuideService.updateGuideDetails(guide, gUpdates);

        const updatedGuide = await this.loadGuideWithRelations(id);

        await this.preGuideService.handlePostUpdate(updatedGuide, guide.status, updateDto.status);

        setImmediate(async () => {
            if (updateDto.fileId) await this.fileLinkService.unlinkAndCleanup(guide.file.id);
            await this.preGuideService.scheduleInvalidateCache();
        });

        return { message: 'Guide updated successfully' };
    }

    /**
     * Allows a user to react to a guide by its ID.
     * Retrieves the user and guide in parallel, then sets or updates the user's reaction.
     * Logs the action and returns the result of the reaction update.
     */
    async reactToGuide(user: CurrentUserInterface, id: string, reaction: ReactGuideDto) {
        this.logger.info(`React To guide with id: ${id}`);

        const [isUserExist, guide] = await Promise.all([
            this.userService.preUserService.retrieveUserByCriteria({
                id: user.id,
            }),
            this.preGuideService.retrieveGuideByCriteria({ id }),
        ]);

        return await this.uGLikeService.setGuideReaction(isUserExist, guide, reaction.reaction!);
    }

    /**
     * Asynchronously deletes a guide by its ID.
     * Logs the deletion attempt, loads the guide with its relations, and removes it from the repository.
     * Initiates cleanup of the associated file link and invalidates the guides cache in the background.
     * Returns a success message upon completion.
     */
    async deleteGuide(id: string) {
        this.logger.info(`Delete guide with id: ${id}`);

        const guide = await this.loadGuideWithRelations(id);
        await this.guidesRepo.delete({ id });

        await this.preGuideService.handlePostDelete(guide, guide.status);

        setImmediate(async () => {
            await Promise.all([
                this.fileLinkService.unlinkAndCleanup(guide.file.id),
                this.cacheService.deleteKeysByBase('guides'),
            ]);
        });
        return { message: 'Guide deleted successfully' };
    }
}
