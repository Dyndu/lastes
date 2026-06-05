import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { DtiCalculatorService } from './dti-calculator.service';
import { DtiCalculatorEntity, DtiOtherDebtsEntity } from '../entities';
import { DtiOtherDebtsLabelsEnum } from '../../../common/enum';
import { CreateDtiOtherDebtDto, UpdateDtiOtherDebtDto } from '../dto';

@Injectable()
export class DtiOtherDebtsService {
    /**
     * Service responsible for handling dti debts operations
     */

    constructor(
        @Inject(forwardRef(() => DtiCalculatorService))
        private readonly dtiCalculatorService: DtiCalculatorService,
    ) {}

    /**
     * Builds a DTI other debts entity using the provided required fields.
     * Instantiates the entity, assigns all required properties, and returns
     * the populated debt entity instance.
     */
    buildODebtsEntity(required: {
        calculator: DtiCalculatorEntity;
        label: DtiOtherDebtsLabelsEnum;
        value: number;
    }): DtiOtherDebtsEntity {
        const result = new DtiOtherDebtsEntity();
        Object.assign(result, required);
        return result;
    }

    /**
     * Ensures the uniqueness of another debts label before persistence.
     * Checks for existing active records matching the provided label (optionally excluding a given id),
     * accumulates validation errors if a conflict is found, and triggers the validation error handler when needed.
     */
    async ensureODebtsLabelIsUnique(label: string, id?: string) {
        const errors: Record<string, any> = {};

        await this.dtiCalculatorService.dtiOtherDebtsRepo.assertUniqueActive(
            this.dtiCalculatorService.dtiOtherDebtsRepo,
            errors,
            { label },
            'Other debts label',
            id,
        );

        if (errors && errors.length > 0) this.dtiCalculatorService.errorHandler.validation(errors);
    }

    /**
     * Retrieves an active other debts entity based on the provided search criteria.
     * Formats and logs the criteria, queries the repository for an active matching record (with optional relations),
     * and throws a not-found error if no matching data is found.
     */
    async retrieveODebtsByCriteria(
        criteria: Record<string, any>,
        relations?: string[],
    ): Promise<DtiOtherDebtsEntity> {
        const entries = this.dtiCalculatorService.otherUtils.formatCriteria(criteria);

        this.dtiCalculatorService.logger.info(`Find dti debt details by ${entries}`);

        const isDataExist = await this.dtiCalculatorService.dtiOtherDebtsRepo.findActiveOne(
            this.dtiCalculatorService.dtiOtherDebtsRepo,
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
     * Creates another debts entity for a given calculator using the provided DTO.
     * Ensures the label is unique before creation, builds the entity from calculator and DTO data,
     * persists it through the repository, and returns the created entity.
     */
    async createODebtEntity(
        calculator: DtiCalculatorEntity,
        createDto: CreateDtiOtherDebtDto,
    ): Promise<DtiOtherDebtsEntity> {
        await this.ensureODebtsLabelIsUnique(createDto.label);

        return await this.dtiCalculatorService.dtiOtherDebtsRepo.create(
            this.buildODebtsEntity({ calculator, ...createDto }),
        );
    }

    /**
     * Updates an existing other debts entity with the provided partial fields.
     * Validates that update data is provided, builds an update payload from allowed fields (label and value),
     * and persists the changes through the repository using the entity identifier.
     * Returns a no-op message when no update data is supplied.
     */
    async updateODebtEntity(
        oIncome: DtiOtherDebtsEntity,
        itemized?: Partial<{
            label: DtiOtherDebtsLabelsEnum;
            value: number;
        }>,
    ) {
        if (!itemized || Object.keys(itemized).length === 0)
            return {
                message: 'No updates provided for other debt details',
            };

        const otherFields = ['label', 'value'] as const;

        const updatePayload: Partial<DtiOtherDebtsEntity> = {};

        otherFields.forEach((field) => {
            if (itemized[field] !== undefined) updatePayload[field] = itemized[field] as any;
        });

        return await this.dtiCalculatorService.dtiOtherDebtsRepo.update(
            { id: oIncome.id },
            updatePayload,
        );
    }

    /**
     * Updates an existing other debts record by id using the provided DTO.
     * Retrieves the target entity, enforces label uniqueness when applicable,
     * and delegates the update operation to the entity update handler.
     */
    async updateODebt(id: string, dto: UpdateDtiOtherDebtDto) {
        const isDateExist = await this.retrieveODebtsByCriteria({ id });

        if (dto.label) await this.ensureODebtsLabelIsUnique(dto.label, isDateExist.id);
        await this.updateODebtEntity(isDateExist, { label: dto.label, value: dto.value });
    }

    /**
     * Deletes an existing other debts record by id.
     * Retrieves the target entity to ensure it exists before performing the deletion,
     * then removes it from the repository using its identifier.
     */
    async deleteODebt(id: string) {
        const isDateExist = await this.retrieveODebtsByCriteria({ id });
        await this.dtiCalculatorService.dtiOtherDebtsRepo.delete({ id: isDateExist.id });
    }
}
