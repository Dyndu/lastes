import { Test, TestingModule } from '@nestjs/testing';
import { AdItemizedService } from './ad-itemized.service';
import { ABuilderService } from './a-builder.service';
import { ADetailsEntity, AdItemizedEntity, SaleEntity } from '../entities';
import { AdItemizedDto } from '../dto';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('AdItemizedService', () => {
    let service: AdItemizedService;

    const mockAdItemizedRepo = {
        findActiveOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockLogger = { info: jest.fn() };
    const mockErrorHandler = { notFound: jest.fn() };
    const mockOtherUtils = { formatCriteria: jest.fn() };

    const mockABuilderService = {
        adItemizedRepo: mockAdItemizedRepo,
        logger: mockLogger,
        errorHandler: mockErrorHandler,
        otherUtils: mockOtherUtils,
    };

    const fullItemizedFields = {
        originationFee: 100,
        hazardInsurance: 200,
        floodInsurance: 300,
        propertyTaxes: 400,
        annualAssessment: 500,
        escrowFees: 600,
        attorneyFees: 700,
        inspectionFees: 800,
        lenderFees: 900,
        recordingFees: 1000,
        appraisal: 1100,
        transferTax: 1200,
        other: 1300,
    };

    const makeDto = (overrides: Partial<typeof fullItemizedFields> = {}): AdItemizedDto =>
        ({ ...fullItemizedFields, ...overrides }) as AdItemizedDto;

    const makeADetails = (): ADetailsEntity => {
        const e = new ADetailsEntity();
        (e as any).id = 'details-abc';
        return e;
    };

    const makeSale = (): SaleEntity => {
        const e = new SaleEntity();
        (e as any).id = 'sale-001';
        return e;
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdItemizedService,
                { provide: ABuilderService, useValue: mockABuilderService },
            ],
        }).compile();

        service = module.get<AdItemizedService>(AdItemizedService);
    });

    afterEach(() => jest.clearAllMocks());

    describe('calculateItemizedAcquisitionCost', () => {
        it('should sum all 13 fields correctly', () => {
            const result = service.calculateItemizedAcquisitionCost(makeDto());
            expect(result).toBe(9100);
        });

        it('should return 0 when all values are 0', () => {
            const dto = makeDto(
                Object.fromEntries(Object.keys(fullItemizedFields).map((k) => [k, 0])) as any,
            );
            expect(service.calculateItemizedAcquisitionCost(dto)).toBe(0);
        });

        it('should skip NaN values and sum the rest', () => {
            const dto = makeDto({ originationFee: NaN, hazardInsurance: NaN });
            expect(service.calculateItemizedAcquisitionCost(dto)).toBe(8800);
        });

        it('should return 0 when all values are NaN', () => {
            const nanDto = Object.fromEntries(
                Object.keys(fullItemizedFields).map((k) => [k, NaN]),
            ) as unknown as AdItemizedDto;
            expect(service.calculateItemizedAcquisitionCost(nanDto)).toBe(0);
        });

        it('should handle decimal values correctly', () => {
            const dto = makeDto({ originationFee: 1.5, hazardInsurance: 2.5 });
            expect(service.calculateItemizedAcquisitionCost(dto)).toBeCloseTo(8804);
        });
    });

    describe('buildADItemizedEntity', () => {
        it('should return an AdItemizedEntity instance with all required fields assigned', () => {
            const result = service.buildADItemizedEntity(fullItemizedFields, {});

            expect(result).toBeInstanceOf(AdItemizedEntity);
            Object.entries(fullItemizedFields).forEach(([key, value]) => {
                expect(result[key as keyof AdItemizedEntity]).toBe(value);
            });
        });

        it('should assign aDetails when provided', () => {
            const aDetails = makeADetails();
            const result = service.buildADItemizedEntity(fullItemizedFields, { aDetails });
            expect(result.aDetails).toBe(aDetails);
        });

        it('should assign sale when provided', () => {
            const sale = makeSale();
            const result = service.buildADItemizedEntity(fullItemizedFields, { sale });
            expect(result.sale).toBe(sale);
        });

        it('should assign both aDetails and sale when both are provided', () => {
            const aDetails = makeADetails();
            const sale = makeSale();
            const result = service.buildADItemizedEntity(fullItemizedFields, { aDetails, sale });
            expect(result.aDetails).toBe(aDetails);
            expect(result.sale).toBe(sale);
        });

        it('should leave aDetails and sale undefined when optional is empty', () => {
            const result = service.buildADItemizedEntity(fullItemizedFields, {});
            expect(result.aDetails).toBeUndefined();
            expect(result.sale).toBeUndefined();
        });

        it('should assign zero values correctly', () => {
            const zeroFields = Object.fromEntries(
                Object.keys(fullItemizedFields).map((k) => [k, 0]),
            ) as typeof fullItemizedFields;

            const result = service.buildADItemizedEntity(zeroFields, {});
            Object.keys(zeroFields).forEach((key) => {
                expect(result[key as keyof AdItemizedEntity]).toBe(0);
            });
        });
    });

    describe('retrieveADItemizedByCriteria', () => {
        const criteria = { id: 'item-123' };
        const formattedEntries = 'id=item-123';
        const mockEntity = new AdItemizedEntity();

        beforeEach(() => {
            mockOtherUtils.formatCriteria.mockReturnValue(formattedEntries);
        });

        it('should return the entities when found', async () => {
            mockAdItemizedRepo.findActiveOne.mockResolvedValue(mockEntity);

            const result = await service.retrieveADItemizedByCriteria(criteria);

            expect(mockOtherUtils.formatCriteria).toHaveBeenCalledWith(criteria);
            expect(mockLogger.info).toHaveBeenCalledWith(
                `Find an acquisition itemized details  by ${formattedEntries}`,
            );
            expect(mockAdItemizedRepo.findActiveOne).toHaveBeenCalledWith(
                mockAdItemizedRepo,
                criteria,
                undefined,
            );
            expect(result).toBe(mockEntity);
        });

        it('should pass relations to findActiveOne when provided', async () => {
            mockAdItemizedRepo.findActiveOne.mockResolvedValue(mockEntity);
            const relations = ['aDetails'];

            await service.retrieveADItemizedByCriteria(criteria, relations);

            expect(mockAdItemizedRepo.findActiveOne).toHaveBeenCalledWith(
                mockAdItemizedRepo,
                criteria,
                relations,
            );
        });

        it('should call errorHandler.notFound when entities is not found', async () => {
            mockAdItemizedRepo.findActiveOne.mockResolvedValue(null);

            await service.retrieveADItemizedByCriteria(criteria);

            expect(mockErrorHandler.notFound).toHaveBeenCalledWith(
                `Data not found with ${formattedEntries}`,
                `Data not found`,
            );
        });

        it('should return null after notFound when errorHandler does not throw', async () => {
            mockAdItemizedRepo.findActiveOne.mockResolvedValue(null);
            mockErrorHandler.notFound.mockImplementation(() => {});

            const result = await service.retrieveADItemizedByCriteria(criteria);

            expect(result).toBeNull();
        });
    });

    describe('createAdItemizedEntity', () => {
        it('should build and persist the entities with dto fields only (no aDetails, no sale)', async () => {
            const dto = makeDto();
            const savedEntity = new AdItemizedEntity();
            mockAdItemizedRepo.create.mockResolvedValue(savedEntity);

            const result = await service.createAdItemizedEntity(dto);

            const calledWith = mockAdItemizedRepo.create.mock.calls[0][0];
            expect(calledWith).toBeInstanceOf(AdItemizedEntity);
            expect(calledWith.aDetails).toBeUndefined();
            expect(calledWith.sale).toBeUndefined();
            Object.entries(fullItemizedFields).forEach(([key, value]) => {
                expect(calledWith[key as keyof AdItemizedEntity]).toBe(value);
            });
            expect(result).toBe(savedEntity);
        });

        it('should assign aDetails when provided as second argument', async () => {
            const dto = makeDto();
            const aDetails = makeADetails();
            const savedEntity = new AdItemizedEntity();
            mockAdItemizedRepo.create.mockResolvedValue(savedEntity);

            await service.createAdItemizedEntity(dto, aDetails);

            const calledWith = mockAdItemizedRepo.create.mock.calls[0][0];
            expect(calledWith.aDetails).toBe(aDetails);
            expect(calledWith.sale).toBeUndefined();
        });

        it('should assign sale when provided as third argument', async () => {
            const dto = makeDto();
            const sale = makeSale();
            const savedEntity = new AdItemizedEntity();
            mockAdItemizedRepo.create.mockResolvedValue(savedEntity);

            await service.createAdItemizedEntity(dto, undefined, sale);

            const calledWith = mockAdItemizedRepo.create.mock.calls[0][0];
            expect(calledWith.sale).toBe(sale);
            expect(calledWith.aDetails).toBeUndefined();
        });

        it('should assign both aDetails and sale when both are provided', async () => {
            const dto = makeDto();
            const aDetails = makeADetails();
            const sale = makeSale();
            const savedEntity = new AdItemizedEntity();
            mockAdItemizedRepo.create.mockResolvedValue(savedEntity);

            await service.createAdItemizedEntity(dto, aDetails, sale);

            const calledWith = mockAdItemizedRepo.create.mock.calls[0][0];
            expect(calledWith.aDetails).toBe(aDetails);
            expect(calledWith.sale).toBe(sale);
        });
    });

    describe('updateADItemized', () => {
        let entity: AdItemizedEntity;

        beforeEach(() => {
            entity = new AdItemizedEntity();
            (entity as any).id = 'entities-uuid';
        });

        it('should return early message when itemized is undefined', async () => {
            const result = await service.updateADItemized(entity, undefined);
            expect(result).toEqual({ message: 'No updates provided for acquisition update' });
            expect(mockAdItemizedRepo.update).not.toHaveBeenCalled();
        });

        it('should return early message when itemized is an empty object', async () => {
            const result = await service.updateADItemized(entity, {});
            expect(result).toEqual({ message: 'No updates provided for acquisition update' });
            expect(mockAdItemizedRepo.update).not.toHaveBeenCalled();
        });

        it('should call update with only the provided fields (partial update)', async () => {
            mockAdItemizedRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateADItemized(entity, { originationFee: 999, appraisal: 50 });

            expect(mockAdItemizedRepo.update).toHaveBeenCalledWith(
                { id: 'entities-uuid' },
                { originationFee: 999, appraisal: 50 },
            );
        });

        it('should call update with all 13 fields when all are provided', async () => {
            mockAdItemizedRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateADItemized(entity, fullItemizedFields);

            expect(mockAdItemizedRepo.update).toHaveBeenCalledWith(
                { id: 'entities-uuid' },
                fullItemizedFields,
            );
        });

        it('should exclude fields with explicit undefined values from the payload', async () => {
            mockAdItemizedRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateADItemized(entity, {
                originationFee: 100,
                hazardInsurance: undefined,
            });

            const calledWith = mockAdItemizedRepo.update.mock.calls[0][1];
            expect(calledWith).toEqual({ originationFee: 100 });
            expect(calledWith).not.toHaveProperty('hazardInsurance');
        });

        it('should include fields with value 0 in the payload', async () => {
            mockAdItemizedRepo.update.mockResolvedValue({ affected: 1 });

            await service.updateADItemized(entity, { originationFee: 0 });

            const calledWith = mockAdItemizedRepo.update.mock.calls[0][1];
            expect(calledWith).toEqual({ originationFee: 0 });
        });

        it('should return the repo update result', async () => {
            const repoResult = { affected: 1 };
            mockAdItemizedRepo.update.mockResolvedValue(repoResult);

            const result = await service.updateADItemized(entity, { other: 42 });

            expect(result).toBe(repoResult);
        });
    });

    describe('updateADItemizedInfo', () => {
        it('should retrieve entities, apply all 13 field updates and return success message', async () => {
            const aDetails = makeADetails();
            const dto = makeDto();
            const foundEntity = new AdItemizedEntity();
            (foundEntity as any).id = 'item-999';

            mockOtherUtils.formatCriteria.mockReturnValue('id=item-999');
            mockAdItemizedRepo.findActiveOne.mockResolvedValue(foundEntity);
            mockAdItemizedRepo.update.mockResolvedValue({ affected: 1 });

            const result = await service.updateADItemizedInfo('item-999', aDetails, dto);

            expect(mockAdItemizedRepo.findActiveOne).toHaveBeenCalledWith(
                mockAdItemizedRepo,
                { id: 'item-999', aDetails: { id: 'details-abc' } },
                undefined,
            );
            expect(mockAdItemizedRepo.update).toHaveBeenCalledWith(
                { id: 'item-999' },
                fullItemizedFields,
            );
            expect(result).toEqual({ message: 'Acquisition items updated successfully' });
        });

        it('should propagate errors thrown by retrieveADItemizedByCriteria', async () => {
            const aDetails = makeADetails();

            mockOtherUtils.formatCriteria.mockReturnValue('id=bad-id');
            mockAdItemizedRepo.findActiveOne.mockResolvedValue(null);
            mockErrorHandler.notFound.mockImplementation(() => {
                throw new Error('Data not found');
            });

            await expect(
                service.updateADItemizedInfo('bad-id', aDetails, makeDto()),
            ).rejects.toThrow('Data not found');
        });
    });

    describe('deleteAdItemized', () => {
        it('should call repo.delete with the entity id when entity is provided', async () => {
            const entity = new AdItemizedEntity();
            (entity as any).id = 'item-to-delete';
            mockAdItemizedRepo.delete.mockResolvedValue({ affected: 1 });

            await service.deleteAdItemized(entity);

            expect(mockAdItemizedRepo.delete).toHaveBeenCalledWith({ id: 'item-to-delete' });
        });

        it('should call repo.delete with undefined id when entity is undefined', async () => {
            mockAdItemizedRepo.delete.mockResolvedValue({ affected: 0 });

            await service.deleteAdItemized(undefined);

            expect(mockAdItemizedRepo.delete).toHaveBeenCalledWith({ id: undefined });
        });

        it('should return the repo.delete result', async () => {
            const entity = new AdItemizedEntity();
            (entity as any).id = 'item-to-delete';
            const repoResult = { affected: 1 };
            mockAdItemizedRepo.delete.mockResolvedValue(repoResult);

            const result = await service.deleteAdItemized(entity);

            expect(result).toBe(repoResult);
        });
    });
});
