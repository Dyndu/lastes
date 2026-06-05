import * as indexExports from './index';
import {
    CFinancingColumnInputDto,
    CFinancingCalculatorDto,
    CFinancingGlobalParamsDto,
} from './index';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('Index barrel exports', () => {
    const expectedExports = [
        ['CFinancingColumnInputDto', CFinancingColumnInputDto],
        ['CFinancingCalculatorDto', CFinancingCalculatorDto],
        ['CFinancingGlobalParamsDto', CFinancingGlobalParamsDto],
    ] as const;

    it.each(expectedExports)(
        'should re-export creative financing dto %s correctly',
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
