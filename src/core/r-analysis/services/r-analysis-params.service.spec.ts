import { Test, TestingModule } from '@nestjs/testing';
import { RAnalysisParamsService } from './r-analysis-params.service';
import { RAnalysisService } from './r-analysis.service';
import { RAnalysisEntity, RAnalysisParamsEntity } from '../entities';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const mockParamsRepository = {
    create: jest.fn(),
    update: jest.fn(),
};

const mockErrorHandler = {
    conflict: jest.fn().mockImplementation(() => {
        throw new Error('Conflict');
    }),
};

const mockRAnalysisService = {
    rAnalysisParamsRepository: mockParamsRepository,
    errorHandler: mockErrorHandler,
};

function makeAnalysis(overrides: Partial<RAnalysisEntity> = {}): RAnalysisEntity {
    const entity = new RAnalysisEntity();
    Object.assign(entity, { id: 'analysis-1', params: null }, overrides);
    return entity;
}

function makeParams(overrides: Partial<RAnalysisParamsEntity> = {}): RAnalysisParamsEntity {
    const entity = new RAnalysisParamsEntity();
    Object.assign(entity, { id: 'param-1' }, overrides);
    return entity;
}

const baseRequired = {
    ltv: 80,
    occupancyRate: 0.95,
    managementFeePercent: 10,
    maintenanceEscrowPercent: 5,
};

describe('RAnalysisParamsService', () => {
    let service: RAnalysisParamsService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RAnalysisParamsService,
                {
                    provide: RAnalysisService,
                    useValue: mockRAnalysisService,
                },
            ],
        }).compile();

        service = module.get<RAnalysisParamsService>(RAnalysisParamsService);
    });

    describe('buildRParamEntity', () => {
        it('should build an entity with all required fields', () => {
            const rAnalysis = makeAnalysis();

            const result = service.buildRParamEntity(
                { rAnalysis, ...baseRequired },
                {},
            );

            expect(result).toBeInstanceOf(RAnalysisParamsEntity);
            expect(result.rAnalysis).toBe(rAnalysis);
            expect(result.ltv).toBe(baseRequired.ltv);
            expect(result.occupancyRate).toBe(baseRequired.occupancyRate);
            expect(result.managementFeePercent).toBe(baseRequired.managementFeePercent);
            expect(result.maintenanceEscrowPercent).toBe(baseRequired.maintenanceEscrowPercent);
        });

        it('should assign the optional pmi field when provided', () => {
            const rAnalysis = makeAnalysis();

            const result = service.buildRParamEntity(
                { rAnalysis, ...baseRequired },
                { pmi: 0.5 },
            );

            expect(result.pmi).toBe(0.5);
        });

        it('should not set pmi when optional object is empty', () => {
            const rAnalysis = makeAnalysis();

            const result = service.buildRParamEntity(
                { rAnalysis, ...baseRequired },
                {},
            );

            expect(result.pmi).toBeUndefined();
        });
    });

    describe('createRParam', () => {
        it('should call repository.create with the built entity', async () => {
            const rAnalysis = makeAnalysis();
            const createdEntity = makeParams();
            mockParamsRepository.create.mockResolvedValue(createdEntity);

            const result = await service.createRParam(rAnalysis, baseRequired, {});

            expect(mockParamsRepository.create).toHaveBeenCalledTimes(1);
            const passedEntity: RAnalysisParamsEntity =
                mockParamsRepository.create.mock.calls[0][0];
            expect(passedEntity).toBeInstanceOf(RAnalysisParamsEntity);
            expect(passedEntity.rAnalysis).toBe(rAnalysis);
            expect(passedEntity.ltv).toBe(baseRequired.ltv);
            expect(result).toBe(createdEntity);
        });

        it('should pass pmi to the repository when provided', async () => {
            const rAnalysis = makeAnalysis();
            mockParamsRepository.create.mockResolvedValue(makeParams());

            await service.createRParam(rAnalysis, baseRequired, { pmi: 1.2 });

            const passedEntity: RAnalysisParamsEntity =
                mockParamsRepository.create.mock.calls[0][0];
            expect(passedEntity.pmi).toBe(1.2);
        });

        it('should call errorHandler.conflict when analysis already has params', async () => {
            const rAnalysis = makeAnalysis({ params: {} as any });

            await expect(
                service.createRParam(rAnalysis, baseRequired, {}),
            ).rejects.toThrow('Conflict');

            expect(mockErrorHandler.conflict).toHaveBeenCalledWith(
                'Rental analysis already has param entity',
                "Can't add param to this anlaysis",
            );
            expect(mockParamsRepository.create).not.toHaveBeenCalled();
        });
    });

    describe('upsertRParam', () => {
        it('should call createRParam when analysis has no params', async () => {
            const rAnalysis = makeAnalysis({ params: null! });
            mockParamsRepository.create.mockResolvedValue(makeParams());

            await service.upsertRParam(rAnalysis, baseRequired, { pmi: 1 });

            expect(mockParamsRepository.create).toHaveBeenCalledTimes(1);
            expect(mockParamsRepository.update).not.toHaveBeenCalled();
        });

        it('should forward required and optional fields to createRParam', async () => {
            const rAnalysis = makeAnalysis({ params: null! });
            mockParamsRepository.create.mockResolvedValue(makeParams());

            await service.upsertRParam(rAnalysis, baseRequired, { pmi: 3 });

            const passedEntity: RAnalysisParamsEntity =
                mockParamsRepository.create.mock.calls[0][0];
            expect(passedEntity.ltv).toBe(baseRequired.ltv);
            expect(passedEntity.pmi).toBe(3);
        });

        it('should call updateRParam when analysis already has params', async () => {
            const existingParams = makeParams();
            const rAnalysis = makeAnalysis({ params: existingParams as any });
            mockParamsRepository.update.mockResolvedValue({ affected: 1 });

            await service.upsertRParam(rAnalysis, baseRequired, { pmi: 0.5 });

            expect(mockParamsRepository.update).toHaveBeenCalledTimes(1);
            expect(mockParamsRepository.create).not.toHaveBeenCalled();
        });

        it('should forward required and optional fields to updateRParam', async () => {
            const existingParams = makeParams();
            const rAnalysis = makeAnalysis({ params: existingParams as any });
            mockParamsRepository.update.mockResolvedValue({ affected: 1 });

            await service.upsertRParam(rAnalysis, baseRequired, { pmi: 2 });

            expect(mockParamsRepository.update).toHaveBeenCalledWith(
                { id: existingParams.id },
                {
                    ltv: baseRequired.ltv,
                    pmi: 2,
                    maintenanceEscrowPercent: baseRequired.maintenanceEscrowPercent,
                    managementFeePercent: baseRequired.maintenanceEscrowPercent,
                    occupancyRate: baseRequired.occupancyRate,
                },
            );
        });
    });

    describe('updateRParam', () => {
        it('should return early message when itemized is undefined', async () => {
            const params = makeParams();

            const result = await service.updateRParam(params, undefined);

            expect(result).toEqual({ message: 'No updates provided for rental params' });
            expect(mockParamsRepository.update).not.toHaveBeenCalled();
        });

        it('should return early message when itemized is an empty object', async () => {
            const params = makeParams();

            const result = await service.updateRParam(params, {});

            expect(result).toEqual({ message: 'No updates provided for rental params' });
            expect(mockParamsRepository.update).not.toHaveBeenCalled();
        });

        it('should call repository.update with only the provided fields', async () => {
            const params = makeParams();
            const updateResult = { affected: 1 };
            mockParamsRepository.update.mockResolvedValue(updateResult);

            const result = await service.updateRParam(params, { ltv: 70 });

            expect(mockParamsRepository.update).toHaveBeenCalledWith(
                { id: params.id },
                { ltv: 70 },
            );
            expect(result).toBe(updateResult);
        });

        it('should include pmi in the update payload when provided', async () => {
            const params = makeParams();
            mockParamsRepository.update.mockResolvedValue({ affected: 1 });

            await service.updateRParam(params, { pmi: 0.8, occupancyRate: 0.9 });

            expect(mockParamsRepository.update).toHaveBeenCalledWith(
                { id: params.id },
                { pmi: 0.8, occupancyRate: 0.9 },
            );
        });

        it('should update all allowed fields at once', async () => {
            const params = makeParams();
            mockParamsRepository.update.mockResolvedValue({ affected: 1 });

            const allFields = {
                ltv: 75,
                occupancyRate: 0.92,
                managementFeePercent: 8,
                maintenanceEscrowPercent: 3,
                pmi: 0.5,
            };

            await service.updateRParam(params, allFields);

            expect(mockParamsRepository.update).toHaveBeenCalledWith(
                { id: params.id },
                allFields,
            );
        });

        it('should ignore undefined values within itemized', async () => {
            const params = makeParams();
            mockParamsRepository.update.mockResolvedValue({ affected: 1 });

            await service.updateRParam(params, {
                ltv: 70,
                occupancyRate: undefined,
            });

            const [, payload] = mockParamsRepository.update.mock.calls[0];
            expect(payload).toEqual({ ltv: 70 });
            expect(payload).not.toHaveProperty('occupancyRate');
        });
    });
});
