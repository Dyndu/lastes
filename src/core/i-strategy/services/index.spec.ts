import * as indexExports from './index';
import { IStrategyService, PreIStrategyService, TransformIStrategyEntityService, IStrategySummaryService } from './index';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('Index barrel exports', () => {
    const expectedExports = [
        ['IStrategyService', IStrategyService],
        ['PreIStrategyService', PreIStrategyService],
        ['TransformIStrategyEntityService', TransformIStrategyEntityService],
        ['IStrategySummaryService', IStrategySummaryService],
    ] as const;

    it.each(expectedExports)(
        'should re-export investment strategy service %s correctly',
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
