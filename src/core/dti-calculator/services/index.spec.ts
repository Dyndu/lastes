import * as indexExports from './index';
import {
    DtiPropertyService,
    DtiEIncomeService,
    DtiOtherDebtsService,
    DtiOtherIncomeService,
    DtiCalculatorService,
    DtiCardService,
    TransformDtiService,
} from './index';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('Index barrel exports', () => {
    const expectedExports = [
        ['DtiPropertyService', DtiPropertyService],
        ['DtiEIncomeService', DtiEIncomeService],
        ['DtiOtherDebtsService', DtiOtherDebtsService],
        ['DtiOtherIncomeService', DtiOtherIncomeService],
        ['DtiCalculatorService', DtiCalculatorService],
        ['DtiCardService', DtiCardService],
        ['TransformDtiService', TransformDtiService],
    ] as const;

    it.each(expectedExports)('should re-export dti services %s correctly', (name, originalEnum) => {
        expect(indexExports[name]).toBe(originalEnum);
    });

    it('should export all expected modules', () => {
        const exportNames = expectedExports.map(([name]) => name);
        exportNames.forEach((name) => {
            expect(indexExports).toHaveProperty(name);
        });
    });
});
