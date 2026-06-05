import { Test, TestingModule } from '@nestjs/testing';
import { TransformBrAnalyzerService } from './transform-br-analyzer.service';
import { BrAnalyzerService } from './br-analyzer.service';
import { ABuilderEntity } from '../../a-builder/entities';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('TransformBrAnalyzerService', () => {
    let service: TransformBrAnalyzerService;
    let brAnalyzerService: jest.Mocked<BrAnalyzerService>;

    const mockTransformRaService = {
        raFExpenseEntities: jest.fn().mockReturnValue(['fExpenses', 'fExpenses.items']),
        rABuilderEntities: jest
            .fn()
            .mockReturnValue(['propertyDetails', 'acquisitionDetails', 'repairs', 'fExpenses']),
        raPDetailsEntities: jest.fn().mockReturnValue(['propertyDetails', 'propertyDetails.units']),
    };

    const mockTransformABuilderService = {
        transformPDetails: jest.fn(),
        transformADetails: jest.fn(),
        transformRepairs: jest.fn(),
        transformCCoast: jest.fn(),
        transformFExpenses: jest.fn(),
        transformBrRefi: jest.fn(),
    };

    const mockABuilderService = {
        transformABuilderService: mockTransformABuilderService,
    };

    const mockRAnalyzerService = {
        transformRaService: mockTransformRaService,
        aBuilderService: mockABuilderService,
    };

    beforeEach(async () => {
        brAnalyzerService = {
            rAnalyzerService: mockRAnalyzerService,
        } as unknown as jest.Mocked<BrAnalyzerService>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TransformBrAnalyzerService,
                {
                    provide: BrAnalyzerService,
                    useValue: brAnalyzerService,
                },
            ],
        }).compile();

        service = module.get<TransformBrAnalyzerService>(TransformBrAnalyzerService);

        jest.clearAllMocks();
        mockTransformRaService.raFExpenseEntities.mockReturnValue(['fExpenses', 'fExpenses.items']);
        mockTransformRaService.rABuilderEntities.mockReturnValue([
            'propertyDetails',
            'acquisitionDetails',
            'repairs',
            'fExpenses',
        ]);
    });

    describe('brAnalyzerBuilderCheckEntities', () => {
        it('should return the correct entity list', () => {
            const result = service.brAnalyzerBuilderCheckEntities();
            expect(result).toEqual(['module', 'createdBy', 'brAnalyzer']);
        });
    });

    describe('cCoastItemEntities', () => {
        it('should return the correct repair item entity list', () => {
            const result = service.cCoastItemEntities();
            expect(result).toEqual(['cCoast.eRepairs', 'cCoast.iRepairs', 'cCoast.oRepairs']);
        });
    });

    describe('cCoastEntities', () => {
        it('should include cCoast and all repair item entities', () => {
            const result = service.cCoastEntities();
            expect(result).toEqual([
                'cCoast',
                'cCoast.eRepairs',
                'cCoast.iRepairs',
                'cCoast.oRepairs',
            ]);
        });
    });

    describe('brRefiEntities', () => {
        it('should return brRefi and its sub-relations', () => {
            const result = service.brRefiEntities();
            expect(result).toEqual([
                'brRefi',
                'brRefi.eRepairs',
                'brRefi.iRepairs',
                'brRefi.oRepairs',
            ]);
        });
    });

    describe('brAnalyzerBuilderEntities', () => {
        it('should combine rABuilderEntities, brRefiEntities, and cCoastEntities', () => {
            const result = service.brAnalyzerBuilderEntities();
            expect(mockTransformRaService.rABuilderEntities).toHaveBeenCalledTimes(1);
            expect(result).toEqual([
                'propertyDetails',
                'acquisitionDetails',
                'repairs',
                'fExpenses',
                'brRefi',
                'brRefi.eRepairs',
                'brRefi.iRepairs',
                'brRefi.oRepairs',
                'cCoast',
                'cCoast.eRepairs',
                'cCoast.iRepairs',
                'cCoast.oRepairs',
            ]);
        });
    });

    describe('transformBrAnalyzerServiceABuilder', () => {
        const id = 'analysis-789';

        it('should transform all sections when all data is present', () => {
            const mockABuilder = {
                propertyDetails: { id: 'pd-1' },
                acquisitionDetails: { id: 'ad-1' },
                repairs: { id: 'r-1' },
                cCoast: { id: 'cc-1' },
                fExpenses: { id: 'fe-1' },
                brRefi: { id: 'refi-1' },
            } as unknown as ABuilderEntity;

            mockTransformABuilderService.transformPDetails.mockReturnValue({ pd: true });
            mockTransformABuilderService.transformADetails.mockReturnValue({ ad: true });
            mockTransformABuilderService.transformRepairs.mockReturnValue({ repairs: true });
            mockTransformABuilderService.transformCCoast.mockReturnValue({ cCoast: true });
            mockTransformABuilderService.transformFExpenses.mockReturnValue({ fExpenses: true });
            mockTransformABuilderService.transformBrRefi.mockReturnValue({ refi: true });

            const result = service.transformBrAnalyzerServiceABuilder(id, mockABuilder);

            expect(mockTransformABuilderService.transformPDetails).toHaveBeenCalledWith(
                mockABuilder.propertyDetails,
            );
            expect(mockTransformABuilderService.transformADetails).toHaveBeenCalledWith(
                mockABuilder.acquisitionDetails,
            );
            expect(mockTransformABuilderService.transformRepairs).toHaveBeenCalledWith(
                mockABuilder.repairs,
            );
            expect(mockTransformABuilderService.transformCCoast).toHaveBeenCalledWith(
                mockABuilder.cCoast,
            );
            expect(mockTransformABuilderService.transformFExpenses).toHaveBeenCalledWith(
                mockABuilder.fExpenses,
            );
            expect(mockTransformABuilderService.transformBrRefi).toHaveBeenCalledWith(
                mockABuilder.brRefi,
            );

            expect(result).toEqual({
                idAnalysis: id,
                propertyDetails: { pd: true },
                acquisitionDetails: { ad: true },
                repairs: { repairs: true },
                cCoast: { cCoast: true },
                fExpenses: { fExpenses: true },
                refinance: { refi: true },
            });
        });

        it('should return null for all sections when aBuilder is empty', () => {
            const aBuilder = {} as unknown as ABuilderEntity;

            const result = service.transformBrAnalyzerServiceABuilder(id, aBuilder);

            expect(mockTransformABuilderService.transformPDetails).not.toHaveBeenCalled();
            expect(mockTransformABuilderService.transformADetails).not.toHaveBeenCalled();
            expect(mockTransformABuilderService.transformRepairs).not.toHaveBeenCalled();
            expect(mockTransformABuilderService.transformCCoast).not.toHaveBeenCalled();
            expect(mockTransformABuilderService.transformFExpenses).not.toHaveBeenCalled();
            expect(mockTransformABuilderService.transformBrRefi).not.toHaveBeenCalled();

            expect(result).toEqual({
                idAnalysis: id,
                propertyDetails: null,
                acquisitionDetails: null,
                repairs: null,
                cCoast: null,
                fExpenses: null,
                refinance: null,
            });
        });

        it('should return null for all sections when all values are explicitly null', () => {
            const aBuilder = {
                propertyDetails: null,
                acquisitionDetails: null,
                repairs: null,
                cCoast: null,
                fExpenses: null,
                brRefi: null,
            } as unknown as ABuilderEntity;

            const result = service.transformBrAnalyzerServiceABuilder(id, aBuilder);

            expect(result).toEqual({
                idAnalysis: id,
                propertyDetails: null,
                acquisitionDetails: null,
                repairs: null,
                cCoast: null,
                fExpenses: null,
                refinance: null,
            });
        });

        it('should partially transform when only some sections are present', () => {
            const aBuilder = {
                propertyDetails: { id: 'pd-1' },
                acquisitionDetails: null,
                repairs: null,
                cCoast: { id: 'cc-1' },
                fExpenses: null,
                brRefi: null,
            } as unknown as ABuilderEntity;

            mockTransformABuilderService.transformPDetails.mockReturnValue({ pd: true });
            mockTransformABuilderService.transformCCoast.mockReturnValue({ cCoast: true });

            const result = service.transformBrAnalyzerServiceABuilder(id, aBuilder);

            expect(mockTransformABuilderService.transformPDetails).toHaveBeenCalledTimes(1);
            expect(mockTransformABuilderService.transformADetails).not.toHaveBeenCalled();
            expect(mockTransformABuilderService.transformRepairs).not.toHaveBeenCalled();
            expect(mockTransformABuilderService.transformCCoast).toHaveBeenCalledTimes(1);
            expect(mockTransformABuilderService.transformFExpenses).not.toHaveBeenCalled();
            expect(mockTransformABuilderService.transformBrRefi).not.toHaveBeenCalled();

            expect(result).toEqual({
                idAnalysis: id,
                propertyDetails: { pd: true },
                acquisitionDetails: null,
                repairs: null,
                cCoast: { cCoast: true },
                fExpenses: null,
                refinance: null,
            });
        });
    });
});
