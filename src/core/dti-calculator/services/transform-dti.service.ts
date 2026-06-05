import { forwardRef, Inject, Injectable } from '@nestjs/common';
import {
    DtiCalculatorEntity,
    DtiCardEntity,
    DtiEIncomeEntity,
    DtiPropertyEntity,
} from '../entities';
import { DtiCalculatorService } from './dti-calculator.service';

@Injectable()
export class TransformDtiService {
    /**
     * Service responsible for transforming dti entities to ui view
     */

    constructor(
        @Inject(forwardRef(() => DtiCalculatorService))
        private readonly dtiCalculatorService: DtiCalculatorService,
    ) {}

    /**
     * Returns the list of DTI calculator relations required to compute gross monthly income.
     * Specifies the related entities (properties, employment income, and other income)
     * needed for aggregation and calculation.
     */
    grosslyMonthEntities = () => ['properties', 'eIncome', 'oIncome'];

    /**
     * Builds a breakdown structure for the calculator computation.
     * Returns a list of gross monthly income entities combined with
     * debt and credit card categories used for calculation grouping.
     */
    calculatorBreakdown = () => [...this.grosslyMonthEntities(), 'debts', 'cards'];

    /**
     * Transforms a DTI property entity into a simplified object representation.
     * Extracts and returns only relevant property fields such as address details and total expenses.
     */
    transformDtiProperty = (item: DtiPropertyEntity) => ({
        id: item.id,
        streetAddress: item.streetAddress,
        city: item.city,
        state: item.state,
        zipCode: item.zipCode,
        monthlyRent: item.monthlyRent,
        totalExpenses: item.totalExpenses,
    });

    /**
     * Transforms a DTI property entity into a detailed property representation.
     * Extends the base property transformation with additional financial and rental fields,
     * including mortgage components, fees, and monthly rental income.
     */
    transformDtiPropertyDetails = (item: DtiPropertyEntity) => ({
        ...this.transformDtiProperty(item),
        propertyType: item.propertyType,
        principalInterest: item.principalInterest,
        taxesEscrow: item.taxesEscrow,
        pMInsurance: item.pMInsurance,
        hoaFees: item.hoaFees,
        monthlyRentalIncome: item.monthlyRentalIncome,
    });

    /**
     * Transforms a list of DTI property entities into a structured response.
     * Maps each property into a simplified representation and computes the total monthly rent
     * by aggregating the monthlyRent values across all properties.
     */
    transformDtiProperties = (items: DtiPropertyEntity[]) => ({
        items: items.map((item) => this.transformDtiPropertyDetails(item)),
        total: this.dtiCalculatorService.preDtiCalculatorService.calculateTotalMonthlyRent(items),
    });

    /**
     * Transforms a list of DTI property entities into a mortgage-focused response structure.
     * Maps each property into a simplified representation and computes the total mortgage expenses
     * by aggregating the totalExpenses across all properties.
     */
    transformDriPropertiesMortgages = (items: DtiPropertyEntity[]) => ({
        items: items.map((item) => this.transformDtiPropertyDetails(item)),
        total: this.dtiCalculatorService.preDtiCalculatorService.calculateMonthlyHouseCoast(items),
    });

    /**
     * Transforms a generic entity into a simplified data representation.
     * Extracts and returns only the id, label, and value fields.
     */
    transformData = (item: any) => ({
        id: item.id,
        label: item.label,
        value: item.value,
    });

    /**
     * Returns a default empty DTI employment income response structure.
     * Provides an empty items array and initializes the total value to zero
     * when no employment income data is available.
     */
    transformDtiEIncomeEmpty = () => ({
        item: [],
        total: 0,
    });

    /**
     * Transforms a list of DTI employment income entities into a structured response.
     * Maps each income item into a simplified representation and computes the total income
     * by aggregating the value field across all items.
     */
    transformDtiEIncome = (items: DtiEIncomeEntity[]) => ({
        item: items.map((item) => this.transformData(item)),
        total: items.reduce((sum, item) => sum + item.value, 0),
    });

    /**
     * Transforms a DTI card entity into a simplified representation.
     * Extracts and returns only the essential card fields such as id, last4 digits, brand, and amount.
     */
    transformDtiCard = (item: DtiCardEntity) => ({
        id: item.id,
        last4: item.last4,
        brand: item.brand,
        amount: item.amount,
    });

    /**
     * Transforms a list of DTI card entities into a structured response.
     * Maps each card into a simplified representation and computes the total amount
     * by aggregating the amount field across all cards.
     */
    transformDtiCards = (items: DtiCardEntity[]) => ({
        item: items.map((item) => this.transformDtiCard(item)),
        total: items.reduce((sum, item) => sum + item.amount, 0),
    });

    /**
     * Transforms a DTI calculator entity into a simplified representation.
     * Extracts and returns only the calculator identifier and description fields.
     */
    transformCalculatorDetails = (item: DtiCalculatorEntity) => ({
        id: item.id,
        description: item.description,
    });
}
