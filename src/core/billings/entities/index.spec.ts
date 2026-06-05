import * as indexExports from './index';
import { SubscriptionInvoiceEntity, SubscriptionEntity } from './index';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('Index barrel exports', () => {
    const expectedExports = [
        ['SubscriptionInvoiceEntity', SubscriptionInvoiceEntity],
        ['SubscriptionEntity', SubscriptionEntity],
    ] as const;

    it.each(expectedExports)(
        'should re-export billings entities correctly',
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
