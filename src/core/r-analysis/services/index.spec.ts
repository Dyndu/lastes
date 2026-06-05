import * as indexExports from './index';
import {
    RaABuilderService,
    RAnalysisService,
    TransformRaService,
    PreRAnalysisService,
    RentalAnalysisCalculatorService,
    RentalSummaryCalculatorService,
    RentalMetricsCalculatorService,
    RentalFullBreakdownCalculatorService,
    DealGradeCalculatorService,
    RAnalysisParamsService,
} from './index';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('Index barrel exports', () => {
    const expectedExports = [
        ['RaABuilderService', RaABuilderService],
        ['RAnalysisService', RAnalysisService],
        ['TransformRaService', TransformRaService],
        ['PreRAnalysisService', PreRAnalysisService],
        ['RentalAnalysisCalculatorService', RentalAnalysisCalculatorService],
        ['RentalSummaryCalculatorService', RentalSummaryCalculatorService],
        ['RentalMetricsCalculatorService', RentalMetricsCalculatorService],
        ['RentalFullBreakdownCalculatorService', RentalFullBreakdownCalculatorService],
        ['DealGradeCalculatorService', DealGradeCalculatorService],
        ['RAnalysisParamsService', RAnalysisParamsService],
    ] as const;

    it.each(expectedExports)(
        'should re-export rental analyzer services %s correctly',
        (name, originalEnum) => {
            expect(indexExports[name]).toBe(originalEnum);
        },
    );

    it('should export all expected modules', () => {
        const exportNames = expectedExports.map(([name]) => name);
        exportNames.forEach((name) => {
            expect(indexExports).toHaveProperty(name);
        });
    });
});
