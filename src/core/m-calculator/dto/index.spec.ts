import * as indexExports from './index';
import {
    AmortizationQueryDto,
    CreateMCalculatorDto,
    CalculateDownPaymentPercentageDto,
    UpdateMCalculatorDto,
    CalculateDownPaymentDto,
    AmortizationBreakdownDto,
} from './index';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('Index barrel exports', () => {
    const expectedExports = [
        ['AmortizationQueryDto', AmortizationQueryDto],
        ['CreateMCalculatorDto', CreateMCalculatorDto],
        ['CalculateDownPaymentPercentageDto', CalculateDownPaymentPercentageDto],
        ['UpdateMCalculatorDto', UpdateMCalculatorDto],
        ['CalculateDownPaymentDto', CalculateDownPaymentDto],
        ['AmortizationBreakdownDto', AmortizationBreakdownDto],
    ] as const;

    it.each(expectedExports)(
        'should re-export mortgage calculator dto %s correctly',
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
