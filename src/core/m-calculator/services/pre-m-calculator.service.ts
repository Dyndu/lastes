import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { MCalculatorService } from './m-calculator.service';
import { MCalculatorEntity } from '../entities/m-calculator.entity';
import { CreateMCalculatorDto } from '../dto';
import {
    CreditScoreEnum,
    ExtraPaymentFrequencyEnum,
    MCalculatorTypeEnum,
} from '../../../common/enum';
import { UserEntity } from '../../users/entities/user.entity';

@Injectable()
export class PreMCalculatorService {
    /**
     * Service responsible for handling pre mortgage operation
     */

    constructor(
        @Inject(forwardRef(() => MCalculatorService))
        private readonly mCalculatorService: MCalculatorService,
    ) {}

    /**
     * Maps a mortgage calculator entity to its corresponding DTO representation.
     * Extracts relevant fields from the entity and returns a structured CreateMCalculatorDto object.
     */
    mapEntityToDto = (calculator: MCalculatorEntity): CreateMCalculatorDto =>
        ({
            purchasePrice: calculator.purchasePrice,
            downPaymentAmount: calculator.downPaymentAmount,
            downPaymentPercentage: calculator.downPaymentPercentage,
            interestRate: calculator.interestRate,
            loanTerm: calculator.loanTerm,
            typeEnum: calculator.typeEnum,
            loanStartDate: calculator.loanStartDate,
            annualPropertyTaxes: calculator.annualPropertyTaxes,
            annualHomeInsurance: calculator.annualHomeInsurance,
            additionalMonthlyPayment: calculator.additionalMonthlyPayment,
            creditScore: calculator.creditScore,
        }) as CreateMCalculatorDto;

    /**
     * Normalizes a payment amount to its monthly equivalent based on frequency.
     * Converts yearly and weekly amounts into monthly values, and returns the amount unchanged for monthly frequency.
     */
    normalizeExtraPaymentToMonthly(amount: number, frequency?: ExtraPaymentFrequencyEnum): number {
        switch (frequency) {
            case ExtraPaymentFrequencyEnum.YEARLY:
                return amount / 12;
            case ExtraPaymentFrequencyEnum.WEEKLY:
                return (amount * 52) / 12;
            case ExtraPaymentFrequencyEnum.MONTHLY:
            default:
                return amount;
        }
    }

    /**
     * Validates mortgage calculator input based on selected calculator mode.
     * Ensures advanced fields are not provided in BASIC mode and are required in ADVANCED mode.
     * Collects field-level validation errors and throws a validation exception if constraints are violated.
     */
    assertCalculatorModeConstraints(data: CreateMCalculatorDto): void {
        const errors: Record<string, string> = {};

        const advancedFields: Array<keyof CreateMCalculatorDto> = [
            'loanStartDate',
            'annualPropertyTaxes',
            'annualHomeInsurance',
            'additionalMonthlyPayment',
            'creditScore',
        ];

        const advancedFieldsMessage =
            'Loan start date, annual home insurance, annual property taxes, additional monthly payment, credit score';

        if (data.typeEnum === MCalculatorTypeEnum.BASIC) {
            const hasForbiddenFields = advancedFields.some((field) => data[field] !== undefined);

            if (hasForbiddenFields) {
                const message = `${advancedFieldsMessage} aren't required when calculator is on basic mode`;
                advancedFields.forEach((field) => (errors[field] = message));
            }
        }

        if (data.typeEnum === MCalculatorTypeEnum.ADVANCED) {
            const hasMissingFields = advancedFields.some((field) => data[field] === undefined);

            if (hasMissingFields) {
                const message = `${advancedFieldsMessage} are required when calculator is on advanced mode`;
                advancedFields.forEach((field) => (errors[field] = message));
            }
        }

        if (Object.keys(errors).length > 0)
            throw this.mCalculatorService.errorHandler.validation(errors);
    }

    /**
     * Retrieves a mortgage calculator entity based on provided criteria.
     * Formats and logs the search parameters, queries the repository with optional relations,
     * validates existence of the data, and throws a not found error if no match is found.
     * Returns the retrieved calculator entity when successful.
     */
    async retrieveMCalculatorByCriteria(
        criteria: Record<string, any>,
        relations?: string[],
    ): Promise<MCalculatorEntity> {
        const entries = this.mCalculatorService.otherUtils.formatCriteria(criteria);
        this.mCalculatorService.logger.info(`Find a mortgage calculator ${entries}`);

        const isDataExist = await this.mCalculatorService.mCalculatorRepo.findActiveOne(
            this.mCalculatorService.mCalculatorRepo,
            criteria,
            relations,
        );

        if (!isDataExist)
            this.mCalculatorService.errorHandler.notFound(
                `Data not found with ${entries}`,
                `Data not found`,
            );

        return isDataExist;
    }

    /**
     * Builds a mortgage calculator entity from required and optional input data.
     * Instantiates a new entity and merges both required and optional properties into it.
     * Returns the fully constructed MCalculatorEntity instance.
     */
    buildMCalculatorEntity(
        required: {
            createdBy: UserEntity;
            purchasePrice: number;
            downPaymentAmount: number;
            downPaymentPercentage: number;
            loanAmount: number;
            interestRate: number;
            loanTerm: number;
            typeEnum: MCalculatorTypeEnum;
        },
        optional: {
            loanStartDate?: Date;
            creditScore?: CreditScoreEnum;
            annualPropertyTaxes?: number;
            annualHomeInsurance?: number;
            additionalMonthlyPayment?: number;
        },
    ) {
        const result = new MCalculatorEntity();
        Object.assign(result, required, optional);
        return result;
    }

    /**
     * Creates a mortgage calculator entity for a given user and input data.
     * Checks for an existing calculator and returns it if found, otherwise validates
     * calculator mode constraints, computes derived financial values (down payment amount,
     * percentage, and loan amount), and persists a new MCalculatorEntity.
     */
    async createMCalculator(
        createdBy: UserEntity,
        createDto: CreateMCalculatorDto,
    ): Promise<MCalculatorEntity> {
        const calculator = await this.mCalculatorService.mCalculatorRepo.findOne({
            where: { createdBy: { id: createdBy.id } },
        });

        if (calculator) return calculator;
        this.assertCalculatorModeConstraints(createDto);

        const { purchasePrice } = createDto;

        const amount = this.mCalculatorService.determineDownPaymentAmount(createDto);
        const percentage =
            this.mCalculatorService.mCalculatorEquationsService.calculateDownPaymentPercentage(
                purchasePrice,
                amount,
            );

        return await this.mCalculatorService.mCalculatorRepo.create(
            this.buildMCalculatorEntity(
                {
                    createdBy,
                    ...createDto,
                    downPaymentAmount: amount,
                    downPaymentPercentage: percentage,
                    loanAmount:
                        this.mCalculatorService.mCalculatorEquationsService.calculateLoanAmount(
                            purchasePrice,
                            amount,
                        ),
                },
                {
                    ...createDto,
                    loanStartDate: createDto.loanStartDate
                        ? new Date(createDto.loanStartDate)
                        : undefined,
                },
            ),
        );
    }

    /**
     * Updates a mortgage calculator entity with the provided partial data.
     * Validates that update data exists, filters supported numeric and optional fields,
     * builds an update payload, and persists changes to the repository by calculator ID.
     */
    async updateMCalculator(
        calculator: MCalculatorEntity,
        itemized?: Partial<{
            purchasePrice: number;
            downPaymentAmount: number;
            downPaymentPercentage: number;
            loanAmount: number;
            interestRate: number;
            loanTerm: number;
            loanStartDate?: Date;
            annualPropertyTaxes?: number;
            annualHomeInsurance?: number;
            typeEnum: MCalculatorTypeEnum;
            additionalMonthlyPayment?: number;
        }>,
    ) {
        if (!itemized || Object.keys(itemized).length === 0)
            return {
                message: 'No updates provided for calculator update',
            };

        const otherFields = [
            'purchasePrice',
            'downPaymentAmount',
            'downPaymentPercentage',
            'loanAmount',
            'typeEnum',
            'interestRate',
            'loanTerm',
            'loanStartDate',
            'annualPropertyTaxes',
            'annualHomeInsurance',
            'additionalMonthlyPayment',
        ] as const;

        const updatePayload: Partial<MCalculatorEntity> = {};

        otherFields.forEach((field) => {
            if (itemized[field] !== undefined) updatePayload[field] = itemized[field] as any;
        });

        return await this.mCalculatorService.mCalculatorRepo.update(
            { id: calculator.id },
            updatePayload,
        );
    }

    /**
     * Updates a mortgage calculator with full validation and derived field recalculation.
     * Validates calculator mode constraints if typeEnum is provided, recomputes down payment
     * amount, percentage, and loan amount when relevant fields change, then persists updates.
     */
    async updateMCalculatorWithRecalculation(
        calculator: MCalculatorEntity,
        updateDto: Partial<CreateMCalculatorDto>,
    ): Promise<MCalculatorEntity | { message: string }> {
        if (!updateDto || Object.keys(updateDto).length === 0)
            return { message: 'No updates provided for calculator update' };

        if (updateDto.typeEnum !== undefined)
            this.assertCalculatorModeConstraints({
                ...calculator,
                ...updateDto,
            } as CreateMCalculatorDto);

        const merged = { ...calculator, ...updateDto };
        const purchasePrice = merged.purchasePrice;

        const needsRecalculation =
            updateDto.purchasePrice !== undefined ||
            updateDto.downPaymentAmount !== undefined ||
            updateDto.downPaymentPercentage !== undefined;

        let downPaymentAmount = calculator.downPaymentAmount;
        let downPaymentPercentage = calculator.downPaymentPercentage;
        let loanAmount = calculator.loanAmount;

        if (needsRecalculation) {
            downPaymentAmount = this.mCalculatorService.determineDownPaymentAmount(
                merged as CreateMCalculatorDto,
            );

            downPaymentPercentage =
                this.mCalculatorService.mCalculatorEquationsService.calculateDownPaymentPercentage(
                    purchasePrice,
                    downPaymentAmount,
                );

            loanAmount = this.mCalculatorService.mCalculatorEquationsService.calculateLoanAmount(
                purchasePrice,
                downPaymentAmount,
            );
        }

        return await this.updateMCalculator(calculator, {
            ...updateDto,
            loanStartDate: updateDto.loanStartDate
                ? new Date(updateDto.loanStartDate)
                : calculator.loanStartDate,
            downPaymentAmount,
            downPaymentPercentage,
            loanAmount,
        });
    }
}
