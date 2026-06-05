import { Test, TestingModule } from '@nestjs/testing';
import { MCalculatorController } from './m-calculator.controller';
import { MCalculatorService } from './services';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guard';
import { Reflector } from '@nestjs/core';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';
import type { CurrentUserInterface } from '../../interface';
import {
    AmortizationQueryDto,
    CalculateDownPaymentDto,
    CalculateDownPaymentPercentageDto,
    CreateMCalculatorDto,
    UpdateMCalculatorDto,
} from './dto';
import { CreditScoreEnum, ExtraPaymentFrequencyEnum, MCalculatorTypeEnum } from '../../common/enum';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const mockUser: CurrentUserInterface = {
    id: 'user-123',
    role: 'user',
    sessionId: 'session-123',
    permissions: { module: ['view', 'update', 'delete'] },
};

const makeBasicDto = (overrides: Partial<CreateMCalculatorDto> = {}): CreateMCalculatorDto => ({
    purchasePrice: 300_000,
    downPaymentAmount: 60_000,
    downPaymentPercentage: 20,
    interestRate: 5,
    loanTerm: 30,
    typeEnum: MCalculatorTypeEnum.BASIC,
    ...overrides,
});

const makeAdvancedDto = (overrides: Partial<CreateMCalculatorDto> = {}): CreateMCalculatorDto =>
    makeBasicDto({
        typeEnum: MCalculatorTypeEnum.ADVANCED,
        loanStartDate: '2024-01-01T00:00:00.000Z',
        annualPropertyTaxes: 3_000,
        annualHomeInsurance: 1_200,
        additionalMonthlyPayment: 100,
        creditScore: CreditScoreEnum.EXCELLENT,
        ...overrides,
    });

const buildMockService = () => ({
    getMCalculatorBreakdownFromSaved: jest.fn(),
    getAmortizationBreakdownFromSaved: jest.fn(),
    determineDownPaymentAmount: jest.fn(),
    determineDownPaymentPercentage: jest.fn(),
    determineLoanAmount: jest.fn(),
    getMCalculatorBreakdown: jest.fn(),
    calculatorAmortizationScheduleBreakdown: jest.fn(),
    mCalculatorDetails: jest.fn(),
    createMCalculator: jest.fn(),
    updateMCalculator: jest.fn(),
});

describe('MCalculatorController', () => {
    let controller: MCalculatorController;
    let service: ReturnType<typeof buildMockService>;

    beforeEach(async () => {
        service = buildMockService();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [MCalculatorController],
            providers: [
                { provide: MCalculatorService, useValue: service },
                {
                    provide: EnvConfigService,
                    useValue: {
                        sAdminRole: 'superadmin',
                        adminRole: 'admin',
                        userRole: 'user',
                        supportRole: 'support',
                    },
                },
                {
                    provide: ErrorHandlerService,
                    useValue: {
                        forbidden: jest.fn((_msg: string, userMsg: string) => {
                            throw new Error(userMsg);
                        }),
                    },
                },
                { provide: Reflector, useValue: { get: jest.fn() } },
                { provide: JwtAuthGuard, useValue: { canActivate: jest.fn(() => true) } },
                { provide: PermissionsGuard, useValue: { canActivate: jest.fn(() => true) } },
            ],
        }).compile();

        controller = module.get<MCalculatorController>(MCalculatorController);
    });

    afterEach(() => jest.clearAllMocks());

    describe('savedBreakdown', () => {
        it('calls getMCalculatorBreakdownFromSaved with user and returns result', async () => {
            const mockResult = { monthlyPayment: 1610, loanAmount: 240_000 };
            service.getMCalculatorBreakdownFromSaved.mockResolvedValue(mockResult);

            const result = await controller.savedBreakdown(mockUser);

            expect(service.getMCalculatorBreakdownFromSaved).toHaveBeenCalledWith(mockUser);
            expect(result).toEqual(mockResult);
        });

        it('propagates service errors', async () => {
            service.getMCalculatorBreakdownFromSaved.mockRejectedValue(new Error('Not found'));

            await expect(controller.savedBreakdown(mockUser)).rejects.toThrow('Not found');
        });
    });

    describe('savedAmortizationBreakdown', () => {
        it('calls getAmortizationBreakdownFromSaved with user and query and returns result', async () => {
            const query: AmortizationQueryDto = {
                extraPayment: 200,
                frequency: ExtraPaymentFrequencyEnum.MONTHLY,
            };
            const mockResult = { schedule: [] };
            service.getAmortizationBreakdownFromSaved.mockResolvedValue(mockResult);

            const result = await controller.savedAmortizationBreakdown(mockUser, query);

            expect(service.getAmortizationBreakdownFromSaved).toHaveBeenCalledWith(mockUser, query);
            expect(result).toEqual(mockResult);
        });

        it('calls service with empty query object when no query params', async () => {
            const query: AmortizationQueryDto = {};
            service.getAmortizationBreakdownFromSaved.mockResolvedValue({ schedule: [] });

            await controller.savedAmortizationBreakdown(mockUser, query);

            expect(service.getAmortizationBreakdownFromSaved).toHaveBeenCalledWith(mockUser, query);
        });

        it('calls service with YEARLY frequency', async () => {
            const query: AmortizationQueryDto = {
                extraPayment: 1_200,
                frequency: ExtraPaymentFrequencyEnum.YEARLY,
            };
            service.getAmortizationBreakdownFromSaved.mockResolvedValue({});

            await controller.savedAmortizationBreakdown(mockUser, query);

            expect(service.getAmortizationBreakdownFromSaved).toHaveBeenCalledWith(mockUser, query);
        });

        it('calls service with WEEKLY frequency', async () => {
            const query: AmortizationQueryDto = {
                extraPayment: 50,
                frequency: ExtraPaymentFrequencyEnum.WEEKLY,
            };
            service.getAmortizationBreakdownFromSaved.mockResolvedValue({});

            await controller.savedAmortizationBreakdown(mockUser, query);

            expect(service.getAmortizationBreakdownFromSaved).toHaveBeenCalledWith(mockUser, query);
        });

        it('propagates service errors', async () => {
            service.getAmortizationBreakdownFromSaved.mockRejectedValue(new Error('Not found'));

            await expect(controller.savedAmortizationBreakdown(mockUser, {})).rejects.toThrow(
                'Not found',
            );
        });
    });

    describe('calculateDownPayment', () => {
        it('calls determineDownPaymentAmount with dto and returns result', async () => {
            const dto: CalculateDownPaymentDto = {
                purchasePrice: 300_000,
                downPaymentPercentage: 20,
            };
            const mockResult = 60_000;
            service.determineDownPaymentAmount.mockReturnValue(mockResult);

            const result = await controller.calculateDownPayment(dto);

            expect(service.determineDownPaymentAmount).toHaveBeenCalledWith(dto);
            expect(result).toBe(mockResult);
        });

        it('handles zero down payment percentage', async () => {
            const dto: CalculateDownPaymentDto = {
                purchasePrice: 300_000,
                downPaymentPercentage: 0,
            };
            service.determineDownPaymentAmount.mockReturnValue(0);

            const result = await controller.calculateDownPayment(dto);

            expect(service.determineDownPaymentAmount).toHaveBeenCalledWith(dto);
            expect(result).toBe(0);
        });

        it('handles 100% down payment percentage', async () => {
            const dto: CalculateDownPaymentDto = {
                purchasePrice: 300_000,
                downPaymentPercentage: 100,
            };
            service.determineDownPaymentAmount.mockReturnValue(300_000);

            const result = await controller.calculateDownPayment(dto);

            expect(result).toBe(300_000);
        });
    });

    describe('calculateDownPaymentPercentage', () => {
        it('calls determineDownPaymentPercentage with dto and returns result', async () => {
            const dto: CalculateDownPaymentPercentageDto = {
                purchasePrice: 300_000,
                downPaymentAmount: 60_000,
            };
            const mockResult = 20;
            service.determineDownPaymentPercentage.mockReturnValue(mockResult);

            const result = await controller.calculateDownPaymentPercentage(dto);

            expect(service.determineDownPaymentPercentage).toHaveBeenCalledWith(dto);
            expect(result).toBe(mockResult);
        });

        it('handles zero down payment amount', async () => {
            const dto: CalculateDownPaymentPercentageDto = {
                purchasePrice: 300_000,
                downPaymentAmount: 0,
            };
            service.determineDownPaymentPercentage.mockReturnValue(0);

            const result = await controller.calculateDownPaymentPercentage(dto);

            expect(result).toBe(0);
        });
    });

    describe('calculateLoanAmount', () => {
        it('calls determineLoanAmount with dto and returns result', async () => {
            const dto: CalculateDownPaymentPercentageDto = {
                purchasePrice: 300_000,
                downPaymentAmount: 60_000,
            };
            const mockResult = 240_000;
            service.determineLoanAmount.mockReturnValue(mockResult);

            const result = await controller.calculateLoanAmount(dto);

            expect(service.determineLoanAmount).toHaveBeenCalledWith(dto);
            expect(result).toBe(mockResult);
        });

        it('returns full purchase price when down payment is zero', async () => {
            const dto: CalculateDownPaymentPercentageDto = {
                purchasePrice: 300_000,
                downPaymentAmount: 0,
            };
            service.determineLoanAmount.mockReturnValue(300_000);

            const result = await controller.calculateLoanAmount(dto);

            expect(result).toBe(300_000);
        });
    });

    describe('calculateBreakdown', () => {
        it('calls getMCalculatorBreakdown with basic dto and returns result', async () => {
            const dto = makeBasicDto();
            const mockResult = { monthlyPayment: 1_288, totalInterest: 223_000 };
            service.getMCalculatorBreakdown.mockResolvedValue(mockResult);

            const result = await controller.calculateBreakdown(dto);

            expect(service.getMCalculatorBreakdown).toHaveBeenCalledWith(dto);
            expect(result).toEqual(mockResult);
        });

        it('calls getMCalculatorBreakdown with advanced dto', async () => {
            const dto = makeAdvancedDto();
            service.getMCalculatorBreakdown.mockResolvedValue({});

            await controller.calculateBreakdown(dto);

            expect(service.getMCalculatorBreakdown).toHaveBeenCalledWith(dto);
        });

        it('propagates service errors', async () => {
            service.getMCalculatorBreakdown.mockRejectedValue(new Error('Calculation failed'));

            await expect(controller.calculateBreakdown(makeBasicDto())).rejects.toThrow(
                'Calculation failed',
            );
        });
    });

    describe('amortizationBreakdown', () => {
        it('calls calculatorAmortizationScheduleBreakdown with dto and returns result', async () => {
            const dto = makeBasicDto();
            const mockResult = { schedule: [{ month: 1, payment: 1_288 }] };
            service.calculatorAmortizationScheduleBreakdown.mockResolvedValue(mockResult);

            const result = await controller.amortizationBreakdown(dto);

            expect(service.calculatorAmortizationScheduleBreakdown).toHaveBeenCalledWith(dto);
            expect(result).toEqual(mockResult);
        });

        it('calls service with advanced dto including optional fields', async () => {
            const dto = makeAdvancedDto();
            service.calculatorAmortizationScheduleBreakdown.mockResolvedValue({});

            await controller.amortizationBreakdown(dto);

            expect(service.calculatorAmortizationScheduleBreakdown).toHaveBeenCalledWith(dto);
        });

        it('propagates service errors', async () => {
            service.calculatorAmortizationScheduleBreakdown.mockRejectedValue(
                new Error('Schedule failed'),
            );

            await expect(controller.amortizationBreakdown(makeBasicDto())).rejects.toThrow(
                'Schedule failed',
            );
        });
    });

    describe('calculatorDetails', () => {
        it('calls mCalculatorDetails with user and returns result', async () => {
            const mockResult = { id: 'calc-1', purchasePrice: 300_000 };
            service.mCalculatorDetails.mockResolvedValue(mockResult);

            const result = await controller.calculatorDetails(mockUser);

            expect(service.mCalculatorDetails).toHaveBeenCalledWith(mockUser);
            expect(result).toEqual(mockResult);
        });

        it('propagates service errors', async () => {
            service.mCalculatorDetails.mockRejectedValue(new Error('Not found'));

            await expect(controller.calculatorDetails(mockUser)).rejects.toThrow('Not found');
        });
    });

    describe('createCalculator', () => {
        it('calls createMCalculator with user and basic dto and returns result', async () => {
            const dto = makeBasicDto();
            const mockResult = { id: 'calc-1', ...dto };
            service.createMCalculator.mockResolvedValue(mockResult);

            const result = await controller.createCalculator(mockUser, dto);

            expect(service.createMCalculator).toHaveBeenCalledWith(mockUser, dto);
            expect(result).toEqual(mockResult);
        });

        it('calls createMCalculator with user and advanced dto', async () => {
            const dto = makeAdvancedDto();
            service.createMCalculator.mockResolvedValue({ id: 'calc-2', ...dto });

            await controller.createCalculator(mockUser, dto);

            expect(service.createMCalculator).toHaveBeenCalledWith(mockUser, dto);
        });

        it('propagates service errors', async () => {
            service.createMCalculator.mockRejectedValue(new Error('Validation failed'));

            await expect(controller.createCalculator(mockUser, makeBasicDto())).rejects.toThrow(
                'Validation failed',
            );
        });
    });

    describe('updateCalculator', () => {
        it('calls updateMCalculator with user and partial dto and returns result', async () => {
            const dto: UpdateMCalculatorDto = { interestRate: 4.5 };
            const mockResult = { message: 'Calculator updated successfully' };
            service.updateMCalculator.mockResolvedValue(mockResult);

            const result = await controller.updateCalculator(mockUser, dto);

            expect(service.updateMCalculator).toHaveBeenCalledWith(mockUser, dto);
            expect(result).toEqual(mockResult);
        });

        it('calls updateMCalculator with full update dto', async () => {
            const dto: UpdateMCalculatorDto = makeAdvancedDto();
            service.updateMCalculator.mockResolvedValue({});

            await controller.updateCalculator(mockUser, dto);

            expect(service.updateMCalculator).toHaveBeenCalledWith(mockUser, dto);
        });

        it('calls updateMCalculator with empty dto', async () => {
            const dto: UpdateMCalculatorDto = {};
            service.updateMCalculator.mockResolvedValue({
                message: 'No updates provided for calculator update',
            });

            const result = await controller.updateCalculator(mockUser, dto);

            expect(service.updateMCalculator).toHaveBeenCalledWith(mockUser, dto);
            expect(result).toEqual({ message: 'No updates provided for calculator update' });
        });

        it('calls updateMCalculator with typeEnum only', async () => {
            const dto: UpdateMCalculatorDto = { typeEnum: MCalculatorTypeEnum.ADVANCED };
            service.updateMCalculator.mockResolvedValue({});

            await controller.updateCalculator(mockUser, dto);

            expect(service.updateMCalculator).toHaveBeenCalledWith(mockUser, dto);
        });

        it('propagates service errors', async () => {
            service.updateMCalculator.mockRejectedValue(new Error('Update failed'));

            await expect(
                controller.updateCalculator(mockUser, { purchasePrice: 400_000 }),
            ).rejects.toThrow('Update failed');
        });
    });
});
