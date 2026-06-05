import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { OtherUtils } from '../../utils/services/tools';
import { ErrorHandlerService } from '../../common/response';
import { SubscriptionRepository } from './subscription.repository';
import { SubscriptionEntity } from './entities/subscription.entity';
import { SPlanUpdateDto } from './dto/s-plan-update.dto';

@Injectable()
export class SubscriptionService {
    /**
     * Service responsible for handling subscriptions plan amounts operations
     */

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        private readonly subscriptionRepo: SubscriptionRepository,
        private readonly otherUtils: OtherUtils,
        private readonly errorHandler: ErrorHandlerService,
    ) {}

    /**
     * Transforms an SubscriptionEntity object into a simplified object containing only its ID and prices.
     */
    transformSPlans = (sc: SubscriptionEntity) => ({
        id: sc.id,
        monthlyPrice: sc.monthlyPrice,
        yearlyPrice: sc.yearlyPrice,
    });

    async getPlanPrices() {
        this.logger.info(`Find subscriptions plan by prices`);

        const data = await this.subscriptionRepo.findOne({
            where: { deleted: false },
        });

        if (!data) this.errorHandler.notFound(`Plans not found`, `Plan not found`);

        return this.transformSPlans(data);
    }

    /**
     * Retrieves a single active support code entities based on the provided criteria.
     * Logs the search criteria and throws a not found error if no matching support code exists.
     */
    async retrieveSPlansByCriteria(criteria: Record<string, any>) {
        const entries = this.otherUtils.formatCriteria(criteria);
        this.logger.info(`Find subscriptions plan by ${entries}`);

        const isDataExist = await this.subscriptionRepo.findActiveOne(
            this.subscriptionRepo,
            criteria,
        );

        if (!isDataExist)
            this.errorHandler.notFound(
                `Support code not found with ${entries}`,
                `Support code not found`,
            );

        return this.transformSPlans(isDataExist);
    }

    /**
     * Updates subscription plan prices for the specified plan ID.
     * Logs the update DTO, checks if the subscription plan exists,
     * updates monthly and yearly prices with fallback to existing values, and returns a success message.
     */
    async updateSPlans(id: string, dto: SPlanUpdateDto) {
        this.logger.info(`Update subscription prices with dto: ${JSON.stringify(dto)}`);
        const isDataExist = await this.retrieveSPlansByCriteria({ id });

        await this.subscriptionRepo.update(
            { id },
            {
                monthlyPrice: dto.monthlyPrice ?? isDataExist.monthlyPrice,
                yearlyPrice: dto.yearlyPrice ?? isDataExist.yearlyPrice,
            },
        );

        return { message: 'Code updated successfully.' };
    }
}
