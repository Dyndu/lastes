import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { ModuleEntity, MFeatureEntity } from '../entities';
import {
    FileUsageEnum,
    ModuleMethodEnum,
    ModuleTypeEnum,
    SocketEventEnum,
} from '../../../common/enum';
import { FileLinksEntity } from '../../files/entities/file-links.entity';
import { ModuleUpdateDto, MRelationDto } from '../dto';

type mUpdatePayload = Partial<{
    label: string;
    color: string;
    description: string;
    usageDescription: string;
    icon: string;
    link: FileLinksEntity;
}>;

@Injectable()
export class PreModuleService {
    /**
     * Service responsible for handling module pre operations
     */

    constructor(
        @Inject(forwardRef(() => ModulesService))
        private readonly modulesService: ModulesService,
    ) {}

    /**
     * Builds a base query for modules, filtering by active status and/or a search term.
     * Excludes deleted modules and supports partial matching on module label or usage count.
     */
    baseModuleQuery(filters: { active?: boolean }) {
        const { active } = filters;

        const query = this.modulesService.moduleRepository
            .getRepository()
            .createQueryBuilder('module')
            .where('module.deleted = false');

        if (active !== undefined) query.andWhere('module.isActive = :active', { active });

        return query;
    }

    /**
     * Retrieves a list of modules for admin purposes, applying optional filters for active status and search term.
     * Returns modules sorted by update date (newest first), with selected fields: id, icon, label, usageCount, type, and isActive.
     */
    adminModulesList(filters: { active?: boolean; searchTerm?: string }) {
        const { searchTerm } = filters;
        const query = this.baseModuleQuery(filters);
        if (searchTerm) {
            const likePattern = `%${searchTerm.split('').join('%')}%`;
            query.andWhere(
                `(module.label ILIKE :searchTerm
              OR CAST(module.usageCount AS TEXT) ILIKE :searchTerm)`,
                { searchTerm: likePattern },
            );
        }
        query
            .orderBy('module.updatedAt', 'DESC')
            .select([
                'module.id',
                'module.icon',
                'module.label',
                'module.color',
                'module.usageCount',
                'module.type',
                'module.isActive',
            ]);

        return query.getMany();
    }

    /**
     * Constructs a query for listing user modules, optionally filtered by type and/or search term.
     * Applies partial matching on module label and description if a search term is provided.
     * Orders results by update date (newest first) and selects specific fields: id, icon, label, description, and type.
     */
    buildUserModuleListQuery(searchTerm?: string, type?: ModuleTypeEnum) {
        const query = this.baseModuleQuery({});
        query.andWhere('module.isActive = true');

        if (type) query.andWhere('module.type = :type', { type });

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
                'module.label',
                'module.color',
                'module.description',
                'module.type',
            ]);

        return query;
    }

    /**
     * Retrieves a list of user modules, optionally filtered by a search term.
     * Uses the `buildUserModuleListQuery` method to construct the query and fetches the results.
     */
    userModuleList(searchTerm?: string) {
        return this.buildUserModuleListQuery(searchTerm).getMany();
    }

    /**
     * Retrieves a list of user tools (modules of type "TOOLS"), optionally filtered by a search term.
     * Uses the `buildUserModuleListQuery` method to construct the query, specifically for tools.
     */
    userToolList(searchTerm?: string) {
        return this.buildUserModuleListQuery(searchTerm, ModuleTypeEnum.TOOLS).getMany();
    }

    /**
     * Finds a module by specified criteria and optional relations.
     * Logs the search criteria, checks for an active module matching the criteria,
     * and throws a "not found" error if no module is found.
     */
    async findModuleByCriteria(
        criteria: Record<string, any>,
        relations?: string[],
    ): Promise<ModuleEntity> {
        const entry = this.modulesService.otherUtils.formatCriteria(criteria);
        this.modulesService.logger.info(`Find a module by criteria: ${entry}`);

        const isModuleExist = await this.modulesService.moduleRepository.findActiveOne(
            this.modulesService.moduleRepository,
            criteria,
            relations,
        );

        if (!isModuleExist)
            this.modulesService.errorHandler.notFound(
                `Module not found with criteria: ${entry}`,
                `Module not found`,
            );

        return isModuleExist;
    }

    /**
     * Updates the details of a module entities with provided partial updates.
     * Validates and trims string fields (label, description, usageDescription),
     * handles null values for optional fields, and updates entities-specific fields (link, type, isActive).
     * Returns the result of the repository update operation.
     */
    async updateModuleDetails(
        module: ModuleEntity,
        moduleUpdates?: Partial<{
            label: string;
            isActive: boolean;
            icon: string;
            color: string;
            usageCount: number;
            type: ModuleTypeEnum;
            description: string;
            usageDescription: string;
            link: FileLinksEntity;
        }>,
    ) {
        if (!moduleUpdates || Object.keys(moduleUpdates).length === 0)
            return { message: 'No updates provided for module' };

        const updatePayload: Partial<MFeatureEntity> = {};

        const [requiredFields, otherFields, stringFields] = [
            ['label', 'icon', 'color'] as const,
            ['link', 'type', 'isActive', 'usageCount'] as const,
            ['description', 'usageDescription'] as const,
        ];

        requiredFields.forEach((field) => {
            if (moduleUpdates[field]?.trim()) updatePayload[field] = moduleUpdates[field].trim();
        });

        stringFields.forEach((field) => {
            const value = moduleUpdates[field];

            if (value === null) updatePayload[field] = null;
            else if (typeof value === 'string') updatePayload[field] = value.trim();
        });

        otherFields.forEach((field) => {
            if (moduleUpdates[field] !== undefined)
                updatePayload[field] = moduleUpdates[field] as any;
        });

        return await this.modulesService.moduleRepository.update({ id: module.id }, updatePayload);
    }

    /**
     * Validates the uniqueness of a module label, excluding the current module by ID.
     * Throws a validation error if the label is not unique.
     */
    async ensureLabelUniqueness(label: string, m: ModuleEntity) {
        const errors: Record<string, string> = {};
        await this.modulesService.moduleRepository.assertUniqueActive(
            this.modulesService.moduleRepository,
            errors,
            { label },
            'Module',
            m.id,
        );

        if (Object.keys(errors).length > 0)
            throw this.modulesService.errorHandler.validation(errors);
    }

    /**
     * Prepares and validates module update data based on the provided DTO.
     * Ensures label uniqueness, updates fields (description, usageDescription, icon),
     * and handles file linking for the module if a new link is provided.
     * Returns an object containing the validated and prepared updates.
     */
    async prepareModuleData(m: ModuleEntity, updateDto: ModuleUpdateDto) {
        const { label, icon, description, usageDescription, link, color } = updateDto;

        const mUpdates: mUpdatePayload = {};

        if (label) {
            await this.ensureLabelUniqueness(label, m);
            mUpdates.label = label;
        }

        if (description !== undefined) mUpdates.description = description;
        if (color !== undefined) mUpdates.color = color;
        if (usageDescription !== undefined) mUpdates.usageDescription = usageDescription;
        if (icon !== undefined) mUpdates.icon = icon;

        if (link) {
            mUpdates.link = await this.modulesService.fileLinksService.linkFileToEntity(
                link,
                FileUsageEnum.MODULES,
            );
        }

        return mUpdates;
    }

    /**
     * Categorizes an array of module relation DTOs by their method type (CREATE or UPDATE).
     * Returns an object with two arrays: `creates` for CREATE methods and `updates` for UPDATE methods.
     */
    splitByMethod(data: MRelationDto[]) {
        return data.reduce(
            (acc, module) => {
                if (module.method === ModuleMethodEnum.CREATE) acc.creates.push(module);

                if (module.method === ModuleMethodEnum.UPDATE) acc.updates.push(module);

                return acc;
            },
            {
                creates: [] as MRelationDto[],
                updates: [] as MRelationDto[],
            },
        );
    }

    /**
     * Broadcasts module changes to both user and admin clients via socket.
     * Sends transformed module data to the '/modules/users' room and '/modules' route with the specified event type.
     */
    broadcastMChange(m: ModuleEntity, event: SocketEventEnum) {
        this.modulesService.socketService.sendDataToRoom(
            '/modules/users',
            `modules-user-room`,
            event,
            {
                payload: [this.modulesService.mTransformService.transformUserModule(m)],
            },
        );

        this.modulesService.socketService.sendDataToRoute('/modules', event, {
            payload: [this.modulesService.mTransformService.transformAdminModule(m)],
        });
    }

    /**
     * Broadcasts a module update to a specific user via socket.
     * Transforms the module into a user-friendly format and sends it to the user's personal route with the given event type.
     */
    broadcastMToUser(userId: string, m: ModuleEntity, event: SocketEventEnum) {
        this.modulesService.socketService.sendDataToUser(
            userId,
            '/modules/users/personal',
            event,
            this.modulesService.mTransformService.transformUserModule(m),
        );
    }
}
