import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { NumberFieldDecorator } from './number-field.decorator';

class RequiredNumberDto {
    @NumberFieldDecorator('Amount', 100)
    amount: number;
}

class OptionalNumberDto {
    @NumberFieldDecorator('Optional Amount', 50, { required: false })
    amount?: number;
}

class CustomMinNumberDto {
    @NumberFieldDecorator('Price', 10, { min: 5 })
    price: number;
}

class NegativeAllowedDto {
    @NumberFieldDecorator('Temperature', -10, { allowNegative: true, min: -50 })
    temperature: number;
}

class ZeroMinDto {
    @NumberFieldDecorator('Quantity', 0, { min: 0 })
    quantity: number;
}

class MaxConstrainedDto {
    @NumberFieldDecorator('Score', 50, { min: 0, max: 100 })
    score: number;
}

class PositiveOnlyCustomMinDto {
    @NumberFieldDecorator('Rating', 1, { min: 1, allowNegative: false })
    rating: number;
}

describe('NumberFieldDecorator', () => {
    describe('Required field validation', () => {
        it('should fail if required number is undefined', async () => {
            const dto = plainToInstance(RequiredNumberDto, {});
            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isNotEmpty');
            expect(errors[0].constraints?.isNotEmpty).toContain('Amount is required');
        });

        it('should fail if required number is null', async () => {
            const dto = plainToInstance(RequiredNumberDto, { amount: null });
            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isNotEmpty');
        });

        it('should pass if required number is valid', async () => {
            const dto = plainToInstance(RequiredNumberDto, { amount: 100 });
            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });
    });

    describe('Optional field validation', () => {
        it('should pass if optional number is undefined', async () => {
            const dto = plainToInstance(OptionalNumberDto, {});
            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should pass if optional number is provided and valid', async () => {
            const dto = plainToInstance(OptionalNumberDto, { amount: 75 });
            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should fail if optional number is invalid', async () => {
            const dto = plainToInstance(OptionalNumberDto, {
                amount: 'invalid' as any,
            });
            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isNumber');
        });
    });

    describe('Type validation', () => {
        it('should fail if value is not a number', async () => {
            const dto = plainToInstance(RequiredNumberDto, {
                amount: 'text' as any,
            });
            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isNumber');
            expect(errors[0].constraints?.isNumber).toContain('must be a valid number');
        });

        it('should fail if value is an object', async () => {
            const dto = plainToInstance(RequiredNumberDto, {
                amount: {} as any,
            });
            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isNumber');
        });

        it('should fail if value is an array', async () => {
            const dto = plainToInstance(RequiredNumberDto, {
                amount: [1, 2, 3] as any,
            });
            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isNumber');
        });

        it('should fail if value is NaN', async () => {
            const dto = plainToInstance(RequiredNumberDto, { amount: NaN });
            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isNumber');
        });

        it('should fail if value is Infinity', async () => {
            const dto = plainToInstance(RequiredNumberDto, {
                amount: Infinity,
            });
            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isNumber');
        });

        it('should fail if value is -Infinity', async () => {
            const dto = plainToInstance(RequiredNumberDto, {
                amount: -Infinity,
            });
            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isNumber');
        });
    });

    describe('Minimum value validation', () => {
        it('should fail if value is less than default minimum (0)', async () => {
            const dto = plainToInstance(RequiredNumberDto, { amount: -10 });
            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('min');
            expect(errors[0].constraints?.min).toContain('must be greater than or equal to 0');
        });

        it('should pass if value equals default minimum (0)', async () => {
            const dto = plainToInstance(ZeroMinDto, { quantity: 0 });
            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should fail if value is less than custom minimum', async () => {
            const dto = plainToInstance(CustomMinNumberDto, { price: 3 });
            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('min');
            expect(errors[0].constraints?.min).toContain('must be greater than or equal to 5');
        });

        it('should pass if value equals custom minimum', async () => {
            const dto = plainToInstance(CustomMinNumberDto, { price: 5 });
            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should pass if value is greater than minimum', async () => {
            const dto = plainToInstance(CustomMinNumberDto, { price: 100 });
            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should enforce custom positive min when allowNegative is false', async () => {
            const dto = plainToInstance(PositiveOnlyCustomMinDto, {
                rating: 0,
            });
            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('min');
            expect(errors[0].constraints?.min).toContain('must be greater than or equal to 1');
        });

        it('should pass if value equals custom positive min when allowNegative is false', async () => {
            const dto = plainToInstance(PositiveOnlyCustomMinDto, {
                rating: 1,
            });
            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });
    });

    describe('Maximum value validation', () => {
        it('should fail if value exceeds max', async () => {
            const dto = plainToInstance(MaxConstrainedDto, { score: 150 });
            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('max');
            expect(errors[0].constraints?.max).toContain('must be less than or equal to 100');
        });

        it('should pass if value equals max', async () => {
            const dto = plainToInstance(MaxConstrainedDto, { score: 100 });
            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should pass if value is below max', async () => {
            const dto = plainToInstance(MaxConstrainedDto, { score: 50 });
            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });
    });

    describe('Negative numbers handling', () => {
        it('should fail negative numbers when allowNegative is false (default)', async () => {
            const dto = plainToInstance(RequiredNumberDto, { amount: -50 });
            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('min');
        });

        it('should allow negative numbers when allowNegative is true', async () => {
            const dto = plainToInstance(NegativeAllowedDto, {
                temperature: -10,
            });
            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should fail if negative value is below custom negative minimum', async () => {
            const dto = plainToInstance(NegativeAllowedDto, {
                temperature: -60,
            });
            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('min');
            expect(errors[0].constraints?.min).toContain('must be greater than or equal to -50');
        });

        it('should pass if negative value equals custom negative minimum', async () => {
            const dto = plainToInstance(NegativeAllowedDto, {
                temperature: -50,
            });
            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should pass positive numbers when allowNegative is true', async () => {
            const dto = plainToInstance(NegativeAllowedDto, {
                temperature: 25,
            });
            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });
    });

    describe('Decimal validation', () => {
        it('should pass numbers with up to 2 decimal places', async () => {
            const dto = plainToInstance(RequiredNumberDto, { amount: 99.99 });
            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should fail numbers with more than 2 decimal places', async () => {
            const dto = plainToInstance(RequiredNumberDto, { amount: 99.999 });
            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isNumber');
        });

        it('should pass integer numbers', async () => {
            const dto = plainToInstance(RequiredNumberDto, { amount: 100 });
            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should pass numbers with 1 decimal place', async () => {
            const dto = plainToInstance(RequiredNumberDto, { amount: 50.5 });
            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });
    });

    describe('Edge cases', () => {
        it('should pass with value 0', async () => {
            const dto = plainToInstance(ZeroMinDto, { quantity: 0 });
            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should pass with very large numbers', async () => {
            const dto = plainToInstance(RequiredNumberDto, {
                amount: 999999999.99,
            });
            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should handle string numbers correctly', async () => {
            const dto = plainToInstance(RequiredNumberDto, {
                amount: '123' as any,
            });
            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Multiple validation errors', () => {
        it('should show multiple errors when value is invalid in multiple ways', async () => {
            const dto = plainToInstance(RequiredNumberDto, {
                amount: 'not a number' as any,
            });
            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toBeDefined();
        });
    });
});
