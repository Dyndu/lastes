import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ErrorHandlerService } from '../../../common/response';
import { OtherUtils } from '../../../utils/services/tools';
import {
    DtiCalculatorRepository,
    DtiCardRepository,
    DtiEIncomeRepository,
    DtiOtherDebtsRepository,
    DtiOtherIncomeRepository,
    DtiPropertyRepository,
} from '../repositories';
import { EnvConfigService } from '../../../utils/services/config';
import { DtiPropertyService } from './dti-property.service';
import { DtiEIncomeService } from './dti-e-income.service';
import { DtiOtherIncomeService } from './dti-other-income.service';
import { DtiOtherDebtsService } from './dti-other-debts.service';
import { TransformDtiService } from './transform-dti.service';
import { UsersService } from '../../users/services';
import { PreDtiCalculatorService } from './pre-dti-calculator.service';
import { CurrentUserInterface } from '../../../interface';
import {
    CreateDtiCardDto,
    CreateDtiEmploymentIncomeDto,
    CreateDtiOtherDebtDto,
    CreateDtiOtherIncomeDto,
    CreateDtiPropertyDto,
    UpdateDtiCardDto,
    UpdateDtiEmploymentIncomeDto,
    UpdateDtiOtherDebtDto,
    UpdateDtiOtherIncomeDto,
    UpdateDtiPropertyDto,
} from '../dto';
import { DtiCardService } from './dti-card.service';

@Injectable()
export class DtiCalculatorService {
    /**
     * Service responsible for handling dti calculator operations
     */

    readonly cardSecret: string;

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        @Inject(forwardRef(() => DtiPropertyService))
        private readonly dtiPropertyService: DtiPropertyService,
        @Inject(forwardRef(() => DtiEIncomeService))
        private readonly dtiEIncomeService: DtiEIncomeService,
        @Inject(forwardRef(() => DtiOtherIncomeService))
        private readonly dtiOtherIncomeService: DtiOtherIncomeService,
        @Inject(forwardRef(() => DtiOtherDebtsService))
        private readonly dtiOtherDebtsService: DtiOtherDebtsService,
        @Inject(forwardRef(() => DtiCardService))
        private readonly dtiCardService: DtiCardService,
        @Inject(forwardRef(() => PreDtiCalculatorService))
        readonly preDtiCalculatorService: PreDtiCalculatorService,
        @Inject(forwardRef(() => TransformDtiService))
        private readonly transformDtiService: TransformDtiService,
        readonly userService: UsersService,
        private readonly envConfigService: EnvConfigService,
        readonly errorHandler: ErrorHandlerService,
        readonly otherUtils: OtherUtils,
        readonly dtiCalculatorRepo: DtiCalculatorRepository,
        readonly dtiPropertyRepo: DtiPropertyRepository,
        readonly dtiEIncomeRepo: DtiEIncomeRepository,
        readonly dtiOtherIncomeRepo: DtiOtherIncomeRepository,
        readonly dtiOtherDebtsRepo: DtiOtherDebtsRepository,
        readonly dtiCardRepo: DtiCardRepository,
    ) {
        this.cardSecret = this.envConfigService.cardSecret;
    }

    /**
     * Initializes or retrieves the DTI calculator for the given user and returns a computed summary.
     * Ensures the calculator is created or launched, then fetches a detailed breakdown using predefined relations.
     * Finally computes and returns frontend and backend DTI metrics based on the retrieved calculator data.
     */
    async calculatorSummary(user: CurrentUserInterface) {
        this.logger.info(
            `Initialize and or break down dti calculator for user with id: ${user.id}`,
        );

        const calculator = await this.preDtiCalculatorService.lunchDti(user);
        const data = await this.preDtiCalculatorService.retrieveDtiCalculatorByCriteria(
            { id: calculator.id },
            this.transformDtiService.calculatorBreakdown(),
        );

        return this.preDtiCalculatorService.calculateFrontendDti(data);
    }

    /**
     * Retrieves the DTI calculator associated with the given user.
     * Fetches the calculator entity based on the user's ownership criteria,
     * and transforms the result into a detailed response format before returning it.
     */
    async calculatorDetails(user: CurrentUserInterface) {
        this.logger.info(`Retrieve dti calculator details for user with id ${user.id}`);

        const calculator = await this.preDtiCalculatorService.retrieveDtiCalculatorByCriteria({
            createdBy: { id: user.id },
        });

        return this.transformDtiService.transformCalculatorDetails(calculator);
    }

    /**
     * Retrieves the DTI properties income data for a given user.
     * Logs the operation, initializes or retrieves the user’s calculator,
     * fetches all non-deleted properties linked to it, and returns either an empty
     * transformation or a mapped list of property data.
     */
    async getDtiPropertiesIncome(user: CurrentUserInterface) {
        this.logger.info(`Get dti calculator properties for user with id: ${user.id}`);
        const calculator = await this.preDtiCalculatorService.lunchDti(user);

        const properties = await this.dtiPropertyRepo.find({
            where: { calculator: { id: calculator.id }, deleted: false },
        });

        return properties.length === 0
            ? this.transformDtiService.transformDtiEIncomeEmpty()
            : this.transformDtiService.transformDtiProperties(properties);
    }

    /**
     * Retrieves the DTI properties mortgage data for a given user.
     * Logs the operation, initializes or retrieves the user’s calculator,
     * fetches all non-deleted properties linked to it, and returns either an empty
     * transformation or a mapped list of mortgage-specific property data.
     */
    async getDtiPropertiesMortgages(user: CurrentUserInterface) {
        this.logger.info(`Get dti calculator properties mortgages for user with id: ${user.id}`);
        const calculator = await this.preDtiCalculatorService.lunchDti(user);

        const properties = await this.dtiPropertyRepo.find({
            where: { calculator: { id: calculator.id }, deleted: false },
        });

        return properties.length === 0
            ? this.transformDtiService.transformDtiEIncomeEmpty()
            : this.transformDtiService.transformDriPropertiesMortgages(properties);
    }

    /**
     * Retrieves the DTI employment income data for a given user.
     * Logs the operation, initializes or retrieves the user’s calculator,
     * fetches all non-deleted employment income records linked to it, and returns
     * either an empty transformation or a mapped list of income data.
     */
    async getDtiEIncome(user: CurrentUserInterface) {
        this.logger.info(`Get dti EIncome for user with id: ${user.id}`);
        const calculator = await this.preDtiCalculatorService.lunchDti(user);

        const eIncome = await this.dtiEIncomeRepo.find({
            where: { calculator: { id: calculator.id }, deleted: false },
        });

        return eIncome.length === 0
            ? this.transformDtiService.transformDtiEIncomeEmpty()
            : this.transformDtiService.transformDtiEIncome(eIncome);
    }

    /**
     * Retrieves the DTI other income data for a given user.
     * Logs the operation, initializes or retrieves the user’s calculator,
     * fetches all non-deleted other income records linked to it, and returns
     * either an empty transformation or a mapped list of income data.
     */
    async getDtiOIncome(user: CurrentUserInterface) {
        this.logger.info(`Get dti OIncome for user with id: ${user.id}`);
        const calculator = await this.preDtiCalculatorService.lunchDti(user);

        const oIncome = await this.dtiOtherIncomeRepo.find({
            where: { calculator: { id: calculator.id }, deleted: false },
        });

        return oIncome.length === 0
            ? this.transformDtiService.transformDtiEIncomeEmpty()
            : this.transformDtiService.transformDtiEIncome(oIncome);
    }

    /**
     * Retrieves the DTI card data for a given user.
     * Logs the operation, initializes or retrieves the user’s calculator,
     * fetches all non-deleted card records linked to it, and returns
     * either an empty transformation or a mapped list of card data.
     */
    async getDtiCards(user: CurrentUserInterface) {
        this.logger.info(`Get dti cards for user with id: ${user.id}`);
        const calculator = await this.preDtiCalculatorService.lunchDti(user);

        const cards = await this.dtiCardRepo.find({
            where: { calculator: { id: calculator.id }, deleted: false },
        });

        return cards.length === 0
            ? this.transformDtiService.transformDtiEIncomeEmpty()
            : this.transformDtiService.transformDtiCards(cards);
    }

    /**
     * Retrieves the DTI other debts data for a given user.
     * Logs the operation, initializes or retrieves the user’s calculator,
     * fetches all non-deleted other debts records linked to it, and returns
     * either an empty transformation or a mapped list of debt data.
     */
    async getDtiODebts(user: CurrentUserInterface) {
        this.logger.info(`Get dti other debts for user with id: ${user.id}`);
        const calculator = await this.preDtiCalculatorService.lunchDti(user);

        const oDebts = await this.dtiOtherDebtsRepo.find({
            where: { calculator: { id: calculator.id }, deleted: false },
        });

        return oDebts.length === 0
            ? this.transformDtiService.transformDtiEIncomeEmpty()
            : this.transformDtiService.transformDtiEIncome(oDebts);
    }

    /**
     * Computes the total gross monthly income for a given user.
     * Logs the operation, initializes or retrieves the user’s calculator,
     * fetches calculator details with required relations, and returns
     * the aggregated gross monthly income using the transformation service.
     */
    async grosslyMonth(user: CurrentUserInterface) {
        this.logger.info(`Get grossly month for user with id: ${user.id}`);
        const calculator = await this.preDtiCalculatorService.lunchDti(user);

        const details = await this.preDtiCalculatorService.retrieveDtiCalculatorByCriteria(
            { id: calculator.id },
            this.transformDtiService.grosslyMonthEntities(),
        );

        return this.preDtiCalculatorService.calculateGrosslyMonth(details);
    }

    /**
     * Updates the DTI calculator associated with the given user.
     * Retrieves the calculator entity based on the user's ownership,
     * applies the provided description update through the pre-service layer,
     * and returns a success message upon completion.
     */
    async updateCalculator(user: CurrentUserInterface, description?: string) {
        this.logger.info(`Update dti calculator for user with id: ${user.id}`);

        const calculator = await this.preDtiCalculatorService.retrieveDtiCalculatorByCriteria({
            createdBy: { id: user.id },
        });

        await this.preDtiCalculatorService.updateCalculator(calculator, { description });

        return { message: 'Calculator updated successfully.' };
    }

    /**
     * Creates a new property for a given user.
     * Logs the operation, initializes or retrieves the user’s calculator,
     * delegates property creation to the property service, and returns a success message.
     */
    async createPropertyDetails(user: CurrentUserInterface, dto: CreateDtiPropertyDto) {
        this.logger.info(`Create a new property for user with id: ${user.id}`);

        const calculator = await this.preDtiCalculatorService.lunchDti(user);
        await this.dtiPropertyService.createDtiProperty(calculator, dto);

        return { message: 'Property created successfully.' };
    }

    /**
     * Updates an existing DTI property record by id using the provided DTO.
     * Logs the operation, delegates the update logic to the property service,
     * and returns a success confirmation message.
     */
    async updateDtiPropertyDetails(id: string, dto: UpdateDtiPropertyDto) {
        this.logger.info(`Update a property for user with id: ${id}`);

        await this.dtiPropertyService.updateDtiProperty(id, dto);
        return { message: 'Property updated successfully.' };
    }

    /**
     * Deletes an existing DTI property record by id.
     * Logs the operation, delegates deletion to the property service,
     * and returns a success confirmation message.
     */
    async deleteDtiPropertyDetails(id: string) {
        this.logger.info(`Delete a property for user with id: ${id}`);

        await this.dtiPropertyService.deleteDtiProperty(id);
        return { message: 'Property deleted successfully.' };
    }

    /**
     * Creates a new employment income record for a user's DTI calculator.
     * Logs the operation, initializes or retrieves the user’s calculator,
     * delegates the creation of the employment income entity to the service,
     * and returns a success confirmation message.
     */
    async addEmploymentIncome(user: CurrentUserInterface, dto: CreateDtiEmploymentIncomeDto) {
        this.logger.info(
            `Create a new employment income for dti calculator for user with id: ${user.id}`,
        );

        const calculator = await this.preDtiCalculatorService.lunchDti(user);
        await this.dtiEIncomeService.createEIncomeEntity(calculator, dto);

        return { message: 'Dti employment income created successfully.' };
    }

    /**
     * Updates an existing employment income record for a DTI calculator.
     * Logs the operation, delegates the update logic to the employment income service,
     * and returns a success confirmation message.
     */
    async updateEmploymentIncome(id: string, dto: UpdateDtiEmploymentIncomeDto) {
        this.logger.info(
            `Update a new employment income for dti calculator for user with id: ${id}`,
        );

        await this.dtiEIncomeService.updateEIncome(id, dto);
        return { message: 'Dti employment income updated successfully.' };
    }

    /**
     * Deletes an existing employment income record for a DTI calculator.
     * Logs the operation, delegates deletion to the employment income service,
     * and returns a success confirmation message.
     */
    async deleteEmploymentIncome(id: string) {
        this.logger.info(
            `Delete a new employment income for dti calculator for user with id: ${id}`,
        );

        await this.dtiEIncomeService.deleteEIncome(id);
        return { message: 'Dti employment income deleted successfully.' };
    }

    /**
     * Creates a new other income record for a user's DTI calculator.
     * Logs the operation, initializes or retrieves the user’s calculator,
     * delegates creation of the other income entity to the service,
     * and returns a success confirmation message.
     */
    async addOtherIncome(user: CurrentUserInterface, dto: CreateDtiOtherIncomeDto) {
        this.logger.info(`Create a new other income for user with id: ${user.id}`);

        const calculator = await this.preDtiCalculatorService.lunchDti(user);
        await this.dtiOtherIncomeService.createOIncomeEntity(calculator, dto);

        return { message: 'Dti employment income updated successfully.' };
    }

    /**
     * Updates an existing other income record for a DTI calculator.
     * Logs the operation, delegates the update logic to the other income service,
     * and returns a success confirmation message.
     */
    async updateOtherIncome(id: string, dto: UpdateDtiOtherIncomeDto) {
        this.logger.info(`Update a new other income for user with id: ${id}`);

        await this.dtiOtherIncomeService.updateOIncome(id, dto);
        return { message: 'Dti other income updated successfully.' };
    }

    /**
     * Deletes an existing other income record for a DTI calculator.
     * Logs the operation, delegates deletion to the other income service,
     * and returns a success confirmation message.
     */
    async deleteOtherIncome(id: string) {
        this.logger.info(`Delete a new other income for user with id: ${id}`);

        await this.dtiOtherIncomeService.deleteOIncome(id);
        return { message: 'Dti other income deleted successfully.' };
    }

    /**
     * Creates a new other debt record for a user's DTI calculator.
     * Logs the operation, initializes or retrieves the user’s calculator,
     * delegates creation of the other debt entity to the service,
     * and returns a success confirmation message.
     */
    async addOtherDebt(user: CurrentUserInterface, dto: CreateDtiOtherDebtDto) {
        this.logger.info(`Create a new other debt for user with id: ${user.id}`);

        const calculator = await this.preDtiCalculatorService.lunchDti(user);
        await this.dtiOtherDebtsService.createODebtEntity(calculator, dto);

        return { message: 'Dti other debt updated successfully.' };
    }

    /**
     * Updates an existing other debt record for a DTI calculator.
     * Logs the operation, delegates the update logic to the other debts service,
     * and returns a success confirmation message.
     */
    async updateOtherDebt(id: string, dto: UpdateDtiOtherDebtDto) {
        this.logger.info(`Update a new other debt for user with id: ${id}`);

        await this.dtiOtherDebtsService.updateODebt(id, dto);
        return { message: 'Dti other debt updated successfully.' };
    }

    /**
     * Deletes an existing other debt record for a DTI calculator.
     * Logs the operation, delegates deletion to the other debts service,
     * and returns a success confirmation message.
     */
    async deleteOtherDebt(id: string) {
        this.logger.info(`Delete a new other debt for user with id: ${id}`);

        await this.dtiOtherDebtsService.deleteODebt(id);
        return { message: 'Dti other debt deleted successfully.' };
    }

    /**
     * Creates a new credit card record for a user's DTI calculator.
     * Logs the operation, initializes or retrieves the user’s calculator,
     * delegates credit card creation to the card service using provided details,
     * and returns a success confirmation message.
     */
    async createDtiCreditsCard(user: CurrentUserInterface, dto: CreateDtiCardDto) {
        this.logger.info(`Create a new credit card for user with id: ${user.id}`);

        const calculator = await this.preDtiCalculatorService.lunchDti(user);
        await this.dtiCardService.createDtiCard(calculator, dto.code, dto.expiry, dto.amount);

        return { message: 'Dti credit card successfully.' };
    }

    /**
     * Updates an existing credit card record for a DTI calculator.
     * Logs the operation, delegates the update logic to the card service,
     * and returns a success confirmation message.
     */
    async updateDtiCreditCard(id: string, dto: UpdateDtiCardDto) {
        this.logger.info(`Update a new credit card for user with id: ${id}`);

        await this.dtiCardService.updateCard(id, dto);
        return { message: 'Dti credit card successfully.' };
    }

    /**
     * Deletes an existing credit card record for a DTI calculator.
     * Logs the operation, delegates deletion to the card service,
     * and returns a success confirmation message.
     */
    async deleteDtiCreditCard(id: string) {
        this.logger.info(`Delete a new credit card for user with id: ${id}`);

        await this.dtiCardService.deleteCardEntity(id);
        return { message: 'Dti credit card successfully.' };
    }
}
