import { Inject, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { EnvConfigService } from '../../utils/services/config';
import { CategoriesRepository } from './categories.repository';
import { CategoryEntity } from './entities/category.entity';

@Injectable()
export class CategoriesSeeder {
    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
        private readonly categoryRepo: CategoriesRepository,
        private readonly envConfigService: EnvConfigService,
    ) {}

    /**
     * Seeds the database with default categories if no categories exist.
     * Checks if there are any existing categories that are not deleted, and if none are found, create new categories from a predefined list.
     */
    async seed() {
        const defaultGC = [this.envConfigService.gCFinance, this.envConfigService.gCREstate].filter(
            Boolean,
        );

        this.logger.info('Seeding default guide categories...');

        if (defaultGC.length === 0) {
            this.logger.warn('No guide categories to seed.');
            return;
        }

        const existing = await this.categoryRepo.find({
            where: { label: In(defaultGC), deleted: false },
        });

        const gCgy = defaultGC
            .filter((label) => !existing.map((role) => role.label).includes(label))
            .map((label) => {
                const role = new CategoryEntity();
                role.label = label;
                return role;
            });

        if (gCgy.length > 0) {
            try {
                await this.categoryRepo.createMany(gCgy);
                this.logger.info('Default guide categories seeded successfully.');
            } catch (error) {
                this.logger.error('Error seeding guide categories:', error);
                throw error;
            }
        } else this.logger.info('All guide categories already exist, nothing to seed.');
    }
}
