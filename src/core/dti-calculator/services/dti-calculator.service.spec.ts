import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DtiCalculatorService } from './dti-calculator.service';
import { DtiPropertyService } from './dti-property.service';
import { DtiEIncomeService } from './dti-e-income.service';
import { DtiOtherIncomeService } from './dti-other-income.service';
import { DtiOtherDebtsService } from './dti-other-debts.service';
import { DtiCardService } from './dti-card.service';
import { PreDtiCalculatorService } from './pre-dti-calculator.service';
import { TransformDtiService } from './transform-dti.service';
import { UsersService } from '../../users/services';
import { EnvConfigService } from '../../../utils/services/config';
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
import {
    DtiOtherDebtsLabelsEnum,
    DtiOtherIncomeLabelsEnum,
    PropertyDetailsTypeEnum,
} from '../../../common/enum';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };

const mockCalculator = { id: 'calc-123' };

const mockUser: CurrentUserInterface = { id: 'user-123' } as CurrentUserInterface;

const mockPreDtiCalculatorService = {
    calculateGrosslyMonth: jest.fn(),
    lunchDti: jest.fn().mockResolvedValue(mockCalculator),
    retrieveDtiCalculatorByCriteria: jest.fn(),
    updateCalculator: jest.fn(),
    calculateFrontendDti: jest.fn(),
};

const mockTransformDtiService = {
    calculatorBreakdown: jest.fn(),
    transformCalculatorDetails: jest.fn(),
    transformEmptyDtiProperties: jest.fn().mockReturnValue({ data: [] }),
    transformDtiProperties: jest.fn().mockReturnValue({ data: ['prop'] }),
    transformDriPropertiesMortgages: jest.fn().mockReturnValue({ data: ['mortgage'] }),
    transformDtiEIncomeEmpty: jest.fn().mockReturnValue({ data: [] }),
    transformDtiEIncome: jest.fn().mockReturnValue({ data: ['income'] }),
    transformDtiCards: jest.fn().mockReturnValue({ data: ['card'] }),
    grosslyMonthEntities: jest.fn().mockReturnValue(['entity']),
    totalGrosslyMonth: jest.fn().mockReturnValue({ total: 5000 }),
};

const mockDtiPropertyRepo = { find: jest.fn() };
const mockDtiEIncomeRepo = { find: jest.fn() };
const mockDtiOtherIncomeRepo = { find: jest.fn() };
const mockDtiOtherDebtsRepo = { find: jest.fn() };
const mockDtiCardRepo = { find: jest.fn() };
const mockDtiCalculatorRepo = {};

const mockDtiPropertyService = {
    createDtiProperty: jest.fn().mockResolvedValue(undefined),
    updateDtiProperty: jest.fn().mockResolvedValue(undefined),
    deleteDtiProperty: jest.fn().mockResolvedValue(undefined),
};

const mockDtiEIncomeService = {
    createEIncomeEntity: jest.fn().mockResolvedValue(undefined),
    updateEIncome: jest.fn().mockResolvedValue(undefined),
    deleteEIncome: jest.fn().mockResolvedValue(undefined),
};

const mockDtiOtherIncomeService = {
    createOIncomeEntity: jest.fn().mockResolvedValue(undefined),
    updateOIncome: jest.fn().mockResolvedValue(undefined),
    deleteOIncome: jest.fn().mockResolvedValue(undefined),
};

const mockDtiOtherDebtsService = {
    createODebtEntity: jest.fn().mockResolvedValue(undefined),
    updateODebt: jest.fn().mockResolvedValue(undefined),
    deleteODebt: jest.fn().mockResolvedValue(undefined),
};

const mockDtiCardService = {
    createDtiCard: jest.fn().mockResolvedValue(undefined),
    updateCard: jest.fn().mockResolvedValue(undefined),
    deleteCardEntity: jest.fn().mockResolvedValue(undefined),
};

const mockEnvConfigService = { cardSecret: 'test-secret' };
const mockErrorHandler = {};
const mockOtherUtils = {};
const mockUsersService = {};

describe('DtiCalculatorService', () => {
    let service: DtiCalculatorService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DtiCalculatorService,
                { provide: WINSTON_MODULE_PROVIDER, useValue: mockLogger },
                { provide: DtiPropertyService, useValue: mockDtiPropertyService },
                { provide: DtiEIncomeService, useValue: mockDtiEIncomeService },
                { provide: DtiOtherIncomeService, useValue: mockDtiOtherIncomeService },
                { provide: DtiOtherDebtsService, useValue: mockDtiOtherDebtsService },
                { provide: DtiCardService, useValue: mockDtiCardService },
                { provide: PreDtiCalculatorService, useValue: mockPreDtiCalculatorService },
                { provide: TransformDtiService, useValue: mockTransformDtiService },
                { provide: UsersService, useValue: mockUsersService },
                { provide: EnvConfigService, useValue: mockEnvConfigService },
                { provide: ErrorHandlerService, useValue: mockErrorHandler },
                { provide: OtherUtils, useValue: mockOtherUtils },
                { provide: DtiCalculatorRepository, useValue: mockDtiCalculatorRepo },
                { provide: DtiPropertyRepository, useValue: mockDtiPropertyRepo },
                { provide: DtiEIncomeRepository, useValue: mockDtiEIncomeRepo },
                { provide: DtiOtherIncomeRepository, useValue: mockDtiOtherIncomeRepo },
                { provide: DtiOtherDebtsRepository, useValue: mockDtiOtherDebtsRepo },
                { provide: DtiCardRepository, useValue: mockDtiCardRepo },
            ],
        }).compile();

        service = module.get<DtiCalculatorService>(DtiCalculatorService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should set cardSecret from envConfigService on init', () => {
        expect(service.cardSecret).toBe('test-secret');
    });

    describe('getDtiPropertiesIncome', () => {
        it('should return empty transform when no properties found', async () => {
            mockDtiPropertyRepo.find.mockResolvedValue([]);

            const result = await service.getDtiPropertiesIncome(mockUser);

            expect(mockPreDtiCalculatorService.lunchDti).toHaveBeenCalledWith(mockUser);
            expect(mockDtiPropertyRepo.find).toHaveBeenCalledWith({
                where: { calculator: { id: mockCalculator.id }, deleted: false },
            });
            expect(mockTransformDtiService.transformDtiEIncomeEmpty).toHaveBeenCalled();
            expect(result).toEqual({ data: [] });
        });

        it('should return transformed properties when properties exist', async () => {
            const properties = [{ id: 'prop-1' }];
            mockDtiPropertyRepo.find.mockResolvedValue(properties);

            const result = await service.getDtiPropertiesIncome(mockUser);

            expect(mockTransformDtiService.transformDtiProperties).toHaveBeenCalledWith(properties);
            expect(result).toEqual({ data: ['prop'] });
        });
    });

    describe('calculatorSummary', () => {
        it('should launch dti, retrieve calculator details, and return frontend dti', async () => {
            const mockDetails = { id: 'calc-123', properties: [] };
            const mockDtiResult = { frontendDti: 32.5, backendDti: 41.2 };

            mockPreDtiCalculatorService.lunchDti.mockResolvedValue(mockCalculator);
            mockPreDtiCalculatorService.retrieveDtiCalculatorByCriteria.mockResolvedValue(
                mockDetails,
            );
            mockPreDtiCalculatorService.calculateFrontendDti = jest
                .fn()
                .mockReturnValue(mockDtiResult);
            mockTransformDtiService.calculatorBreakdown = jest
                .fn()
                .mockReturnValue(['properties', 'eIncome']);

            const result = await service.calculatorSummary(mockUser);

            expect(mockPreDtiCalculatorService.lunchDti).toHaveBeenCalledWith(mockUser);
            expect(
                mockPreDtiCalculatorService.retrieveDtiCalculatorByCriteria,
            ).toHaveBeenCalledWith({ id: mockCalculator.id }, ['properties', 'eIncome']);
            expect(mockPreDtiCalculatorService.calculateFrontendDti).toHaveBeenCalledWith(
                mockDetails,
            );
            expect(result).toEqual(mockDtiResult);
        });
    });

    describe('calculatorDetails', () => {
        it('should retrieve calculator by user ownership and return transformed details', async () => {
            const mockDetails = { id: 'calc-123' };
            const mockTransformed = { id: 'calc-123', description: 'My calculator' };

            mockPreDtiCalculatorService.retrieveDtiCalculatorByCriteria.mockResolvedValue(
                mockDetails,
            );
            mockTransformDtiService.transformCalculatorDetails = jest
                .fn()
                .mockReturnValue(mockTransformed);

            const result = await service.calculatorDetails(mockUser);

            expect(
                mockPreDtiCalculatorService.retrieveDtiCalculatorByCriteria,
            ).toHaveBeenCalledWith({
                createdBy: { id: mockUser.id },
            });
            expect(mockTransformDtiService.transformCalculatorDetails).toHaveBeenCalledWith(
                mockDetails,
            );
            expect(result).toEqual(mockTransformed);
        });

        it('should propagate error if calculator not found', async () => {
            mockPreDtiCalculatorService.retrieveDtiCalculatorByCriteria.mockRejectedValueOnce(
                new Error('not found'),
            );

            await expect(service.calculatorDetails(mockUser)).rejects.toThrow('not found');
        });
    });

    describe('grosslyMonth', () => {
        it('should launch dti, retrieve details with relations, and return grossly month total', async () => {
            const mockDetails = { id: 'calc-123' };
            mockPreDtiCalculatorService.lunchDti.mockResolvedValue(mockCalculator);
            mockPreDtiCalculatorService.retrieveDtiCalculatorByCriteria.mockResolvedValue(
                mockDetails,
            );
            mockPreDtiCalculatorService.calculateGrosslyMonth = jest
                .fn()
                .mockReturnValue({ total: 5000 });

            const result = await service.grosslyMonth(mockUser);

            expect(mockPreDtiCalculatorService.lunchDti).toHaveBeenCalledWith(mockUser);
            expect(
                mockPreDtiCalculatorService.retrieveDtiCalculatorByCriteria,
            ).toHaveBeenCalledWith({ id: mockCalculator.id }, ['entity']);
            expect(mockPreDtiCalculatorService.calculateGrosslyMonth).toHaveBeenCalledWith(
                mockDetails,
            );
            expect(result).toEqual({ total: 5000 });
        });
    });

    describe('updateCalculator', () => {
        it('should retrieve calculator by ownership and update with description', async () => {
            const mockDetails = { id: 'calc-123' };
            mockPreDtiCalculatorService.retrieveDtiCalculatorByCriteria.mockResolvedValue(
                mockDetails,
            );
            mockPreDtiCalculatorService.updateCalculator = jest.fn().mockResolvedValue(undefined);

            const result = await service.updateCalculator(mockUser, 'New description');

            expect(
                mockPreDtiCalculatorService.retrieveDtiCalculatorByCriteria,
            ).toHaveBeenCalledWith({
                createdBy: { id: mockUser.id },
            });
            expect(mockPreDtiCalculatorService.updateCalculator).toHaveBeenCalledWith(mockDetails, {
                description: 'New description',
            });
            expect(result).toEqual({ message: 'Calculator updated successfully.' });
        });

        it('should pass undefined description when not provided', async () => {
            const mockDetails = { id: 'calc-123' };
            mockPreDtiCalculatorService.retrieveDtiCalculatorByCriteria.mockResolvedValue(
                mockDetails,
            );
            mockPreDtiCalculatorService.updateCalculator = jest.fn().mockResolvedValue(undefined);

            const result = await service.updateCalculator(mockUser);

            expect(mockPreDtiCalculatorService.updateCalculator).toHaveBeenCalledWith(mockDetails, {
                description: undefined,
            });
            expect(result).toEqual({ message: 'Calculator updated successfully.' });
        });

        it('should propagate error if retrieval fails', async () => {
            mockPreDtiCalculatorService.retrieveDtiCalculatorByCriteria.mockRejectedValueOnce(
                new Error('not found'),
            );

            await expect(service.updateCalculator(mockUser, 'desc')).rejects.toThrow('not found');
        });
    });

    describe('getDtiPropertiesMortgages', () => {
        it('should return empty transform when no properties found', async () => {
            mockDtiPropertyRepo.find.mockResolvedValue([]);

            const result = await service.getDtiPropertiesMortgages(mockUser);

            expect(mockTransformDtiService.transformDtiEIncomeEmpty).toHaveBeenCalled();
            expect(result).toEqual({ data: [] });
        });

        it('should return transformed mortgages when properties exist', async () => {
            const properties = [{ id: 'prop-1' }];
            mockDtiPropertyRepo.find.mockResolvedValue(properties);

            const result = await service.getDtiPropertiesMortgages(mockUser);

            expect(mockTransformDtiService.transformDriPropertiesMortgages).toHaveBeenCalledWith(
                properties,
            );
            expect(result).toEqual({ data: ['mortgage'] });
        });
    });

    describe('getDtiEIncome', () => {
        it('should return empty transform when no employment incomes found', async () => {
            mockDtiEIncomeRepo.find.mockResolvedValue([]);

            const result = await service.getDtiEIncome(mockUser);

            expect(mockTransformDtiService.transformDtiEIncomeEmpty).toHaveBeenCalled();
            expect(result).toEqual({ data: [] });
        });

        it('should return transformed employment incomes when records exist', async () => {
            const eIncome = [{ id: 'eincome-1' }];
            mockDtiEIncomeRepo.find.mockResolvedValue(eIncome);

            const result = await service.getDtiEIncome(mockUser);

            expect(mockTransformDtiService.transformDtiEIncome).toHaveBeenCalledWith(eIncome);
            expect(result).toEqual({ data: ['income'] });
        });
    });

    describe('getDtiOIncome', () => {
        it('should return empty transform when no other incomes found', async () => {
            mockDtiOtherIncomeRepo.find.mockResolvedValue([]);

            const result = await service.getDtiOIncome(mockUser);

            expect(mockTransformDtiService.transformDtiEIncomeEmpty).toHaveBeenCalled();
            expect(result).toEqual({ data: [] });
        });

        it('should return transformed other incomes when records exist', async () => {
            const oIncome = [{ id: 'oincome-1' }];
            mockDtiOtherIncomeRepo.find.mockResolvedValue(oIncome);

            const result = await service.getDtiOIncome(mockUser);

            expect(mockTransformDtiService.transformDtiEIncome).toHaveBeenCalledWith(oIncome);
            expect(result).toEqual({ data: ['income'] });
        });
    });

    describe('getDtiCards', () => {
        it('should return empty transform when no cards found', async () => {
            mockDtiCardRepo.find.mockResolvedValue([]);

            const result = await service.getDtiCards(mockUser);

            expect(mockTransformDtiService.transformDtiEIncomeEmpty).toHaveBeenCalled();
            expect(result).toEqual({ data: [] });
        });

        it('should return transformed cards when records exist', async () => {
            const cards = [{ id: 'card-1' }];
            mockDtiCardRepo.find.mockResolvedValue(cards);

            const result = await service.getDtiCards(mockUser);

            expect(mockTransformDtiService.transformDtiCards).toHaveBeenCalledWith(cards);
            expect(result).toEqual({ data: ['card'] });
        });
    });

    describe('getDtiODebts', () => {
        it('should return empty transform when no other debts found', async () => {
            mockDtiOtherDebtsRepo.find.mockResolvedValue([]);

            const result = await service.getDtiODebts(mockUser);

            expect(mockTransformDtiService.transformDtiEIncomeEmpty).toHaveBeenCalled();
            expect(result).toEqual({ data: [] });
        });

        it('should return transformed other debts when records exist', async () => {
            const oDebts = [{ id: 'debt-1' }];
            mockDtiOtherDebtsRepo.find.mockResolvedValue(oDebts);

            const result = await service.getDtiODebts(mockUser);

            expect(mockTransformDtiService.transformDtiEIncome).toHaveBeenCalledWith(oDebts);
            expect(result).toEqual({ data: ['income'] });
        });
    });

    describe('createPropertyDetails', () => {
        it('should create a property and return success message', async () => {
            const dto: CreateDtiPropertyDto = {
                city: 'State',
                state: 'London',
                hoaFees: 90,
                monthlyRentalIncome: 900,
                pMInsurance: 900,
                propertyType: PropertyDetailsTypeEnum.MULTI_FAMILY,
            } as CreateDtiPropertyDto;

            const result = await service.createPropertyDetails(mockUser, dto);

            expect(mockPreDtiCalculatorService.lunchDti).toHaveBeenCalledWith(mockUser);
            expect(mockDtiPropertyService.createDtiProperty).toHaveBeenCalledWith(
                mockCalculator,
                dto,
            );
            expect(result).toEqual({ message: 'Property created successfully.' });
        });
    });

    describe('updateDtiPropertyDetails', () => {
        it('should update a property and return success message', async () => {
            const dto: UpdateDtiPropertyDto = { address: '456 Main St' } as UpdateDtiPropertyDto;

            const result = await service.updateDtiPropertyDetails('prop-1', dto);

            expect(mockDtiPropertyService.updateDtiProperty).toHaveBeenCalledWith('prop-1', dto);
            expect(result).toEqual({ message: 'Property updated successfully.' });
        });
    });

    describe('deleteDtiPropertyDetails', () => {
        it('should delete a property and return success message', async () => {
            const result = await service.deleteDtiPropertyDetails('prop-1');

            expect(mockDtiPropertyService.deleteDtiProperty).toHaveBeenCalledWith('prop-1');
            expect(result).toEqual({ message: 'Property deleted successfully.' });
        });
    });

    describe('addEmploymentIncome', () => {
        it('should create employment income and return success message', async () => {
            const dto: CreateDtiEmploymentIncomeDto = {
                value: 5000,
                label: DtiOtherIncomeLabelsEnum.ALIMONY_SUPPORT,
            } as CreateDtiEmploymentIncomeDto;

            const result = await service.addEmploymentIncome(mockUser, dto);

            expect(mockPreDtiCalculatorService.lunchDti).toHaveBeenCalledWith(mockUser);
            expect(mockDtiEIncomeService.createEIncomeEntity).toHaveBeenCalledWith(
                mockCalculator,
                dto,
            );
            expect(result).toEqual({ message: 'Dti employment income created successfully.' });
        });
    });

    describe('updateEmploymentIncome', () => {
        it('should update employment income and return success message', async () => {
            const dto: UpdateDtiEmploymentIncomeDto = {
                amount: 4000,
            } as UpdateDtiEmploymentIncomeDto;

            const result = await service.updateEmploymentIncome('eincome-1', dto);

            expect(mockDtiEIncomeService.updateEIncome).toHaveBeenCalledWith('eincome-1', dto);
            expect(result).toEqual({ message: 'Dti employment income updated successfully.' });
        });
    });

    describe('deleteEmploymentIncome', () => {
        it('should delete employment income and return success message', async () => {
            const result = await service.deleteEmploymentIncome('eincome-1');

            expect(mockDtiEIncomeService.deleteEIncome).toHaveBeenCalledWith('eincome-1');
            expect(result).toEqual({ message: 'Dti employment income deleted successfully.' });
        });
    });

    describe('addOtherIncome', () => {
        it('should create other income and return success message', async () => {
            const dto: CreateDtiOtherIncomeDto = {
                value: 500,
                label: DtiOtherIncomeLabelsEnum.ALIMONY_SUPPORT,
            } as CreateDtiOtherIncomeDto;

            const result = await service.addOtherIncome(mockUser, dto);

            expect(mockPreDtiCalculatorService.lunchDti).toHaveBeenCalledWith(mockUser);
            expect(mockDtiOtherIncomeService.createOIncomeEntity).toHaveBeenCalledWith(
                mockCalculator,
                dto,
            );
            expect(result).toEqual({ message: 'Dti employment income updated successfully.' });
        });
    });

    describe('updateOtherIncome', () => {
        it('should update other income and return success message', async () => {
            const dto: UpdateDtiOtherIncomeDto = { amount: 600 } as UpdateDtiOtherIncomeDto;

            const result = await service.updateOtherIncome('oincome-1', dto);

            expect(mockDtiOtherIncomeService.updateOIncome).toHaveBeenCalledWith('oincome-1', dto);
            expect(result).toEqual({ message: 'Dti other income updated successfully.' });
        });
    });

    describe('deleteOtherIncome', () => {
        it('should delete other income and return success message', async () => {
            const result = await service.deleteOtherIncome('oincome-1');

            expect(mockDtiOtherIncomeService.deleteOIncome).toHaveBeenCalledWith('oincome-1');
            expect(result).toEqual({ message: 'Dti other income deleted successfully.' });
        });
    });

    describe('addOtherDebt', () => {
        it('should create other debt and return success message', async () => {
            const dto: CreateDtiOtherDebtDto = {
                value: 200,
                label: DtiOtherDebtsLabelsEnum.OTHER_REVOLVING,
            } as CreateDtiOtherDebtDto;

            const result = await service.addOtherDebt(mockUser, dto);

            expect(mockPreDtiCalculatorService.lunchDti).toHaveBeenCalledWith(mockUser);
            expect(mockDtiOtherDebtsService.createODebtEntity).toHaveBeenCalledWith(
                mockCalculator,
                dto,
            );
            expect(result).toEqual({ message: 'Dti other debt updated successfully.' });
        });
    });

    describe('updateOtherDebt', () => {
        it('should update other debt and return success message', async () => {
            const dto: UpdateDtiOtherDebtDto = { amount: 300 } as UpdateDtiOtherDebtDto;

            const result = await service.updateOtherDebt('debt-1', dto);

            expect(mockDtiOtherDebtsService.updateODebt).toHaveBeenCalledWith('debt-1', dto);
            expect(result).toEqual({ message: 'Dti other debt updated successfully.' });
        });
    });

    describe('deleteOtherDebt', () => {
        it('should delete other debt and return success message', async () => {
            const result = await service.deleteOtherDebt('debt-1');

            expect(mockDtiOtherDebtsService.deleteODebt).toHaveBeenCalledWith('debt-1');
            expect(result).toEqual({ message: 'Dti other debt deleted successfully.' });
        });
    });

    describe('createDtiCreditsCard', () => {
        it('should create a credit card and return success message', async () => {
            const dto: CreateDtiCardDto = {
                code: '1234',
                expiry: '12/26',
                amount: 1000,
            } as CreateDtiCardDto;

            const result = await service.createDtiCreditsCard(mockUser, dto);

            expect(mockPreDtiCalculatorService.lunchDti).toHaveBeenCalledWith(mockUser);
            expect(mockDtiCardService.createDtiCard).toHaveBeenCalledWith(
                mockCalculator,
                dto.code,
                dto.expiry,
                dto.amount,
            );
            expect(result).toEqual({ message: 'Dti credit card successfully.' });
        });
    });

    describe('updateDtiCreditCard', () => {
        it('should update a credit card and return success message', async () => {
            const dto: UpdateDtiCardDto = { amount: 2000 } as UpdateDtiCardDto;

            const result = await service.updateDtiCreditCard('card-1', dto);

            expect(mockDtiCardService.updateCard).toHaveBeenCalledWith('card-1', dto);
            expect(result).toEqual({ message: 'Dti credit card successfully.' });
        });
    });

    describe('deleteDtiCreditCard', () => {
        it('should delete a credit card and return success message', async () => {
            const result = await service.deleteDtiCreditCard('card-1');

            expect(mockDtiCardService.deleteCardEntity).toHaveBeenCalledWith('card-1');
            expect(result).toEqual({ message: 'Dti credit card successfully.' });
        });
    });
});
