import { validate } from 'class-validator';
import { UuidFieldDto } from './uuid-field.dto';

describe('UuidFieldDto', () => {
    describe('Valid UUID validation', () => {
        it('should pass validation with a valid UUIDv4', async () => {
            const dto = new UuidFieldDto();
            dto.field = 'eb5174d5-1cef-40f6-bb57-97393cde0426';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation with another valid UUIDv4', async () => {
            const dto = new UuidFieldDto();
            dto.field = '550e8400-e29b-41d4-a716-446655440000';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation with valid UUIDv4 in uppercase', async () => {
            const dto = new UuidFieldDto();
            dto.field = 'EB5174D5-1CEF-40F6-BB57-97393CDE0426';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('Invalid UUID validation', () => {
        it('should fail validation with invalid UUID format', async () => {
            const dto = new UuidFieldDto();
            dto.field = 'not-a-valid-uuid';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('field');
            expect(errors[0].constraints).toHaveProperty('isUuid');
        });

        it('should fail validation with UUIDv1 (not UUIDv4)', async () => {
            const dto = new UuidFieldDto();
            dto.field = '550e8400-e29b-11d4-a716-446655440000';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isUuid');
        });

        it('should fail validation with malformed UUID (missing dashes)', async () => {
            const dto = new UuidFieldDto();
            dto.field = 'eb5174d51cef40f6bb5797393cde0426';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isUuid');
        });

        it('should fail validation with UUID containing invalid characters', async () => {
            const dto = new UuidFieldDto();
            dto.field = 'zb5174d5-1cef-40f6-bb57-97393cde0426';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isUuid');
        });

        it('should fail validation with UUID of wrong length', async () => {
            const dto = new UuidFieldDto();
            dto.field = 'eb5174d5-1cef-40f6-bb57';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isUuid');
        });
    });

    describe('Required field validation (from StringFieldDecorator)', () => {
        it('should fail validation when field is empty string', async () => {
            const dto = new UuidFieldDto();
            dto.field = '';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isNotEmpty');
            expect(errors[0].constraints?.isNotEmpty).toBe('Id fields is required');
        });

        it('should fail validation when field is not provided', async () => {
            const dto = new UuidFieldDto();

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isNotEmpty');
            expect(errors[0].constraints?.isNotEmpty).toBe('Id fields is required');
        });

        it('should fail validation when field is null', async () => {
            const dto = new UuidFieldDto();
            (dto as any).field = null;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isNotEmpty');
        });

        it('should fail validation when field is undefined', async () => {
            const dto = new UuidFieldDto();
            (dto as any).field = undefined;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isNotEmpty');
        });
    });

    describe('String type validation (from StringFieldDecorator)', () => {
        it('should fail validation when field is a number', async () => {
            const dto = new UuidFieldDto();
            (dto as any).field = 12345;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isString');
            expect(errors[0].constraints?.isString).toBe('Id fields must be a string');
        });

        it('should fail validation when field is an object', async () => {
            const dto = new UuidFieldDto();
            (dto as any).field = {
                uuid: 'eb5174d5-1cef-40f6-bb57-97393cde0426',
            };

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isString');
        });

        it('should fail validation when field is an array', async () => {
            const dto = new UuidFieldDto();
            (dto as any).field = ['eb5174d5-1cef-40f6-bb57-97393cde0426'];

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isString');
        });

        it('should fail validation when field is a boolean', async () => {
            const dto = new UuidFieldDto();
            (dto as any).field = true;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isString');
        });
    });

    describe('Minimum length validation (from StringFieldDecorator)', () => {
        it('should fail validation when string length is less than 2', async () => {
            const dto = new UuidFieldDto();
            dto.field = 'a';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('minLength');
            expect(errors[0].constraints?.minLength).toBe(
                'Id fields must be at least 2 characters long',
            );
        });

        it('should pass validation with exactly 2 characters (but fail UUID validation)', async () => {
            const dto = new UuidFieldDto();
            dto.field = 'ab';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).not.toHaveProperty('minLength');
            expect(errors[0].constraints).toHaveProperty('isUuid');
        });
    });

    describe('Combined validations', () => {
        it('should return multiple validation errors when field has multiple issues', async () => {
            const dto = new UuidFieldDto();
            (dto as any).field = 123;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isString');
        });

        it('should validate a valid UUID passes all decorators', async () => {
            const dto = new UuidFieldDto();
            dto.field = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('Edge cases', () => {
        it('should fail validation with whitespace-only string', async () => {
            const dto = new UuidFieldDto();
            dto.field = '   ';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isUuid');
        });

        it('should fail validation with UUID containing extra spaces', async () => {
            const dto = new UuidFieldDto();
            dto.field = ' eb5174d5-1cef-40f6-bb57-97393cde0426 ';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isUuid');
        });

        it('should fail validation with UUID containing newlines', async () => {
            const dto = new UuidFieldDto();
            dto.field = 'eb5174d5-1cef-40f6-bb57-97393cde0426\n';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isUuid');
        });

        it('should fail validation with partially valid UUID', async () => {
            const dto = new UuidFieldDto();
            dto.field = 'eb5174d5-1cef-40f6-bb57-97393cde04';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isUuid');
        });
    });

    describe('Property metadata', () => {
        it('should create instance successfully', () => {
            const dto = new UuidFieldDto();
            expect(dto).toBeDefined();
            expect(dto).toBeInstanceOf(UuidFieldDto);
        });

        it('should allow setting valid UUID', () => {
            const dto = new UuidFieldDto();
            const validUuid = 'eb5174d5-1cef-40f6-bb57-97393cde0426';
            dto.field = validUuid;

            expect(dto.field).toBe(validUuid);
        });
    });
});
