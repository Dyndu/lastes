import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { In } from 'typeorm';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupsRepository } from './groups.repository';
import { GroupEntity } from './entities/group.entity';
import { PermissionEntity } from '../permissions/entities/permission.entity';
import { ErrorHandlerService } from '../../common/response';
import { OtherUtils } from '../../utils/services/tools';
import { UserEntity } from '../users/entities/user.entity';
import { PermissionsService } from '../permissions/permissions.service';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupsService {
    /**
     * Service responsible for handling group operations
     */

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        private readonly groupRepository: GroupsRepository,
        private readonly otherUtils: OtherUtils,
        private readonly errorHandler: ErrorHandlerService,
        private readonly permissionService: PermissionsService,
    ) {}

    /**
     * Transforms a GroupEntity into a simplified object.
     * Capitalizes the first letter of the group label.
     */
    transformGroup = (g: GroupEntity) => ({
        id: g.id,
        label: this.otherUtils.changeFirstLetterToUpperCase(g.label),
    });

    /**
     * Transforms an array of GroupEntity objects into an array of simplified group objects.
     * Each group object contains the group ID and its label with the first letter capitalized.
     */
    transformGroups = (gs: GroupEntity[]) => gs.map((g) => this.transformGroup(g));

    /**
     * Retrieves a group based on the provided criteria and relations.
     * Formats the criteria for logging, searches for an active group matching the criteria,
     * and throws a "not found" error if no group is found.
     */
    async retrieveGroupByCriteria(
        criteria: Record<string, any>,
        relations?: string[],
    ): Promise<GroupEntity> {
        const entry = this.otherUtils.formatCriteria(criteria);
        this.logger.info(`Retrieved group by ${entry}`);

        const isGroupExist = await this.groupRepository.findActiveOne(
            this.groupRepository,
            criteria,
            relations,
        );

        if (!isGroupExist)
            this.errorHandler.notFound(`Group not found with entry ${entry}`, `Group not found`);

        return isGroupExist;
    }

    /**
     * Asynchronously retrieves all non-deleted groups from the repository,
     * ordered by their last update date in descending order.
     * Returns an empty array if no groups are found, otherwise transforms and returns the groups.
     */
    async findAllGroup() {
        this.logger.info(`Retrieve groups permissions`);
        const groups = await this.groupRepository.find({
            where: { deleted: false },
            order: {
                updatedAt: 'DESC',
            },
        });

        if (groups.length === 0) return [];
        return this.transformGroups(groups);
    }

    /**
     * Constructs a new GroupEntity with the required and optional properties.
     * Assigns the label, permissions, and optionally users to the group.
     */
    buildGroupEntity(
        required: {
            label: string;
            permissions: PermissionEntity[];
        },
        optional: { users?: UserEntity[] },
    ) {
        const group = new GroupEntity();
        Object.assign(group, required, optional);
        return group;
    }

    /**
     * Validates that the provided label is unique among active groups.
     * Adds an error to the validationErrors object if the label is already in use.
     */
    async assertLabelIsUnique(label: string, validationErrors: Record<string, string> = {}) {
        await this.groupRepository.assertUniqueActive(
            this.groupRepository,
            validationErrors,
            { label },
            'Group',
        );
    }

    /**
     * Validates that the provided label is unique.
     * Throws a validation error if the label is already in use.
     */
    async validateUniqueFields(label: string) {
        const errors: Record<string, string> = {};
        await this.assertLabelIsUnique(label, errors);

        if (Object.keys(errors).length > 0) throw this.errorHandler.validation(errors);
    }

    /**
     * Asynchronously creates a new permission group using the provided label and permission IDs.
     * Validates the uniqueness of the group label, retrieves the associated permissions,
     * builds the group entities, and saves it to the repository.
     * Returns a success message upon completion.
     */
    async createPermissionGroup(createGroupDto: CreateGroupDto) {
        const { label, permissionIds } = createGroupDto;

        await this.validateUniqueFields(label);

        const permissions = await this.permissionService.retrievePermsByCriteria({
            id: In(permissionIds),
        });

        await this.groupRepository.create(this.buildGroupEntity({ label, permissions }, {}));

        return { message: 'Group created successfully' };
    }

    /**
     * Validates that the group label is unique for an update operation.
     * Checks if another active group (excluding the current one) already uses the provided label.
     * Throws a validation error if the label is not unique.
     */
    async validateUniqueFieldsForUpdate(g: GroupEntity, label: string) {
        const errors: Record<string, string> = {};

        await this.groupRepository.assertUniqueActive(
            this.groupRepository,
            errors,
            { label },
            'Group',
            g.id,
        );

        if (Object.keys(errors).length > 0) throw this.errorHandler.validation(errors);
    }

    /**
     * Asynchronously retrieves a single group by its ID, including its associated permissions.
     * Logs the retrieval attempt, fetches the group with its permissions,
     * transforms the group and its permissions, and returns the result.
     * Returns an empty array for permissions if none are found.
     */
    async findOne(id: string) {
        this.logger.info(`Retrieve group with id ${id}`);
        const isGroupExist = await this.retrieveGroupByCriteria({ id }, ['permissions', 'users']);

        return {
            ...this.transformGroup(isGroupExist),
            hasUser: isGroupExist.users?.length > 0,
            permissions: isGroupExist.permissions
                ? this.permissionService.transformPermsGroupedByUi(isGroupExist.permissions)
                : [],
        };
    }

    /**
     * Compares two arrays of permission IDs and returns an object indicating
     * which IDs are new (toAdd) and which are no longer present (toRemove).
     */
    comparePermissionIds = (
        oldIds: string[],
        newIds: string[],
    ): { toAdd: string[]; toRemove: string[] } => {
        return {
            toAdd: newIds.filter((id) => !new Set(oldIds).has(id)),
            toRemove: oldIds.filter((id) => !new Set(newIds).has(id)),
        };
    };

    /**
     * Asynchronously updates the permissions of a group by comparing existing and new permission IDs.
     * Logs the changes, retrieves new permissions to add, filters out permissions to remove,
     * and updates the group's permissions with the remaining and new permissions.
     */
    async updateGroupPermissions(group: GroupEntity, permissionIds: string[]) {
        const { toAdd, toRemove } = this.comparePermissionIds(
            group.permissions.map((p) => p.id),
            permissionIds,
        );

        if (toAdd.length === 0 && toRemove.length === 0) return;
        this.logger.info(
            `Permissions changes - To add: [${toAdd.join(', ')}], To remove: [${toRemove.join(', ')}]`,
        );

        let newPerms: PermissionEntity[] = [];
        if (toAdd.length > 0)
            newPerms = await this.permissionService.retrievePermsByCriteria({
                id: In(toAdd),
            });

        const remainingPerms = group.permissions.filter((p) => !toRemove.includes(p.id));

        group.permissions = [...remainingPerms, ...newPerms];
    }

    /**
     * Asynchronously updates a group's label and/or permissions using the provided ID and update data.
     * Logs the update attempt, validates the uniqueness of the label if provided,
     * updates the group's permissions if new permission IDs are provided,
     * and saves the updated group to the repository.
     * Returns a success message upon completion.
     */
    async updateGroupPerm(id: string, updateDto: UpdateGroupDto) {
        const { label, permissionIds } = updateDto;
        this.logger.info(`update group with id ${id} and data ${JSON.stringify(updateDto)}`);

        const group = await this.retrieveGroupByCriteria({ id }, ['permissions']);

        if (label) {
            await this.validateUniqueFieldsForUpdate(group, label);
            group.label = label;
        }

        if (permissionIds) await this.updateGroupPermissions(group, permissionIds);
        await this.groupRepository.create(group);

        return { message: 'Group updated successfully' };
    }

    /**
     * Asynchronously deletes a group by its ID after verifying it has no associated users.
     * Logs the deletion attempt, checks if the group contains users, and throws a forbidden error if so.
     * Deletes the group from the repository if no users are associated.
     * Returns a success message upon deletion.
     */
    async deleteGroup(id: string) {
        this.logger.info(`Delete group with id ${id}`);

        const group = await this.retrieveGroupByCriteria({ id }, ['users']);

        if (group.users?.length > 0)
            this.errorHandler.forbidden(
                `Group with id ${id} still has user in it, can't delete`,
                `Forbidden, remove all users from group first`,
            );

        await this.groupRepository.delete({ id });

        return { message: 'Group deleted successfully' };
    }
}
