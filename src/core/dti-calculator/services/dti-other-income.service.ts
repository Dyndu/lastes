import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { DtiCalculatorService } from './dti-calculator.service';
import { DtiCalculatorEntity, DtiOtherIncomeEntity } from '../entities';
import { DtiOtherIncomeLabelsEnum } from '../../../common/enum';
import { CreateDtiOtherIncomeDto, UpdateDtiOtherIncomeDto } from '../dto';

@Injectable()
export class DtiOtherIncomeService {
    /**
     * Service responsible for handling dti other operations
     */

    constructor(
        @Inject(forwardRef(() => DtiCalculatorService))
        private readonly dtiCalculatorService: DtiCalculatorService,
    ) {}

    /**
     * Builds a DTI other income entity from the provided data.
     * Maps required fields into a new entity instance for persistence or further processing.
     */
    buildOIncomeEntity(required: {
        calculator: DtiCalculatorEntity;
        label: DtiOtherIncomeLabelsEnum;
        value: number;
    }): DtiOtherIncomeEntity {
        const result = new DtiOtherIncomeEntity();
        Object.assign(result, required);
        return result;
    }

    /**
     * Ensures the uniqueness of another income label.
     * Validates against existing active records and raises a validation error if duplication is detected.
     */
    async ensureOIncomeLabelIsUnique(label: string, id?: string) {
        const errors: Record<string, any> = {};

        await this.dtiCalculatorService.dtiOtherIncomeRepo.assertUniqueActive(
            this.dtiCalculatorService.dtiOtherIncomeRepo,
            errors,
            { label },
            'Other income label',
            id,
        );

        if (errors && errors.length > 0) this.dtiCalculatorService.errorHandler.validation(errors);
    }

    /**
     * Retrieves another income entity based on the provided criteria.
     * Logs the lookup context, fetches active data with optional relations,
     * and raises a not found error if no matching record exists.
     */
    async retrieveOIncomeByCriteria(
        criteria: Record<string, any>,
        relations?: string[],
    ): Promise<DtiOtherIncomeEntity> {
        const entries = this.dtiCalculatorService.otherUtils.formatCriteria(criteria);

        this.dtiCalculatorService.logger.info(`Find other income details by ${entries}`);

        const isDataExist = await this.dtiCalculatorService.dtiOtherIncomeRepo.findActiveOne(
            this.dtiCalculatorService.dtiOtherIncomeRepo,
            criteria,
            relations,
        );

        if (!isDataExist)
            this.dtiCalculatorService.errorHandler.notFound(
                `Data not found with ${entries}`,
                `Data not found`,
            );

        return isDataExist;
    }

    /**
     * Creates a new other income entity.
     * Validates label uniqueness, builds the entity, and persists it to the data store.
     */
    async createOIncomeEntity(
        calculator: DtiCalculatorEntity,
        createDto: CreateDtiOtherIncomeDto,
    ): Promise<DtiOtherIncomeEntity> {
        await this.ensureOIncomeLabelIsUnique(createDto.label);

        return await this.dtiCalculatorService.dtiOtherIncomeRepo.create(
            this.buildOIncomeEntity({ calculator, ...createDto }),
        );
    }

    /**
     * Updates an existing other income entity.
     * Validates input payload and applies partial updates before persisting changes.
     * Returns early if no update data is provided.
     */
    async updateOIncomeEntity(
        oIncome: DtiOtherIncomeEntity,
        itemized?: Partial<{
            label: DtiOtherIncomeLabelsEnum;
            value: number;
        }>,
    ) {
        if (!itemized || Object.keys(itemized).length === 0)
            return {
                message: 'No updates provided for other income details',
            };

        const otherFields = ['label', 'value'] as const;

        const updatePayload: Partial<DtiOtherIncomeEntity> = {};

        otherFields.forEach((field) => {
            if (itemized[field] !== undefined) updatePayload[field] = itemized[field] as any;
        });

        return await this.dtiCalculatorService.dtiOtherIncomeRepo.update(
            { id: oIncome.id },
            updatePayload,
        );
    }

    /**
     * Updates another income record by identifier.
     * Retrieves the existing entity, validates label uniqueness when provided,
     * and delegates the update operation with normalized input data.
     */
    async updateOIncome(id: string, dto: UpdateDtiOtherIncomeDto) {
        const isDateExist = await this.retrieveOIncomeByCriteria({ id });

        if (dto.label) await this.ensureOIncomeLabelIsUnique(dto.label, isDateExist.id);
        await this.updateOIncomeEntity(isDateExist, { label: dto.label, value: dto.value });
    }

    /**
     * Deletes another income record by identifier.
     * Retrieves the existing entity to ensure existence and removes it from the data store.
     */
    async deleteOIncome(id: string) {
        const isDateExist = await this.retrieveOIncomeByCriteria({ id });
        await this.dtiCalculatorService.dtiOtherIncomeRepo.delete({ id: isDateExist.id });
    }
}
