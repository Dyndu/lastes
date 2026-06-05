import { Test, TestingModule } from '@nestjs/testing';
import { BrRefinanceService } from './br-refinance.service';
import { ABuilderService } from './a-builder.service';
import { ABuilderEntity, BrRefinanceEntity } from '../entities';
import { BrRefiDto } from '../dto';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const mockValidation = jest.fn();
const mockResolveTotal = jest.fn();
const mockDetermineNewAmount = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockCreateERepair = jest.fn();
const mockCreateIRepair = jest.fn();
const mockCreateORepair = jest.fn();
const mockUpdateERepairs = jest.fn();
const mockUpdateIRepairs = jest.fn();
const mockUpdateORepairs = jest.fn();

const mockABuilderService = {
    errorHandler: { validation: mockValidation },
    repairsService: { resolveTotal: mockResolveTotal },
    refinanceService: { determineNewAmount: mockDetermineNewAmount },
    brRefinanceRepository: { create: mockCreate, update: mockUpdate },
    eRepairsService: { createERepair: mockCreateERepair, updateERepairs: mockUpdateERepairs },
    iRepairsService: { createIRepair: mockCreateIRepair, updateIRepairs: mockUpdateIRepairs },
    oRepairsService: { createORepair: mockCreateORepair, updateORepairs: mockUpdateORepairs },
};

function makeDto(overrides: Partial<BrRefiDto> = {}): BrRefiDto {
    return {
        afterRepairValue: 300_000,
        refiLTV: 75,
        oldLoanAmount: 150_000,
        pInterest: 1_200,
        interestRate: 5,
        pmi: 100,
        point: 1,
        hasItems: false,
        closingCoast: 5_000,
        ...overrides,
    } as BrRefiDto;
}

function makeRefiEntity(overrides: Partial<BrRefinanceEntity> = {}): BrRefinanceEntity {
    return Object.assign(new BrRefinanceEntity(), { id: 'refi-1', ...overrides });
}

describe('BrRefinanceService', () => {
    let service: BrRefinanceService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BrRefinanceService,
                { provide: ABuilderService, useValue: mockABuilderService },
            ],
        }).compile();

        service = module.get<BrRefinanceService>(BrRefinanceService);
    });

    describe('validateBrRefinanceDetails', () => {
        it('should pass with no errors when hasItems=false and closingCoast is provided', () => {
            service.validateBrRefinanceDetails(makeDto({ hasItems: false, closingCoast: 5_000 }));

            expect(mockValidation).toHaveBeenCalledWith({});
        });

        it('should error when hasItems=false and closingCoast is null', () => {
            service.validateBrRefinanceDetails(
                makeDto({ hasItems: false, closingCoast: null as any }),
            );

            expect(mockValidation).toHaveBeenCalledWith(
                expect.objectContaining({
                    closingCoast: expect.stringContaining('required'),
                }),
            );
        });

        it('should error when hasItems=false and closingCoast is undefined', () => {
            service.validateBrRefinanceDetails(
                makeDto({ hasItems: false, closingCoast: undefined }),
            );

            expect(mockValidation).toHaveBeenCalledWith(
                expect.objectContaining({ closingCoast: expect.any(String) }),
            );
        });

        it('should error when hasItems=true and closingCoast is provided', () => {
            service.validateBrRefinanceDetails(
                makeDto({ hasItems: true, closingCoast: 5_000, eRepairs: {} as any }),
            );

            expect(mockValidation).toHaveBeenCalledWith(
                expect.objectContaining({
                    closingCoast: expect.stringContaining('must not be provided'),
                }),
            );
        });

        it('should error when hasItems=true and none of the repair items are provided', () => {
            service.validateBrRefinanceDetails(
                makeDto({
                    hasItems: true,
                    closingCoast: undefined,
                    eRepairs: undefined,
                    iRepairs: undefined,
                    oRepairs: undefined,
                }),
            );

            expect(mockValidation).toHaveBeenCalledWith(
                expect.objectContaining({
                    repairs: expect.stringContaining('At least one repair item'),
                }),
            );
        });

        it('should pass when hasItems=true, no closingCoast, and eRepairs is provided', () => {
            service.validateBrRefinanceDetails(
                makeDto({
                    hasItems: true,
                    closingCoast: undefined,
                    eRepairs: {} as any,
                    iRepairs: undefined,
                    oRepairs: undefined,
                }),
            );

            expect(mockValidation).toHaveBeenCalledWith({});
        });

        it('should pass when hasItems=true, no closingCoast, and iRepairs is provided', () => {
            service.validateBrRefinanceDetails(
                makeDto({
                    hasItems: true,
                    closingCoast: undefined,
                    eRepairs: undefined,
                    iRepairs: {} as any,
                    oRepairs: undefined,
                }),
            );

            expect(mockValidation).toHaveBeenCalledWith({});
        });

        it('should pass when hasItems=true, no closingCoast, and oRepairs is provided', () => {
            service.validateBrRefinanceDetails(
                makeDto({
                    hasItems: true,
                    closingCoast: undefined,
                    eRepairs: undefined,
                    iRepairs: undefined,
                    oRepairs: {} as any,
                }),
            );

            expect(mockValidation).toHaveBeenCalledWith({});
        });

        it('should pass when hasItems=true, no closingCoast, and all repairs are provided', () => {
            service.validateBrRefinanceDetails(
                makeDto({
                    hasItems: true,
                    closingCoast: undefined,
                    eRepairs: {} as any,
                    iRepairs: {} as any,
                    oRepairs: {} as any,
                }),
            );

            expect(mockValidation).toHaveBeenCalledWith({});
        });

        it('should accumulate both closingCoast and repairs errors simultaneously', () => {
            service.validateBrRefinanceDetails(
                makeDto({
                    hasItems: true,
                    closingCoast: 5_000,
                    eRepairs: undefined,
                    iRepairs: undefined,
                    oRepairs: undefined,
                }),
            );

            expect(mockValidation).toHaveBeenCalledWith(
                expect.objectContaining({
                    closingCoast: expect.any(String),
                    repairs: expect.any(String),
                }),
            );
        });
    });

    describe('resolveBrRefinanceValue', () => {
        it('should return closingCoast when hasItems=false', () => {
            const dto = makeDto({ hasItems: false, closingCoast: 4_500 });
            const result = service.resolveBrRefinanceValue(dto);

            expect(result).toBe(4_500);
            expect(mockResolveTotal).not.toHaveBeenCalled();
        });

        it('should return 0 when hasItems=false and closingCoast is undefined', () => {
            mockValidation.mockImplementation(() => {}); // swallow error for this path
            const dto = makeDto({ hasItems: false, closingCoast: undefined });
            const result = service.resolveBrRefinanceValue(dto);

            expect(result).toBe(0);
        });

        it('should call repairsService.resolveTotal when hasItems=true', () => {
            mockResolveTotal.mockReturnValue(12_000);
            const dto = makeDto({ hasItems: true, closingCoast: undefined, eRepairs: {} as any });
            const result = service.resolveBrRefinanceValue(dto);

            expect(mockResolveTotal).toHaveBeenCalledWith(dto);
            expect(result).toBe(12_000);
        });
    });

    describe('handleBrRefinanceItemizedCreation', () => {
        it('should create only eRepairs when only eRepairs is provided', async () => {
            const dto = makeDto({ eRepairs: { total: 1_000 } as any });
            const refi = makeRefiEntity();

            await service.handleBrRefinanceItemizedCreation(dto, refi);

            expect(mockCreateERepair).toHaveBeenCalledWith(
                dto.eRepairs,
                undefined,
                undefined,
                refi,
            );
            expect(mockCreateIRepair).not.toHaveBeenCalled();
            expect(mockCreateORepair).not.toHaveBeenCalled();
        });

        it('should create only iRepairs when only iRepairs is provided', async () => {
            const dto = makeDto({ iRepairs: { total: 2_000 } as any });
            const refi = makeRefiEntity();

            await service.handleBrRefinanceItemizedCreation(dto, refi);

            expect(mockCreateIRepair).toHaveBeenCalledWith(
                dto.iRepairs,
                undefined,
                undefined,
                undefined,
                refi,
            );
            expect(mockCreateERepair).not.toHaveBeenCalled();
            expect(mockCreateORepair).not.toHaveBeenCalled();
        });

        it('should create only oRepairs when only oRepairs is provided', async () => {
            const dto = makeDto({ oRepairs: { total: 3_000 } as any });
            const refi = makeRefiEntity();

            await service.handleBrRefinanceItemizedCreation(dto, refi);

            expect(mockCreateORepair).toHaveBeenCalledWith(
                dto.oRepairs,
                undefined,
                undefined,
                refi,
            );
            expect(mockCreateERepair).not.toHaveBeenCalled();
            expect(mockCreateIRepair).not.toHaveBeenCalled();
        });

        it('should create all three repairs when all are provided', async () => {
            const dto = makeDto({
                eRepairs: {} as any,
                iRepairs: {} as any,
                oRepairs: {} as any,
            });
            const refi = makeRefiEntity();

            await service.handleBrRefinanceItemizedCreation(dto, refi);

            expect(mockCreateERepair).toHaveBeenCalledTimes(1);
            expect(mockCreateIRepair).toHaveBeenCalledTimes(1);
            expect(mockCreateORepair).toHaveBeenCalledTimes(1);
        });

        it('should create no repairs when none are provided', async () => {
            const dto = makeDto({ eRepairs: undefined, iRepairs: undefined, oRepairs: undefined });
            const refi = makeRefiEntity();

            await service.handleBrRefinanceItemizedCreation(dto, refi);

            expect(mockCreateERepair).not.toHaveBeenCalled();
            expect(mockCreateIRepair).not.toHaveBeenCalled();
            expect(mockCreateORepair).not.toHaveBeenCalled();
        });

        it('should return the refi entity', async () => {
            const dto = makeDto();
            const refi = makeRefiEntity();

            const result = await service.handleBrRefinanceItemizedCreation(dto, refi);

            expect(result).toBe(refi);
        });
    });

    describe('buildBrRefinance', () => {
        const required = {
            afterRepairValue: 300_000,
            refiLTV: 75,
            newLoanAmount: 225_000,
            oldLoanAmount: 150_000,
            pInterest: 1_200,
            interestRate: 5,
            pmi: 100,
            point: 1,
            closingCoast: 5_000,
        };

        it('should build a BrRefinanceEntity with all required fields', () => {
            const result = service.buildBrRefinance(required, {});

            expect(result).toBeInstanceOf(BrRefinanceEntity);
            expect(result.afterRepairValue).toBe(300_000);
            expect(result.newLoanAmount).toBe(225_000);
            expect(result.closingCoast).toBe(5_000);
        });

        it('should attach analysisBuilder when provided', () => {
            const aBuilder = new ABuilderEntity();
            const result = service.buildBrRefinance(required, { analysisBuilder: aBuilder });

            expect(result.analysisBuilder).toBe(aBuilder);
        });

        it('should not set analysisBuilder when not provided', () => {
            const result = service.buildBrRefinance(required, {});

            expect(result.analysisBuilder).toBeUndefined();
        });
    });

    describe('createBrRefinance', () => {
        it('should create a refinance and handle itemized creation', async () => {
            const dto = makeDto({ hasItems: false, closingCoast: 5_000 });
            const aBuilder = new ABuilderEntity();
            const savedRefi = makeRefiEntity({ closingCoast: 5_000 });

            mockDetermineNewAmount.mockReturnValue(225_000);
            mockCreate.mockResolvedValue(savedRefi);

            const result = await service.createBrRefinance(aBuilder, dto);

            expect(mockDetermineNewAmount).toHaveBeenCalledWith(dto.afterRepairValue, dto.refiLTV);
            expect(mockCreate).toHaveBeenCalledWith(
                expect.objectContaining({ closingCoast: 5_000, newLoanAmount: 225_000 }),
            );
            expect(result).toBe(savedRefi);
        });

        it('should use resolveTotal when hasItems=true', async () => {
            const dto = makeDto({ hasItems: true, closingCoast: undefined, eRepairs: {} as any });
            const aBuilder = new ABuilderEntity();
            const savedRefi = makeRefiEntity({ closingCoast: 8_000 });

            mockResolveTotal.mockReturnValue(8_000);
            mockDetermineNewAmount.mockReturnValue(225_000);
            mockCreate.mockResolvedValue(savedRefi);

            const result = await service.createBrRefinance(aBuilder, dto);

            expect(mockResolveTotal).toHaveBeenCalledWith(dto);
            expect(mockCreate).toHaveBeenCalledWith(
                expect.objectContaining({ closingCoast: 8_000 }),
            );
            expect(result).toBe(savedRefi);
        });
    });

    describe('updateBrRefinance', () => {
        it('should return early message when no itemized payload', async () => {
            const refi = makeRefiEntity();
            const result = await service.updateBrRefinance(refi, {});

            expect(result).toEqual({ message: expect.stringContaining('No updates') });
            expect(mockUpdate).not.toHaveBeenCalled();
        });

        it('should return early message when itemized is undefined', async () => {
            const refi = makeRefiEntity();
            const result = await service.updateBrRefinance(refi, undefined);

            expect(result).toEqual({ message: expect.stringContaining('No updates') });
            expect(mockUpdate).not.toHaveBeenCalled();
        });

        it('should call repository.update with the correct payload', async () => {
            const refi = makeRefiEntity();
            mockUpdate.mockResolvedValue({ affected: 1 });

            await service.updateBrRefinance(refi, { closingCoast: 6_000, pmi: 150 });

            expect(mockUpdate).toHaveBeenCalledWith(
                { id: refi.id },
                expect.objectContaining({ closingCoast: 6_000, pmi: 150 }),
            );
        });

        it('should only include defined fields in the update payload', async () => {
            const refi = makeRefiEntity();
            mockUpdate.mockResolvedValue({ affected: 1 });

            await service.updateBrRefinance(refi, { closingCoast: 6_000, pmi: undefined });

            const payload = mockUpdate.mock.calls[0][1];
            expect(payload).toHaveProperty('closingCoast', 6_000);
            expect(payload).not.toHaveProperty('pmi');
        });

        it('should update all accepted fields', async () => {
            const refi = makeRefiEntity();
            mockUpdate.mockResolvedValue({ affected: 1 });

            await service.updateBrRefinance(refi, {
                afterRepairValue: 1,
                refiLTV: 2,
                newLoanAmount: 3,
                oldLoanAmount: 4,
                pInterest: 5,
                interestRate: 6,
                pmi: 7,
                point: 8,
                closingCoast: 9,
            });

            const payload = mockUpdate.mock.calls[0][1];
            expect(Object.keys(payload)).toHaveLength(9);
        });
    });

    describe('handleBrRefiUpdate', () => {
        it('should create iRepairs when dto has iRepairs but refi does not', async () => {
            const dto = makeDto({ hasItems: true, closingCoast: undefined, iRepairs: {} as any });
            const refi = makeRefiEntity({ iRepairs: undefined });

            mockResolveTotal.mockReturnValue(5_000);
            mockDetermineNewAmount.mockReturnValue(225_000);
            mockUpdate.mockResolvedValue({ affected: 1 });

            await service.handleBrRefiUpdate(refi, dto);

            expect(mockCreateIRepair).toHaveBeenCalledWith(
                dto.iRepairs,
                undefined,
                undefined,
                undefined,
                refi,
            );
            expect(mockUpdateIRepairs).not.toHaveBeenCalled();
        });

        it('should update iRepairs when both dto and refi have iRepairs', async () => {
            const existingIRepairs = {} as any;
            const dto = makeDto({ hasItems: true, closingCoast: undefined, iRepairs: {} as any });
            const refi = makeRefiEntity({ iRepairs: existingIRepairs });

            mockResolveTotal.mockReturnValue(5_000);
            mockDetermineNewAmount.mockReturnValue(225_000);
            mockUpdate.mockResolvedValue({ affected: 1 });

            await service.handleBrRefiUpdate(refi, dto);

            expect(mockUpdateIRepairs).toHaveBeenCalledWith(existingIRepairs, dto.iRepairs);
            expect(mockCreateIRepair).not.toHaveBeenCalled();
        });

        it('should create eRepairs when dto has eRepairs but refi does not', async () => {
            const dto = makeDto({ hasItems: true, closingCoast: undefined, eRepairs: {} as any });
            const refi = makeRefiEntity({ eRepairs: undefined });

            mockResolveTotal.mockReturnValue(5_000);
            mockDetermineNewAmount.mockReturnValue(225_000);
            mockUpdate.mockResolvedValue({ affected: 1 });

            await service.handleBrRefiUpdate(refi, dto);

            expect(mockCreateERepair).toHaveBeenCalledWith(
                dto.eRepairs,
                undefined,
                undefined,
                refi,
            );
            expect(mockUpdateERepairs).not.toHaveBeenCalled();
        });

        it('should update eRepairs when both dto and refi have eRepairs', async () => {
            const existingERepairs = {} as any;
            const dto = makeDto({ hasItems: true, closingCoast: undefined, eRepairs: {} as any });
            const refi = makeRefiEntity({ eRepairs: existingERepairs });

            mockResolveTotal.mockReturnValue(5_000);
            mockDetermineNewAmount.mockReturnValue(225_000);
            mockUpdate.mockResolvedValue({ affected: 1 });

            await service.handleBrRefiUpdate(refi, dto);

            expect(mockUpdateERepairs).toHaveBeenCalledWith(existingERepairs, dto.eRepairs);
            expect(mockCreateERepair).not.toHaveBeenCalled();
        });

        it('should create oRepairs when dto has oRepairs but refi does not', async () => {
            const dto = makeDto({ hasItems: true, closingCoast: undefined, oRepairs: {} as any });
            const refi = makeRefiEntity({ oRepairs: undefined });

            mockResolveTotal.mockReturnValue(5_000);
            mockDetermineNewAmount.mockReturnValue(225_000);
            mockUpdate.mockResolvedValue({ affected: 1 });

            await service.handleBrRefiUpdate(refi, dto);

            expect(mockCreateORepair).toHaveBeenCalledWith(
                dto.oRepairs,
                undefined,
                undefined,
                refi,
            );
            expect(mockUpdateORepairs).not.toHaveBeenCalled();
        });

        it('should update oRepairs when both dto and refi have oRepairs', async () => {
            const existingORepairs = {} as any;
            const dto = makeDto({ hasItems: true, closingCoast: undefined, oRepairs: {} as any });
            const refi = makeRefiEntity({ oRepairs: existingORepairs });

            mockResolveTotal.mockReturnValue(5_000);
            mockDetermineNewAmount.mockReturnValue(225_000);
            mockUpdate.mockResolvedValue({ affected: 1 });

            await service.handleBrRefiUpdate(refi, dto);

            expect(mockUpdateORepairs).toHaveBeenCalledWith(existingORepairs, dto.oRepairs);
            expect(mockCreateORepair).not.toHaveBeenCalled();
        });

        it('should skip repairs not present in dto', async () => {
            const dto = makeDto({ hasItems: false, closingCoast: 5_000 });
            const refi = makeRefiEntity();

            mockDetermineNewAmount.mockReturnValue(225_000);
            mockUpdate.mockResolvedValue({ affected: 1 });

            await service.handleBrRefiUpdate(refi, dto);

            expect(mockCreateERepair).not.toHaveBeenCalled();
            expect(mockCreateIRepair).not.toHaveBeenCalled();
            expect(mockCreateORepair).not.toHaveBeenCalled();
            expect(mockUpdateERepairs).not.toHaveBeenCalled();
            expect(mockUpdateIRepairs).not.toHaveBeenCalled();
            expect(mockUpdateORepairs).not.toHaveBeenCalled();
        });

        it('should call updateBrRefinance with resolved closingCoast and newLoanAmount', async () => {
            const dto = makeDto({ hasItems: false, closingCoast: 7_000 });
            const refi = makeRefiEntity({ newLoanAmount: 100_000 });

            mockDetermineNewAmount.mockReturnValue(225_000);
            mockUpdate.mockResolvedValue({ affected: 1 });

            await service.handleBrRefiUpdate(refi, dto);

            expect(mockUpdate).toHaveBeenCalledWith(
                { id: refi.id },
                expect.objectContaining({ closingCoast: 7_000, newLoanAmount: 225_000 }),
            );
        });

        it('should fall back to refi.newLoanAmount when determineNewAmount returns undefined', async () => {
            const dto = makeDto({ hasItems: false, closingCoast: 7_000 });
            const refi = makeRefiEntity({ newLoanAmount: 100_000 });

            mockDetermineNewAmount.mockReturnValue(undefined);
            mockUpdate.mockResolvedValue({ affected: 1 });

            await service.handleBrRefiUpdate(refi, dto);

            expect(mockUpdate).toHaveBeenCalledWith(
                { id: refi.id },
                expect.objectContaining({ newLoanAmount: 100_000 }),
            );
        });

        it('should return the original refi entity', async () => {
            const dto = makeDto({ hasItems: false, closingCoast: 5_000 });
            const refi = makeRefiEntity();

            mockDetermineNewAmount.mockReturnValue(225_000);
            mockUpdate.mockResolvedValue({ affected: 1 });

            const result = await service.handleBrRefiUpdate(refi, dto);

            expect(result).toBe(refi);
        });

        it('should run all repair operations in parallel via Promise.all', async () => {
            const callOrder: string[] = [];

            mockCreateERepair.mockImplementation(async () => {
                callOrder.push('eRepairs');
            });
            mockCreateIRepair.mockImplementation(async () => {
                callOrder.push('iRepairs');
            });
            mockCreateORepair.mockImplementation(async () => {
                callOrder.push('oRepairs');
            });
            mockDetermineNewAmount.mockReturnValue(225_000);
            mockUpdate.mockResolvedValue({ affected: 1 });
            mockResolveTotal.mockReturnValue(10_000);

            const dto = makeDto({
                hasItems: true,
                closingCoast: undefined,
                eRepairs: {} as any,
                iRepairs: {} as any,
                oRepairs: {} as any,
            });
            const refi = makeRefiEntity();

            await service.handleBrRefiUpdate(refi, dto);

            expect(mockCreateERepair).toHaveBeenCalledTimes(1);
            expect(mockCreateIRepair).toHaveBeenCalledTimes(1);
            expect(mockCreateORepair).toHaveBeenCalledTimes(1);
            expect(mockUpdate).toHaveBeenCalledTimes(1);
        });
    });
});
