import * as indexExports from './index';
import {
    BillingsService,
    SubscriptionService,
    SInvoiceService,
    SWebhookService,
    TransformBEntitiesService,
    PreBillingsService,
} from './index';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('Index barrel exports', () => {
    const expectedExports = [
        ['BillingsService', BillingsService],
        ['SubscriptionService', SubscriptionService],
        ['SInvoiceService', SInvoiceService],
        ['SWebhookService', SWebhookService],
        ['TransformBEntitiesService', TransformBEntitiesService],
        ['PreBillingsService', PreBillingsService],
    ] as const;

    it.each(expectedExports)(
        'should re-export billings services correctly',
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
