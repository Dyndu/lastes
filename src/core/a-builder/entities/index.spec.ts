import * as indexExports from './index';
import {
    PDetailsEntity,
    UnitEntity,
    AdItemizedEntity,
    ADetailsEntity,
    ABuilderEntity,
    ERepairsEntity,
    IRepairsEntity,
    ORepairsEntity,
    RepairsEntity,
    BaseRepairsEntity,
    FExpensesEntity,
    HCoastEntity,
    HCoastItemizedEntity,
    HDurationEntity,
    RefinanceEntity,
    RefinanceItemEntity,
    RDurationEntity,
    CCoastEntity,
    BaseRefiEntity,
    BrRefinanceEntity,
} from './index';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('Index barrel exports', () => {
    const expectedExports = [
        ['PDetailsEntity', PDetailsEntity],
        ['UnitEntity', UnitEntity],
        ['AdItemizedEntity', AdItemizedEntity],
        ['ADetailsEntity', ADetailsEntity],
        ['ABuilderEntity', ABuilderEntity],
        ['ERepairsEntity', ERepairsEntity],
        ['IRepairsEntity', IRepairsEntity],
        ['ORepairsEntity', ORepairsEntity],
        ['RepairsEntity', RepairsEntity],
        ['BaseRepairsEntity', BaseRepairsEntity],
        ['FExpensesEntity', FExpensesEntity],
        ['HCoastEntity', HCoastEntity],
        ['HCoastItemizedEntity', HCoastItemizedEntity],
        ['HDurationEntity', HDurationEntity],
        ['RefinanceEntity', RefinanceEntity],
        ['RefinanceItemEntity', RefinanceItemEntity],
        ['RDurationEntity', RDurationEntity],
        ['CCoastEntity', CCoastEntity],
        ['BaseRefiEntity', BaseRefiEntity],
        ['BrRefinanceEntity', BrRefinanceEntity],
    ] as const;

    it.each(expectedExports)(
        'should re-export analysis entities %s correctly',
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
