import { validate } from 'class-validator';
import { FieldDto } from './field.dto';

describe('FieldDto', () => {
    let dto: FieldDto;

    beforeEach(() => {
        dto = new FieldDto();
    });

    describe('field property', () => {
        it('should pass validation with valid field value', async () => {
            dto.field = 'testtoken';

            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should pass validation with exactly minimum length (8 characters)', async () => {
            dto.field = 'token123';

            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should fail validation when field is empty', async () => {
            dto.field = '';

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isNotEmpty');
            expect(errors[0].constraints?.isNotEmpty).toBe('Field is required');
        });

        it('should fail validation when field is not provided', async () => {
            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isNotEmpty');
            expect(errors[0].constraints?.isNotEmpty).toBe('Field is required');
        });

        it('should fail validation when field is not a string', async () => {
            (dto as any).field = 12345;

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isString');
            expect(errors[0].constraints?.isString).toBe('Field must be a string');
        });

        it('should fail validation when field is shorter than minimum length', async () => {
            dto.field = 's';

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('minLength');
            expect(errors[0].constraints?.minLength).toBe(
                'Field must be at least 2 characters long',
            );
        });

        it('should pass validation when field contains only whitespace (8+ spaces)', async () => {
            dto.field = '        ';

            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should fail validation when field contains whitespace shorter than minimum', async () => {
            dto.field = ' ';

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('minLength');
            expect(errors[0].constraints?.minLength).toBe(
                'Field must be at least 2 characters long',
            );
        });

        it('should pass validation with long field value', async () => {
            dto.field = 'a'.repeat(100);

            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should fail validation when field is null', async () => {
            (dto as any).field = null;

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isNotEmpty');
        });

        it('should fail validation when field is undefined', async () => {
            dto.field = undefined as any;

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isNotEmpty');
        });

        it('should pass validation with alphanumeric field', async () => {
            dto.field = 'token12345';

            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should pass validation with special characters', async () => {
            dto.field = 'token@#$%';

            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should fail validation with array value', async () => {
            (dto as any).field = ['token123'];

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isString');
        });

        it('should fail validation with object value', async () => {
            (dto as any).field = { value: 'token123' };

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isString');
        });

        it('should fail validation with boolean value', async () => {
            (dto as any).field = true;

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isString');
        });
    });

    describe('multiple instances', () => {
        it('should validate multiple instances independently', async () => {
            const dto1 = new FieldDto();
            const dto2 = new FieldDto();

            dto1.field = 'validtoken1';
            dto2.field = 's';

            const errors1 = await validate(dto1);
            const errors2 = await validate(dto2);

            expect(errors1.length).toBe(0);
            expect(errors2.length).toBeGreaterThan(0);
        });
    });

    describe('edge cases', () => {
        it('should handle field with newlines', async () => {
            dto.field = 'token\n123\n';

            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should handle field with tabs', async () => {
            dto.field = 'token\t123';

            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should fail when field is an empty object', async () => {
            (dto as any).field = {};

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isString');
        });
    });
});
