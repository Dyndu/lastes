import * as indexExports from './index';
import {
    BAnalysisService,
    RoomExpenseItemService,
    RoomSectionService,
    RoomCategoryService,
    TransformBAEntitiesService,
} from './index';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('Index barrel exports', () => {
    const expectedExports = [
        ['BAnalysisService', BAnalysisService],
        ['RoomExpenseItemService', RoomExpenseItemService],
        ['RoomSectionService', RoomSectionService],
        ['RoomCategoryService', RoomCategoryService],
        ['TransformBAEntitiesService', TransformBAEntitiesService],
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
