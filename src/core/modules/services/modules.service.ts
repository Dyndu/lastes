import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import {
    MExportRepository,
    MFeatureRepository,
    MHeaderRepository,
    ModulesRepository,
    MUseRepository,
    MUsersRepository,
} from '../repositories';
import { ErrorHandlerService } from '../../../common/response';
import { PreModuleService } from './pre-module.service';
import { OtherUtils } from '../../../utils/services/tools';
import { UsersService } from '../../users/services';
import { MTransformService } from './m-transform.service';
import { CacheService } from '../../../helpers/cache/cache.service';
import { MHeaderService } from './m-header.service';
import { MFeatureService } from './m-feature.service';
import { MUseService } from './m-use.service';
import { MUsersService } from './m-users.service';
import { CurrentUserInterface } from '../../../interface';
import { ModuleTypeEnum, SocketEventEnum } from '../../../common/enum';
import { ModuleEntity } from '../entities';
import { CreateMExportDto, UpdateAllDto, UpdateMExportDto } from '../dto';
import { FileLinksService } from '../../files/services/file-links.service';
import { SocketService } from '../../../helpers/socket/socket.service';
import { MExportService } from './m-export.service';

@Injectable()
export class ModulesService {
    /**
     * Service responsible for handling modules main operations
     */

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        @Inject(forwardRef(() => PreModuleService))
        readonly preModuleService: PreModuleService,
        @Inject(forwardRef(() => MTransformService))
        readonly mTransformService: MTransformService,
        @Inject(forwardRef(() => MHeaderService))
        readonly mHeaderService: MHeaderService,
        @Inject(forwardRef(() => MFeatureService))
        readonly mFeatureService: MFeatureService,
        @Inject(forwardRef(() => MUseService))
        readonly mUseService: MUseService,
        @Inject(forwardRef(() => MUsersService))
        readonly mUsersService: MUsersService,
        @Inject(forwardRef(() => MExportService))
        readonly mExportService: MExportService,
        readonly errorHandler: ErrorHandlerService,
        readonly otherUtils: OtherUtils,
        readonly cacheService: CacheService,
        readonly socketService: SocketService,
        readonly userService: UsersService,
        readonly fileLinksService: FileLinksService,
        readonly mUsersRepository: MUsersRepository,
        readonly moduleRepository: ModulesRepository,
        readonly mHeaderRepo: MHeaderRepository,
        readonly mUseRepository: MUseRepository,
        readonly mExportRepository: MExportRepository,
        readonly mFeatureRepo: MFeatureRepository,
    ) {}

    /**
     * Retrieves a list of modules based on optional filters for active status and search term.
     * Logs the retrieval action and transforms the result using the module transformation service.
     */
    async getModules(filters: { active?: boolean; searchTerm?: string }) {
        this.logger.info(`Retrieve module list with specified fields`);
        const modules = await this.preModuleService.adminModulesList(filters);

        return this.mTransformService.transformAModules(modules);
    }

    /**
     * Retrieves a list of user modules, optionally filtered by a search term.
     * Logs the retrieval action and groups the results by module type for easier access.
     * Returns an object where each key is a module type and the value is an array of modules of that type.
     */
    async userModulesList(searchTerm?: string) {
        this.logger.info(`Retrieve userModulesList with searchTerm: ${searchTerm}`);

        const modules = await this.preModuleService.userModuleList(searchTerm);
        return modules.reduce(
            (acc, module) => {
                if (!acc[module.type]) acc[module.type] = [];
                acc[module.type].push(module);
                return acc;
            },
            {} as Record<ModuleTypeEnum, ModuleEntity[]>,
        );
    }

    /**
     * Retrieves a list of pinned modules for a user, optionally filtered by a search term.
     * Logs the retrieval action and delegates the query to the user module service.
     */
    async userPinModulesList(user: CurrentUserInterface, searchTerm?: string) {
        this.logger.info(`Retrieve userPinModules with searchTerm: ${searchTerm}`);
        return await this.mUsersService.buildUserModulesFromUserQuery(user.id, searchTerm);
    }

    /**
     * Retrieves a list of user tools, optionally filtered by a search term.
     * Logs the retrieval action, fetches the tools via the pre-module service,
     * and transforms the result using the module transformation service.
     */
    async userTools(searchTerm?: string) {
        this.logger.info(`Retrieve userTools with searchTerm: ${searchTerm}`);

        const tools = await this.preModuleService.userToolList(searchTerm);
        return this.mTransformService.transformUserModules(tools);
    }

    /**
     * Retrieves detailed information for a module by its ID.
     * Logs the retrieval action, fetches the module using the pre-module service,
     * and transforms the result using the module transformation service.
     */
    async moduleDetails(id: string) {
        this.logger.info(`Retrieve module details with specified fields`);

        const module = await this.preModuleService.findModuleByCriteria(
            { id },
            this.mTransformService.moduleDetails(),
        );
        return this.mTransformService.transformModule(module);
    }

    /**
     * Updates the pinned state of a module for a specific user.
     * Logs the action, verifies the existence of the user and module,
     * and sets the pinned state via the user service.
     */
    async modulePinStateByUser(user: CurrentUserInterface, id: string, pinned: boolean) {
        this.logger.debug(`Setting pinned state for module with id: ${user.id} by user: ${id}`);

        const [isUserExist, module] = await Promise.all([
            this.userService.preUserService.retrieveUserByCriteria({
                id: user.id,
            }),
            this.preModuleService.findModuleByCriteria({ id }),
        ]);

        await this.mUsersService.setModulePinnedState(isUserExist, module, pinned);

        const event = pinned ? SocketEventEnum.MODULE_PINNED : SocketEventEnum.MODULE_UNPINNED;
        this.preModuleService.broadcastMToUser(user.id, module, event);

        return {
            message: `Module ${pinned ? 'pinned' : 'unpinned'} successfully`,
        };
    }

    /**
     * Toggles the active state of a module by its ID.
     * Logs the action, retrieves the module, updates its active status,
     * and returns a success message indicating the new state.
     */
    async toggleModule(id: string) {
        this.logger.info(`Toggle module with id: ${id}`);

        const module = await this.preModuleService.findModuleByCriteria({ id });
        const value = !module.isActive;

        await this.preModuleService.updateModuleDetails(module, {
            isActive: value,
        });

        const event = value ? SocketEventEnum.MODULE_ACTIVATED : SocketEventEnum.MODULE_DEACTIVATED;
        this.preModuleService.broadcastMChange(module, event);

        return {
            message: `Module ${module.isActive ? 'deactivated' : 'activated'} successfully.`,
        };
    }

    /**
     * Updates a module by its ID using the provided DTO.
     * Logs the action, retrieves the module, prepares and applies updates,
     * handles file cleanup if a new link is provided, and processes headers, features, and uses in parallel.
     * Returns a success message upon completion.
     */
    async updateModule(id: string, updateDto: UpdateAllDto) {
        this.logger.info(`Update module with id: ${id}`);

        const { headers, uses, features } = updateDto;
        const module = await this.preModuleService.findModuleByCriteria({ id }, [
            'link',
            'link.file',
        ]);

        const moduleUpdates = await this.preModuleService.prepareModuleData(module, updateDto);

        await this.preModuleService.updateModuleDetails(module, moduleUpdates);

        if (updateDto.link) await this.fileLinksService.unlinkAndCleanup(module?.link?.id!);

        await Promise.all([
            this.mHeaderService.processModuleHeaders(module, headers),
            this.mFeatureService.processModuleFeatures(module, features),
            this.mUseService.processModuleUses(module, uses),
        ]);

        const event = SocketEventEnum.MODULE_UPDATED;
        this.preModuleService.broadcastMChange(module, event);

        return { message: 'Module updated successfully.' };
    }

    /**
     * Retrieves all module export templates for the current user.
     * Fetches the user entity, loads associated export templates,
     * and transforms the result set if data exists.
     */
    async getUserMExportTemplates(user: CurrentUserInterface) {
        this.logger.info(`Modules export templates with user ${user.id}`);

        const createdBy = await this.userService.preUserService.retrieveUserByCriteria({
            id: user.id,
        });
        const data = await this.mExportService.userMExports(createdBy);

        return data.length < 1 ? [] : this.mTransformService.transformMExportEntities(data);
    }

    /**
     * Retrieves detailed information for a module export template by id and user.
     * Loads the export entity with required relations and transforms it into a detailed response object.
     */
    async getModuleExportTDetails(user: CurrentUserInterface, id: string) {
        this.logger.info(`Module export template details with id: ${id}`);
        const data = await this.mExportService.retrieveMExportByCriteria(
            { id: id, createdBy: { id: user.id } },
            this.mTransformService.mExportDetails(),
        );

        return this.mTransformService.transformMExport(data);
    }

    /**
     * Creates a new module export template for the authenticated user.
     * Retrieves the user entity, delegates creation of the export template,
     * and returns a success response message.
     */
    async createMExports(user: CurrentUserInterface, dto: CreateMExportDto) {
        this.logger.info(
            `Create a new module export with data ${JSON.stringify(dto)} by user ${user.id}`,
        );

        const createdBy = await this.userService.preUserService.retrieveUserByCriteria({
            id: user.id,
        });

        await this.mExportService.createMExport(createdBy, dto);

        return { message: 'Module export template created successfully.' };
    }

    /**
     * Updates a module export template for the authenticated user.
     * Retrieves the user entity, delegates update operation to the service,
     * and returns the updated result.
     */
    async updateMExportData(user: CurrentUserInterface, dto: UpdateMExportDto, id: string) {
        this.logger.info(`Update module with id: ${id}`);
        const createdBy = await this.userService.preUserService.retrieveUserByCriteria({
            id: user.id,
        });

        return await this.mExportService.mExportUpdate(
            createdBy,
            dto,
            id,
            this.mTransformService.mExportDetails(),
        );
    }
}
