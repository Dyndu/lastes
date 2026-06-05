import { Inject, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { EnvConfigService } from '../../utils/services/config';
import { SCodesRepository } from './s-codes.repository';
import { SCodeEntity } from './entities/s-code.entity';

@Injectable()
export class SCodesSeeder {
    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
        private readonly repository: SCodesRepository,
        private readonly envConfigService: EnvConfigService,
    ) {}

    /**
     * Seeds the database with default support codes if no support codes exist.
     * Checks if there are any existing support codes that are not deleted, and if none are found, create new support codes from a predefined list.
     */
    async seed() {
        this.logger.info('Seeding default support codes...');
        const data = [this.envConfigService.sCodeOther].filter(Boolean);

        if (data.length === 0) {
            this.logger.warn('No valid support codes to seed. Check your environment variables.');
            return;
        }

        const existingCodes = await this.repository.find({
            where: { label: In(data), deleted: false },
        });

        const dataToSeed = data
            .filter((d) => !existingCodes.map((role) => role.label).includes(d))
            .map((label) => {
                const code = new SCodeEntity();
                code.label = label;
                return code;
            });

        if (dataToSeed.length > 0) {
            try {
                await this.repository.createMany(dataToSeed);
                this.logger.info('Default support codes seeded successfully.');
            } catch (error) {
                this.logger.error('Error seeding support codes:', error);
                throw error;
            }
        } else this.logger.info('All support codes already exist, nothing to seed.');
    }
}
