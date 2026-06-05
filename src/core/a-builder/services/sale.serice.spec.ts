import { Test, TestingModule } from '@nestjs/testing';
import { SaleService } from './sale.service';
import { ABuilderService } from './a-builder.service';
import { ABuilderEntity, SaleEntity } from '../entities';
import { CreateSaleDto } from '../dto';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const makeABuilder = (overrides: Partial<ABuilderEntity> = {}): ABuilderEntity =>
    Object.assign(new ABuilderEntity(), { id: 'ab-001', ...overrides });

const makeSale = (overrides: Partial<SaleEntity> = {}): SaleEntity =>
    Object.assign(new SaleEntity(), {
        id: 'sale-001',
        afterRepairValue: 200000,
        targetProfit: 30000,
        saleClosingCoast: 5000,
        ...overrides,
    });

const makeCreateSaleDto = (overrides: Partial<CreateSaleDto> = {}): CreateSaleDto => ({
    afterRepairValue: 200000,
    targetProfit: 30000,
    saleClosingCoast: 5000,
    agentCommission: 2,
    item: undefined,
    ...overrides,
});

const mockSaleRepositoryCreate = jest.fn();
const mockSaleRepositoryUpdate = jest.fn();
const mockCalculateItemizedAcquisitionCost = jest.fn();
const mockCreateAdItemizedEntity = jest.fn();

const mockABuilderService = {
    saleRepository: {
        create: mockSaleRepositoryCreate,
        update: mockSaleRepositoryUpdate,
    },
    adItemizedService: {
        calculateItemizedAcquisitionCost: mockCalculateItemizedAcquisitionCost,
        createAdItemizedEntity: mockCreateAdItemizedEntity,
    },
};

describe('SaleService', () => {
    let service: SaleService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [SaleService, { provide: ABuilderService, useValue: mockABuilderService }],
        }).compile();

        service = module.get<SaleService>(SaleService);
    });

    afterEach(() => jest.clearAllMocks());

    describe('buildSaleEntity', () => {
        it('should return a SaleEntity instance', () => {
            const result = service.buildSaleEntity(
                {
                    afterRepairValue: 100000,
                    targetProfit: 20000,
                    saleClosingCoast: 3000,
                    agentCommission: 2,
                },
                {},
            );
            expect(result).toBeInstanceOf(SaleEntity);
        });

        it('should assign all required fields to the entities', () => {
            const required = {
                afterRepairValue: 150000,
                targetProfit: 25000,
                saleClosingCoast: 4000,
                agentCommission: 2,
            };
            const result = service.buildSaleEntity(required, {});

            expect(result.afterRepairValue).toBe(150000);
            expect(result.targetProfit).toBe(25000);
            expect(result.saleClosingCoast).toBe(4000);
        });

        it('should assign the optional analysisBuilder when provided', () => {
            const aBuilder = makeABuilder();
            const result = service.buildSaleEntity(
                {
                    afterRepairValue: 100000,
                    targetProfit: 10000,
                    saleClosingCoast: 2000,
                    agentCommission: 2,
                },
                { analysisBuilder: aBuilder },
            );
            expect(result.analysisBuilder).toBe(aBuilder);
        });

        it('should leave analysisBuilder undefined when not provided', () => {
            const result = service.buildSaleEntity(
                {
                    afterRepairValue: 100000,
                    targetProfit: 10000,
                    saleClosingCoast: 2000,
                    agentCommission: 2,
                },
                {},
            );
            expect(result.analysisBuilder).toBeUndefined();
        });
    });

    describe('createSale', () => {
        it('should use saleClosingCoast from DTO when it is provided', async () => {
            const dto = makeCreateSaleDto({ saleClosingCoast: 5000, item: undefined });
            const createdSale = makeSale();
            mockSaleRepositoryCreate.mockResolvedValue(createdSale);

            const result = await service.createSale(dto);

            expect(mockCalculateItemizedAcquisitionCost).not.toHaveBeenCalled();

            expect(mockSaleRepositoryCreate).toHaveBeenCalledWith(
                expect.objectContaining({ saleClosingCoast: 5000 }),
            );
            expect(result).toBe(createdSale);
        });

        it('should calculate saleClosingCoast from item when saleClosingCoast is not provided', async () => {
            const item = { originationFee: 1000 } as any;
            const dto = makeCreateSaleDto({ saleClosingCoast: undefined, item });
            const createdSale = makeSale({ saleClosingCoast: 7000 });

            mockCalculateItemizedAcquisitionCost.mockReturnValue(7000);
            mockSaleRepositoryCreate.mockResolvedValue(createdSale);
            mockCreateAdItemizedEntity.mockResolvedValue(undefined);

            const result = await service.createSale(dto);

            expect(mockCalculateItemizedAcquisitionCost).toHaveBeenCalledWith(item);
            expect(mockSaleRepositoryCreate).toHaveBeenCalledWith(
                expect.objectContaining({ saleClosingCoast: 7000 }),
            );
            expect(result).toBe(createdSale);
        });

        it('should call createAdItemizedEntity with item and sale when item is present', async () => {
            const item = { originationFee: 1000 } as any;
            const dto = makeCreateSaleDto({ saleClosingCoast: 5000, item });
            const createdSale = makeSale();

            mockSaleRepositoryCreate.mockResolvedValue(createdSale);
            mockCreateAdItemizedEntity.mockResolvedValue(undefined);

            await service.createSale(dto);

            expect(mockCreateAdItemizedEntity).toHaveBeenCalledWith(item, undefined, createdSale);
        });

        it('should NOT call createAdItemizedEntity when item is absent', async () => {
            const dto = makeCreateSaleDto({ saleClosingCoast: 5000, item: undefined });
            mockSaleRepositoryCreate.mockResolvedValue(makeSale());

            await service.createSale(dto);

            expect(mockCreateAdItemizedEntity).not.toHaveBeenCalled();
        });

        it('should associate the analysisBuilder with the created entities when aBuilder is provided', async () => {
            const aBuilder = makeABuilder();
            const dto = makeCreateSaleDto({ saleClosingCoast: 5000 });
            mockSaleRepositoryCreate.mockResolvedValue(makeSale());

            await service.createSale(dto, aBuilder);

            expect(mockSaleRepositoryCreate).toHaveBeenCalledWith(
                expect.objectContaining({ analysisBuilder: aBuilder }),
            );
        });

        it('should leave analysisBuilder undefined when no aBuilder is passed', async () => {
            const dto = makeCreateSaleDto({ saleClosingCoast: 5000 });
            mockSaleRepositoryCreate.mockResolvedValue(makeSale());

            await service.createSale(dto);

            const calledWith = mockSaleRepositoryCreate.mock.calls[0][0];
            expect(calledWith.analysisBuilder).toBeUndefined();
        });
    });

    describe('updateSaleEntity', () => {
        it('should return a no-update message when itemized is undefined', async () => {
            const sale = makeSale();

            const result = await service.updateSaleEntity(sale, undefined);

            expect(result).toEqual({ message: 'No updates provided for sales update' });
            expect(mockSaleRepositoryUpdate).not.toHaveBeenCalled();
        });

        it('should return a no-update message when itemized is an empty object', async () => {
            const sale = makeSale();

            const result = await service.updateSaleEntity(sale, {});

            expect(result).toEqual({ message: 'No updates provided for sales update' });
            expect(mockSaleRepositoryUpdate).not.toHaveBeenCalled();
        });

        it('should call saleRepository.update with only the provided fields', async () => {
            const sale = makeSale({ id: 'sale-001' });
            const updateData = { afterRepairValue: 999999 };
            mockSaleRepositoryUpdate.mockResolvedValue({ affected: 1 });

            await service.updateSaleEntity(sale, updateData);

            expect(mockSaleRepositoryUpdate).toHaveBeenCalledWith(
                { id: 'sale-001' },
                { afterRepairValue: 999999 },
            );
        });

        it('should include all three fields in the payload when all are provided', async () => {
            const sale = makeSale({ id: 'sale-001' });
            const updateData = {
                afterRepairValue: 300000,
                targetProfit: 50000,
                saleClosingCoast: 8000,
            };
            mockSaleRepositoryUpdate.mockResolvedValue({ affected: 1 });

            await service.updateSaleEntity(sale, updateData);

            expect(mockSaleRepositoryUpdate).toHaveBeenCalledWith(
                { id: 'sale-001' },
                { afterRepairValue: 300000, targetProfit: 50000, saleClosingCoast: 8000 },
            );
        });

        it('should only include fields that are not undefined in the payload', async () => {
            const sale = makeSale({ id: 'sale-001' });
            const updateData = {
                afterRepairValue: 250000,
                targetProfit: undefined,
                saleClosingCoast: 6000,
            };
            mockSaleRepositoryUpdate.mockResolvedValue({ affected: 1 });

            await service.updateSaleEntity(sale, updateData);

            expect(mockSaleRepositoryUpdate).toHaveBeenCalledWith(
                { id: 'sale-001' },
                { afterRepairValue: 250000, saleClosingCoast: 6000 },
            );
        });

        it('should return the result from saleRepository.update', async () => {
            const sale = makeSale();
            const updateResult = { affected: 1 };
            mockSaleRepositoryUpdate.mockResolvedValue(updateResult);

            const result = await service.updateSaleEntity(sale, { targetProfit: 40000 });

            expect(result).toBe(updateResult);
        });
    });
});
