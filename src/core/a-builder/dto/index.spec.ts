import * as indexExports from './index';
import {
    UnitsDto,
    CreatePDetailsDto,
    UpdatePDetailsDto,
    AdItemizedDto,
    ADetailsDto,
    ADetailsUpdateDto,
    UpdateFExpenseDto,
    UpdateRepairsDto,
    CreateRepairsDto,
    RItemDto,
    FExpenseDto,
    HCoastDto,
    HCoastItemizedDto,
    HDurationDto,
    RefiItemUpdateDto,
    RefiItemDto,
    RefiItemResolveDto,
    CreateSaleDto,
    RefiCreateDto,
    RDurationDto,
    CCoastDto,
    BrRefiDto,
} from './index';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('Index barrel exports', () => {
    const expectedExports = [
        ['UnitsDto', UnitsDto],
        ['CreatePDetailsDto', CreatePDetailsDto],
        ['UpdatePDetailsDto', UpdatePDetailsDto],
        ['AdItemizedDto', AdItemizedDto],
        ['ADetailsDto', ADetailsDto],
        ['RItemDto', RItemDto],
        ['UpdateFExpenseDto', UpdateFExpenseDto],
        ['FExpenseDto', FExpenseDto],
        ['ADetailsUpdateDto', ADetailsUpdateDto],
        ['UpdateRepairsDto', UpdateRepairsDto],
        ['CreateRepairsDto', CreateRepairsDto],
        ['HCoastDto', HCoastDto],
        ['HCoastItemizedDto', HCoastItemizedDto],
        ['HDurationDto', HDurationDto],
        ['RefiItemUpdateDto', RefiItemUpdateDto],
        ['RefiItemResolveDto', RefiItemResolveDto],
        ['CreateSaleDto', CreateSaleDto],
        ['RefiItemDto', RefiItemDto],
        ['RefiCreateDto', RefiCreateDto],
        ['RDurationDto', RDurationDto],
        ['CCoastDto', CCoastDto],
        ['BrRefiDto', BrRefiDto],
    ] as const;

    it.each(expectedExports)(
        'should re-export analysis builder dto %s correctly',
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
