import { Inject, Injectable } from '@nestjs/common';
import { PermissionRepository } from './permissions.repository';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ErrorHandlerService } from '../../common/response';
import { OtherUtils } from '../../utils/services/tools';
import { PermissionEntity } from './entities/permission.entity';

@Injectable()
export class PermissionsService {
    /**
     * Service responsible for handling permissions-related operations.
     */

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        private readonly errorHandler: ErrorHandlerService,
        private readonly otherUtils: OtherUtils,
        private readonly permRepository: PermissionRepository,
    ) {}

    /**
     * Transforms an array of permission entities into an array of objects grouped by their UI category.
     * Each group contains the UI identifier and an array of permissions with their id, label, and action.
     */
    transformPermsGroupedByUi = (perms: PermissionEntity[]) => {
        const grouped = perms.reduce(
            (acc, perm) => {
                if (!acc[perm.ui]) acc[perm.ui] = [];
                acc[perm.ui].push(perm);
                return acc;
            },
            {} as Record<string, PermissionEntity[]>,
        );

        return Object.entries(grouped).map(([ui, permissions]) => ({
            ui,
            perms: permissions.map((p) => ({
                id: p.id,
                label: p.label,
                action: p.action,
            })),
        }));
    };

    /**
     * Retrieves permissions based on the provided criteria and relations.
     * Logs the criteria, searches for active permissions, and validates the number of results
     * against the expected size (if specified). Throws a "not found" error if the results do not match expectations.
     */
    async retrievePermsByCriteria(
        criteria: Record<string, any>,
        relations?: string[],
    ): Promise<PermissionEntity[]> {
        const entries = this.otherUtils.formatCriteria(criteria);
        this.logger.info(`Retrieving permissions by ${entries}`);

        const results = await this.permRepository.findActiveMany(
            this.permRepository,
            criteria,
            relations,
        );

        const expectedSize = Object.values(criteria).find(
            (value) => value?._value && Array.isArray(value._value),
        )?._value?.length;

        if (expectedSize && results.length !== expectedSize)
            this.errorHandler.notFound(
                `Expected ${expectedSize} permissions but found ${results.length}. Some permission IDs do not exist.`,
                `Permissions not found`,
            );

        return results;
    }

    /**
     * Asynchronously retrieves all non-deleted permissions from the repository.
     * Logs the retrieval attempt, checks if permissions exist, and returns them grouped by UI category.
     * Returns an empty array if no permissions are found.
     */
    async allPermissions() {
        this.logger.info(`Retrieve all permissions`);

        const allPerms = await this.permRepository.find({
            where: { deleted: false },
        });

        if (allPerms.length === 0) return [];
        return this.transformPermsGroupedByUi(allPerms);
    }
}
