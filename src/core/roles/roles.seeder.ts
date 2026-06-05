import { Inject, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { RolesRepository } from './roles.repository';
import { RoleEntity } from './entities/role.entity';
import { EnvConfigService } from '../../utils/services/config';

@Injectable()
export class RolesSeeder {
    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
        private readonly repository: RolesRepository,
        private readonly envConfigService: EnvConfigService,
    ) {}

    /**
     * Seeds the database with default roles if no roles exist.
     * Checks if there are any existing roles that are not deleted, and if none are found, create new roles from a predefined list.
     */
    async seed() {
        this.logger.info('Seeding default roles...');
        const labels = [
            this.envConfigService.sAdminRole,
            this.envConfigService.adminRole,
            this.envConfigService.userRole,
            this.envConfigService.supportRole,
        ].filter(Boolean);

        if (labels.length === 0) {
            this.logger.warn('No valid roles to seed. Check your environment variables.');
            return;
        }

        const existingRoles = await this.repository.find({
            where: { label: In(labels), deleted: false },
        });

        const rolesToSeed = labels
            .filter((label) => !existingRoles.map((role) => role.label).includes(label))
            .map((label) => {
                const role = new RoleEntity();
                role.label = label;
                return role;
            });

        if (rolesToSeed.length > 0) {
            try {
                await this.repository.createMany(rolesToSeed);
                this.logger.info('Default roles seeded successfully.');
            } catch (error) {
                this.logger.error('Error seeding roles:', error);
                throw error;
            }
        } else this.logger.info('All roles already exist, nothing to seed.');
    }
}
