import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ADetailsEntity, AdItemizedEntity, RDurationEntity, SaleEntity } from '../entities';
import { ABuilderService } from './a-builder.service';
import { AdItemizedDto } from '../dto';

@Injectable()
export class AdItemizedService {
    /**
     * Service responsible for handling acquisition details itemized operations
     */

    constructor(
        @Inject(forwardRef(() => ABuilderService))
        private readonly aBuilderService: ABuilderService,
    ) {}

    /**
     * Calculates the total itemized acquisition cost by summing the values of originationFee, hazardInsurance,
     * floodInsurance, propertyTaxes, and annualAssessment from the provided AdItemizedDto.
     */
    calculateItemizedAcquisitionCost(item: AdItemizedDto): number {
        const values = [
            item.originationFee,
            item.hazardInsurance,
            item.floodInsurance,
            item.propertyTaxes,
            item.annualAssessment,
            item.escrowFees,
            item.attorneyFees,
            item.inspectionFees,
            item.lenderFees,
            item.recordingFees,
            item.appraisal,
            item.transferTax,
            item.other,
        ];

        return values.reduce((sum, value) => {
            if (!Number.isNaN(value)) return sum + value;
            return sum;
        }, 0);
    }

    /**
     * Creates and returns a new AdItemizedEntity instance populated with the provided optional fields:
     * originationFee, hazardInsurance, floodInsurance, propertyTaxes, annualAssessment, and aDetails.
     */
    buildADItemizedEntity(
        required: {
            originationFee: number;
            hazardInsurance: number;
            floodInsurance: number;
            propertyTaxes: number;
            annualAssessment: number;
            escrowFees: number;
            attorneyFees: number;
            inspectionFees: number;
            lenderFees: number;
            recordingFees: number;
            appraisal: number;
            transferTax: number;
            other: number;
        },
        optional: {
            aDetails?: ADetailsEntity;
            sale?: SaleEntity;
            rDuration?: RDurationEntity;
        },
    ): AdItemizedEntity {
        const result = new AdItemizedEntity();
        Object.assign(result, required, optional);
        return result;
    }

    /**
     * Asynchronously retrieves an AdItemizedEntity based on the provided criteria and optional relations.
     * Formats the criteria for logging, checks for the existence of an active record, and throws a not found error if the record does not exist.
     * Returns the found AdItemizedEntity.
     */
    async retrieveADItemizedByCriteria(
        criteria: Record<string, any>,
        relations?: string[],
    ): Promise<AdItemizedEntity> {
        const entries = this.aBuilderService.otherUtils.formatCriteria(criteria);

        this.aBuilderService.logger.info(`Find an acquisition itemized details  by ${entries}`);

        const isDataExist = await this.aBuilderService.adItemizedRepo.findActiveOne(
            this.aBuilderService.adItemizedRepo,
            criteria,
            relations,
        );

        if (!isDataExist)
            this.aBuilderService.errorHandler.notFound(
                `Data not found with ${entries}`,
                `Data not found`,
            );

        return isDataExist;
    }

    /**
     * Asynchronously creates and saves a new AdItemizedEntity using the provided ADetailsEntity and AdItemizedDto.
     * Combines the aDetails reference with the DTO fields (originationFee, hazardInsurance, floodInsurance, propertyTaxes, annualAssessment)
     * to build and persist the entities in the database.
     */
    async createAdItemizedEntity(
        createDto: AdItemizedDto,
        aDetails?: ADetailsEntity,
        sale?: SaleEntity,
        rDuration?: RDurationEntity,
    ): Promise<AdItemizedEntity> {
        return await this.aBuilderService.adItemizedRepo.create(
            this.buildADItemizedEntity(
                {
                    ...createDto,
                },
                { aDetails, sale, rDuration },
            ),
        );
    }

    /**
     * Asynchronously updates an AdItemizedEntity with the provided partial updates for originationFee, hazardInsurance,
     * floodInsurance, propertyTaxes, and annualAssessment. Returns a message if no updates are provided,
     * otherwise updates the entities in the database using the specified fields.
     */
    async updateADItemized(
        result: AdItemizedEntity,
        itemized?: Partial<{
            originationFee: number;
            hazardInsurance: number;
            floodInsurance: number;
            propertyTaxes: number;
            annualAssessment: number;
            escrowFees: number;
            attorneyFees: number;
            inspectionFees: number;
            lenderFees: number;
            recordingFees: number;
            appraisal: number;
            transferTax: number;
            other: number;
        }>,
    ) {
        if (!itemized || Object.keys(itemized).length === 0)
            return {
                message: 'No updates provided for acquisition update',
            };

        const otherFields = [
            'originationFee',
            'hazardInsurance',
            'floodInsurance',
            'propertyTaxes',
            'annualAssessment',
            'escrowFees',
            'attorneyFees',
            'inspectionFees',
            'lenderFees',
            'recordingFees',
            'appraisal',
            'transferTax',
            'other',
        ] as const;

        const updatePayload: Partial<AdItemizedEntity> = {};

        otherFields.forEach((field) => {
            if (itemized[field] !== undefined) updatePayload[field] = itemized[field] as any;
        });

        return await this.aBuilderService.adItemizedRepo.update({ id: result.id }, updatePayload);
    }

    /**
     * Asynchronously updates acquisition itemized details for a given ID and ADetailsEntity using the provided DTO.
     * Retrieves the existing AdItemizedEntity, applies updates for originationFee, hazardInsurance, floodInsurance,
     * propertyTaxes, and annualAssessment, and returns a success message upon completion.
     */
    async updateADItemizedInfo(id: string, aDetails: ADetailsEntity, createDto: AdItemizedDto) {
        const result = await this.retrieveADItemizedByCriteria({
            id,
            aDetails: { id: aDetails.id },
        });

        await this.updateADItemized(result, {
            originationFee: createDto.originationFee,
            hazardInsurance: createDto.hazardInsurance,
            floodInsurance: createDto.floodInsurance,
            propertyTaxes: createDto.propertyTaxes,
            annualAssessment: createDto.annualAssessment,
            escrowFees: createDto.escrowFees,
            attorneyFees: createDto.attorneyFees,
            inspectionFees: createDto.inspectionFees,
            lenderFees: createDto.lenderFees,
            recordingFees: createDto.recordingFees,
            appraisal: createDto.appraisal,
            transferTax: createDto.transferTax,
            other: createDto.other,
        });

        return { message: 'Acquisition items updated successfully' };
    }

    /**
     * Deletes an acquisition details itemized entity.
     * Removes the AdItemized record from persistence using its identifier when provided.
     */
    async deleteAdItemized(data?: AdItemizedEntity) {
        return await this.aBuilderService.adItemizedRepo.delete({ id: data?.id });
    }
}
