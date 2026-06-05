import * as indexExports from './index';
import {
    ABuilderService,
    PDetailsService,
    UnitsService,
    ADetailsService,
    AdItemizedService,
    RepairsService,
    IRepairsService,
    ERepairsService,
    ORepairsService,
    FExpensesService,
    SaleService,
    HCoastService,
    HCoastItemizedService,
    HDurationService,
    TransformABuilderService,
    RefinanceItemService,
    RefinanceService,
    RDurationService,
    CCoastService,
    BrRefinanceService,
} from './index';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('Index barrel exports', () => {
    const expectedExports = [
        ['ABuilderService', ABuilderService],
        ['PDetailsService', PDetailsService],
        ['UnitsService', UnitsService],
        ['UnitsService', UnitsService],
        ['ADetailsService', ADetailsService],
        ['AdItemizedService', AdItemizedService],
        ['RepairsService', RepairsService],
        ['IRepairsService', IRepairsService],
        ['ERepairsService', ERepairsService],
        ['ORepairsService', ORepairsService],
        ['FExpensesService', FExpensesService],
        ['SaleService', SaleService],
        ['HCoastService', HCoastService],
        ['HCoastItemizedService', HCoastItemizedService],
        ['HDurationService', HDurationService],
        ['TransformABuilderService', TransformABuilderService],
        ['RefinanceService', RefinanceService],
        ['RefinanceItemService', RefinanceItemService],
        ['RDurationService', RDurationService],
        ['CCoastService', CCoastService],
        ['BrRefinanceService', BrRefinanceService],
    ] as const;

    it.each(expectedExports)(
        'should re-export analysis builder services %s correctly',
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
