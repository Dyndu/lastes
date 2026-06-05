import * as indexExports from './index';
import { CCodesService, CRedemptionService, PreCCodesService } from './index';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('Index barrel exports', () => {
    const expectedExports = [
        ['CCodesService', CCodesService],
        ['CRedemptionService', CRedemptionService],
        ['PreCCodesService', PreCCodesService],
    ] as const;

    it.each(expectedExports)(
        'should re-export affiliation code services correctly',
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
