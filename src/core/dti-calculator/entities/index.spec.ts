import * as indexExports from './index';
import {
    DtiCalculatorEntity,
    DtiEIncomeEntity,
    DtiPropertyEntity,
    DtiOtherIncomeEntity,
    DtiOtherDebtsEntity,
    DtiCardEntity,
} from './index';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('Index barrel exports', () => {
    const expectedExports = [
        ['DtiCalculatorEntity', DtiCalculatorEntity],
        ['DtiEIncomeEntity', DtiEIncomeEntity],
        ['DtiPropertyEntity', DtiPropertyEntity],
        ['DtiOtherIncomeEntity', DtiOtherIncomeEntity],
        ['DtiOtherDebtsEntity', DtiOtherDebtsEntity],
        ['DtiCardEntity', DtiCardEntity],
    ] as const;

    it.each(expectedExports)('should re-export dti entities %s correctly', (name, originalEnum) => {
        expect(indexExports[name]).toBe(originalEnum);
    });

    it('should export all expected modules', () => {
        const exportNames = expectedExports.map(([name]) => name);
        exportNames.forEach((name) => {
            expect(indexExports).toHaveProperty(name);
        });
    });
});
