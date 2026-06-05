import { InvoiceStatusEnum } from './invoice-status.enum';

describe('InvoiceStatusEnum Enum', () => {
    const expectedEntries = Object.entries(InvoiceStatusEnum) as [
        keyof typeof InvoiceStatusEnum,
        string,
    ][];

    it.each(expectedEntries)('should map %s to %s', (key, value) => {
        expect(InvoiceStatusEnum[key]).toBe(value);
    });

    it('should contain all expected keys', () => {
        expect(Object.keys(InvoiceStatusEnum)).toEqual(expectedEntries.map(([key]) => key));
    });

    it('should contain all expected values', () => {
        expect(Object.values(InvoiceStatusEnum)).toEqual(expectedEntries.map(([, value]) => value));
    });
});
