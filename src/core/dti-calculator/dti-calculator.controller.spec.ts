import { Test, TestingModule } from '@nestjs/testing';
import { DtiCalculatorController } from './dti-calculator.controller';
import { DtiCalculatorService } from './services';
import { CurrentUserInterface } from '../../interface';
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
} from './dto';
import {
    PropertyDetailsTypeEnum,
    DtiOtherIncomeLabelsEnum,
    DtiOtherDebtsLabelsEnum,
} from '../../common/enum';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../../common/response';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guard';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('DtiCalculatorController', () => {
    let controller: DtiCalculatorController;
    let service: jest.Mocked<DtiCalculatorService>;

    const mockCurrentUser: CurrentUserInterface = {
        id: 'user-123',
        role: 'user',
        sessionId: 'session-123',
        permissions: {
            module: ['view', 'update', 'delete'],
        },
    };

    const mockService = {
        getDtiPropertiesIncome: jest.fn(),
        calculatorSummary: jest.fn(),
        calculatorDetails: jest.fn(),
        updateCalculator: jest.fn(),
        getDtiPropertiesMortgages: jest.fn(),
        getDtiEIncome: jest.fn(),
        getDtiOIncome: jest.fn(),
        getDtiCards: jest.fn(),
        getDtiODebts: jest.fn(),
        grosslyMonth: jest.fn(),
        createPropertyDetails: jest.fn(),
        updateDtiPropertyDetails: jest.fn(),
        deleteDtiPropertyDetails: jest.fn(),
        addEmploymentIncome: jest.fn(),
        updateEmploymentIncome: jest.fn(),
        deleteEmploymentIncome: jest.fn(),
        addOtherIncome: jest.fn(),
        updateOtherIncome: jest.fn(),
        deleteOtherIncome: jest.fn(),
        addOtherDebt: jest.fn(),
        updateOtherDebt: jest.fn(),
        deleteOtherDebt: jest.fn(),
        createDtiCreditsCard: jest.fn(),
        updateDtiCreditCard: jest.fn(),
        deleteDtiCreditCard: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [DtiCalculatorController],
            providers: [
                { provide: DtiCalculatorService, useValue: mockService },
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
                        forbidden: jest.fn((_msg, userMsg) => {
                            throw new Error(userMsg);
                        }),
                    },
                },
                { provide: Reflector, useValue: { get: jest.fn() } },
                { provide: JwtAuthGuard, useValue: { canActivate: jest.fn(() => true) } },
                { provide: PermissionsGuard, useValue: { canActivate: jest.fn(() => true) } },
            ],
        }).compile();

        controller = module.get<DtiCalculatorController>(DtiCalculatorController);
        service = module.get(DtiCalculatorService) as jest.Mocked<DtiCalculatorService>;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('calculatorSummary', () => {
        it('should call calculatorSummary with current user and return result', async () => {
            const mockResult = { frontendDti: 32.5, backendDti: 41.2 };
            mockService.calculatorSummary.mockResolvedValue(mockResult);

            const result = await controller.calculatorSummary(mockCurrentUser);

            expect(service.calculatorSummary).toHaveBeenCalledWith(mockCurrentUser);
            expect(result).toEqual(mockResult);
        });
    });

    describe('calculatorDetails', () => {
        it('should call calculatorDetails with current user and return result', async () => {
            const mockResult = { id: 'calc-1', description: 'My calculator' };
            mockService.calculatorDetails.mockResolvedValue(mockResult);

            const result = await controller.calculatorDetails(mockCurrentUser);

            expect(service.calculatorDetails).toHaveBeenCalledWith(mockCurrentUser);
            expect(result).toEqual(mockResult);
        });
    });

    describe('updateCalculator', () => {
        it('should call updateCalculator with user and field value and return result', async () => {
            const mockResult = { message: 'Calculator updated successfully.' };
            mockService.updateCalculator.mockResolvedValue(mockResult);

            const result = await controller.updateCalculator(mockCurrentUser, {
                field: 'My description',
            });

            expect(service.updateCalculator).toHaveBeenCalledWith(
                mockCurrentUser,
                'My description',
            );
            expect(result).toEqual(mockResult);
        });

        it('should pass undefined field when field is not provided', async () => {
            const mockResult = { message: 'Calculator updated successfully.' };
            mockService.updateCalculator.mockResolvedValue(mockResult);

            const result = await controller.updateCalculator(mockCurrentUser, {
                field: undefined!,
            });

            expect(service.updateCalculator).toHaveBeenCalledWith(mockCurrentUser, undefined);
            expect(result).toEqual(mockResult);
        });
    });

    describe('propertiesIncome', () => {
        it('should call getDtiPropertiesIncome with current user and return result', async () => {
            const mockResult = { data: [{ id: 'prop-1' }] };
            mockService.getDtiPropertiesIncome.mockResolvedValue(mockResult);

            const result = await controller.propertiesIncome(mockCurrentUser);

            expect(service.getDtiPropertiesIncome).toHaveBeenCalledWith(mockCurrentUser);
            expect(result).toEqual(mockResult);
        });
    });

    describe('propertiesMortgages', () => {
        it('should call getDtiPropertiesMortgages with current user and return result', async () => {
            const mockResult = { data: [{ id: 'mortgage-1' }] };
            mockService.getDtiPropertiesMortgages.mockResolvedValue(mockResult);

            const result = await controller.propertiesMortgages(mockCurrentUser);

            expect(service.getDtiPropertiesMortgages).toHaveBeenCalledWith(mockCurrentUser);
            expect(result).toEqual(mockResult);
        });
    });

    describe('dtiEIncome', () => {
        it('should call getDtiEIncome with current user and return result', async () => {
            const mockResult = { data: [{ id: 'eincome-1' }] };
            mockService.getDtiEIncome.mockResolvedValue(mockResult);

            const result = await controller.dtiEIncome(mockCurrentUser);

            expect(service.getDtiEIncome).toHaveBeenCalledWith(mockCurrentUser);
            expect(result).toEqual(mockResult);
        });
    });

    describe('dtiOIncome', () => {
        it('should call getDtiOIncome with current user and return result', async () => {
            const mockResult = { data: [{ id: 'oincome-1' }] };
            mockService.getDtiOIncome.mockResolvedValue(mockResult);

            const result = await controller.dtiOIncome(mockCurrentUser);

            expect(service.getDtiOIncome).toHaveBeenCalledWith(mockCurrentUser);
            expect(result).toEqual(mockResult);
        });
    });

    describe('dtiCards', () => {
        it('should call getDtiCards with current user and return result', async () => {
            const mockResult = { data: [{ id: 'card-1' }] };
            mockService.getDtiCards.mockResolvedValue(mockResult);

            const result = await controller.dtiCards(mockCurrentUser);

            expect(service.getDtiCards).toHaveBeenCalledWith(mockCurrentUser);
            expect(result).toEqual(mockResult);
        });
    });

    describe('dtiOtherDebts', () => {
        it('should call getDtiODebts with current user and return result', async () => {
            const mockResult = { data: [{ id: 'debt-1' }] };
            mockService.getDtiODebts.mockResolvedValue(mockResult);

            const result = await controller.dtiOtherDebts(mockCurrentUser);

            expect(service.getDtiODebts).toHaveBeenCalledWith(mockCurrentUser);
            expect(result).toEqual(mockResult);
        });
    });

    describe('dtiGrosslyMonth', () => {
        it('should call grosslyMonth with current user and return result', async () => {
            const mockResult = { total: 8500 };
            mockService.grosslyMonth.mockResolvedValue(mockResult);

            const result = await controller.dtiGrosslyMonth(mockCurrentUser);

            expect(service.grosslyMonth).toHaveBeenCalledWith(mockCurrentUser);
            expect(result).toEqual(mockResult);
        });
    });

    describe('createDtiProperty', () => {
        it('should call createPropertyDetails with user and dto and return result', async () => {
            const dto: CreateDtiPropertyDto = {
                streetAddress: '123 Main St',
                city: 'Toronto',
                state: 'Ontario',
                zipCode: 'M5V 3A8',
                propertyType: PropertyDetailsTypeEnum.SINGLE_FAMILY,
                principalInterest: 1200,
                taxesEscrow: 300,
                pMInsurance: 100,
                hoaFees: 50,
                monthlyRentalIncome: 0,
            };
            const mockResult = { message: 'Property created successfully.' };
            mockService.createPropertyDetails.mockResolvedValue(mockResult);

            const result = await controller.createDtiProperty(mockCurrentUser, dto);

            expect(service.createPropertyDetails).toHaveBeenCalledWith(mockCurrentUser, dto);
            expect(result).toEqual(mockResult);
        });
    });

    describe('updateDtiProperty', () => {
        it('should call updateDtiPropertyDetails with id and dto and return result', async () => {
            const propertyId = '123e4567-e89b-12d3-a456-426614174000';
            const dto: UpdateDtiPropertyDto = {
                streetAddress: '456 Updated St',
                monthlyRent: 2300,
            };
            const mockResult = { message: 'Property updated successfully.' };
            mockService.updateDtiPropertyDetails.mockResolvedValue(mockResult);

            const result = await controller.updateDtiProperty(propertyId, dto);

            expect(service.updateDtiPropertyDetails).toHaveBeenCalledWith(propertyId, dto);
            expect(result).toEqual(mockResult);
        });
    });

    describe('deleteDtiProperty', () => {
        it('should call deleteDtiPropertyDetails with id and return result', async () => {
            const propertyId = '123e4567-e89b-12d3-a456-426614174000';
            const mockResult = { message: 'Property deleted successfully.' };
            mockService.deleteDtiPropertyDetails.mockResolvedValue(mockResult);

            const result = await controller.deleteDtiProperty(propertyId);

            expect(service.deleteDtiPropertyDetails).toHaveBeenCalledWith(propertyId);
            expect(result).toEqual(mockResult);
        });
    });

    describe('createDtiEIncome', () => {
        it('should call addEmploymentIncome with user and dto and return result', async () => {
            const dto: CreateDtiEmploymentIncomeDto = {
                label: 'Primary employment',
                value: 5000,
            };
            const mockResult = { message: 'Dti employment income created successfully.' };
            mockService.addEmploymentIncome.mockResolvedValue(mockResult);

            const result = await controller.createDtiEIncome(mockCurrentUser, dto);

            expect(service.addEmploymentIncome).toHaveBeenCalledWith(mockCurrentUser, dto);
            expect(result).toEqual(mockResult);
        });
    });

    describe('updateDtiEIncome', () => {
        it('should call updateEmploymentIncome with id and dto and return result', async () => {
            const incomeId = '123e4567-e89b-12d3-a456-426614174000';
            const dto: UpdateDtiEmploymentIncomeDto = { value: 6000 };
            const mockResult = { message: 'Dti employment income updated successfully.' };
            mockService.updateEmploymentIncome.mockResolvedValue(mockResult);

            const result = await controller.updateDtiEIncome(incomeId, dto);

            expect(service.updateEmploymentIncome).toHaveBeenCalledWith(incomeId, dto);
            expect(result).toEqual(mockResult);
        });
    });

    describe('deleteDtiEIncome', () => {
        it('should call deleteEmploymentIncome with id and return result', async () => {
            const incomeId = '123e4567-e89b-12d3-a456-426614174000';
            const mockResult = { message: 'Dti employment income deleted successfully.' };
            mockService.deleteEmploymentIncome.mockResolvedValue(mockResult);

            const result = await controller.deleteDtiEIncome(incomeId);

            expect(service.deleteEmploymentIncome).toHaveBeenCalledWith(incomeId);
            expect(result).toEqual(mockResult);
        });
    });

    describe('createDtiOIncome', () => {
        it('should call addOtherIncome with user and dto and return result', async () => {
            const dto: CreateDtiOtherIncomeDto = {
                label: DtiOtherIncomeLabelsEnum.BONUS_PAY,
                value: 1500,
            };
            const mockResult = { message: 'Dti employment income updated successfully.' };
            mockService.addOtherIncome.mockResolvedValue(mockResult);

            const result = await controller.createDtiOIncome(mockCurrentUser, dto);

            expect(service.addOtherIncome).toHaveBeenCalledWith(mockCurrentUser, dto);
            expect(result).toEqual(mockResult);
        });
    });

    describe('updateDtiOIncome', () => {
        it('should call updateOtherIncome with id and dto and return result', async () => {
            const incomeId = '123e4567-e89b-12d3-a456-426614174000';
            const dto: UpdateDtiOtherIncomeDto = { value: 2000 };
            const mockResult = { message: 'Dti other income updated successfully.' };
            mockService.updateOtherIncome.mockResolvedValue(mockResult);

            const result = await controller.updateDtiOIncome(incomeId, dto);

            expect(service.updateOtherIncome).toHaveBeenCalledWith(incomeId, dto);
            expect(result).toEqual(mockResult);
        });
    });

    describe('deleteDtiOIncome', () => {
        it('should call deleteOtherIncome with id and return result', async () => {
            const incomeId = '123e4567-e89b-12d3-a456-426614174000';
            const mockResult = { message: 'Dti other income deleted successfully.' };
            mockService.deleteOtherIncome.mockResolvedValue(mockResult);

            const result = await controller.deleteDtiOIncome(incomeId);

            expect(service.deleteOtherIncome).toHaveBeenCalledWith(incomeId);
            expect(result).toEqual(mockResult);
        });
    });

    describe('createDtiODebts', () => {
        it('should call addOtherDebt with user and dto and return result', async () => {
            const dto: CreateDtiOtherDebtDto = {
                label: DtiOtherDebtsLabelsEnum.AUTO_LOAN,
                value: 400,
            };
            const mockResult = { message: 'Dti other debt updated successfully.' };
            mockService.addOtherDebt.mockResolvedValue(mockResult);

            const result = await controller.createDtiODebts(mockCurrentUser, dto);

            expect(service.addOtherDebt).toHaveBeenCalledWith(mockCurrentUser, dto);
            expect(result).toEqual(mockResult);
        });
    });

    describe('updateDtiODebts', () => {
        it('should call updateOtherDebt with id and dto and return result', async () => {
            const debtId = '123e4567-e89b-12d3-a456-426614174000';
            const dto: UpdateDtiOtherDebtDto = { value: 500 };
            const mockResult = { message: 'Dti other debt updated successfully.' };
            mockService.updateOtherDebt.mockResolvedValue(mockResult);

            const result = await controller.updateDtiODebts(debtId, dto);

            expect(service.updateOtherDebt).toHaveBeenCalledWith(debtId, dto);
            expect(result).toEqual(mockResult);
        });
    });

    describe('deleteDtiODebts', () => {
        it('should call deleteOtherDebt with id and return result', async () => {
            const debtId = '123e4567-e89b-12d3-a456-426614174000';
            const mockResult = { message: 'Dti other debt deleted successfully.' };
            mockService.deleteOtherDebt.mockResolvedValue(mockResult);

            const result = await controller.deleteDtiODebts(debtId);

            expect(service.deleteOtherDebt).toHaveBeenCalledWith(debtId);
            expect(result).toEqual(mockResult);
        });
    });

    describe('createCreditCard', () => {
        it('should call createDtiCreditsCard with user and dto and return result', async () => {
            const dto: CreateDtiCardDto = {
                code: 'xxxx-xxx-xxx-xxxxx',
                amount: 1000,
                expiry: '12/2026',
            };
            const mockResult = { message: 'Dti credit card successfully.' };
            mockService.createDtiCreditsCard.mockResolvedValue(mockResult);

            const result = await controller.createCreditCard(mockCurrentUser, dto);

            expect(service.createDtiCreditsCard).toHaveBeenCalledWith(mockCurrentUser, dto);
            expect(result).toEqual(mockResult);
        });
    });

    describe('updateCreditCard', () => {
        it('should call updateDtiCreditCard with id and dto and return result', async () => {
            const cardId = '123e4567-e89b-12d3-a456-426614174000';
            const dto: UpdateDtiCardDto = { amount: 2000 };
            const mockResult = { message: 'Dti credit card successfully.' };
            mockService.updateDtiCreditCard.mockResolvedValue(mockResult);

            const result = await controller.updateCreditCard(cardId, dto);

            expect(service.updateDtiCreditCard).toHaveBeenCalledWith(cardId, dto);
            expect(result).toEqual(mockResult);
        });
    });

    describe('deleteCreditCard', () => {
        it('should call deleteDtiCreditCard with id and return result', async () => {
            const cardId = '123e4567-e89b-12d3-a456-426614174000';
            const mockResult = { message: 'Dti credit card successfully.' };
            mockService.deleteDtiCreditCard.mockResolvedValue(mockResult);

            const result = await controller.deleteCreditCard(cardId);

            expect(service.deleteDtiCreditCard).toHaveBeenCalledWith(cardId);
            expect(result).toEqual(mockResult);
        });
    });
});
