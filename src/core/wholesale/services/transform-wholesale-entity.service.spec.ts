import { TransformWholesaleEntityService } from './transform-wholesale-entity.service';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

const mockTransformABuilderService = {
    transformPDetails: jest.fn((x) => ({ pDetails: x })),
    transformADetails: jest.fn((x) => ({ aDetails: x })),
    transformRepairs: jest.fn((x) => ({ repairs: x })),
    transformFExpenses: jest.fn((x) => ({ fExpenses: x })),
    transformHDuration: jest.fn((x) => ({ hDuration: x })),
};

const mockTransformRaService = {
    rABuilderEntities: jest.fn(() => [
        'propertyDetails',
        'acquisitionDetails',
        'repairs',
        'fExpenses',
    ]),
};

describe('TransformWholesaleEntityService', () => {
    let service: TransformWholesaleEntityService;

    const mockWholesaleServiceForTransform = {
        rAnalyzerService: {
            transformRaService: mockTransformRaService,
            aBuilderService: {
                transformABuilderService: mockTransformABuilderService,
            },
        },
    };

    beforeEach(() => {
        service = new TransformWholesaleEntityService(mockWholesaleServiceForTransform as any);
        jest.clearAllMocks();
    });

    describe('wholesaleBuilderCheckEntities', () => {
        it('returns the required check relations', () => {
            expect(service.wholesaleBuilderCheckEntities()).toEqual([
                'module',
                'createdBy',
                'wholesale',
            ]);
        });
    });

    describe('durationItemEntities', () => {
        it('returns the holding duration itemized relation path', () => {
            expect(service.durationItemEntities()).toEqual(['hDuration.itemized']);
        });
    });

    describe('durationEntities', () => {
        it('includes hDuration and its itemized relations', () => {
            const result = service.durationEntities();
            expect(result).toContain('hDuration');
            expect(result).toContain('hDuration.itemized');
        });
    });

    describe('wholesaleBuilderEntities', () => {
        it('combines rABuilder entities with duration entities', () => {
            mockTransformRaService.rABuilderEntities.mockReturnValue([
                'propertyDetails',
                'acquisitionDetails',
            ]);
            const result = service.wholesaleBuilderEntities();
            expect(result).toContain('propertyDetails');
            expect(result).toContain('acquisitionDetails');
            expect(result).toContain('hDuration');
        });
    });

    describe('transformWholesaleABuilder', () => {
        it('returns idAnalysis with all sections null when aBuilder is empty', () => {
            const result = service.transformWholesaleABuilder('a1', {} as any);
            expect(result.idAnalysis).toBe('a1');
            expect(result.propertyDetails).toBeNull();
            expect(result.acquisitionDetails).toBeNull();
            expect(result.repairs).toBeNull();
            expect(result.fExpenses).toBeNull();
            expect(result.hDuration).toBeNull();
        });

        it('transforms each section when present', () => {
            const aBuilder = {
                propertyDetails: { id: 'pd1' },
                acquisitionDetails: { id: 'ad1' },
                repairs: { id: 'r1' },
                fExpenses: { id: 'fe1' },
                hDuration: { id: 'hd1' },
            } as any;

            const result = service.transformWholesaleABuilder('a1', aBuilder);

            expect(mockTransformABuilderService.transformPDetails).toHaveBeenCalledWith(
                aBuilder.propertyDetails,
            );
            expect(mockTransformABuilderService.transformADetails).toHaveBeenCalledWith(
                aBuilder.acquisitionDetails,
            );
            expect(mockTransformABuilderService.transformRepairs).toHaveBeenCalledWith(
                aBuilder.repairs,
            );
            expect(mockTransformABuilderService.transformFExpenses).toHaveBeenCalledWith(
                aBuilder.fExpenses,
            );
            expect(mockTransformABuilderService.transformHDuration).toHaveBeenCalledWith(
                aBuilder.hDuration,
            );

            expect(result.propertyDetails).toBeDefined();
            expect(result.acquisitionDetails).toBeDefined();
            expect(result.repairs).toBeDefined();
            expect(result.fExpenses).toBeDefined();
            expect(result.hDuration).toBeDefined();
        });

        it('transforms only present sections when some are missing', () => {
            const aBuilder = {
                propertyDetails: { id: 'pd1' },
                acquisitionDetails: null,
                repairs: null,
                fExpenses: { id: 'fe1' },
                hDuration: null,
            } as any;

            const result = service.transformWholesaleABuilder('a1', aBuilder);

            expect(mockTransformABuilderService.transformPDetails).toHaveBeenCalled();
            expect(mockTransformABuilderService.transformADetails).not.toHaveBeenCalled();
            expect(mockTransformABuilderService.transformRepairs).not.toHaveBeenCalled();
            expect(mockTransformABuilderService.transformFExpenses).toHaveBeenCalled();
            expect(mockTransformABuilderService.transformHDuration).not.toHaveBeenCalled();

            expect(result.acquisitionDetails).toBeNull();
            expect(result.repairs).toBeNull();
            expect(result.hDuration).toBeNull();
        });
    });
});
