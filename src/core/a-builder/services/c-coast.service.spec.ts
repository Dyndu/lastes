import { Test, TestingModule } from '@nestjs/testing';
import { CCoastService } from './c-coast.service';
import { ABuilderService } from './a-builder.service';
import { CCoastEntity } from '../entities';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const mockValidation = jest.fn();
const mockDetermineNewAmount = jest.fn();
const mockCCoastCreate = jest.fn();
const mockCCoastUpdate = jest.fn();
const mockCreateERepair = jest.fn();
const mockCreateIRepair = jest.fn();
const mockCreateORepair = jest.fn();
const mockUpdateERepairs = jest.fn();
const mockUpdateIRepairs = jest.fn();
const mockUpdateORepairs = jest.fn();
const mockDeleteERepair = jest.fn();
const mockDeleteIRepair = jest.fn();
const mockDeleteORepair = jest.fn();

const mockABuilderService = {
    errorHandler: { validation: mockValidation },
    refinanceService: { determineNewAmount: mockDetermineNewAmount },
    cCoastRepository: { create: mockCCoastCreate, update: mockCCoastUpdate },
    eRepairsService: {
        createERepair: mockCreateERepair,
        updateERepairs: mockUpdateERepairs,
        deleteERepair: mockDeleteERepair,
    },
    iRepairsService: {
        createIRepair: mockCreateIRepair,
        updateIRepairs: mockUpdateIRepairs,
        deleteIRepair: mockDeleteIRepair,
    },
    oRepairsService: {
        createORepair: mockCreateORepair,
        updateORepairs: mockUpdateORepairs,
        deleteORepair: mockDeleteORepair,
    },
};

const rItem = { roof: 100, landscaping: 50, concierge: 30, garage: 20, bathrooms: 40 };

function makeDto(overrides = {}) {
    return {
        rContingency: 10,
        duration: 6,
        hasItems: false,
        holdingCoast: 5000,
        ...overrides,
    };
}

function makeEntity(overrides = {}): CCoastEntity {
    return Object.assign(new CCoastEntity(), {
        id: 'ccoast-001',
        rContingency: 10,
        rContingencyTotal: 500,
        duration: 6,
        holdingCoast: 5000,
        ...overrides,
    });
}

function makeABuilder(overrides = {}) {
    return {
        acquisitionDetails: { monthlyIncome: 2000 },
        cCoast: { duration: 3, totalCCoast: 9000 },
        ...overrides,
    } as any;
}

describe('CCoastService', () => {
    let service: CCoastService;

    beforeEach(async () => {
        jest.clearAllMocks();
        mockValidation.mockImplementation(() => undefined);
        mockDetermineNewAmount.mockReturnValue(500);
        mockCCoastCreate.mockResolvedValue(makeEntity());

        const module: TestingModule = await Test.createTestingModule({
            providers: [CCoastService, { provide: ABuilderService, useValue: mockABuilderService }],
        }).compile();

        service = module.get<CCoastService>(CCoastService);
    });

    describe('validateCCoastDetails', () => {
        it('should call validation with empty errors when dto is valid (hasItems=false, holdingCoast provided)', () => {
            service.validateCCoastDetails(makeDto() as any);
            expect(mockValidation).toHaveBeenCalledWith({});
        });

        it('should add eRepairs/iRepairs/oRepairs error when hasItems=true but repairs missing', () => {
            service.validateCCoastDetails(
                makeDto({ hasItems: true, holdingCoast: undefined }) as any,
            );
            expect(mockValidation).toHaveBeenCalledWith(
                expect.objectContaining({
                    eRepairs: expect.any(String),
                    iRepairs: expect.any(String),
                    oRepairs: expect.any(String),
                }),
            );
        });

        it('should add holdingCoast error when hasItems=false and holdingCoast is null', () => {
            service.validateCCoastDetails(makeDto({ hasItems: false, holdingCoast: null }) as any);
            expect(mockValidation).toHaveBeenCalledWith(
                expect.objectContaining({ holdingCoast: expect.any(String) }),
            );
        });

        it('should add holdingCoast error when hasItems=true and holdingCoast is provided', () => {
            service.validateCCoastDetails(
                makeDto({
                    hasItems: true,
                    holdingCoast: 1000,
                    eRepairs: rItem,
                    iRepairs: rItem,
                    oRepairs: rItem,
                }) as any,
            );
            expect(mockValidation).toHaveBeenCalledWith(
                expect.objectContaining({ holdingCoast: expect.any(String) }),
            );
        });

        it('should pass with no errors when hasItems=true and all repairs provided and no holdingCoast', () => {
            service.validateCCoastDetails(
                makeDto({
                    hasItems: true,
                    holdingCoast: undefined,
                    eRepairs: rItem,
                    iRepairs: rItem,
                    oRepairs: rItem,
                }) as any,
            );
            expect(mockValidation).toHaveBeenCalledWith({});
        });
    });

    describe('calculateIncomeReceived', () => {
        it('should return monthlyIncome * duration', () => {
            expect(service.calculateIncomeReceived(makeABuilder())).toBe(6000);
        });

        it('should return 0 when acquisitionDetails is missing', () => {
            expect(
                service.calculateIncomeReceived(makeABuilder({ acquisitionDetails: null })),
            ).toBe(0);
        });

        it('should return 0 when cCoast is missing', () => {
            expect(service.calculateIncomeReceived(makeABuilder({ cCoast: null }))).toBe(0);
        });

        it('should return 0 when both are missing', () => {
            expect(
                service.calculateIncomeReceived(
                    makeABuilder({ acquisitionDetails: null, cCoast: null }),
                ),
            ).toBe(0);
        });
    });

    describe('calculateNetCarryingCoast', () => {
        it('should return totalCCoast minus incomeReceived', () => {
            expect(service.calculateNetCarryingCoast(makeABuilder())).toBe(3000);
        });

        it('should return 0 when cCoast is null', () => {
            expect(service.calculateNetCarryingCoast(makeABuilder({ cCoast: null }))).toBe(0);
        });
    });

    describe('resolveHoldingCoast', () => {
        it('should return holdingCoast directly when provided', () => {
            expect(service.resolveHoldingCoast(makeDto({ holdingCoast: 7000 }) as any)).toBe(7000);
        });

        it('should return 0 when holdingCoast is explicitly 0', () => {
            expect(service.resolveHoldingCoast(makeDto({ holdingCoast: 0 }) as any)).toBe(0);
        });

        it('should sum eRepairs + iRepairs + oRepairs when holdingCoast is undefined', () => {
            const dto = makeDto({
                holdingCoast: undefined,
                eRepairs: { roof: 100, landscaping: 50, concierge: 30, garage: 20, bathrooms: 40 },
                iRepairs: { roof: 10, landscaping: 10, concierge: 10, garage: 10, bathrooms: 10 },
                oRepairs: { roof: 5, landscaping: 5, concierge: 5, garage: 5, bathrooms: 5 },
            });
            expect(service.resolveHoldingCoast(dto as any)).toBe(315);
        });

        it('should return 0 when holdingCoast is null and no repairs provided', () => {
            expect(
                service.resolveHoldingCoast(
                    makeDto({
                        holdingCoast: null,
                        eRepairs: undefined,
                        iRepairs: undefined,
                        oRepairs: undefined,
                    }) as any,
                ),
            ).toBe(0);
        });
    });

    describe('buildCCoastEntity', () => {
        it('should build entity with required fields', () => {
            const entity = service.buildCCoastEntity(
                { rContingency: 10, rContingencyTotal: 500, duration: 6, holdingCoast: 5000 },
                {},
            );
            expect(entity).toBeInstanceOf(CCoastEntity);
            expect(entity.rContingency).toBe(10);
            expect(entity.duration).toBe(6);
            expect(entity.holdingCoast).toBe(5000);
        });

        it('should assign optional analysisBuilder', () => {
            const aBuilder = { id: 'ab-001' } as any;
            const entity = service.buildCCoastEntity(
                { rContingency: 10, rContingencyTotal: 500, duration: 6, holdingCoast: 5000 },
                { analysisBuilder: aBuilder },
            );
            expect((entity as any).analysisBuilder).toBe(aBuilder);
        });
    });

    describe('createCCoast', () => {
        it('should create entity without repairs when hasItems=false', async () => {
            const dto = makeDto();
            const aBuilder = { id: 'ab-001' } as any;
            const result = await service.createCCoast(aBuilder, dto as any);

            expect(mockCCoastCreate).toHaveBeenCalled();
            expect(mockCreateERepair).not.toHaveBeenCalled();
            expect(mockCreateIRepair).not.toHaveBeenCalled();
            expect(mockCreateORepair).not.toHaveBeenCalled();
            expect(result).toBeInstanceOf(CCoastEntity);
        });

        it('should create entity with all repairs when provided', async () => {
            const dto = makeDto({
                hasItems: true,
                holdingCoast: undefined,
                eRepairs: rItem,
                iRepairs: rItem,
                oRepairs: rItem,
            });
            mockCreateERepair.mockResolvedValue({});
            mockCreateIRepair.mockResolvedValue({});
            mockCreateORepair.mockResolvedValue({});

            await service.createCCoast({ id: 'ab-001' } as any, dto as any);

            expect(mockCreateERepair).toHaveBeenCalled();
            expect(mockCreateIRepair).toHaveBeenCalled();
            expect(mockCreateORepair).toHaveBeenCalled();
        });

        it('should create entity with only eRepairs', async () => {
            const dto = makeDto({ eRepairs: rItem });
            mockCreateERepair.mockResolvedValue({});

            await service.createCCoast({ id: 'ab-001' } as any, dto as any);

            expect(mockCreateERepair).toHaveBeenCalled();
            expect(mockCreateIRepair).not.toHaveBeenCalled();
            expect(mockCreateORepair).not.toHaveBeenCalled();
        });

        it('should call determineNewAmount with rContingency and holdingCoast', async () => {
            const dto = makeDto({ holdingCoast: 5000 });
            await service.createCCoast({ id: 'ab-001' } as any, dto as any);
            expect(mockDetermineNewAmount).toHaveBeenCalledWith(10, 5000);
        });
    });

    describe('reconcileCCoastBeforeUpdate', () => {
        it('should delete eRepairs when entity has them but dto does not', async () => {
            const cCoast = makeEntity({ eRepairs: rItem, iRepairs: null, oRepairs: null });
            mockDeleteERepair.mockResolvedValue(undefined);

            await service.reconcileCCoastBeforeUpdate(
                cCoast,
                makeDto({ eRepairs: undefined }) as any,
            );

            expect(mockDeleteERepair).toHaveBeenCalledWith(rItem);
            expect(mockDeleteIRepair).not.toHaveBeenCalled();
            expect(mockDeleteORepair).not.toHaveBeenCalled();
        });

        it('should delete iRepairs when entity has them but dto does not', async () => {
            const cCoast = makeEntity({ eRepairs: null, iRepairs: rItem, oRepairs: null });
            mockDeleteIRepair.mockResolvedValue(undefined);

            await service.reconcileCCoastBeforeUpdate(
                cCoast,
                makeDto({ iRepairs: undefined }) as any,
            );

            expect(mockDeleteIRepair).toHaveBeenCalledWith(rItem);
        });

        it('should delete oRepairs when entity has them but dto does not', async () => {
            const cCoast = makeEntity({ eRepairs: null, iRepairs: null, oRepairs: rItem });
            mockDeleteORepair.mockResolvedValue(undefined);

            await service.reconcileCCoastBeforeUpdate(
                cCoast,
                makeDto({ oRepairs: undefined }) as any,
            );

            expect(mockDeleteORepair).toHaveBeenCalledWith(rItem);
        });

        it('should not delete when entity has no repairs', async () => {
            const cCoast = makeEntity({ eRepairs: null, iRepairs: null, oRepairs: null });

            await service.reconcileCCoastBeforeUpdate(cCoast, makeDto() as any);

            expect(mockDeleteERepair).not.toHaveBeenCalled();
            expect(mockDeleteIRepair).not.toHaveBeenCalled();
            expect(mockDeleteORepair).not.toHaveBeenCalled();
        });

        it('should return resolved holding coast', async () => {
            const cCoast = makeEntity();
            const result = await service.reconcileCCoastBeforeUpdate(
                cCoast,
                makeDto({ holdingCoast: 7000 }) as any,
            );
            expect(result).toBe(7000);
        });
    });

    describe('updateCCoast', () => {
        it('should update entity without repairs when dto has none', async () => {
            const cCoast = makeEntity({ eRepairs: null, iRepairs: null, oRepairs: null });
            mockCCoastUpdate.mockResolvedValue(undefined);

            await service.updateCCoast(cCoast, makeDto() as any);

            expect(mockCCoastUpdate).toHaveBeenCalled();
            expect(mockCreateERepair).not.toHaveBeenCalled();
            expect(mockCreateIRepair).not.toHaveBeenCalled();
            expect(mockCreateORepair).not.toHaveBeenCalled();
        });

        it('should update existing iRepairs', async () => {
            const cCoast = makeEntity({ iRepairs: rItem, eRepairs: null, oRepairs: null });
            mockUpdateIRepairs.mockResolvedValue(undefined);
            mockCCoastUpdate.mockResolvedValue(undefined);

            await service.updateCCoast(cCoast, makeDto({ iRepairs: rItem }) as any);

            expect(mockUpdateIRepairs).toHaveBeenCalledWith(rItem, rItem);
        });

        it('should create iRepairs when entity has none but dto has them', async () => {
            const cCoast = makeEntity({ iRepairs: null, eRepairs: null, oRepairs: null });
            mockCreateIRepair.mockResolvedValue(undefined);
            mockCCoastUpdate.mockResolvedValue(undefined);

            await service.updateCCoast(cCoast, makeDto({ iRepairs: rItem }) as any);

            expect(mockCreateIRepair).toHaveBeenCalled();
        });

        it('should update existing eRepairs', async () => {
            const cCoast = makeEntity({ eRepairs: rItem, iRepairs: null, oRepairs: null });
            mockUpdateERepairs.mockResolvedValue(undefined);
            mockCCoastUpdate.mockResolvedValue(undefined);

            await service.updateCCoast(cCoast, makeDto({ eRepairs: rItem }) as any);

            expect(mockUpdateERepairs).toHaveBeenCalledWith(rItem, rItem);
        });

        it('should create eRepairs when entity has none but dto has them', async () => {
            const cCoast = makeEntity({ eRepairs: null, iRepairs: null, oRepairs: null });
            mockCreateERepair.mockResolvedValue(undefined);
            mockCCoastUpdate.mockResolvedValue(undefined);

            await service.updateCCoast(cCoast, makeDto({ eRepairs: rItem }) as any);

            expect(mockCreateERepair).toHaveBeenCalled();
        });

        it('should update existing oRepairs', async () => {
            const cCoast = makeEntity({ oRepairs: rItem, eRepairs: null, iRepairs: null });
            mockUpdateORepairs.mockResolvedValue(undefined);
            mockCCoastUpdate.mockResolvedValue(undefined);

            await service.updateCCoast(cCoast, makeDto({ oRepairs: rItem }) as any);

            expect(mockUpdateORepairs).toHaveBeenCalledWith(rItem, rItem);
        });

        it('should create oRepairs when entity has none but dto has them', async () => {
            const cCoast = makeEntity({ oRepairs: null, eRepairs: null, iRepairs: null });
            mockCreateORepair.mockResolvedValue(undefined);
            mockCCoastUpdate.mockResolvedValue(undefined);

            await service.updateCCoast(cCoast, makeDto({ oRepairs: rItem }) as any);

            expect(mockCreateORepair).toHaveBeenCalled();
        });

        it('should update holdingCoast when dto provides one', async () => {
            const cCoast = makeEntity({ eRepairs: null, iRepairs: null, oRepairs: null });
            mockCCoastUpdate.mockResolvedValue(undefined);

            await service.updateCCoast(cCoast, makeDto({ holdingCoast: 8000 }) as any);

            expect(mockCCoastUpdate).toHaveBeenCalledWith(
                { id: 'ccoast-001' },
                expect.objectContaining({ holdingCoast: 8000 }),
            );
        });

        it('should keep existing holdingCoast when dto does not provide one', async () => {
            const cCoast = makeEntity({
                eRepairs: null,
                iRepairs: null,
                oRepairs: null,
                holdingCoast: 5000,
            });
            mockCCoastUpdate.mockResolvedValue(undefined);

            await service.updateCCoast(
                cCoast,
                makeDto({ holdingCoast: undefined, holdingCoastValue: undefined }) as any,
            );

            expect(mockCCoastUpdate).toHaveBeenCalledWith(
                { id: 'ccoast-001' },
                expect.objectContaining({ holdingCoast: 5000 }),
            );
        });

        it('should recalculate rContingencyTotal when rContingency is in dto', async () => {
            const cCoast = makeEntity({ eRepairs: null, iRepairs: null, oRepairs: null });
            mockCCoastUpdate.mockResolvedValue(undefined);
            mockDetermineNewAmount.mockReturnValue(800);

            await service.updateCCoast(cCoast, makeDto({ rContingency: 20 }) as any);

            expect(mockDetermineNewAmount).toHaveBeenCalled();
            expect(mockCCoastUpdate).toHaveBeenCalledWith(
                { id: 'ccoast-001' },
                expect.objectContaining({ rContingencyTotal: 800 }),
            );
        });

        it('should keep existing rContingencyTotal when rContingency not in dto', async () => {
            const cCoast = makeEntity({
                eRepairs: null,
                iRepairs: null,
                oRepairs: null,
                rContingencyTotal: 500,
            });
            mockCCoastUpdate.mockResolvedValue(undefined);

            await service.updateCCoast(cCoast, makeDto({ rContingency: undefined }) as any);

            expect(mockCCoastUpdate).toHaveBeenCalledWith(
                { id: 'ccoast-001' },
                expect.objectContaining({ rContingencyTotal: 500 }),
            );
        });
    });
});
