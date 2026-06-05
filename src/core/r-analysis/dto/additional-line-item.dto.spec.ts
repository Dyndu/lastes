import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AdditionalLineItemDto } from './additional-line-item.dto';

describe('AdditionalLineItemDto', () => {
    const validPayload = { label: 'Additional fee', amount: 100 };

    const build = (data: object) => plainToInstance(AdditionalLineItemDto, data);
    const check = (data: object) => validate(build(data));

    describe('valid cases', () => {
        it('should pass with valid label and amount', async () => {
            const errors = await check(validPayload);
            expect(errors).toHaveLength(0);
        });

        it('should pass with amount = 0 (min boundary)', async () => {
            const errors = await check({ ...validPayload, amount: 0 });
            expect(errors).toHaveLength(0);
        });

        it('should pass with amount having 2 decimal places', async () => {
            const errors = await check({ ...validPayload, amount: 99.99 });
            expect(errors).toHaveLength(0);
        });
    });

    describe('label', () => {
        it('should fail when label is missing', async () => {
            const errors = await check({ amount: 100 });
            expect(errors.some((e) => e.property === 'label')).toBe(true);
        });

        it('should fail when label is empty string', async () => {
            const errors = await check({ ...validPayload, label: '' });
            expect(errors.some((e) => e.property === 'label')).toBe(true);
        });

        it('should fail when label is not a string', async () => {
            const errors = await check({ ...validPayload, label: 123 });
            expect(errors.some((e) => e.property === 'label')).toBe(true);
        });
    });

    describe('amount', () => {
        it('should fail when amount is missing', async () => {
            const errors = await check({ label: 'Fee' });
            expect(errors.some((e) => e.property === 'amount')).toBe(true);
        });

        it('should fail when amount is negative', async () => {
            const errors = await check({ ...validPayload, amount: -1 });
            expect(errors.some((e) => e.property === 'amount')).toBe(true);
        });

        it('should fail when amount is not a number', async () => {
            const errors = await check({ ...validPayload, amount: 'abc' });
            expect(errors.some((e) => e.property === 'amount')).toBe(true);
        });

        it('should fail when amount has more than 2 decimal places', async () => {
            const errors = await check({ ...validPayload, amount: 10.123 });
            expect(errors.some((e) => e.property === 'amount')).toBe(true);
        });

        it('should fail when amount is NaN', async () => {
            const errors = await check({ ...validPayload, amount: NaN });
            expect(errors.some((e) => e.property === 'amount')).toBe(true);
        });
    });
});
