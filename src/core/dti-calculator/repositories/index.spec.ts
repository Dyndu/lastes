import * as indexExports from './index';
import {
    DtiCalculatorRepository,
    DtiPropertyRepository,
    DtiEIncomeRepository,
    DtiOtherIncomeRepository,
    DtiOtherDebtsRepository,
    DtiCardRepository,
} from './index';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('Index barrel exports', () => {
    const expectedExports = [
        ['DtiCalculatorRepository', DtiCalculatorRepository],
        ['DtiPropertyRepository', DtiPropertyRepository],
        ['DtiEIncomeRepository', DtiEIncomeRepository],
        ['DtiOtherIncomeRepository', DtiOtherIncomeRepository],
        ['DtiOtherDebtsRepository', DtiOtherDebtsRepository],
        ['DtiCardRepository', DtiCardRepository],
    ] as const;

    it.each(expectedExports)(
        'should re-export dti repositories %s correctly',
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
