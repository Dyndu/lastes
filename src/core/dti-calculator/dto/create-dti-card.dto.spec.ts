import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateDtiCardDto } from './create-dti-card.dto';

describe('CreateDtiCardDto', () => {
    const buildValid = (overrides = {}) =>
        plainToInstance(CreateDtiCardDto, {
            code: 'xxxx-xxx-xxx-xxxxx',
            amount: 100,
            expiry: 'MM/YYYY',
            ...overrides,
        });

    describe('code', () => {
        it('should pass with a valid code', async () => {
            const dto = buildValid();
            const errors = await validate(dto);
            const codeErrors = errors.filter((e) => e.property === 'code');
            expect(codeErrors).toHaveLength(0);
        });

        it('should fail when code is missing', async () => {
            const dto = buildValid({ code: undefined });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'code')).toBe(true);
        });

        it('should fail when code is empty string', async () => {
            const dto = buildValid({ code: '' });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'code')).toBe(true);
        });

        it('should fail when code is too short (< 8 chars)', async () => {
            const dto = buildValid({ code: 'short' });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'code')).toBe(true);
        });

        it('should fail when code is not a string', async () => {
            const dto = buildValid({ code: 12345678 });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'code')).toBe(true);
        });

        it('should pass with exactly 8 characters', async () => {
            const dto = buildValid({ code: '12345678' });
            const errors = await validate(dto);
            const codeErrors = errors.filter((e) => e.property === 'code');
            expect(codeErrors).toHaveLength(0);
        });
    });

    describe('amount', () => {
        it('should pass with a valid amount', async () => {
            const dto = buildValid({ amount: 500 });
            const errors = await validate(dto);
            const amountErrors = errors.filter((e) => e.property === 'amount');
            expect(amountErrors).toHaveLength(0);
        });

        it('should fail when amount is missing', async () => {
            const dto = buildValid({ amount: undefined });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'amount')).toBe(true);
        });

        it('should fail when amount is negative', async () => {
            const dto = buildValid({ amount: -1 });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'amount')).toBe(true);
        });

        it('should fail when amount is not a number', async () => {
            const dto = buildValid({ amount: 'abc' });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'amount')).toBe(true);
        });

        it('should pass with amount = 0', async () => {
            const dto = buildValid({ amount: 0 });
            const errors = await validate(dto);
            const amountErrors = errors.filter((e) => e.property === 'amount');
            expect(amountErrors).toHaveLength(0);
        });

        it('should pass with decimal amount up to 2 places', async () => {
            const dto = buildValid({ amount: 99.99 });
            const errors = await validate(dto);
            const amountErrors = errors.filter((e) => e.property === 'amount');
            expect(amountErrors).toHaveLength(0);
        });
    });

    describe('expiry', () => {
        it('should pass with a valid expiry', async () => {
            const dto = buildValid({ expiry: 'MM/YYYY' });
            const errors = await validate(dto);
            const expiryErrors = errors.filter((e) => e.property === 'expiry');
            expect(expiryErrors).toHaveLength(0);
        });

        it('should fail when expiry is missing', async () => {
            const dto = buildValid({ expiry: undefined });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'expiry')).toBe(true);
        });

        it('should fail when expiry is empty string', async () => {
            const dto = buildValid({ expiry: '' });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'expiry')).toBe(true);
        });

        it('should fail when expiry is not a string', async () => {
            const dto = buildValid({ expiry: 123456 });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'expiry')).toBe(true);
        });
    });

    describe('full DTO validation', () => {
        it('should pass with all valid fields', async () => {
            const dto = buildValid();
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should fail when all fields are missing', async () => {
            const dto = plainToInstance(CreateDtiCardDto, {});
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
        });
    });
});
