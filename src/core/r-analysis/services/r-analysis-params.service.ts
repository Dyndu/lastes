import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { RAnalysisService } from './r-analysis.service';
import { RAnalysisEntity, RAnalysisParamsEntity } from '../entities';

@Injectable()
export class RAnalysisParamsService {
    /**
     * Service responsible for handling rental analysis params
     */

    constructor(
        @Inject(forwardRef(() => RAnalysisService))
        private readonly service: RAnalysisService,
    ) {}

    buildRParamEntity(
        required: {
            rAnalysis: RAnalysisEntity;
            ltv: number;
            occupancyRate: number;
            managementFeePercent: number;
            maintenanceEscrowPercent: number;
        },
        optional: {
            pmi?: number;
        },
    ): RAnalysisParamsEntity {
        const result = new RAnalysisParamsEntity();
        Object.assign(result, required, optional);
        return result;
    }

    async createRParam(
        rAnalysis: RAnalysisEntity,
        required: {
            ltv: number;
            occupancyRate: number;
            managementFeePercent: number;
            maintenanceEscrowPercent: number;
        },
        optional: { pmi?: number },
    ) {
        if (rAnalysis.params)
            this.service.errorHandler.conflict(
                `Rental analysis already has param entity`,
                `Can't add param to this anlaysis`,
            );

        return await this.service.rAnalysisParamsRepository.create(
            this.buildRParamEntity({ rAnalysis, ...required }, { ...optional }),
        );
    }

    async updateRParam(
        params: RAnalysisParamsEntity,
        itemized?: Partial<{
            ltv: number;
            occupancyRate: number;
            managementFeePercent: number;
            maintenanceEscrowPercent: number;
            pmi: number;
        }>,
    ) {
        if (!itemized || Object.keys(itemized).length === 0)
            return {
                message: 'No updates provided for rental params',
            };

        const otherFields = [
            'ltv',
            'occupancyRate',
            'managementFeePercent',
            'maintenanceEscrowPercent',
            'pmi',
        ] as const;

        const updatePayload: Partial<RAnalysisParamsEntity> = {};

        otherFields.forEach((field) => {
            if (itemized[field] !== undefined) updatePayload[field] = itemized[field] as any;
        });

        return await this.service.rAnalysisParamsRepository.update(
            { id: params.id },
            updatePayload,
        );
    }

    /**
     * Upserts the params of a rental analysis.
     * - If the analysis already has a `params` entity, updates it with the provided values.
     * - Otherwise, creates a new `params` entity linked to the analysis.
     */
    async upsertRParam(
        rAnalysis: RAnalysisEntity,
        required?: {
            ltv: number;
            occupancyRate: number;
            managementFeePercent: number;
            maintenanceEscrowPercent: number;
        },
        optional?: { pmi?: number },
    ) {
        const params = rAnalysis.params;
        if (params)
            await this.updateRParam(params, {
                ltv: required?.ltv,
                pmi: optional?.pmi,
                maintenanceEscrowPercent: required?.maintenanceEscrowPercent,
                managementFeePercent: required?.maintenanceEscrowPercent,
                occupancyRate: required?.occupancyRate,
            });
        else await this.createRParam(rAnalysis, required!, optional!);
    }
}
