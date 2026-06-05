import * as indexExports from './index';
import {
    AdItemizedRepository,
    ADetailsRepository,
    ERepairsRepository,
    FExpensesRepository,
    IRepairsRepository,
    RepairsRepository,
    UnitsRepository,
    PDetailsRepository,
    ORepairsRepository,
    ABuilderRepository,
    SaleRepository,
    HCoastRepository,
    HCoastItemizedRepository,
    HDurationRepository,
    RefinanceRepository,
    RefinanceItemRepository,
    RDurationRepository,
    CCoastRepository,
    BrRefinanceRepository,
} from './index';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('Index barrel exports', () => {
    const expectedExports = [
        ['AdItemizedRepository', AdItemizedRepository],
        ['ADetailsRepository', ADetailsRepository],
        ['ERepairsRepository', ERepairsRepository],
        ['FExpensesRepository', FExpensesRepository],
        ['IRepairsRepository', IRepairsRepository],
        ['RepairsRepository', RepairsRepository],
        ['UnitsRepository', UnitsRepository],
        ['PDetailsRepository', PDetailsRepository],
        ['ORepairsRepository', ORepairsRepository],
        ['ABuilderRepository', ABuilderRepository],
        ['SaleRepository', SaleRepository],
        ['HCoastRepository', HCoastRepository],
        ['HCoastItemizedRepository', HCoastItemizedRepository],
        ['HDurationRepository', HDurationRepository],
        ['RefinanceRepository', RefinanceRepository],
        ['RefinanceItemRepository', RefinanceItemRepository],
        ['RDurationRepository', RDurationRepository],
        ['CCoastRepository', CCoastRepository],
        ['BrRefinanceRepository', BrRefinanceRepository],
    ] as const;

    it.each(expectedExports)(
        'should re-export repositories repositories %s correctly',
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
