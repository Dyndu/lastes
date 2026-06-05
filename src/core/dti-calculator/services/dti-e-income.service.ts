import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { DtiCalculatorService } from './dti-calculator.service';
import { DtiCalculatorEntity, DtiEIncomeEntity } from '../entities';
import { CreateDtiEmploymentIncomeDto, UpdateDtiEmploymentIncomeDto } from '../dto';

@Injectable()
export class DtiEIncomeService {
    /**
     * Service responsible for handling dti employment operations
     */

    constructor(
        @Inject(forwardRef(() => DtiCalculatorService))
        private readonly dtiCalculatorService: DtiCalculatorService,
    ) {}

    /**
     * Builds a DTI income entity from the provided data.
     * Maps required fields into a new entity instance for persistence or further processing.
     */
    buildEIncomeEntity(required: {
        calculator: DtiCalculatorEntity;
        label: string;
        value: number;
    }): DtiEIncomeEntity {
        const result = new DtiEIncomeEntity();
        Object.assign(result, required);
        return result;
    }

    /**
     * Ensures the uniqueness of an employment income label.
     * Validates against existing active records and raises a validation error if duplication is detected.
     */
    async ensureEIncomeLabelIsUnique(label: string, id?: string) {
        const errors: Record<string, any> = {};

        await this.dtiCalculatorService.dtiEIncomeRepo.assertUniqueActive(
            this.dtiCalculatorService.dtiEIncomeRepo,
            errors,
            { label },
            'Employment income label',
            id,
        );

        if (errors && errors.length > 0) this.dtiCalculatorService.errorHandler.validation(errors);
    }

    /**
     * Retrieves an employment income entity based on the provided criteria.
     * Logs the lookup context, fetches active data with optional relations,
     * and raises a not found error if no matching record exists.
     */
    async retrieveEIncomeByCriteria(
        criteria: Record<string, any>,
        relations?: string[],
    ): Promise<DtiEIncomeEntity> {
        const entries = this.dtiCalculatorService.otherUtils.formatCriteria(criteria);

        this.dtiCalculatorService.logger.info(`Find employment income details by ${entries}`);

        const isDataExist = await this.dtiCalculatorService.dtiEIncomeRepo.findActiveOne(
            this.dtiCalculatorService.dtiEIncomeRepo,
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
     * Creates a new employment income entity.
     * Validates label uniqueness, builds the entity, and persists it to the data store.
     */
    async createEIncomeEntity(
        calculator: DtiCalculatorEntity,
        createDto: CreateDtiEmploymentIncomeDto,
    ): Promise<DtiEIncomeEntity> {
        await this.ensureEIncomeLabelIsUnique(createDto.label);

        return await this.dtiCalculatorService.dtiEIncomeRepo.create(
            this.buildEIncomeEntity({ calculator, ...createDto }),
        );
    }

    /**
     * Updates an existing employment income entity.
     * Validates input payload, normalizes string fields, applies partial updates,
     * and persists changes, returning early if no updates are provided.
     */
    async updateEIncomeEntity(
        oIncome: DtiEIncomeEntity,
        itemized?: Partial<{
            label: string;
            value: number;
        }>,
    ) {
        if (!itemized || Object.keys(itemized).length === 0)
            return {
                message: 'No updates provided for employment income details',
            };

        const otherFields = ['value'] as const;
        const stringField = ['label'] as const;

        const updatePayload: Partial<DtiEIncomeEntity> = {};

        stringField.forEach((field) => {
            if (itemized[field]?.trim()) updatePayload[field] = itemized[field].trim();
        });

        otherFields.forEach((field) => {
            if (itemized[field] !== undefined) updatePayload[field] = itemized[field] as any;
        });

        return await this.dtiCalculatorService.dtiEIncomeRepo.update(
            { id: oIncome.id },
            updatePayload,
        );
    }

    /**
     * Updates an employment income record by identifier.
     * Retrieves the existing entity, validates label uniqueness when provided,
     * and delegates the update operation with normalized input data.
     */
    async updateEIncome(id: string, dto: UpdateDtiEmploymentIncomeDto) {
        const isDateExist = await this.retrieveEIncomeByCriteria({ id });

        if (dto.label) await this.ensureEIncomeLabelIsUnique(dto.label, isDateExist.id);
        await this.updateEIncomeEntity(isDateExist, { label: dto.label, value: dto.value });
    }

    /**
     * Deletes an existing employment income record by id.
     * Retrieves the target entity to ensure it exists before deletion,
     * then removes it from the repository using its identifier.
     */
    async deleteEIncome(id: string) {
        const isDateExist = await this.retrieveEIncomeByCriteria({ id });
        await this.dtiCalculatorService.dtiEIncomeRepo.delete({ id: isDateExist.id });
    }
}
