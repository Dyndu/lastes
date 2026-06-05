import * as indexExports from './index';
import { ChangePeriodDto, CreateCheckoutDto, SetDefaultPaymentDto } from './index';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('Index barrel exports', () => {
    const expectedExports = [
        ['ChangePeriodDto', ChangePeriodDto],
        ['CreateCheckoutDto', CreateCheckoutDto],
        ['SetDefaultPaymentDto', SetDefaultPaymentDto],
    ] as const;

    it.each(expectedExports)('should re-export billings dto correctly', (name, originalEnum) => {
        expect(indexExports[name]).toBe(originalEnum);
    });

    it('should export all expected modules', () => {
        const exportNames = expectedExports.map(([name]) => name);
        exportNames.forEach((name) => {
            expect(indexExports).toHaveProperty(name);
        });
    });
});
