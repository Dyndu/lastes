import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BooleanFieldDecorator } from './boolean-field.decorator';

class RequiredBooleanDto {
    @BooleanFieldDecorator('Active flag', true, true)
    isActive: boolean;
}

class OptionalBooleanDto {
    @BooleanFieldDecorator('Optional flag', false, false)
    isActive?: boolean;
}

describe('BooleanFieldDecorator decorator', () => {
    it('should fail if required boolean is missing', async () => {
        const dto = plainToInstance(RequiredBooleanDto, {});
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('isNotEmpty');
        expect(errors[0].constraints?.isNotEmpty).toContain('Active flag is required');
    });

    it('should fail if required boolean is not boolean', async () => {
        const dto = plainToInstance(RequiredBooleanDto, {
            isActive: 'yes' as any,
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('isBoolean');
        expect(errors[0].constraints?.isBoolean).toContain('Active flag must be a boolean');
    });

    it('should pass if required boolean is valid', async () => {
        const dto = plainToInstance(RequiredBooleanDto, { isActive: true });
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should pass if optional boolean is missing', async () => {
        const dto = plainToInstance(OptionalBooleanDto, {});
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should fail if optional boolean is invalid', async () => {
        const dto = plainToInstance(OptionalBooleanDto, {
            isActive: 'no' as any,
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('isBoolean');
        expect(errors[0].constraints?.isBoolean).toContain('Optional flag must be a boolean');
    });

    it('should pass if optional boolean is valid', async () => {
        const dto = plainToInstance(OptionalBooleanDto, { isActive: false });
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });
});
