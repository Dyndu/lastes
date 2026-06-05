import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { DtiCalculatorService } from './dti-calculator.service';
import { UserEntity } from '../../users/entities/user.entity';
import {
    DtiCalculatorEntity,
    DtiCardEntity,
    DtiOtherDebtsEntity,
    DtiPropertyEntity,
} from '../entities';
import { CurrentUserInterface } from '../../../interface';

@Injectable()
export class PreDtiCalculatorService {
    /**
     * Service responsible for handling pre operation for dti calculator
     */

    constructor(
        @Inject(forwardRef(() => DtiCalculatorService))
        private readonly dtiCalculatorService: DtiCalculatorService,
    ) {}

    /**
     * Builds a DTI calculator entity using the provided required data.
     * Instantiates the entity, assigns the provided properties, and returns
     * the initialized calculator entity instance.
     */
    buildDtiCalculator(required: { createdBy: UserEntity }): DtiCalculatorEntity {
        const result = new DtiCalculatorEntity();
        Object.assign(result, required);
        return result;
    }

    /**
     * Retrieves an active DTI calculator entity based on the provided search criteria.
     * Formats and logs the criteria, queries the repository for an active matching record (with optional relations),
     * and throws a not-found error if no matching data is found.
     */
    async retrieveDtiCalculatorByCriteria(
        criteria: Record<string, any>,
        relations?: string[],
    ): Promise<DtiCalculatorEntity> {
        const entries = this.dtiCalculatorService.otherUtils.formatCriteria(criteria);
        this.dtiCalculatorService.logger.info(`Find a dti calculator ${entries}`);

        const isDataExist = await this.dtiCalculatorService.dtiCalculatorRepo.findActiveOne(
            this.dtiCalculatorService.dtiCalculatorRepo,
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
     * Initializes or retrieves a DTI calculator for the current user.
     * Logs the operation, retrieves the user entity, checks for an existing calculator linked to the user,
     * and creates a new calculator if none exists. Returns the calculator entity.
     */
    async lunchDti(user: CurrentUserInterface): Promise<DtiCalculatorEntity> {
        this.dtiCalculatorService.logger.info(
            `Create or retrieve user with id: ${user.id} dti calculator`,
        );

        const createdBy =
            await this.dtiCalculatorService.userService.preUserService.retrieveUserByCriteria({
                id: user.id,
            });
        return (
            (await this.dtiCalculatorService.dtiCalculatorRepo.findOne({
                where: { createdBy: { id: user.id } },
            })) ??
            (await this.dtiCalculatorService.dtiCalculatorRepo.create(
                this.buildDtiCalculator({ createdBy }),
            ))
        );
    }

    /**
     * Updates a calculator entity with the provided partial data.
     * Filters and trims allowed string fields, ignores empty or undefined inputs,
     * and aborts the operation if no valid updates are provided.
     * Persists the update payload to the repository based on the calculator ID.
     */
    async updateCalculator(
        calculator: DtiCalculatorEntity,
        itemized?: Partial<{
            description: string;
        }>,
    ) {
        if (!itemized || Object.keys(itemized).length === 0)
            return {
                message: 'No updates provided for calculator update',
            };

        const stringField = ['description'] as const;

        const updatePayload: Partial<DtiPropertyEntity> = {};

        stringField.forEach((field) => {
            if (itemized[field]?.trim()) updatePayload[field] = itemized[field].trim();
        });

        return await this.dtiCalculatorService.dtiCalculatorRepo.update(
            { id: calculator.id },
            updatePayload,
        );
    }

    /**
     * Calculates the total monthly housing cost from a list of property items.
     * Aggregates the totalExpenses field of each item and returns the summed value.
     */
    calculateMonthlyHouseCoast = (items: DtiPropertyEntity[]) =>
        items.reduce((sum, item) => sum + item.totalExpenses, 0);

    /**
     * Calculates the total monthly rent from a list of property items.
     * Aggregates the monthlyRent field of each item and returns the summed value.
     */
    calculateTotalMonthlyRent = (items: DtiPropertyEntity[]) =>
        items.reduce((sum, item) => sum + item.monthlyRent, 0);

    /**
     * Calculates the total credit card debt from a list of card items.
     * Aggregates the amount field of each item and returns the summed value.
     */
    calculateTotalCreditCardDebts = (items: DtiCardEntity[]) =>
        items.reduce((sum, item) => sum + item.amount, 0);

    /**
     * Calculates the total amount of other debts from a list of debt items.
     * Aggregates the value field of each item and returns the summed total.
     */
    calculatorTotalOtherDebts = (items: DtiOtherDebtsEntity[]) =>
        items.reduce((sum, item) => sum + item.value, 0);

    /**
     * Calculates the total gross monthly income for a calculator entity.
     * Aggregates rental income from properties along with additional earned and other income sources,
     * and returns the combined total value.
     */
    calculateGrosslyMonth = (calculator: DtiCalculatorEntity) =>
        this.calculateTotalMonthlyRent(calculator.properties) +
        calculator.eIncome.reduce((sum, item) => sum + item.value, 0) +
        calculator.oIncome.reduce((sum, item) => sum + item.value, 0);

    /**
     * Calculates DTI (Debt-to-Income) metrics for a calculator entity.
     * Computes gross monthly income, housing expenses, and total debt obligations,
     * then derives frontend and backend DTI percentages.
     * Returns a structured object containing all computed financial indicators.
     */
    calculateFrontendDti(calculator: DtiCalculatorEntity) {
        const [grosslyMonth, monthlyHouseCoast, otherDebts] = [
            this.calculateGrosslyMonth(calculator),
            this.calculateMonthlyHouseCoast(calculator.properties),
            this.calculateTotalCreditCardDebts(calculator.cards) +
                this.calculatorTotalOtherDebts(calculator.debts),
        ];

        return {
            frontendDti: (monthlyHouseCoast / grosslyMonth) * 100,
            backendDti: (otherDebts / grosslyMonth) * 100,
            grosslyMonth,
            housingExpenses: monthlyHouseCoast,
            totalMonthlyDebts: otherDebts,
            otherDebtsPayment: monthlyHouseCoast - otherDebts,
        };
    }
}
