import * as indexExports from './index';
import { FFlipService, PreFFlipService, TransformFFlipService, FFlipSummaryService } from './index';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('Index barrel exports', () => {
    const expectedExports = [
        ['FFlipService', FFlipService],
        ['PreFFlipService', PreFFlipService],
        ['TransformFFlipService', TransformFFlipService],
        ['FFlipSummaryService', FFlipSummaryService],
    ] as const;

    it.each(expectedExports)(
        'should re-export fix and flip service %s correctly',
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
