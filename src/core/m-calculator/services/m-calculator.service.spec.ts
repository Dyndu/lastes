import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { MCalculatorService } from './m-calculator.service';
import { MCalculatorEquationsService } from './m-calculator-equations.service';
import { PreMCalculatorService } from './pre-m-calculator.service';
import { UsersService } from '../../users/services';
import { ErrorHandlerService } from '../../../common/response';
import { OtherUtils } from '../../../utils/services/tools';
import { MCalculatorRepository } from '../m-calculator.repository';
import { MCalculatorTypeEnum, CreditScoreEnum } from '../../../common/enum';
import {
    AmortizationQueryDto,
    CalculateDownPaymentDto,
    CalculateDownPaymentPercentageDto,
    CreateMCalculatorDto,
    UpdateMCalculatorDto,
} from '../dto';
import { CurrentUserInterface } from '../../../interface';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };

const mockEquationsService = {
    calculateDownPayment: jest.fn(),
    calculateDownPaymentPercentage: jest.fn(),
    calculateLoanAmount: jest.fn(),
    calculatePInterest: jest.fn(),
    calculatePMI: jest.fn(),
    getPMIRateByCreditScore: jest.fn(),
    calculateTotalPMI: jest.fn(),
    calculateTotalInterestPaid: jest.fn(),
    calculateAmortizationSchedule: jest.fn(),
    calculateMonthlyPropertyTax: jest.fn(),
};

const mockPreMCalculatorService = {
    assertCalculatorModeConstraints: jest.fn(),
    retrieveMCalculatorByCriteria: jest.fn(),
    mapEntityToDto: jest.fn(),
    createMCalculator: jest.fn(),
    updateMCalculatorWithRecalculation: jest.fn(),
    normalizeExtraPaymentToMonthly: jest.fn(),
};

const mockUserService = {
    preUserService: {
        retrieveUserByCriteria: jest.fn(),
    },
};

const mockErrorHandler = {};
const mockOtherUtils = {};
const mockRepo = {};

const currentUser: CurrentUserInterface = {
    id: 'user-123',
    role: 'USER',
    sessionId: 'session-abc',
    permissions: {},
};

const basicDto: CreateMCalculatorDto = {
    purchasePrice: 400_000,
    downPaymentAmount: 80_000,
    downPaymentPercentage: 20,
    interestRate: 5,
    loanTerm: 30,
    typeEnum: MCalculatorTypeEnum.BASIC,
};

const advancedDto: CreateMCalculatorDto = {
    ...basicDto,
    typeEnum: MCalculatorTypeEnum.ADVANCED,
    annualPropertyTaxes: 4_800,
    annualHomeInsurance: 1_200,
    loanStartDate: '2024-01-01T00:00:00.000Z',
    creditScore: CreditScoreEnum.EXCELLENT,
};

describe('MCalculatorService', () => {
    let service: MCalculatorService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MCalculatorService,
                { provide: WINSTON_MODULE_PROVIDER, useValue: mockLogger },
                { provide: MCalculatorEquationsService, useValue: mockEquationsService },
                { provide: PreMCalculatorService, useValue: mockPreMCalculatorService },
                { provide: UsersService, useValue: mockUserService },
                { provide: ErrorHandlerService, useValue: mockErrorHandler },
                { provide: OtherUtils, useValue: mockOtherUtils },
                { provide: MCalculatorRepository, useValue: mockRepo },
            ],
        }).compile();

        service = module.get<MCalculatorService>(MCalculatorService);
    });

    describe('determineDownPaymentAmount', () => {
        it('should delegate to calculateDownPayment with correct args', () => {
            const dto: CalculateDownPaymentDto = {
                purchasePrice: 300_000,
                downPaymentPercentage: 10,
            };
            mockEquationsService.calculateDownPayment.mockReturnValue(30_000);

            const result = service.determineDownPaymentAmount(dto);

            expect(mockEquationsService.calculateDownPayment).toHaveBeenCalledWith(
                dto.purchasePrice,
                dto.downPaymentPercentage,
            );
            expect(result).toBe(30_000);
        });
    });

    describe('determineDownPaymentPercentage', () => {
        it('should delegate to calculateDownPaymentPercentage with correct args', () => {
            const dto: CalculateDownPaymentPercentageDto = {
                purchasePrice: 300_000,
                downPaymentAmount: 60_000,
            };
            mockEquationsService.calculateDownPaymentPercentage.mockReturnValue(20);

            const result = service.determineDownPaymentPercentage(dto);

            expect(mockEquationsService.calculateDownPaymentPercentage).toHaveBeenCalledWith(
                dto.purchasePrice,
                dto.downPaymentAmount,
            );
            expect(result).toBe(20);
        });
    });

    describe('determineLoanAmount', () => {
        it('should delegate to calculateLoanAmount with correct args', () => {
            const dto: CalculateDownPaymentPercentageDto = {
                purchasePrice: 400_000,
                downPaymentAmount: 80_000,
            };
            mockEquationsService.calculateLoanAmount.mockReturnValue(320_000);

            const result = service.determineLoanAmount(dto);

            expect(mockEquationsService.calculateLoanAmount).toHaveBeenCalledWith(
                dto.purchasePrice,
                dto.downPaymentAmount,
            );
            expect(result).toBe(320_000);
        });
    });

    describe('determinePInterest', () => {
        it('should assert constraints and delegate to calculatePInterest', () => {
            mockEquationsService.calculateLoanAmount.mockReturnValue(320_000);
            mockEquationsService.calculatePInterest.mockReturnValue(1_717);

            const result = service.determinePInterest(basicDto);

            expect(mockPreMCalculatorService.assertCalculatorModeConstraints).toHaveBeenCalledWith(
                basicDto,
            );
            expect(mockEquationsService.calculatePInterest).toHaveBeenCalledWith(
                320_000,
                basicDto.interestRate,
                basicDto.loanTerm,
            );
            expect(result).toBe(1_717);
        });
    });

    describe('determinePMI', () => {
        it('should compute PMI using loan amount, down payment %, and PMI rate by credit score', () => {
            mockEquationsService.calculateLoanAmount.mockReturnValue(320_000);
            mockEquationsService.getPMIRateByCreditScore.mockReturnValue(0.005);
            mockEquationsService.calculatePMI.mockReturnValue(133);

            const result = service.determinePMI(basicDto);

            expect(mockEquationsService.getPMIRateByCreditScore).toHaveBeenCalledWith(
                basicDto.creditScore,
            );
            expect(mockEquationsService.calculatePMI).toHaveBeenCalledWith(
                320_000,
                basicDto.downPaymentPercentage,
                0.005,
            );
            expect(result).toBe(133);
        });
    });

    describe('computeSharedMCalculatorCore', () => {
        it('should aggregate all shared calculation components', () => {
            mockEquationsService.calculateLoanAmount.mockReturnValue(320_000);
            mockEquationsService.calculatePInterest.mockReturnValue(1_717);
            mockEquationsService.getPMIRateByCreditScore.mockReturnValue(0.006);
            mockEquationsService.calculatePMI.mockReturnValue(133);
            mockEquationsService.calculateTotalPMI.mockReturnValue({
                pmiMonths: 84,
                pmiMonthly: 133,
                totalPMI: 11_172,
            });
            mockEquationsService.calculateTotalInterestPaid.mockReturnValue(298_000);

            const result = service.computeSharedMCalculatorCore(basicDto, 0.006);

            expect(result).toEqual({
                loanAmount: 320_000,
                principalAndInterest: 1_717,
                pmi: 133,
                totalMonthlyPayment: 1_717 + 133,
                totalInterestPaid: 298_000,
                totalPaid: 320_000 + 298_000,
                pmiMonths: 84,
                pmiMonthly: 133,
                totalPMI: 11_172,
            });
        });
    });

    describe('basicMCalculatorBreakdown', () => {
        it('should assert constraints and call computeSharedMCalculatorCore with 0.006 PMI rate', () => {
            mockEquationsService.calculateLoanAmount.mockReturnValue(320_000);
            mockEquationsService.calculatePInterest.mockReturnValue(1_717);
            mockEquationsService.getPMIRateByCreditScore.mockReturnValue(0.006);
            mockEquationsService.calculatePMI.mockReturnValue(133);
            mockEquationsService.calculateTotalPMI.mockReturnValue({
                pmiMonths: 84,
                pmiMonthly: 133,
                totalPMI: 11_172,
            });
            mockEquationsService.calculateTotalInterestPaid.mockReturnValue(298_000);

            const result = service.basicMCalculatorBreakdown(basicDto);

            expect(mockPreMCalculatorService.assertCalculatorModeConstraints).toHaveBeenCalledWith(
                basicDto,
            );
            expect(mockEquationsService.calculateTotalPMI).toHaveBeenCalledWith(
                320_000,
                basicDto.purchasePrice,
                basicDto.interestRate,
                basicDto.loanTerm,
                0.006,
            );
            expect(result.loanAmount).toBe(320_000);
        });
    });

    describe('advancedMCalculatorBreakdown', () => {
        it('should include pmiRate, monthlyPropertyTax and monthlyHomeInsurance', () => {
            mockEquationsService.calculateLoanAmount.mockReturnValue(320_000);
            mockEquationsService.calculatePInterest.mockReturnValue(1_717);
            mockEquationsService.getPMIRateByCreditScore.mockReturnValue(0.004);
            mockEquationsService.calculatePMI.mockReturnValue(106);
            mockEquationsService.calculateTotalPMI.mockReturnValue({
                pmiMonths: 72,
                pmiMonthly: 106,
                totalPMI: 7_632,
            });
            mockEquationsService.calculateTotalInterestPaid.mockReturnValue(298_000);
            mockEquationsService.calculateMonthlyPropertyTax
                .mockReturnValueOnce(400)
                .mockReturnValueOnce(100);

            const result = service.advancedMCalculatorBreakdown(advancedDto);

            expect(mockPreMCalculatorService.assertCalculatorModeConstraints).toHaveBeenCalledWith(
                advancedDto,
            );
            expect(mockEquationsService.getPMIRateByCreditScore).toHaveBeenCalledWith(
                advancedDto.creditScore,
            );
            expect(mockEquationsService.calculateMonthlyPropertyTax).toHaveBeenNthCalledWith(
                1,
                advancedDto.annualPropertyTaxes,
            );
            expect(mockEquationsService.calculateMonthlyPropertyTax).toHaveBeenNthCalledWith(
                2,
                advancedDto.annualHomeInsurance,
            );
            expect(result).toMatchObject({
                pmiRate: 0.004,
                monthlyPropertyTax: 400,
                monthlyHomeInsurance: 100,
            });
        });
    });

    describe('getMCalculatorBreakdown', () => {
        it('should call basicMCalculatorBreakdown when typeEnum is BASIC', () => {
            const spy = jest
                .spyOn(service, 'basicMCalculatorBreakdown')
                .mockReturnValue({ loanAmount: 320_000 } as any);

            service.getMCalculatorBreakdown(basicDto);

            expect(spy).toHaveBeenCalledWith(basicDto);
        });

        it('should call advancedMCalculatorBreakdown when typeEnum is ADVANCED', () => {
            const spy = jest
                .spyOn(service, 'advancedMCalculatorBreakdown')
                .mockReturnValue({ loanAmount: 320_000 } as any);

            service.getMCalculatorBreakdown(advancedDto);

            expect(spy).toHaveBeenCalledWith(advancedDto);
        });
    });

    describe('calculatorAmortizationScheduleBreakdown', () => {
        it('should assert constraints, derive loan amount, and return amortization schedule', () => {
            mockEquationsService.calculateLoanAmount.mockReturnValue(320_000);
            mockEquationsService.getPMIRateByCreditScore.mockReturnValue(0.004);
            mockEquationsService.calculateAmortizationSchedule.mockReturnValue([{ month: 1 }]);

            const result = service.calculatorAmortizationScheduleBreakdown(advancedDto);

            expect(mockPreMCalculatorService.assertCalculatorModeConstraints).toHaveBeenCalledWith(
                advancedDto,
            );
            expect(mockEquationsService.calculateAmortizationSchedule).toHaveBeenCalledWith({
                loanAmount: 320_000,
                homeValue: advancedDto.purchasePrice,
                interestRate: advancedDto.interestRate,
                loanTerm: advancedDto.loanTerm,
                pmiRate: 0.004,
                taxesMonthly: advancedDto.annualPropertyTaxes! / 12,
                insuranceMonthly: advancedDto.annualHomeInsurance! / 12,
                startDate: new Date(advancedDto.loanStartDate!),
            });
            expect(result).toEqual([{ month: 1 }]);
        });

        it('should pass undefined for taxesMonthly/insuranceMonthly when not provided', () => {
            mockEquationsService.calculateLoanAmount.mockReturnValue(320_000);
            mockEquationsService.getPMIRateByCreditScore.mockReturnValue(0.006);
            mockEquationsService.calculateAmortizationSchedule.mockReturnValue([]);

            service.calculatorAmortizationScheduleBreakdown(basicDto);

            expect(mockEquationsService.calculateAmortizationSchedule).toHaveBeenCalledWith(
                expect.objectContaining({
                    taxesMonthly: undefined,
                    insuranceMonthly: undefined,
                    startDate: undefined,
                }),
            );
        });
    });

    describe('mCalculatorDetails', () => {
        it('should log and return the calculator for the user', async () => {
            const calculator = { id: 'calc-1' };
            mockPreMCalculatorService.retrieveMCalculatorByCriteria.mockResolvedValue(calculator);

            const result = await service.mCalculatorDetails(currentUser);

            expect(mockLogger.info).toHaveBeenCalledWith(
                `Get mortgage calculator details for user ${currentUser.id}`,
            );
            expect(mockPreMCalculatorService.retrieveMCalculatorByCriteria).toHaveBeenCalledWith({
                createdBy: { id: currentUser.id },
            });
            expect(result).toBe(calculator);
        });
    });

    describe('getMCalculatorBreakdownFromSaved', () => {
        it('should retrieve, map to dto, and return breakdown', async () => {
            const calculator = { id: 'calc-1' };
            const dto = { ...basicDto };
            const breakdown = { loanAmount: 320_000 };

            mockPreMCalculatorService.retrieveMCalculatorByCriteria.mockResolvedValue(calculator);
            mockPreMCalculatorService.mapEntityToDto.mockReturnValue(dto);
            jest.spyOn(service, 'getMCalculatorBreakdown').mockReturnValue(breakdown as any);

            const result = await service.getMCalculatorBreakdownFromSaved(currentUser);

            expect(mockLogger.info).toHaveBeenCalledWith(
                `Get breakdown from saved calculator for user ${currentUser.id}`,
            );
            expect(mockPreMCalculatorService.mapEntityToDto).toHaveBeenCalledWith(calculator);
            expect(service.getMCalculatorBreakdown).toHaveBeenCalledWith(dto);
            expect(result).toBe(breakdown);
        });
    });

    describe('getAmortizationBreakdownFromSaved', () => {
        it('should compute amortization schedule with extra payment', async () => {
            const calculator = { id: 'calc-1' };
            const dto = { ...advancedDto };
            const query: AmortizationQueryDto = { extraPayment: 200, frequency: 'MONTHLY' as any };
            const schedule = [{ month: 1 }];

            mockPreMCalculatorService.retrieveMCalculatorByCriteria.mockResolvedValue(calculator);
            mockPreMCalculatorService.mapEntityToDto.mockReturnValue(dto);
            mockPreMCalculatorService.normalizeExtraPaymentToMonthly.mockReturnValue(200);
            mockEquationsService.calculateLoanAmount.mockReturnValue(320_000);
            mockEquationsService.getPMIRateByCreditScore.mockReturnValue(0.004);
            mockEquationsService.calculateAmortizationSchedule.mockReturnValue(schedule);

            const result = await service.getAmortizationBreakdownFromSaved(currentUser, query);

            expect(mockPreMCalculatorService.normalizeExtraPaymentToMonthly).toHaveBeenCalledWith(
                200,
                query.frequency,
            );
            expect(mockEquationsService.calculateAmortizationSchedule).toHaveBeenCalledWith(
                expect.objectContaining({
                    loanAmount: 320_000,
                    extraPayment: 200,
                }),
            );
            expect(result).toBe(schedule);
        });

        it('should default extraPayment to 0 when not provided in query', async () => {
            const calculator = { id: 'calc-1' };
            const dto = { ...basicDto };
            const query: AmortizationQueryDto = {} as any;

            mockPreMCalculatorService.retrieveMCalculatorByCriteria.mockResolvedValue(calculator);
            mockPreMCalculatorService.mapEntityToDto.mockReturnValue(dto);
            mockPreMCalculatorService.normalizeExtraPaymentToMonthly.mockReturnValue(0);
            mockEquationsService.calculateLoanAmount.mockReturnValue(320_000);
            mockEquationsService.getPMIRateByCreditScore.mockReturnValue(0.006);
            mockEquationsService.calculateAmortizationSchedule.mockReturnValue([]);

            await service.getAmortizationBreakdownFromSaved(currentUser, query);

            expect(mockPreMCalculatorService.normalizeExtraPaymentToMonthly).toHaveBeenCalledWith(
                0,
                undefined,
            );
        });
    });

    describe('createMCalculator', () => {
        it('should retrieve user entity and delegate to preMCalculatorService', async () => {
            const userEntity = { id: currentUser.id };
            const created = { id: 'calc-new' };

            mockUserService.preUserService.retrieveUserByCriteria.mockResolvedValue(userEntity);
            mockPreMCalculatorService.createMCalculator.mockResolvedValue(created);

            const result = await service.createMCalculator(currentUser, basicDto);

            expect(mockLogger.info).toHaveBeenCalledWith(
                `Create the mortgage calculator for user ${currentUser.id}`,
            );
            expect(mockUserService.preUserService.retrieveUserByCriteria).toHaveBeenCalledWith({
                id: currentUser.id,
            });
            expect(mockPreMCalculatorService.createMCalculator).toHaveBeenCalledWith(
                userEntity,
                basicDto,
            );
            expect(result).toBe(created);
        });
    });

    describe('updateMCalculator', () => {
        it('should retrieve calculator, update it, and return success message', async () => {
            const calculator = { id: 'calc-1' };
            const updateDto: UpdateMCalculatorDto = { purchasePrice: 500_000 } as any;

            mockPreMCalculatorService.retrieveMCalculatorByCriteria.mockResolvedValue(calculator);
            mockPreMCalculatorService.updateMCalculatorWithRecalculation.mockResolvedValue(
                undefined,
            );

            const result = await service.updateMCalculator(currentUser, updateDto);

            expect(mockLogger.info).toHaveBeenCalledWith(
                `Update the mortgage calculator for user ${currentUser.id}`,
            );
            expect(mockPreMCalculatorService.retrieveMCalculatorByCriteria).toHaveBeenCalledWith({
                createdBy: { id: currentUser.id },
            });
            expect(
                mockPreMCalculatorService.updateMCalculatorWithRecalculation,
            ).toHaveBeenCalledWith(calculator, updateDto);
            expect(result).toEqual({ message: 'Calculator updated successfully.' });
        });
    });
});
