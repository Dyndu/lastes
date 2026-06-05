import * as indexExports from './index';
import { MCalculatorService, MCalculatorEquationsService, PreMCalculatorService } from './index';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('Index barrel exports', () => {
    const expectedExports = [
        ['MCalculatorService', MCalculatorService],
        ['MCalculatorEquationsService', MCalculatorEquationsService],
        ['PreMCalculatorService', PreMCalculatorService],
    ] as const;

    it.each(expectedExports)(
        'should re-export mortgage calculator %s correctly',
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
