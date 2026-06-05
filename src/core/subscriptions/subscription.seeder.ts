import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { EnvConfigService } from '../../utils/services/config';
import { SubscriptionRepository } from './subscription.repository';
import { SubscriptionEntity } from './entities/subscription.entity';

@Injectable()
export class SubscriptionSeeder {
    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
        private readonly repository: SubscriptionRepository,
        private readonly envConfigService: EnvConfigService,
    ) {}

    /**
     * Seeds the database with default subscription plan prices if no subscription plan prices exist.
     * Checks if there are any existing subscription plan prices that are not deleted, and if none are found, create new subscription plan prices from a predefined list.
     */
    async seed() {
        this.logger.info('Seeding default subscription plan prices...');
        const data = [
            this.envConfigService.monthlySPrice,
            this.envConfigService.yearlySPrice,
        ].filter(Boolean);

        if (data.length === 0) {
            this.logger.warn(
                'No valid subscription plan prices to seed. Check your environment variables.',
            );
            return;
        }

        const isDataExists = await this.repository.findOne({
            where: { deleted: false },
        });

        if (isDataExists) this.logger.info(`Subscriptions plan prices are already seeded`);
        else {
            const result = new SubscriptionEntity();
            result.monthlyPrice = data[0];
            result.yearlyPrice = data[1];
            await this.repository.create(result);
        }

        this.logger.info('All subscription plan prices already exist, nothing to seed.');
    }
}
