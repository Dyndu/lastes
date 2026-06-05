import { Test, TestingModule } from '@nestjs/testing';
import { RDurationService } from './r-duration.service';
import { ABuilderService } from './a-builder.service';
import { ABuilderEntity, RDurationEntity } from '../entities';
import { RDurationDto } from '../dto';

jest.mock('uuid', () => ({ v4: jest.fn(() => 'mock-uuid-1234') }));

const mockValidation = jest.fn();
const mockCalculateItemizedAcquisitionCost = jest.fn();
const mockCreateAdItemizedEntity = jest.fn();
const mockConvertWeeksToMonths = jest.fn();
const mockDetermineNewAmount = jest.fn();
const mockRDurationRepositoryCreate = jest.fn();
const mockRDurationRepositoryUpdate = jest.fn();
const mockAdItemizedRepoDelete = jest.fn();

const mockABuilderService = {
    errorHandler: { validation: mockValidation },
    adItemizedService: {
        calculateItemizedAcquisitionCost: mockCalculateItemizedAcquisitionCost,
        createAdItemizedEntity: mockCreateAdItemizedEntity,
    },
    hCoastService: { convertWeeksToMonths: mockConvertWeeksToMonths },
    refinanceService: { determineNewAmount: mockDetermineNewAmount },
    rDurationRepository: {
        create: mockRDurationRepositoryCreate,
        update: mockRDurationRepositoryUpdate,
    },
    adItemizedRepo: { delete: mockAdItemizedRepoDelete },
};

function makeDto(overrides: Partial<RDurationDto> = {}): RDurationDto {
    return {
        rehabDuration: 3,
        rContingency: 10,
        hasItems: false,
        holdingCoast: 4_800,
        ...overrides,
    } as RDurationDto;
}

function makeEntity(overrides: Partial<RDurationEntity> = {}): RDurationEntity {
    return Object.assign(new RDurationEntity(), {
        id: 'rdur-001',
        rehabDuration: 3,
        duration: 3,
        rContingency: 10,
        holdingCoast: 4_800,
        rContingencyAmount: 480,
        itemized: null,
        ...overrides,
    });
}

describe('RDurationService', () => {
    let service: RDurationService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RDurationService,
                { provide: ABuilderService, useValue: mockABuilderService },
            ],
        }).compile();

        service = module.get<RDurationService>(RDurationService);
    });

    describe('convertYearsToMonths', () => {
        it('should convert 1 year to 12 months', () => {
            expect(service.convertYearsToMonths(1)).toBe(12);
        });

        it('should convert 0.5 years to 6 months', () => {
            expect(service.convertYearsToMonths(0.5)).toBe(6);
        });

        it('should convert 0 years to 0 months', () => {
            expect(service.convertYearsToMonths(0)).toBe(0);
        });

        it('should round fractional results to nearest integer', () => {
            expect(service.convertYearsToMonths(0.1)).toBe(1);
        });

        it('should round 0.083 years (1 month) correctly', () => {
            expect(service.convertYearsToMonths(0.083)).toBe(1);
        });

        it('should handle large values', () => {
            expect(service.convertYearsToMonths(10)).toBe(120);
        });
    });

    describe('validateRDurationDetails', () => {
        it('should pass with no errors when hasItems=false and holdingCoast is provided', () => {
            service.validateRDurationDetails(makeDto({ hasItems: false, holdingCoast: 4_800 }));
            expect(mockValidation).toHaveBeenCalledWith({});
        });

        it('should error when hasItems=true and item is not provided', () => {
            service.validateRDurationDetails(
                makeDto({ hasItems: true, holdingCoast: undefined, item: undefined }),
            );
            expect(mockValidation).toHaveBeenCalledWith(
                expect.objectContaining({
                    item: expect.stringContaining('required'),
                }),
            );
        });

        it('should not error item when hasItems=true and item is provided', () => {
            service.validateRDurationDetails(
                makeDto({ hasItems: true, holdingCoast: undefined, item: {} as any }),
            );
            const errors = mockValidation.mock.calls[0][0];
            expect(errors['item']).toBeUndefined();
        });

        it('should error when hasItems=false and holdingCoast is null', () => {
            service.validateRDurationDetails(
                makeDto({ hasItems: false, holdingCoast: null as any }),
            );
            expect(mockValidation).toHaveBeenCalledWith(
                expect.objectContaining({
                    holdingCoast: expect.stringContaining('required'),
                }),
            );
        });

        it('should error when hasItems=false and holdingCoast is undefined', () => {
            service.validateRDurationDetails(makeDto({ hasItems: false, holdingCoast: undefined }));
            expect(mockValidation).toHaveBeenCalledWith(
                expect.objectContaining({ holdingCoast: expect.any(String) }),
            );
        });

        it('should error when hasItems=true and holdingCoast is provided', () => {
            service.validateRDurationDetails(
                makeDto({ hasItems: true, holdingCoast: 5_000, item: {} as any }),
            );
            expect(mockValidation).toHaveBeenCalledWith(
                expect.objectContaining({
                    holdingCoast: expect.stringContaining('must not be provided'),
                }),
            );
        });

        it('should accumulate both item and holdingCoast errors simultaneously', () => {
            service.validateRDurationDetails(
                makeDto({ hasItems: true, holdingCoast: 5_000, item: undefined }),
            );
            expect(mockValidation).toHaveBeenCalledWith(
                expect.objectContaining({
                    item: expect.any(String),
                    holdingCoast: expect.any(String),
                }),
            );
        });
    });

    describe('buildRDurationEntity', () => {
        const required = {
            rehabDuration: 3,
            duration: 3,
            rContingency: 10,
            holdingCoast: 4_800,
            rContingencyAmount: 480,
        };

        it('should return a RDurationEntity instance with required fields', () => {
            const result = service.buildRDurationEntity(required, {});
            expect(result).toBeInstanceOf(RDurationEntity);
            expect(result.rehabDuration).toBe(3);
            expect(result.duration).toBe(3);
            expect(result.rContingency).toBe(10);
            expect(result.holdingCoast).toBe(4_800);
            expect(result.rContingencyAmount).toBe(480);
        });

        it('should assign analysisBuilder when provided', () => {
            const aBuilder = new ABuilderEntity();
            const result = service.buildRDurationEntity(required, { analysisBuilder: aBuilder });
            expect(result.analysisBuilder).toBe(aBuilder);
        });

        it('should leave analysisBuilder undefined when not provided', () => {
            const result = service.buildRDurationEntity(required, {});
            expect(result.analysisBuilder).toBeUndefined();
        });

        it('should assign zero values correctly', () => {
            const result = service.buildRDurationEntity(
                { ...required, holdingCoast: 0, rContingencyAmount: 0 },
                {},
            );
            expect(result.holdingCoast).toBe(0);
            expect(result.rContingencyAmount).toBe(0);
        });
    });

    describe('resolveRehabDurationValue', () => {
        it('should return holdingCoast when hasItems=false and no item', () => {
            const dto = makeDto({ hasItems: false, holdingCoast: 4_800 });
            const result = service.resolveRehabDurationValue(dto);
            expect(result).toBe(4_800);
            expect(mockCalculateItemizedAcquisitionCost).not.toHaveBeenCalled();
        });

        it('should return 0 when hasItems=false and holdingCoast is undefined', () => {
            mockValidation.mockImplementation(() => {});
            const dto = makeDto({ hasItems: false, holdingCoast: undefined });
            const result = service.resolveRehabDurationValue(dto);
            expect(result).toBe(0);
        });

        it('should call calculateItemizedAcquisitionCost when item is provided', () => {
            mockCalculateItemizedAcquisitionCost.mockReturnValue(12_000);
            const dto = makeDto({ hasItems: true, holdingCoast: undefined, item: {} as any });
            const result = service.resolveRehabDurationValue(dto);
            expect(mockCalculateItemizedAcquisitionCost).toHaveBeenCalledWith(dto.item);
            expect(result).toBe(12_000);
        });

        it('should always call validateRDurationDetails', () => {
            const dto = makeDto();
            service.resolveRehabDurationValue(dto);
            expect(mockValidation).toHaveBeenCalledTimes(1);
        });
    });

    describe('handleRDurationItemizedCreation', () => {
        it('should call createAdItemizedEntity when dto.item is provided', async () => {
            const dto = makeDto({ item: { originationFee: 100 } as any });
            const rDuration = makeEntity();
            mockCreateAdItemizedEntity.mockResolvedValue(undefined);

            await service.handleRDurationItemizedCreation(dto, rDuration);

            expect(mockCreateAdItemizedEntity).toHaveBeenCalledWith(
                dto.item,
                undefined,
                undefined,
                rDuration,
            );
        });

        it('should not call createAdItemizedEntity when dto.item is undefined', async () => {
            const dto = makeDto({ item: undefined });
            const rDuration = makeEntity();

            await service.handleRDurationItemizedCreation(dto, rDuration);

            expect(mockCreateAdItemizedEntity).not.toHaveBeenCalled();
        });
    });

    describe('createRDuration', () => {
        it('should create entity with resolved holdingCoast and return it', async () => {
            const dto = makeDto({ hasItems: false, holdingCoast: 4_800 });
            const aBuilder = new ABuilderEntity();
            const saved = makeEntity();

            mockConvertWeeksToMonths.mockReturnValue(3);
            mockDetermineNewAmount.mockReturnValue(480);
            mockRDurationRepositoryCreate.mockResolvedValue(saved);

            const result = await service.createRDuration(aBuilder, dto);

            expect(mockRDurationRepositoryCreate).toHaveBeenCalledWith(
                expect.objectContaining({
                    holdingCoast: 4_800,
                    duration: 3,
                    rContingencyAmount: 480,
                }),
            );
            expect(result).toBe(saved);
        });

        it('should pass analysisBuilder to buildRDurationEntity', async () => {
            const dto = makeDto();
            const aBuilder = new ABuilderEntity();
            const saved = makeEntity();

            mockConvertWeeksToMonths.mockReturnValue(3);
            mockDetermineNewAmount.mockReturnValue(480);
            mockRDurationRepositoryCreate.mockResolvedValue(saved);

            await service.createRDuration(aBuilder, dto);

            expect(mockRDurationRepositoryCreate).toHaveBeenCalledWith(
                expect.objectContaining({ analysisBuilder: aBuilder }),
            );
        });

        it('should call handleRDurationItemizedCreation after creating entity', async () => {
            const dto = makeDto({ item: { originationFee: 100 } as any });
            const aBuilder = new ABuilderEntity();
            const saved = makeEntity();

            mockConvertWeeksToMonths.mockReturnValue(3);
            mockDetermineNewAmount.mockReturnValue(480);
            mockRDurationRepositoryCreate.mockResolvedValue(saved);
            mockCreateAdItemizedEntity.mockResolvedValue(undefined);

            await service.createRDuration(aBuilder, dto);

            expect(mockCreateAdItemizedEntity).toHaveBeenCalledWith(
                dto.item,
                undefined,
                undefined,
                saved,
            );
        });

        it('should use convertWeeksToMonths for duration computation', async () => {
            const dto = makeDto();
            const aBuilder = new ABuilderEntity();
            mockConvertWeeksToMonths.mockReturnValue(6);
            mockDetermineNewAmount.mockReturnValue(100);
            mockRDurationRepositoryCreate.mockResolvedValue(makeEntity());

            await service.createRDuration(aBuilder, dto);

            expect(mockConvertWeeksToMonths).toHaveBeenCalledWith(dto.rehabDuration);
            expect(mockRDurationRepositoryCreate).toHaveBeenCalledWith(
                expect.objectContaining({ duration: 6 }),
            );
        });

        it('should use determineNewAmount for rContingencyAmount computation', async () => {
            const dto = makeDto({ rContingency: 15, holdingCoast: 5_000 });
            const aBuilder = new ABuilderEntity();
            mockConvertWeeksToMonths.mockReturnValue(3);
            mockDetermineNewAmount.mockReturnValue(750);
            mockRDurationRepositoryCreate.mockResolvedValue(makeEntity());

            await service.createRDuration(aBuilder, dto);

            expect(mockDetermineNewAmount).toHaveBeenCalledWith(dto.rContingency, 5_000);
            expect(mockRDurationRepositoryCreate).toHaveBeenCalledWith(
                expect.objectContaining({ rContingencyAmount: 750 }),
            );
        });
    });

    describe('updateRDuration', () => {
        let entity: RDurationEntity;

        beforeEach(() => {
            entity = makeEntity();
        });

        it('should return early message when pUpdates is undefined', async () => {
            const result = await service.updateRDuration(entity, undefined);
            expect(result).toEqual({ message: expect.stringContaining('No updates') });
            expect(mockRDurationRepositoryUpdate).not.toHaveBeenCalled();
        });

        it('should return early message when pUpdates is empty object', async () => {
            const result = await service.updateRDuration(entity, {});
            expect(result).toEqual({ message: expect.stringContaining('No updates') });
            expect(mockRDurationRepositoryUpdate).not.toHaveBeenCalled();
        });

        it('should call update with only defined fields', async () => {
            mockRDurationRepositoryUpdate.mockResolvedValue({ affected: 1 });
            await service.updateRDuration(entity, { holdingCoast: 6_000, rContingency: 12 });
            expect(mockRDurationRepositoryUpdate).toHaveBeenCalledWith(
                { id: entity.id },
                expect.objectContaining({ holdingCoast: 6_000, rContingency: 12 }),
            );
        });

        it('should exclude undefined fields from payload', async () => {
            mockRDurationRepositoryUpdate.mockResolvedValue({ affected: 1 });
            await service.updateRDuration(entity, { rehabDuration: 4, duration: undefined });
            const payload = mockRDurationRepositoryUpdate.mock.calls[0][1];
            expect(payload).toHaveProperty('rehabDuration', 4);
            expect(payload).not.toHaveProperty('duration');
        });

        it('should include all accepted fields when all provided', async () => {
            mockRDurationRepositoryUpdate.mockResolvedValue({ affected: 1 });
            const updates = {
                rehabDuration: 1,
                duration: 2,
                rContingency: 3,
                holdingCoast: 4,
                rContingencyAmount: 5,
            };
            await service.updateRDuration(entity, updates);
            expect(mockRDurationRepositoryUpdate).toHaveBeenCalledWith({ id: entity.id }, updates);
        });

        it('should include fields with value 0', async () => {
            mockRDurationRepositoryUpdate.mockResolvedValue({ affected: 1 });
            await service.updateRDuration(entity, { holdingCoast: 0 });
            const payload = mockRDurationRepositoryUpdate.mock.calls[0][1];
            expect(payload).toHaveProperty('holdingCoast', 0);
        });

        it('should return the repository update result', async () => {
            const mockResult = { affected: 1, raw: [] };
            mockRDurationRepositoryUpdate.mockResolvedValue(mockResult);
            const result = await service.updateRDuration(entity, { rehabDuration: 5 });
            expect(result).toBe(mockResult);
        });
    });

    describe('handleRDurationUpdate', () => {
        it('should delete itemized when rDuration.itemized exists', async () => {
            const rDuration = makeEntity({ itemized: { id: 'item-001' } as any });
            const dto = makeDto();
            mockAdItemizedRepoDelete.mockResolvedValue(undefined);
            mockRDurationRepositoryUpdate.mockResolvedValue({ affected: 1 });

            await service.handleRDurationUpdate(rDuration, dto);

            expect(mockAdItemizedRepoDelete).toHaveBeenCalledWith({
                rDuration: { id: rDuration.id },
            });
        });

        it('should not delete itemized when rDuration.itemized is null', async () => {
            const rDuration = makeEntity({ itemized: null! });
            const dto = makeDto();
            mockRDurationRepositoryUpdate.mockResolvedValue({ affected: 1 });

            await service.handleRDurationUpdate(rDuration, dto);

            expect(mockAdItemizedRepoDelete).not.toHaveBeenCalled();
        });

        it('should call updateRDuration with resolved holdingCoast', async () => {
            const rDuration = makeEntity();
            const dto = makeDto({ hasItems: false, holdingCoast: 7_200 });
            mockRDurationRepositoryUpdate.mockResolvedValue({ affected: 1 });

            await service.handleRDurationUpdate(rDuration, dto);

            expect(mockRDurationRepositoryUpdate).toHaveBeenCalledWith(
                { id: rDuration.id },
                expect.objectContaining({ holdingCoast: 7_200 }),
            );
        });

        it('should recalculate duration from convertYearsToMonths when dto.rehabDuration is provided', async () => {
            const rDuration = makeEntity({ duration: 3 });
            const dto = makeDto({ rehabDuration: 2, holdingCoast: 4_800 });
            mockRDurationRepositoryUpdate.mockResolvedValue({ affected: 1 });

            await service.handleRDurationUpdate(rDuration, dto);

            const payload = mockRDurationRepositoryUpdate.mock.calls[0][1];
            expect(payload.duration).toBe(24);
        });

        it('should fallback to rDuration.duration when dto.rehabDuration is falsy', async () => {
            const rDuration = makeEntity({ duration: 5 });
            const dto = makeDto({ rehabDuration: 0, holdingCoast: 4_800 });
            mockRDurationRepositoryUpdate.mockResolvedValue({ affected: 1 });

            await service.handleRDurationUpdate(rDuration, dto);

            const payload = mockRDurationRepositoryUpdate.mock.calls[0][1];
            expect(payload.duration).toBe(rDuration.duration);
        });

        it('should recalculate rContingencyAmount from determineNewAmount when dto.rContingency is provided', async () => {
            const rDuration = makeEntity({ rContingencyAmount: 100 });
            const dto = makeDto({ rContingency: 20, holdingCoast: 5_000 });
            mockDetermineNewAmount.mockReturnValue(1_000);
            mockRDurationRepositoryUpdate.mockResolvedValue({ affected: 1 });

            await service.handleRDurationUpdate(rDuration, dto);

            expect(mockDetermineNewAmount).toHaveBeenCalledWith(20, 5_000);
            const payload = mockRDurationRepositoryUpdate.mock.calls[0][1];
            expect(payload.rContingencyAmount).toBe(1_000);
        });

        it('should fallback to rDuration.rContingencyAmount when dto.rContingency is falsy', async () => {
            const rDuration = makeEntity({ rContingencyAmount: 999 });
            const dto = makeDto({ rContingency: 0, holdingCoast: 4_800 });
            mockRDurationRepositoryUpdate.mockResolvedValue({ affected: 1 });

            await service.handleRDurationUpdate(rDuration, dto);

            const payload = mockRDurationRepositoryUpdate.mock.calls[0][1];
            expect(payload.rContingencyAmount).toBe(rDuration.rContingencyAmount);
        });

        it('should call handleRDurationItemizedCreation after updating', async () => {
            const rDuration = makeEntity();
            const dto = makeDto({ item: { originationFee: 500 } as any });
            mockRDurationRepositoryUpdate.mockResolvedValue({ affected: 1 });
            mockCreateAdItemizedEntity.mockResolvedValue(undefined);

            await service.handleRDurationUpdate(rDuration, dto);

            expect(mockCreateAdItemizedEntity).toHaveBeenCalledWith(
                dto.item,
                undefined,
                undefined,
                rDuration,
            );
        });

        it('should return the rDuration entity', async () => {
            const rDuration = makeEntity();
            const dto = makeDto();
            mockRDurationRepositoryUpdate.mockResolvedValue({ affected: 1 });

            const result = await service.handleRDurationUpdate(rDuration, dto);

            expect(result).toBe(rDuration);
        });
    });
});
