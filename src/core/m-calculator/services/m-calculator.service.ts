import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ErrorHandlerService } from '../../../common/response';
import { OtherUtils } from '../../../utils/services/tools';
import { MCalculatorRepository } from '../m-calculator.repository';
import { MCalculatorEquationsService } from './m-calculator-equations.service';
import {
    AmortizationBreakdownDto,
    AmortizationQueryDto,
    CalculateDownPaymentDto,
    CalculateDownPaymentPercentageDto,
    CreateMCalculatorDto,
    UpdateMCalculatorDto,
} from '../dto';
import { PreMCalculatorService } from './pre-m-calculator.service';
import { MCalculatorTypeEnum } from '../../../common/enum';
import { CurrentUserInterface } from '../../../interface';
import { UsersService } from '../../users/services';

@Injectable()
export class MCalculatorService {
    /**
     * Service responsible for handling mortgage calculator operation
     */

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) readonly logger: Logger,
        @Inject(forwardRef(() => MCalculatorEquationsService))
        readonly mCalculatorEquationsService: MCalculatorEquationsService,
        @Inject(forwardRef(() => PreMCalculatorService))
        readonly preMCalculatorService: PreMCalculatorService,
        private readonly userService: UsersService,
        readonly errorHandler: ErrorHandlerService,
        readonly otherUtils: OtherUtils,
        readonly mCalculatorRepo: MCalculatorRepository,
    ) {}

    /**
     * Determines the down payment amount based on the provided calculation data.
     * Delegates the computation to the equations service using purchase price
     * and an optional down payment percentage with a default fallback.
     */
    determineDownPaymentAmount = (dto: CalculateDownPaymentDto) =>
        this.mCalculatorEquationsService.calculateDownPayment(
            dto.purchasePrice,
            dto.downPaymentPercentage,
        );

    /**
     * Determines the down payment percentage based on the provided calculation data.
     * Delegates the computation to the equations service using purchase price
     * and the specified down payment amount.
     */
    determineDownPaymentPercentage = (dto: CalculateDownPaymentPercentageDto) =>
        this.mCalculatorEquationsService.calculateDownPaymentPercentage(
            dto.purchasePrice,
            dto.downPaymentAmount,
        );

    /**
     * Determines the loan amount based on the provided calculation data.
     * Delegates the computation to the equations service using purchase price
     * and the specified down payment amount.
     */
    determineLoanAmount = (dto: CalculateDownPaymentPercentageDto) =>
        this.mCalculatorEquationsService.calculateLoanAmount(
            dto.purchasePrice,
            dto.downPaymentAmount,
        );

    /**
     * Calculates principal and interest payments for a mortgage scenario.
     * Validates calculator mode constraints, derives the loan amount,
     * and delegates the computation using interest rate and loan term parameters.
     */
    determinePInterest(dto: CreateMCalculatorDto) {
        this.preMCalculatorService.assertCalculatorModeConstraints(dto);
        const loanAmount = this.determineLoanAmount(dto);
        return this.mCalculatorEquationsService.calculatePInterest(
            loanAmount,
            dto.interestRate,
            dto.loanTerm,
        );
    }

    /**
     * Calculates the PMI (Private Mortgage Insurance) amount for a mortgage scenario.
     * Derives the loan amount, resolves the PMI rate based on credit score,
     * and delegates the computation using the down payment percentage.
     */
    determinePMI = (dto: CreateMCalculatorDto) =>
        this.mCalculatorEquationsService.calculatePMI(
            this.determineLoanAmount(dto),
            dto.downPaymentPercentage,
            this.mCalculatorEquationsService.getPMIRateByCreditScore(dto.creditScore),
        );

    /**
     * Computes the shared mortgage calculation core used by both basic and advanced breakdowns.
     * Derives loan amount, principal & interest, PMI, total monthly payment,
     * total PMI details, and total interest paid from the provided dto and pmiRate.
     */
    computeSharedMCalculatorCore(dto: CreateMCalculatorDto, pmiRate: number) {
        const loanAmount = this.determineLoanAmount(dto);
        const principalAndInterest = this.determinePInterest(dto);
        const pmi = this.determinePMI(dto);
        const totalMonthlyPayment = principalAndInterest + pmi;
        const { pmiMonths, pmiMonthly, totalPMI } =
            this.mCalculatorEquationsService.calculateTotalPMI(
                loanAmount,
                dto.purchasePrice,
                dto.interestRate,
                dto.loanTerm,
                pmiRate,
            );
        const totalInterestPaid = this.mCalculatorEquationsService.calculateTotalInterestPaid(
            principalAndInterest,
            dto.loanTerm,
            loanAmount,
        );

        return {
            loanAmount,
            principalAndInterest,
            pmi,
            totalMonthlyPayment,
            totalInterestPaid,
            totalPaid: loanAmount + totalInterestPaid,
            pmiMonths,
            pmiMonthly,
            totalPMI,
        };
    }

    /**
     * Computes the full mortgage breakdown for the basic calculator mode.
     * Uses a fixed default PMI rate and excludes taxes, insurance, and credit score fields.
     */
    basicMCalculatorBreakdown(dto: CreateMCalculatorDto) {
        this.preMCalculatorService.assertCalculatorModeConstraints(dto);
        return this.computeSharedMCalculatorCore(dto, 0.006);
    }

    /**
     * Computes the full mortgage breakdown for the advanced calculator mode.
     * Determines PMI rate from the user's credit score and includes monthly
     * property tax and home insurance derived from the annual values provided.
     */
    advancedMCalculatorBreakdown(dto: CreateMCalculatorDto) {
        this.preMCalculatorService.assertCalculatorModeConstraints(dto);
        const pmiRate = this.mCalculatorEquationsService.getPMIRateByCreditScore(dto.creditScore);
        const core = this.computeSharedMCalculatorCore(dto, pmiRate);

        return {
            ...core,
            pmiRate,
            monthlyPropertyTax: this.mCalculatorEquationsService.calculateMonthlyPropertyTax(
                dto.annualPropertyTaxes!,
            ),
            monthlyHomeInsurance: this.mCalculatorEquationsService.calculateMonthlyPropertyTax(
                dto.annualHomeInsurance!,
            ),
        };
    }

    /**
     * Determines the appropriate mortgage calculator breakdown based on calculator type.
     * Routes the request to either the basic or advanced breakdown computation logic.
     */
    getMCalculatorBreakdown(dto: CreateMCalculatorDto) {
        if (dto.typeEnum === MCalculatorTypeEnum.BASIC) return this.basicMCalculatorBreakdown(dto);
        return this.advancedMCalculatorBreakdown(dto);
    }

    /**
     * Generates the amortization schedule breakdown for a mortgage calculation.
     * Validates calculator mode constraints, derives the loan amount,
     * and computes the schedule using financial inputs including interest rate,
     * loan term, PMI rate, taxes, insurance, and loan start date.
     */
    calculatorAmortizationScheduleBreakdown(dto: AmortizationBreakdownDto) {
        this.preMCalculatorService.assertCalculatorModeConstraints(dto);
        const loanAmount = this.determineLoanAmount(dto);

        const extraPayment = this.preMCalculatorService.normalizeExtraPaymentToMonthly(
            dto.extraPayment ?? 0,
            dto.frequency,
        );

        return this.mCalculatorEquationsService.calculateAmortizationSchedule({
            loanAmount,
            homeValue: dto.purchasePrice,
            interestRate: dto.interestRate,
            loanTerm: dto.loanTerm,
            pmiRate: this.mCalculatorEquationsService.getPMIRateByCreditScore(dto.creditScore),
            taxesMonthly: dto.annualPropertyTaxes ? dto.annualPropertyTaxes / 12 : undefined,
            insuranceMonthly: dto.annualHomeInsurance ? dto.annualHomeInsurance / 12 : undefined,
            startDate: dto.loanStartDate ? new Date(dto.loanStartDate) : undefined,
            extraPayment,
        });
    }

    /**
     * Retrieves the mortgage calculator associated with the given user.
     * Fetches the calculator entity based on the user's ownership criteria
     * and returns the result.
     */
    async mCalculatorDetails(user: CurrentUserInterface) {
        this.logger.info(`Get mortgage calculator details for user ${user.id}`);
        return await this.preMCalculatorService.retrieveMCalculatorByCriteria({
            createdBy: { id: user.id },
        });
    }

    /**
     * Retrieves the mortgage calculator breakdown from a saved user calculator.
     * Logs the operation, fetches the calculator based on user ownership,
     * maps the entity to a DTO, and delegates the breakdown computation.
     */
    async getMCalculatorBreakdownFromSaved(user: CurrentUserInterface) {
        this.logger.info(`Get breakdown from saved calculator for user ${user.id}`);
        const calculator = await this.preMCalculatorService.retrieveMCalculatorByCriteria({
            createdBy: { id: user.id },
        });
        const dto = this.preMCalculatorService.mapEntityToDto(calculator);
        return this.getMCalculatorBreakdown(dto);
    }

    /**
     * Generates an amortization schedule breakdown from a saved mortgage calculator.
     * Retrieves the user's calculator, maps it to a DTO, normalizes extra payments,
     * and computes the amortization schedule using stored data and query parameters.
     */
    async getAmortizationBreakdownFromSaved(
        user: CurrentUserInterface,
        query: AmortizationQueryDto,
    ) {
        const calculator = await this.preMCalculatorService.retrieveMCalculatorByCriteria({
            createdBy: { id: user.id },
        });
        const dto = this.preMCalculatorService.mapEntityToDto(calculator);
        const extraPayment = this.preMCalculatorService.normalizeExtraPaymentToMonthly(
            query.extraPayment ?? 0,
            query.frequency,
        );

        return this.mCalculatorEquationsService.calculateAmortizationSchedule({
            loanAmount: this.determineLoanAmount(dto),
            homeValue: dto.purchasePrice,
            interestRate: dto.interestRate,
            loanTerm: dto.loanTerm,
            pmiRate: this.mCalculatorEquationsService.getPMIRateByCreditScore(dto.creditScore),
            taxesMonthly: dto.annualPropertyTaxes ? dto.annualPropertyTaxes / 12 : undefined,
            insuranceMonthly: dto.annualHomeInsurance ? dto.annualHomeInsurance / 12 : undefined,
            startDate: dto.loanStartDate ? new Date(dto.loanStartDate) : undefined,
            extraPayment,
        });
    }

    /**
     * Creates a mortgage calculator for the given user and input data.
     * Logs the operation, retrieves the user entity, and delegates
     * the calculator creation to the pre-service layer.
     */
    async createMCalculator(user: CurrentUserInterface, dto: CreateMCalculatorDto) {
        this.logger.info(`Create the mortgage calculator for user ${user.id}`);

        const createdBy = await this.userService.preUserService.retrieveUserByCriteria({
            id: user.id,
        });
        return await this.preMCalculatorService.createMCalculator(createdBy, dto);
    }

    /**
     * Updates the mortgage calculator for the given user.
     * Logs the operation, retrieves the calculator based on user ownership,
     * delegates the update with recalculation logic to the pre-service layer,
     * and returns a success message upon completion.
     */
    async updateMCalculator(user: CurrentUserInterface, dto: UpdateMCalculatorDto) {
        this.logger.info(`Update the mortgage calculator for user ${user.id}`);

        const calculator = await this.preMCalculatorService.retrieveMCalculatorByCriteria({
            createdBy: { id: user.id },
        });

        await this.preMCalculatorService.updateMCalculatorWithRecalculation(calculator, dto);
        return { message: 'Calculator updated successfully.' };
    }
}
