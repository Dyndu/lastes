import { Test, TestingModule } from '@nestjs/testing';
import { PreDtiCalculatorService } from './pre-dti-calculator.service';
import { DtiCalculatorService } from './dti-calculator.service';
import {
    DtiCalculatorEntity,
    DtiPropertyEntity,
    DtiCardEntity,
    DtiOtherDebtsEntity,
} from '../entities';
import { UserEntity } from '../../users/entities/user.entity';
import { CurrentUserInterface } from '../../../interface';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const buildUser = (overrides: Partial<UserEntity> = {}): UserEntity =>
    ({ id: 'user-123', ...overrides }) as UserEntity;

const buildCalculator = (overrides: Partial<DtiCalculatorEntity> = {}): DtiCalculatorEntity =>
    ({ id: 'calc-1', description: 'My DTI', ...overrides }) as DtiCalculatorEntity;

const buildProperty = (overrides: Partial<DtiPropertyEntity> = {}): DtiPropertyEntity =>
    ({ monthlyRent: 1500, totalExpenses: 1200, ...overrides }) as DtiPropertyEntity;

const buildCard = (overrides: Partial<DtiCardEntity> = {}): DtiCardEntity =>
    ({ amount: 500, ...overrides }) as DtiCardEntity;

const buildDebt = (overrides: Partial<DtiOtherDebtsEntity> = {}): DtiOtherDebtsEntity =>
    ({ value: 300, ...overrides }) as DtiOtherDebtsEntity;

const mockCurrentUser: CurrentUserInterface = { id: 'user-123' } as CurrentUserInterface;

const mockDtiCalculatorRepo = {
    findActiveOne: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
};

const mockPreUserService = {
    retrieveUserByCriteria: jest.fn(),
};

const mockDtiCalculatorService = {
    logger: { info: jest.fn() },
    otherUtils: { formatCriteria: jest.fn() },
    errorHandler: { notFound: jest.fn() },
    dtiCalculatorRepo: mockDtiCalculatorRepo,
    userService: { preUserService: mockPreUserService },
};

describe('PreDtiCalculatorService', () => {
    let service: PreDtiCalculatorService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PreDtiCalculatorService,
                { provide: DtiCalculatorService, useValue: mockDtiCalculatorService },
            ],
        }).compile();

        service = module.get<PreDtiCalculatorService>(PreDtiCalculatorService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('buildDtiCalculator', () => {
        it('should build a DtiCalculatorEntity and assign createdBy', () => {
            const user = buildUser();

            const result = service.buildDtiCalculator({ createdBy: user });

            expect(result).toBeInstanceOf(DtiCalculatorEntity);
            expect(result.createdBy).toBe(user);
        });
    });

    describe('retrieveDtiCalculatorByCriteria', () => {
        it('should return calculator when found', async () => {
            const calculator = buildCalculator();
            mockDtiCalculatorService.otherUtils.formatCriteria.mockReturnValue('id=calc-1');
            mockDtiCalculatorRepo.findActiveOne.mockResolvedValue(calculator);

            const result = await service.retrieveDtiCalculatorByCriteria({ id: 'calc-1' });

            expect(mockDtiCalculatorService.otherUtils.formatCriteria).toHaveBeenCalledWith({
                id: 'calc-1',
            });
            expect(mockDtiCalculatorRepo.findActiveOne).toHaveBeenCalledWith(
                mockDtiCalculatorRepo,
                { id: 'calc-1' },
                undefined,
            );
            expect(result).toBe(calculator);
        });

        it('should pass relations to findActiveOne when provided', async () => {
            const calculator = buildCalculator();
            mockDtiCalculatorService.otherUtils.formatCriteria.mockReturnValue('id=calc-1');
            mockDtiCalculatorRepo.findActiveOne.mockResolvedValue(calculator);

            await service.retrieveDtiCalculatorByCriteria({ id: 'calc-1' }, [
                'properties',
                'eIncome',
            ]);

            expect(mockDtiCalculatorRepo.findActiveOne).toHaveBeenCalledWith(
                mockDtiCalculatorRepo,
                { id: 'calc-1' },
                ['properties', 'eIncome'],
            );
        });

        it('should call errorHandler.notFound when calculator is not found', async () => {
            mockDtiCalculatorService.otherUtils.formatCriteria.mockReturnValue('id=not-found');
            mockDtiCalculatorRepo.findActiveOne.mockResolvedValue(null);

            await service.retrieveDtiCalculatorByCriteria({ id: 'not-found' });

            expect(mockDtiCalculatorService.errorHandler.notFound).toHaveBeenCalledWith(
                'Data not found with id=not-found',
                'Data not found',
            );
        });
    });

    describe('lunchDti', () => {
        it('should return existing calculator if one already exists for user', async () => {
            const user = buildUser();
            const calculator = buildCalculator();
            mockPreUserService.retrieveUserByCriteria.mockResolvedValue(user);
            mockDtiCalculatorRepo.findOne.mockResolvedValue(calculator);

            const result = await service.lunchDti(mockCurrentUser);

            expect(mockPreUserService.retrieveUserByCriteria).toHaveBeenCalledWith({
                id: mockCurrentUser.id,
            });
            expect(mockDtiCalculatorRepo.findOne).toHaveBeenCalledWith({
                where: { createdBy: { id: mockCurrentUser.id } },
            });
            expect(mockDtiCalculatorRepo.create).not.toHaveBeenCalled();
            expect(result).toBe(calculator);
        });

        it('should create a new calculator if none exists for user', async () => {
            const user = buildUser();
            const newCalculator = buildCalculator({ id: 'calc-new' });
            mockPreUserService.retrieveUserByCriteria.mockResolvedValue(user);
            mockDtiCalculatorRepo.findOne.mockResolvedValue(null);
            mockDtiCalculatorRepo.create.mockResolvedValue(newCalculator);

            const result = await service.lunchDti(mockCurrentUser);

            expect(mockDtiCalculatorRepo.create).toHaveBeenCalled();
            const createdArg = mockDtiCalculatorRepo.create.mock.calls[0][0];
            expect(createdArg).toBeInstanceOf(DtiCalculatorEntity);
            expect(createdArg.createdBy).toBe(user);
            expect(result).toBe(newCalculator);
        });
    });

    describe('updateCalculator', () => {
        it('should return early message when itemized is undefined', async () => {
            const calculator = buildCalculator();

            const result = await service.updateCalculator(calculator, undefined);

            expect(result).toEqual({ message: 'No updates provided for calculator update' });
            expect(mockDtiCalculatorRepo.update).not.toHaveBeenCalled();
        });

        it('should return early message when itemized is empty object', async () => {
            const calculator = buildCalculator();

            const result = await service.updateCalculator(calculator, {});

            expect(result).toEqual({ message: 'No updates provided for calculator update' });
            expect(mockDtiCalculatorRepo.update).not.toHaveBeenCalled();
        });

        it('should update calculator with valid trimmed description', async () => {
            const calculator = buildCalculator();
            mockDtiCalculatorRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateCalculator(calculator, { description: '  New description  ' });

            expect(mockDtiCalculatorRepo.update).toHaveBeenCalledWith(
                { id: 'calc-1' },
                { description: 'New description' },
            );
        });

        it('should skip description when it is only whitespace', async () => {
            const calculator = buildCalculator();
            mockDtiCalculatorRepo.update.mockResolvedValue({ affected: 0 });

            await service.updateCalculator(calculator, { description: '   ' });

            expect(mockDtiCalculatorRepo.update).toHaveBeenCalledWith({ id: 'calc-1' }, {});
        });

        it('should skip description when it is an empty string', async () => {
            const calculator = buildCalculator();
            mockDtiCalculatorRepo.update.mockResolvedValue({ affected: 0 });

            await service.updateCalculator(calculator, { description: '' });

            expect(mockDtiCalculatorRepo.update).toHaveBeenCalledWith({ id: 'calc-1' }, {});
        });
    });

    describe('calculateMonthlyHouseCoast', () => {
        it('should sum totalExpenses across all properties', () => {
            const properties = [
                buildProperty({ totalExpenses: 1200 }),
                buildProperty({ totalExpenses: 800 }),
            ];

            expect(service.calculateMonthlyHouseCoast(properties)).toBe(2000);
        });

        it('should return 0 for empty property list', () => {
            expect(service.calculateMonthlyHouseCoast([])).toBe(0);
        });
    });

    describe('calculateTotalMonthlyRent', () => {
        it('should sum monthlyRent across all properties', () => {
            const properties = [
                buildProperty({ monthlyRent: 1500 }),
                buildProperty({ monthlyRent: 2000 }),
            ];

            expect(service.calculateTotalMonthlyRent(properties)).toBe(3500);
        });

        it('should return 0 for empty property list', () => {
            expect(service.calculateTotalMonthlyRent([])).toBe(0);
        });
    });

    describe('calculateTotalCreditCardDebts', () => {
        it('should sum amount across all cards', () => {
            const cards = [buildCard({ amount: 500 }), buildCard({ amount: 300 })];

            expect(service.calculateTotalCreditCardDebts(cards)).toBe(800);
        });

        it('should return 0 for empty card list', () => {
            expect(service.calculateTotalCreditCardDebts([])).toBe(0);
        });
    });

    describe('calculatorTotalOtherDebts', () => {
        it('should sum value across all other debts', () => {
            const debts = [buildDebt({ value: 300 }), buildDebt({ value: 200 })];

            expect(service.calculatorTotalOtherDebts(debts)).toBe(500);
        });

        it('should return 0 for empty debt list', () => {
            expect(service.calculatorTotalOtherDebts([])).toBe(0);
        });
    });

    describe('calculateGrosslyMonth', () => {
        it('should sum monthly rent + eIncome + oIncome', () => {
            const calculator = {
                ...buildCalculator(),
                properties: [
                    buildProperty({ monthlyRent: 1500 }),
                    buildProperty({ monthlyRent: 500 }),
                ],
                eIncome: [{ value: 3000 }, { value: 1000 }],
                oIncome: [{ value: 500 }],
            } as unknown as DtiCalculatorEntity;

            // monthlyRent: 2000, eIncome: 4000, oIncome: 500 => total: 6500
            expect(service.calculateGrosslyMonth(calculator)).toBe(6500);
        });

        it('should return 0 when all sources are empty', () => {
            const calculator = {
                ...buildCalculator(),
                properties: [],
                eIncome: [],
                oIncome: [],
            } as unknown as DtiCalculatorEntity;

            expect(service.calculateGrosslyMonth(calculator)).toBe(0);
        });
    });

    describe('calculateFrontendDti', () => {
        it('should compute all DTI metrics correctly', () => {
            const calculator = {
                ...buildCalculator(),
                properties: [buildProperty({ monthlyRent: 2000, totalExpenses: 1200 })],
                eIncome: [{ value: 4000 }],
                oIncome: [{ value: 1000 }],
                cards: [buildCard({ amount: 500 })],
                debts: [buildDebt({ value: 300 })],
            } as unknown as DtiCalculatorEntity;

            const result = service.calculateFrontendDti(calculator);

            expect(result.grosslyMonth).toBe(7000);
            expect(result.housingExpenses).toBe(1200);
            expect(result.totalMonthlyDebts).toBe(800);
            expect(result.frontendDti).toBeCloseTo((1200 / 7000) * 100);
            expect(result.backendDti).toBeCloseTo((800 / 7000) * 100);
            expect(result.otherDebtsPayment).toBe(1200 - 800);
        });

        it('should return 0 percentages when grosslyMonth is 0 (division by zero case)', () => {
            const calculator = {
                ...buildCalculator(),
                properties: [],
                eIncome: [],
                oIncome: [],
                cards: [],
                debts: [],
            } as unknown as DtiCalculatorEntity;

            const result = service.calculateFrontendDti(calculator);

            expect(result.grosslyMonth).toBe(0);
            expect(result.frontendDti).toBeNaN();
            expect(result.backendDti).toBeNaN();
            expect(result.housingExpenses).toBe(0);
            expect(result.totalMonthlyDebts).toBe(0);
        });

        it('should handle multiple properties, cards and debts', () => {
            const calculator = {
                ...buildCalculator(),
                properties: [
                    buildProperty({ monthlyRent: 1000, totalExpenses: 600 }),
                    buildProperty({ monthlyRent: 1000, totalExpenses: 600 }),
                ],
                eIncome: [{ value: 3000 }],
                oIncome: [{ value: 500 }, { value: 500 }],
                cards: [buildCard({ amount: 200 }), buildCard({ amount: 300 })],
                debts: [buildDebt({ value: 100 })],
            } as unknown as DtiCalculatorEntity;

            const result = service.calculateFrontendDti(calculator);

            expect(result.grosslyMonth).toBe(6000);
            expect(result.housingExpenses).toBe(1200);
            expect(result.totalMonthlyDebts).toBe(600);
            expect(result.frontendDti).toBeCloseTo(20);
            expect(result.backendDti).toBeCloseTo(10);
            expect(result.otherDebtsPayment).toBe(600);
        });
    });
});
