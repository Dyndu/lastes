import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { DtiCalculatorService } from './dti-calculator.service';
import { DtiCalculatorEntity, DtiPropertyEntity } from '../entities';
import { PropertyDetailsTypeEnum } from '../../../common/enum';
import { CreateDtiPropertyDto, UpdateDtiPropertyDto } from '../dto';

@Injectable()
export class DtiPropertyService {
    /**
     * Service responsible for handling dti property operations
     */

    constructor(
        @Inject(forwardRef(() => DtiCalculatorService))
        private readonly dtiCalculatorService: DtiCalculatorService,
    ) {}

    /**
     * Builds a DTI property entity from the provided data.
     * Maps required fields into a new entity instance for persistence or further processing.
     */
    buildDtiProperty(required: {
        streetAddress: string;
        city: string;
        state: string;
        zipCode: string;
        propertyType: PropertyDetailsTypeEnum;
        principalInterest: number;
        taxesEscrow: number;
        pMInsurance: number;
        hoaFees: number;
        monthlyRentalIncome: number;
        calculator: DtiCalculatorEntity;
    }): DtiPropertyEntity {
        const result = new DtiPropertyEntity();
        Object.assign(result, required);
        return result;
    }

    /**
     * Ensures the uniqueness of a DTI property address within a calculator scope.
     * Validates against existing active records and raises a validation error if duplication is detected.
     */
    async ensureDtiPropertyLabelIsUnique(
        calculator: DtiCalculatorEntity,
        streetAddress: string,
        id?: string,
    ) {
        const errors: Record<string, any> = {};

        await this.dtiCalculatorService.dtiPropertyRepo.assertUniqueActive(
            this.dtiCalculatorService.dtiPropertyRepo,
            errors,
            { streetAddress, calculator: { id: calculator.id } },
            'Address already exists',
            id,
        );

        if (errors && errors.length > 0) this.dtiCalculatorService.errorHandler.validation(errors);
    }

    /**
     * Retrieves a DTI property entity based on the provided criteria.
     * Logs the lookup context, fetches active data with optional relations,
     * and raises a not found error if no matching record exists.
     */
    async retrieveDtiPropertyByCriteria(
        criteria: Record<string, any>,
        relations?: string[],
    ): Promise<DtiPropertyEntity> {
        const entries = this.dtiCalculatorService.otherUtils.formatCriteria(criteria);

        this.dtiCalculatorService.logger.info(`Find dti property details by ${entries}`);

        const isDataExist = await this.dtiCalculatorService.dtiPropertyRepo.findActiveOne(
            this.dtiCalculatorService.dtiPropertyRepo,
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
     * Creates a new DTI property entity.
     * Validates address uniqueness within the calculator scope,
     * builds the entity, and persists it to the data store.
     */
    async createDtiProperty(
        calculator: DtiCalculatorEntity,
        createDto: CreateDtiPropertyDto,
    ): Promise<DtiPropertyEntity> {
        await this.ensureDtiPropertyLabelIsUnique(calculator, createDto.streetAddress);

        return await this.dtiCalculatorService.dtiPropertyRepo.create(
            this.buildDtiProperty({
                calculator,
                ...createDto,
            }),
        );
    }

    /**
     * Updates an existing DTI property entity.
     * Validates input payload, normalizes string fields, applies partial updates,
     * and persists changes, returning early if no updates are provided.
     */
    async updateDtiPropertyEntity(
        property: DtiPropertyEntity,
        itemized?: Partial<{
            streetAddress: string;
            city: string;
            state: string;
            zipCode: string;
            propertyType: PropertyDetailsTypeEnum;
            principalInterest: number;
            taxesEscrow: number;
            pMInsurance: number;
            hoaFees: number;
            monthlyRentalIncome: number;
        }>,
    ) {
        if (!itemized || Object.keys(itemized).length === 0)
            return {
                message: 'No updates provided for dti property details',
            };

        const otherFields = [
            'propertyType',
            'principalInterest',
            'taxesEscrow',
            'pMInsurance',
            'hoaFees',
            'monthlyRentalIncome',
            'monthlyRent',
        ] as const;
        const stringField = ['streetAddress', 'city', 'state', 'zipCode'] as const;

        const updatePayload: Partial<DtiPropertyEntity> = {};

        stringField.forEach((field) => {
            if (itemized[field]?.trim()) updatePayload[field] = itemized[field].trim();
        });

        otherFields.forEach((field) => {
            if (itemized[field] !== undefined) updatePayload[field] = itemized[field] as any;
        });

        return await this.dtiCalculatorService.dtiPropertyRepo.update(
            { id: property.id },
            updatePayload,
        );
    }

    /**
     * Updates a DTI property record by identifier.
     * Retrieves the existing entity, validates address uniqueness when provided,
     * and delegates the update operation with normalized input data.
     */
    async updateDtiProperty(id: string, dto: UpdateDtiPropertyDto) {
        const isDateExist = await this.retrieveDtiPropertyByCriteria({ id }, ['calculator']);

        if (dto.streetAddress)
            await this.ensureDtiPropertyLabelIsUnique(
                isDateExist.calculator,
                dto.streetAddress,
                isDateExist.id,
            );
        await this.updateDtiPropertyEntity(isDateExist, { ...dto });
    }

    /**
     * Deletes a DTI property record by identifier.
     * Retrieves the existing entity to ensure existence and removes it from the data store.
     */
    async deleteDtiProperty(id: string) {
        const isDataExist = await this.retrieveDtiPropertyByCriteria({ id });
        await this.dtiCalculatorService.dtiPropertyRepo.delete({ id: isDataExist.id });
    }
}
