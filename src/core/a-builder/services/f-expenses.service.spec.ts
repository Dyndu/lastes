import { Test, TestingModule } from '@nestjs/testing';
import { FExpensesService } from './f-expenses.service';
import { ABuilderService } from './a-builder.service';
import { FExpensesEntity } from '../entities';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const mockFExpensesCreate = jest.fn();
const mockFExpensesUpdate = jest.fn();

const mockABuilderService = {
    fExpensesRepository: {
        create: mockFExpensesCreate,
        update: mockFExpensesUpdate,
    },
};

function makeDto(overrides = {}) {
    return {
        sewer: 100,
        water: 80,
        trash: 50,
        gas: 120,
        electric: 150,
        internet: 60,
        other: 30,
        hoaFees: 200,
        propertyTaxes: 500,
        hazardInsurance: 300,
        additionalFees: 75,
        cashReserves: 10,
        managementFees: 8,
        maintenanceEscrow: 5,
        ...overrides,
    } as any;
}

function makeEntity(overrides = {}): FExpensesEntity {
    return Object.assign(new FExpensesEntity(), {
        id: 'fe-001',
        sewer: 100,
        water: 80,
        trash: 50,
        gas: 120,
        electric: 150,
        internet: 60,
        other: 30,
        hoaFees: 200,
        propertyTaxes: 500,
        hazardInsurance: 300,
        additionalFees: 75,
        cashReserves: 10,
        managementFees: 8,
        maintenanceEscrow: 5,
        total: 0,
        ...overrides,
    });
}

describe('FExpensesService', () => {
    let service: FExpensesService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FExpensesService,
                { provide: ABuilderService, useValue: mockABuilderService },
            ],
        }).compile();

        service = module.get<FExpensesService>(FExpensesService);
    });

    describe('buildFExpenseEntity', () => {
        it('should build entity with all required fields', () => {
            const entity = service.buildFExpenseEntity(
                {
                    sewer: 100,
                    water: 80,
                    trash: 50,
                    gas: 120,
                    electric: 150,
                    internet: 60,
                    other: 30,
                    hoaFees: 200,
                    propertyTaxes: 500,
                    hazardInsurance: 300,
                    additionalFees: 75,
                    cashReserves: 10,
                    managementFees: 8,
                    maintenanceEscrow: 5,
                    total: 1895,
                },
                {},
            );
            expect(entity).toBeInstanceOf(FExpensesEntity);
            expect(entity.total).toBe(1895);
            expect(entity.sewer).toBe(100);
        });

        it('should assign optional analysisBuilder', () => {
            const aBuilder = { id: 'ab-001' } as any;
            const entity = service.buildFExpenseEntity(
                {
                    sewer: 0,
                    water: 0,
                    trash: 0,
                    gas: 0,
                    electric: 0,
                    internet: 0,
                    other: 0,
                    hoaFees: 0,
                    propertyTaxes: 0,
                    hazardInsurance: 0,
                    additionalFees: 0,
                    cashReserves: 0,
                    managementFees: 0,
                    maintenanceEscrow: 0,
                    total: 0,
                },
                { analysisBuilder: aBuilder },
            );
            expect((entity as any).analysisBuilder).toBe(aBuilder);
        });
    });

    describe('calcMonthlyExpenseBreakdown', () => {
        it('should calculate mEscrow, mFees and cReserves correctly', () => {
            const result = service.calcMonthlyExpenseBreakdown(1000, makeDto());
            expect(result.mEscrow).toBeCloseTo(50);
            expect(result.mFees).toBeCloseTo(80);
            expect(result.cReserves).toBeCloseTo(100);
        });

        it('should return 0 for all when totalIncome is 0', () => {
            const result = service.calcMonthlyExpenseBreakdown(0, makeDto());
            expect(result.mEscrow).toBe(0);
            expect(result.mFees).toBe(0);
            expect(result.cReserves).toBe(0);
        });

        it('should handle percentage of 0 correctly', () => {
            const result = service.calcMonthlyExpenseBreakdown(
                1000,
                makeDto({ cashReserves: 0, managementFees: 0, maintenanceEscrow: 0 }),
            );
            expect(result.mEscrow).toBe(0);
            expect(result.mFees).toBe(0);
            expect(result.cReserves).toBe(0);
        });

        it('should handle percentage of 100 correctly', () => {
            const result = service.calcMonthlyExpenseBreakdown(
                200,
                makeDto({ cashReserves: 100, managementFees: 100, maintenanceEscrow: 100 }),
            );
            expect(result.mEscrow).toBe(200);
            expect(result.mFees).toBe(200);
            expect(result.cReserves).toBe(200);
        });
    });

    describe('resolveFETotal', () => {
        it('should compute correct total from flat fields + proportional breakdown', () => {
            const result = service.resolveFETotal(makeDto(), 1000);
            expect(result).toBeCloseTo(1895);
        });

        it('should return only flat sum when all percentages are 0', () => {
            const dto = makeDto({ cashReserves: 0, managementFees: 0, maintenanceEscrow: 0 });
            const result = service.resolveFETotal(dto, 1000);
            expect(result).toBeCloseTo(1665);
        });

        it('should return 0 when all fields are 0', () => {
            const dto = makeDto({
                sewer: 0,
                water: 0,
                trash: 0,
                gas: 0,
                electric: 0,
                internet: 0,
                other: 0,
                hoaFees: 0,
                propertyTaxes: 0,
                hazardInsurance: 0,
                additionalFees: 0,
                cashReserves: 0,
                managementFees: 0,
                maintenanceEscrow: 0,
            });
            expect(service.resolveFETotal(dto, 0)).toBe(0);
        });

        it('should handle undefined values gracefully (default to 0)', () => {
            const dto = makeDto({ sewer: undefined });
            const result = service.resolveFETotal(dto, 1000);
            expect(result).toBeCloseTo(1795);
        });
    });

    describe('createFExpense', () => {
        it('should call repository.create with correct entity and return result', async () => {
            const expected = makeEntity({ total: 1895 });
            mockFExpensesCreate.mockResolvedValue(expected);

            const result = await service.createFExpense(makeDto(), 1000);

            expect(mockFExpensesCreate).toHaveBeenCalledWith(
                expect.objectContaining({ total: expect.any(Number) }),
            );
            expect(result).toBe(expected);
        });

        it('should pass analysisBuilder when provided', async () => {
            const aBuilder = { id: 'ab-001' } as any;
            mockFExpensesCreate.mockResolvedValue(makeEntity());

            await service.createFExpense(makeDto(), 1000, aBuilder);

            expect(mockFExpensesCreate).toHaveBeenCalledWith(
                expect.objectContaining({ analysisBuilder: aBuilder }),
            );
        });

        it('should not include analysisBuilder when not provided', async () => {
            mockFExpensesCreate.mockResolvedValue(makeEntity());

            await service.createFExpense(makeDto(), 1000);

            expect(mockFExpensesCreate).toHaveBeenCalledWith(
                expect.not.objectContaining({ analysisBuilder: expect.anything() }),
            );
        });
    });

    describe('updateFExpense', () => {
        it('should return early message when itemized is undefined', async () => {
            const result = await service.updateFExpense(makeEntity(), 1000, undefined);
            expect(result).toEqual({ message: expect.any(String) });
            expect(mockFExpensesUpdate).not.toHaveBeenCalled();
        });

        it('should return early message when itemized is empty object', async () => {
            const result = await service.updateFExpense(makeEntity(), 1000, {});
            expect(result).toEqual({ message: expect.any(String) });
            expect(mockFExpensesUpdate).not.toHaveBeenCalled();
        });

        it('should call repository.update with correct payload when valid update provided', async () => {
            mockFExpensesUpdate.mockResolvedValue({ affected: 1 });

            await service.updateFExpense(makeEntity(), 1000, { sewer: 200 });

            expect(mockFExpensesUpdate).toHaveBeenCalledWith(
                { id: 'fe-001' },
                expect.objectContaining({ sewer: 200, total: expect.any(Number) }),
            );
        });

        it('should only include defined fields in update payload', async () => {
            mockFExpensesUpdate.mockResolvedValue({ affected: 1 });

            await service.updateFExpense(makeEntity(), 1000, { water: 99 });

            const call = mockFExpensesUpdate.mock.calls[0][1];
            expect(call.water).toBe(99);
            expect(call.sewer).toBeUndefined();
        });

        it('should merge entity values with partial dto for total calculation', async () => {
            mockFExpensesUpdate.mockResolvedValue({ affected: 1 });

            const entity = makeEntity({ sewer: 100 });
            await service.updateFExpense(entity, 0, { sewer: 500 });

            const call = mockFExpensesUpdate.mock.calls[0][1];
            expect(call.sewer).toBe(500);
        });

        it('should update all fields when all are provided', async () => {
            mockFExpensesUpdate.mockResolvedValue({ affected: 1 });

            const fullUpdate = {
                sewer: 10,
                water: 10,
                trash: 10,
                gas: 10,
                electric: 10,
                internet: 10,
                other: 10,
                hoaFees: 10,
                propertyTaxes: 10,
                hazardInsurance: 10,
                additionalFees: 10,
                cashReserves: 5,
                managementFees: 5,
                maintenanceEscrow: 5,
            };
            await service.updateFExpense(makeEntity(), 1000, fullUpdate);

            const call = mockFExpensesUpdate.mock.calls[0][1];
            expect(call.sewer).toBe(10);
            expect(call.total).toBeDefined();
        });

        it('should return repository update result', async () => {
            const updateResult = { affected: 1 };
            mockFExpensesUpdate.mockResolvedValue(updateResult);

            const result = await service.updateFExpense(makeEntity(), 1000, { sewer: 200 });

            expect(result).toBe(updateResult);
        });
    });
});
