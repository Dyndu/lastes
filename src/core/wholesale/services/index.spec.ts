import * as indexExports from './index';
import {
    PreWholesaleService,
    WholesaleService,
    TransformWholesaleEntityService,
    WholesaleCalculatorService,
} from './index';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('Index barrel exports', () => {
    const expectedExports = [
        ['PreWholesaleService', PreWholesaleService],
        ['WholesaleService', WholesaleService],
        ['TransformWholesaleEntityService', TransformWholesaleEntityService],
        ['WholesaleCalculatorService', WholesaleCalculatorService],
    ] as const;

    it.each(expectedExports)(
        'should re-export wholesale service %s correctly',
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
