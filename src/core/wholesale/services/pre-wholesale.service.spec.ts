import { PreWholesaleService } from './pre-wholesale.service';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const mockErrorHandler = {
    badRequest: jest.fn().mockImplementation((msg: string) => {
        throw new Error(msg);
    }),
};

const mockWholesaleRepo = {
    create: jest.fn(),
    delete: jest.fn(),
    findOne: jest.fn(),
};

const mockABuilderRepository = { findOne: jest.fn(), delete: jest.fn() };
const mockPDetailsRepository = { delete: jest.fn() };

const mockUnitsService = { createPDetailsUnits: jest.fn() };

const mockHDurationService = {
    handleHDurationUpdate: jest.fn(),
    createHDuration: jest.fn(),
};

const mockTransformABuilderService = {
    transformPDetails: jest.fn((x) => ({ pDetails: x })),
    transformADetails: jest.fn((x) => ({ aDetails: x })),
    transformRepairs: jest.fn((x) => ({ repairs: x })),
    transformFExpenses: jest.fn((x) => ({ fExpenses: x })),
    transformHDuration: jest.fn((x) => ({ hDuration: x })),
};

const mockABuilderService = {
    aBuilderRepository: mockABuilderRepository,
    pDetailsRepository: mockPDetailsRepository,
    unitsService: mockUnitsService,
    hDurationService: mockHDurationService,
    transformABuilderService: mockTransformABuilderService,
    createABuilder: jest.fn(),
};

const mockRaABuilderService = {
    createPropertyDetailsForABuilder: jest.fn(),
    updateRentalAnalyzerPropertyDetails: jest.fn(),
};

const mockTransformRaService = {
    rABuilderEntities: jest.fn(() => [
        'propertyDetails',
        'acquisitionDetails',
        'repairs',
        'fExpenses',
    ]),
};

const mockPreRAnalysisService = {
    upsertAcquisitionDetails: jest.fn(),
    upsertRepairs: jest.fn(),
    upsertFExpenses: jest.fn(),
};

const mockRAnalyzerService = {
    getAnalysis: jest.fn(),
    aBuilderService: mockABuilderService,
    raABuilderService: mockRaABuilderService,
    transformRaService: mockTransformRaService,
    preRAnalysisService: mockPreRAnalysisService,
    retrieveABuilderByCriteria: jest.fn(),
};

describe('PreWholesaleService', () => {
    let service: PreWholesaleService;

    const mockWholesaleService = {
        wholesaleRepo: mockWholesaleRepo,
        errorHandler: mockErrorHandler,
        rAnalyzerService: {
            ...mockRAnalyzerService,
            aBuilderService: {
                ...mockABuilderService,
                createABuilder: jest.fn(),
            },
            raABuilderService: mockRaABuilderService,
        },
    };

    beforeEach(() => {
        service = new PreWholesaleService(mockWholesaleService as any);
        jest.clearAllMocks();
    });

    describe('buildWholesaleEntity', () => {
        it('assigns analysis to a new WholesaleEntity', () => {
            const analysis = { id: 'analysis-1' } as any;
            const result = service.buildWholesaleEntity({ analysis });
            expect(result.analysis).toBe(analysis);
        });
    });

    describe('createWholesale', () => {
        it('builds and persists a new wholesale entity', async () => {
            const analysis = { id: 'a1' } as any;
            const saved = { id: 'w1', analysis };
            mockWholesaleRepo.create.mockResolvedValue(saved);

            const result = await service.createWholesale(analysis);
            expect(mockWholesaleRepo.create).toHaveBeenCalled();
            expect(result).toEqual(saved);
        });
    });

    describe('getOrCreateIStrategyBuilder', () => {
        it('returns existing builder when found', async () => {
            const wholesale = { id: 'w1' } as any;
            const existing = { id: 'b1' };
            mockABuilderRepository.findOne.mockResolvedValue(existing);

            const result = await service.getOrCreateIStrategyBuilder(wholesale, []);
            expect(result).toEqual(existing);
            expect(mockABuilderService.createABuilder).not.toHaveBeenCalled();
        });

        it('creates builder when not found', async () => {
            const wholesale = { id: 'w1' } as any;
            const created = { id: 'b2' };
            mockABuilderRepository.findOne.mockResolvedValue(null);
            mockWholesaleService.rAnalyzerService.aBuilderService.createABuilder.mockResolvedValue(
                created,
            );

            const result = await service.getOrCreateIStrategyBuilder(wholesale, []);
            expect(
                mockWholesaleService.rAnalyzerService.aBuilderService.createABuilder,
            ).toHaveBeenCalledWith(undefined, undefined, undefined, wholesale);
            expect(result).toEqual(created);
        });

        it('deletes wholesale and throws on error', async () => {
            const wholesale = { id: 'w1' } as any;
            mockABuilderRepository.findOne.mockRejectedValue(new Error('DB error'));

            await expect(service.getOrCreateIStrategyBuilder(wholesale, [])).rejects.toThrow();
            expect(mockWholesaleRepo.delete).toHaveBeenCalledWith({ id: 'w1' });
        });
    });

    describe('createPropertyDetailsForAnalysisBuilderForWholesale', () => {
        it('creates and returns property details', async () => {
            const wholesale = { id: 'w1' } as any;
            const aBuilder = { id: 'b1' } as any;
            const dto = {} as any;
            const pDetails = { id: 'pd1' };
            mockRaABuilderService.createPropertyDetailsForABuilder.mockResolvedValue(pDetails);

            const result = await service.createPropertyDetailsForAnalysisBuilderForWholesale(
                wholesale,
                aBuilder,
                dto,
            );
            expect(result).toEqual(pDetails);
        });

        it('cleans up and throws on failure', async () => {
            const wholesale = { id: 'w1' } as any;
            const aBuilder = { id: 'b1' } as any;
            mockRaABuilderService.createPropertyDetailsForABuilder.mockRejectedValue(
                new Error('fail'),
            );

            await expect(
                service.createPropertyDetailsForAnalysisBuilderForWholesale(
                    wholesale,
                    aBuilder,
                    {} as any,
                ),
            ).rejects.toThrow();

            expect(mockABuilderRepository.delete).toHaveBeenCalledWith({ id: 'b1' });
            expect(mockWholesaleRepo.delete).toHaveBeenCalledWith({ id: 'w1' });
        });
    });

    describe('createUnitsForPDFWholesale', () => {
        it('creates units successfully', async () => {
            const wholesale = { id: 'w1' } as any;
            const aBuilder = { id: 'b1' } as any;
            const pDetails = { id: 'pd1' } as any;
            const dto = { units: [] } as any;
            mockUnitsService.createPDetailsUnits.mockResolvedValue(undefined);

            await expect(
                service.createUnitsForPDFWholesale(wholesale, aBuilder, pDetails, dto),
            ).resolves.not.toThrow();
        });

        it('cleans up all entities and throws on failure', async () => {
            const wholesale = { id: 'w1' } as any;
            const aBuilder = { id: 'b1' } as any;
            const pDetails = { id: 'pd1' } as any;
            mockUnitsService.createPDetailsUnits.mockRejectedValue(new Error('unit fail'));

            await expect(
                service.createUnitsForPDFWholesale(wholesale, aBuilder, pDetails, {} as any),
            ).rejects.toThrow();

            expect(mockPDetailsRepository.delete).toHaveBeenCalledWith({ id: 'pd1' });
            expect(mockABuilderRepository.delete).toHaveBeenCalledWith({ id: 'b1' });
            expect(mockWholesaleRepo.delete).toHaveBeenCalledWith({ id: 'w1' });
        });
    });

    describe('upsertWholesalePD', () => {
        it('updates property details when already present', async () => {
            const wholesale = { id: 'w1' } as any;
            const aBuilder = { id: 'b1', propertyDetails: { id: 'pd1' } } as any;
            mockRaABuilderService.updateRentalAnalyzerPropertyDetails.mockResolvedValue(undefined);

            await service.upsertWholesalePD(wholesale, aBuilder, {} as any);
            expect(mockRaABuilderService.updateRentalAnalyzerPropertyDetails).toHaveBeenCalledWith(
                'pd1',
                {},
            );
        });

        it('creates property details when not present', async () => {
            const wholesale = { id: 'w1' } as any;
            const aBuilder = { id: 'b1', propertyDetails: null } as any;
            const pDetails = { id: 'pd1' } as any;
            mockRaABuilderService.createPropertyDetailsForABuilder.mockResolvedValue(pDetails);
            mockUnitsService.createPDetailsUnits.mockResolvedValue(undefined);

            await service.upsertWholesalePD(wholesale, aBuilder, { units: [] } as any);
            expect(mockRaABuilderService.createPropertyDetailsForABuilder).toHaveBeenCalled();
        });
    });

    describe('upsertWholesaleHDuration', () => {
        it('updates existing holding duration', async () => {
            const aBuilder = { id: 'b1', hDuration: { id: 'hd1' } } as any;
            const dto = {} as any;
            mockHDurationService.handleHDurationUpdate.mockResolvedValue(undefined);

            await service.upsertWholesaleHDuration(aBuilder, dto);
            expect(mockHDurationService.handleHDurationUpdate).toHaveBeenCalledWith(
                { id: 'hd1' },
                dto,
            );
        });

        it('creates holding duration when absent', async () => {
            const aBuilder = { id: 'b1', hDuration: null } as any;
            const dto = {} as any;
            mockHDurationService.createHDuration.mockResolvedValue(undefined);

            await service.upsertWholesaleHDuration(aBuilder, dto);
            expect(mockHDurationService.createHDuration).toHaveBeenCalledWith(aBuilder, dto);
        });
    });
});
