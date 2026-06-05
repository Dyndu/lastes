import { Test, TestingModule } from '@nestjs/testing';
import { TransformRCalculatorService } from './transform-r-calculator.service';
import { RCalculatorService } from './r-calculator.service';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('TransformRCalculatorService', () => {
    let service: TransformRCalculatorService;

    const mockTransformBAEntitiesService = {
        transformRCategories: jest.fn(),
    };

    const mockBAnalysisService = {
        transformBAEntitiesService: mockTransformBAEntitiesService,
    };

    const mockRCalculatorService = {
        bAnalysisService: mockBAnalysisService,
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TransformRCalculatorService,
                { provide: RCalculatorService, useValue: mockRCalculatorService },
            ],
        }).compile();

        service = module.get<TransformRCalculatorService>(TransformRCalculatorService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('analysisEntities', () => {
        it('should return the correct relations', () => {
            expect(service.analysisEntities()).toEqual([
                'module',
                'createdBy',
                'rehabCalculator',
                'rehabCalculator.analysisBuilder',
            ]);
        });
    });

    describe('rCalculatorABuilderEntities', () => {
        it('should return the correct relations', () => {
            expect(service.rCalculatorABuilderEntities()).toEqual(['rooms', 'rooms.sections']);
        });
    });

    describe('rCBuilderRooms', () => {
        it('should return the correct relations', () => {
            expect(service.rCBuilderRooms()).toEqual(['rooms']);
        });
    });

    describe('roomEntities', () => {
        it('should return the correct relations', () => {
            expect(service.roomEntities()).toEqual(['sections']);
        });
    });

    describe('sectionExpenses', () => {
        it('should return the correct relations', () => {
            expect(service.sectionExpenses()).toEqual(['expenses']);
        });
    });

    describe('roomTotalEntities', () => {
        it('should return the correct relations', () => {
            expect(service.roomTotalEntities()).toEqual(['sections', 'sections.expenses']);
        });
    });

    describe('rCalculatorSummaryEntities', () => {
        it('should return the correct relations', () => {
            expect(service.rCalculatorSummaryEntities()).toEqual([
                'rooms',
                'rooms.sections',
                'rooms.sections.expenses',
            ]);
        });
    });

    describe('transformRCBAnalysis', () => {
        it('should return idAnalysis merged with transformRCategories result', () => {
            const rooms = [{ id: 'room-1' }] as any[];
            const transformedRooms = { totalRooms: 1, roomList: rooms };

            mockTransformBAEntitiesService.transformRCategories.mockReturnValue(transformedRooms);

            const result = service.transformRCBAnalysis(rooms, 'analysis-1');

            expect(mockTransformBAEntitiesService.transformRCategories).toHaveBeenCalledWith(rooms);
            expect(result).toEqual({
                idAnalysis: 'analysis-1',
                ...transformedRooms,
            });
        });
    });
});
