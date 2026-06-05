import * as indexExports from './index';
import { PreCFinancingService, CFinancingService, CFinancingCalculatorService } from './index';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('Index barrel exports', () => {
    const expectedExports = [
        ['PreCFinancingService', PreCFinancingService],
        ['CFinancingService', CFinancingService],
        ['CFinancingCalculatorService', CFinancingCalculatorService],
    ] as const;

    it.each(expectedExports)(
        'should re-export creative financing service %s correctly',
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
