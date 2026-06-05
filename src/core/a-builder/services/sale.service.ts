import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ABuilderService } from './a-builder.service';
import { ABuilderEntity, SaleEntity } from '../entities';
import { CreateSaleDto } from '../dto';

@Injectable()
export class SaleService {
    /**
     * Service responsible for handling sale operations
     */

    constructor(
        @Inject(forwardRef(() => ABuilderService))
        private readonly aBuilderService: ABuilderService,
    ) {}

    /**
     * Builds a sale entities using required and optional parameters.
     * Combines after repair value, target profit, sale closing cost and agent commission with an optional analysis builder,
     * and returns the constructed sale entities.
     */
    buildSaleEntity(
        required: {
            afterRepairValue: number;
            targetProfit: number;
            saleClosingCoast: number;
            agentCommission: number;
        },
        optional: {
            analysisBuilder?: ABuilderEntity;
        },
    ): SaleEntity {
        const result = new SaleEntity();
        Object.assign(result, required, optional);
        return result;
    }

    /**
     * Creates a sale entities using the provided DTO and optional analysis builder.
     * Calculates the sale closing cost if not provided, creates the sale entities,
     * and associates itemized acquisition costs if present.
     */
    async createSale(createDto: CreateSaleDto, aBuilder?: ABuilderEntity) {
        let data: number;
        const { afterRepairValue, targetProfit, saleClosingCoast, item, agentCommission } =
            createDto;

        if (saleClosingCoast) data = createDto.saleClosingCoast!;
        else data = this.aBuilderService.adItemizedService.calculateItemizedAcquisitionCost(item!);

        const sale = await this.aBuilderService.saleRepository.create(
            this.buildSaleEntity(
                {
                    afterRepairValue,
                    targetProfit,
                    saleClosingCoast: data,
                    agentCommission,
                },
                {
                    analysisBuilder: aBuilder,
                },
            ),
        );

        if (item)
            await this.aBuilderService.adItemizedService.createAdItemizedEntity(
                item,
                undefined,
                sale,
            );
        return sale;
    }

    /**
     * Updates a sale entities with the provided partial data.
     * Checks if updates are provided; if not, returns a message indicating no updates.
     * Constructs an update payload from the provided fields and applies the changes to the sale entities.
     */
    async updateSaleEntity(
        result: SaleEntity,
        itemized?: Partial<{
            afterRepairValue: number;
            targetProfit: number;
            saleClosingCoast: number;
            agentCommission: number;
        }>,
    ) {
        if (!itemized || Object.keys(itemized).length === 0)
            return {
                message: 'No updates provided for sales update',
            };

        const otherFields = ['afterRepairValue', 'targetProfit', 'saleClosingCoast'] as const;

        const updatePayload: Partial<SaleEntity> = {};

        otherFields.forEach((field) => {
            if (itemized[field] !== undefined) updatePayload[field] = itemized[field] as any;
        });

        return await this.aBuilderService.saleRepository.update({ id: result.id }, updatePayload);
    }
}
