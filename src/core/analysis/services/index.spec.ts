import * as indexExports from './index';
import {
    AnalysisService,
    PreAnalysisService,
    TransformAEntityService,
    AnalysisUsageService,
    AnalysisCloneService,
} from './index';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('Index barrel exports', () => {
    const expectedExports = [
        ['AnalysisService', AnalysisService],
        ['PreAnalysisService', PreAnalysisService],
        ['TransformAEntityService', TransformAEntityService],
        ['AnalysisUsageService', AnalysisUsageService],
        ['AnalysisCloneService', AnalysisCloneService],
    ] as const;

    it.each(expectedExports)(
        'should re-export analyses services %s correctly',
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
