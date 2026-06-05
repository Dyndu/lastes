import * as indexExports from './index';
import {
    CreateDtiOtherIncomeDto,
    CreateDtiEmploymentIncomeDto,
    CreateDtiOtherDebtDto,
    CreateDtiPropertyDto,
    UpdateDtiEmploymentIncomeDto,
    UpdateDtiOtherIncomeDto,
    UpdateDtiOtherDebtDto,
    UpdateDtiPropertyDto,
    CreateDtiCardDto,
    UpdateDtiCardDto,
} from './index';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('Index barrel exports', () => {
    const expectedExports = [
        ['CreateDtiOtherIncomeDto', CreateDtiOtherIncomeDto],
        ['CreateDtiEmploymentIncomeDto', CreateDtiEmploymentIncomeDto],
        ['CreateDtiOtherDebtDto', CreateDtiOtherDebtDto],
        ['CreateDtiPropertyDto', CreateDtiPropertyDto],
        ['UpdateDtiEmploymentIncomeDto', UpdateDtiEmploymentIncomeDto],
        ['UpdateDtiOtherIncomeDto', UpdateDtiOtherIncomeDto],
        ['UpdateDtiOtherDebtDto', UpdateDtiOtherDebtDto],
        ['UpdateDtiPropertyDto', UpdateDtiPropertyDto],
        ['CreateDtiCardDto', CreateDtiCardDto],
        ['UpdateDtiCardDto', UpdateDtiCardDto],
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
