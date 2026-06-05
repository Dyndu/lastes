import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { ModuleEntity, MUsersEntity } from '../entities';
import { UserEntity } from '../../users/entities/user.entity';
import { ModuleTypeEnum } from '../../../common/enum';

@Injectable()
export class MUsersService {
    /**
     * Service responsible for handling module users relation operation
     */

    constructor(
        @Inject(forwardRef(() => ModulesService))
        private readonly modulesService: ModulesService,
    ) {}

    /**
     * Builds and executes a query to retrieve pinned modules for a specific user, optionally filtered by a search term.
     * Joins the user-modules relationship table with the modules and users tables.
     * Applies partial matching on module label and description if a search term is provided.
     * Orders results by module update date (newest first) and transforms the results to include pinned status.
     */
    async buildUserModulesFromUserQuery(userId: string, searchTerm?: string) {
        const query = this.modulesService.mUsersRepository
            .getRepository()
            .createQueryBuilder('mu')
            .innerJoin('mu.module', 'module')
            .innerJoin('mu.user', 'user')
            .where('module.deleted = false')
            .andWhere('user.id = :userId', { userId })
            .andWhere('mu.isPinned = :isPinned', { isPinned: true })
            .andWhere('module.type = :type', {
                type: ModuleTypeEnum.MODULE,
            });

        if (searchTerm) {
            const likePattern = `%${searchTerm.split('').join('%')}%`;

            query.andWhere(
                `(module.label ILIKE :searchTerm
              OR module.description ILIKE :searchTerm)`,
                { searchTerm: likePattern },
            );
        }

        query
            .orderBy('module.updatedAt', 'DESC')
            .select([
                'module.id',
                'module.icon',
                'module.color',
                'module.label',
                'module.description',
                'module.type',
                'mu.isPinned',
            ]);

        const result = await query.getMany();

        return result.map((mu) => ({
            ...this.modulesService.mTransformService.transformUserModule(mu.module),
            isPinned: mu.isPinned,
        }));
    }

    /**
     * Constructs and returns a new MUsersEntity by assigning required fields:
     * module, user, and isPinned.
     */
    buildMUserEntity(required: {
        module: ModuleEntity;
        user: UserEntity;
        isPinned: boolean;
    }): MUsersEntity {
        const mUser = new MUsersEntity();
        Object.assign(mUser, required);
        return mUser;
    }

    /**
     * Validates that a module is active before allowing further operations.
     * Throws a forbidden error if the module is not active.
     */
    ensureModuleIsActive(m: ModuleEntity) {
        if (!m.isActive)
            this.modulesService.errorHandler.forbidden(
                `Module with id: ${m.id} has to be active before any further operation`,
                `Module isn't active`,
            );
    }

    /**
     * Sets or updates the pinned state of a module for a user.
     * Validates that the module type is "MODULE" before proceeding.
     * Checks for an existing user-module link; updates it if found, otherwise creates a new one.
     * Returns a success message indicating whether the module was pinned or unpinned.
     */
    async setModulePinnedState(user: UserEntity, module: ModuleEntity, pinned: boolean) {
        const [userId, moduleId] = [user.id, module.id];
        this.modulesService.logger.debug(
            `Setting pinned state for module with id: ${moduleId} by user: ${userId}`,
        );
        this.ensureModuleIsActive(module);
        if (module.type !== ModuleTypeEnum.MODULE)
            this.modulesService.errorHandler.forbidden(
                `This module type type is different from ${JSON.stringify(ModuleTypeEnum.MODULE)}, can't pin unpin`,
                `Only modules can be pinned`,
            );

        const isLinkExist = await this.modulesService.mUsersRepository.findOne({
            where: {
                user: { id: userId },
                module: { id: moduleId },
                deleted: false,
            },
        });

        if (isLinkExist)
            await this.modulesService.mUsersRepository.update(
                { id: isLinkExist.id },
                { isPinned: pinned },
            );
        else
            await this.modulesService.mUsersRepository.create(
                this.buildMUserEntity({ user, module, isPinned: pinned }),
            );

        return {
            message: `Module ${pinned ? 'pinned' : 'unpinned'} successfully`,
        };
    }
}
