import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';
import { RolesRepository } from './roles.repository';
import { OtherUtils } from '../../utils/services/tools';
import { RoleEntity } from './entities/role.entity';

@Injectable()
export class RolesService {
    /**
     * Service responsible for handling roles operation
     */

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        private readonly roleRepo: RolesRepository,
        readonly envConfigService: EnvConfigService,
        readonly otherUtils: OtherUtils,
        readonly errorHandlerService: ErrorHandlerService,
    ) {}

    /**
     * Retrieves a role based on the provided criteria and optional relations.
     * Logs the search criteria and throws a "not found" error if no matching role exists.
     * Returns the user if found.
     */
    async retrieveRoleByCriteria(
        criteria: Record<string, any>,
        relations?: string[],
    ): Promise<RoleEntity> {
        const entries = this.otherUtils.formatCriteria(criteria);
        this.logger.info(`Find a role by ${entries}`);

        const isRoleExist = await this.roleRepo.findActiveOne(this.roleRepo, criteria, relations);

        if (!isRoleExist)
            this.errorHandlerService.notFound(`Data not found with ${entries}`, `Data not found`);

        return isRoleExist;
    }
}
