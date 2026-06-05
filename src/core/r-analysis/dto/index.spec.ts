import * as indexExports from './index';
import {
    AdditionalLineItemDto,
    AppreciationDto,
    BaseRentalAnalysisDto,
    BuyHoldDto,
    CreateRaBuilderDto,
    DealGradeDto,
    RAnalysisDto,
    RentalSummaryDto,
    RentalSummaryAppreciationDto,
    RaAdditionalRowsDto,
    TaxDeductionDto,
    DealComparisonDto,
} from './index';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('Index barrel exports', () => {
    const expectedExports = [
        ['AdditionalLineItemDto', AdditionalLineItemDto],
        ['AppreciationDto', AppreciationDto],
        ['BaseRentalAnalysisDto', BaseRentalAnalysisDto],
        ['BuyHoldDto', BuyHoldDto],
        ['CreateRaBuilderDto', CreateRaBuilderDto],
        ['DealGradeDto', DealGradeDto],
        ['RAnalysisDto', RAnalysisDto],
        ['RentalSummaryDto', RentalSummaryDto],
        ['RentalSummaryAppreciationDto', RentalSummaryAppreciationDto],
        ['TaxDeductionDto', TaxDeductionDto],
        ['RaAdditionalRowsDto', RaAdditionalRowsDto],
        ['DealComparisonDto', DealComparisonDto],
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
