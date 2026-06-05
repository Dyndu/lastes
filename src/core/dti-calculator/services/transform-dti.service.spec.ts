import { Test, TestingModule } from '@nestjs/testing';
import { TransformDtiService } from './transform-dti.service';
import { DtiCalculatorService } from './dti-calculator.service';
import {
    DtiPropertyEntity,
    DtiEIncomeEntity,
    DtiCardEntity,
    DtiCalculatorEntity,
} from '../entities';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const mockPreDtiCalculatorService = {
    calculateTotalMonthlyRent: jest.fn(),
    calculateMonthlyHouseCoast: jest.fn(),
};

const mockDtiCalculatorService = {
    preDtiCalculatorService: mockPreDtiCalculatorService,
};

const buildProperty = (overrides: Partial<DtiPropertyEntity> = {}): DtiPropertyEntity =>
    ({
        id: 'prop-1',
        streetAddress: '123 Main St',
        city: 'Toronto',
        state: 'Ontario',
        zipCode: 'M5V 3A8',
        monthlyRent: 1500,
        totalExpenses: 1200,
        propertyType: 'SINGLE_FAMILY',
        principalInterest: 800,
        taxesEscrow: 200,
        pMInsurance: 100,
        hoaFees: 50,
        monthlyRentalIncome: 1500,
        ...overrides,
    }) as DtiPropertyEntity;

const buildEIncome = (overrides: Partial<DtiEIncomeEntity> = {}): DtiEIncomeEntity =>
    ({
        id: 'eincome-1',
        label: 'Primary employment',
        value: 3000,
        ...overrides,
    }) as DtiEIncomeEntity;

const buildCard = (overrides: Partial<DtiCardEntity> = {}): DtiCardEntity =>
    ({
        id: 'card-1',
        last4: '4242',
        brand: 'Visa',
        amount: 500,
        ...overrides,
    }) as DtiCardEntity;

const buildCalculator = (overrides: Partial<DtiCalculatorEntity> = {}): DtiCalculatorEntity =>
    ({
        id: 'calc-1',
        description: 'My calculator',
        ...overrides,
    }) as DtiCalculatorEntity;

describe('TransformDtiService', () => {
    let service: TransformDtiService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TransformDtiService,
                { provide: DtiCalculatorService, useValue: mockDtiCalculatorService },
            ],
        }).compile();

        service = module.get<TransformDtiService>(TransformDtiService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('grosslyMonthEntities', () => {
        it('should return the list of relations for gross monthly income computation', () => {
            expect(service.grosslyMonthEntities()).toEqual(['properties', 'eIncome', 'oIncome']);
        });
    });

    describe('calculatorBreakdown', () => {
        it('should return grosslyMonthEntities combined with debts and cards', () => {
            expect(service.calculatorBreakdown()).toEqual([
                'properties',
                'eIncome',
                'oIncome',
                'debts',
                'cards',
            ]);
        });
    });

    describe('transformDtiProperty', () => {
        it('should return simplified property fields', () => {
            const property = buildProperty();

            const result = service.transformDtiProperty(property);

            expect(result).toEqual({
                id: 'prop-1',
                streetAddress: '123 Main St',
                city: 'Toronto',
                state: 'Ontario',
                zipCode: 'M5V 3A8',
                monthlyRent: 1500,
                totalExpenses: 1200,
            });
        });
    });

    describe('transformDtiPropertyDetails', () => {
        it('should return extended property fields including mortgage components', () => {
            const property = buildProperty();

            const result = service.transformDtiPropertyDetails(property);

            expect(result).toEqual({
                id: 'prop-1',
                streetAddress: '123 Main St',
                city: 'Toronto',
                state: 'Ontario',
                zipCode: 'M5V 3A8',
                monthlyRent: 1500,
                totalExpenses: 1200,
                propertyType: 'SINGLE_FAMILY',
                principalInterest: 800,
                taxesEscrow: 200,
                pMInsurance: 100,
                hoaFees: 50,
                monthlyRentalIncome: 1500,
            });
        });
    });

    describe('transformDtiProperties', () => {
        it('should map properties and compute total monthly rent', () => {
            const properties = [
                buildProperty(),
                buildProperty({ id: 'prop-2', monthlyRent: 2000 }),
            ];
            mockPreDtiCalculatorService.calculateTotalMonthlyRent.mockReturnValue(3500);

            const result = service.transformDtiProperties(properties);

            expect(mockPreDtiCalculatorService.calculateTotalMonthlyRent).toHaveBeenCalledWith(
                properties,
            );
            expect(result.total).toBe(3500);
            expect(result.items).toHaveLength(2);
            expect(result.items[0].id).toBe('prop-1');
            expect(result.items[1].id).toBe('prop-2');
        });

        it('should call transformDtiPropertyDetails for each item', () => {
            const properties = [buildProperty()];
            mockPreDtiCalculatorService.calculateTotalMonthlyRent.mockReturnValue(1500);

            const result = service.transformDtiProperties(properties);

            expect(result.items[0]).toHaveProperty('principalInterest');
            expect(result.items[0]).toHaveProperty('taxesEscrow');
        });
    });

    describe('transformDriPropertiesMortgages', () => {
        it('should map properties and compute total mortgage expenses', () => {
            const properties = [
                buildProperty(),
                buildProperty({ id: 'prop-2', totalExpenses: 900 }),
            ];
            mockPreDtiCalculatorService.calculateMonthlyHouseCoast.mockReturnValue(2100);

            const result = service.transformDriPropertiesMortgages(properties);

            expect(mockPreDtiCalculatorService.calculateMonthlyHouseCoast).toHaveBeenCalledWith(
                properties,
            );
            expect(result.total).toBe(2100);
            expect(result.items).toHaveLength(2);
        });

        it('should call transformDtiPropertyDetails for each item', () => {
            const properties = [buildProperty()];
            mockPreDtiCalculatorService.calculateMonthlyHouseCoast.mockReturnValue(1200);

            const result = service.transformDriPropertiesMortgages(properties);

            expect(result.items[0]).toHaveProperty('hoaFees');
        });
    });

    describe('transformData', () => {
        it('should return only id, label, and value fields from any entity', () => {
            const item = { id: 'item-1', label: 'Bonus', value: 500, extraField: 'ignored' };

            const result = service.transformData(item);

            expect(result).toEqual({ id: 'item-1', label: 'Bonus', value: 500 });
            expect(result).not.toHaveProperty('extraField');
        });
    });

    describe('transformDtiEIncomeEmpty', () => {
        it('should return empty items array with total 0', () => {
            const result = service.transformDtiEIncomeEmpty();

            expect(result).toEqual({ item: [], total: 0 });
        });
    });

    describe('transformDtiEIncome', () => {
        it('should map income items and compute total value', () => {
            const items = [
                buildEIncome({ id: 'e-1', value: 3000 }),
                buildEIncome({ id: 'e-2', label: 'Freelance', value: 1500 }),
            ];

            const result = service.transformDtiEIncome(items as DtiEIncomeEntity[]);

            expect(result.total).toBe(4500);
            expect(result.item).toHaveLength(2);
            expect(result.item[0]).toEqual({ id: 'e-1', label: 'Primary employment', value: 3000 });
            expect(result.item[1]).toEqual({ id: 'e-2', label: 'Freelance', value: 1500 });
        });

        it('should return total 0 for an empty list', () => {
            const result = service.transformDtiEIncome([]);

            expect(result).toEqual({ item: [], total: 0 });
        });

        it('should handle a single income item', () => {
            const items = [buildEIncome({ value: 5000 })];

            const result = service.transformDtiEIncome(items as DtiEIncomeEntity[]);

            expect(result.total).toBe(5000);
            expect(result.item).toHaveLength(1);
        });
    });

    describe('transformDtiCard', () => {
        it('should return simplified card fields', () => {
            const card = buildCard();

            const result = service.transformDtiCard(card);

            expect(result).toEqual({
                id: 'card-1',
                last4: '4242',
                brand: 'Visa',
                amount: 500,
            });
        });
    });

    describe('transformDtiCards', () => {
        it('should map cards and compute total amount', () => {
            const cards = [
                buildCard({ id: 'card-1', amount: 500 }),
                buildCard({ id: 'card-2', amount: 300 }),
            ];

            const result = service.transformDtiCards(cards);

            expect(result.total).toBe(800);
            expect(result.item).toHaveLength(2);
            expect(result.item[0]).toEqual({
                id: 'card-1',
                last4: '4242',
                brand: 'Visa',
                amount: 500,
            });
            expect(result.item[1]).toEqual({
                id: 'card-2',
                last4: '4242',
                brand: 'Visa',
                amount: 300,
            });
        });

        it('should return total 0 for empty card list', () => {
            const result = service.transformDtiCards([]);

            expect(result).toEqual({ item: [], total: 0 });
        });

        it('should handle a single card', () => {
            const result = service.transformDtiCards([buildCard({ amount: 1000 })]);

            expect(result.total).toBe(1000);
            expect(result.item).toHaveLength(1);
        });
    });

    describe('transformCalculatorDetails', () => {
        it('should return only id and description from calculator entity', () => {
            const calculator = buildCalculator();

            const result = service.transformCalculatorDetails(calculator);

            expect(result).toEqual({ id: 'calc-1', description: 'My calculator' });
        });

        it('should work with undefined description', () => {
            const calculator = buildCalculator({ description: undefined });

            const result = service.transformCalculatorDetails(calculator);

            expect(result.id).toBe('calc-1');
            expect(result.description).toBeUndefined();
        });
    });
});
