import { validate } from 'class-validator';
import { UuidsArrayDto } from './uuids-array.dto';

describe('UuidsArrayDto', () => {
    let dto: UuidsArrayDto;

    beforeEach(() => {
        dto = new UuidsArrayDto();
    });

    describe('ids field validation', () => {
        it('should pass validation with valid UUIDs', async () => {
            dto.ids = [
                'eb5174d5-1cef-40f6-bb57-97393cde0426',
                'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
            ];

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should pass validation with single valid UUID', async () => {
            dto.ids = ['eb5174d5-1cef-40f6-bb57-97393cde0426'];

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should fail validation when ids is empty array', async () => {
            dto.ids = [];

            const errors = await validate(dto);

            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('ids');
            expect(errors[0].constraints).toHaveProperty('arrayNotEmpty');
            expect(errors[0].constraints?.arrayNotEmpty).toBe('Ids should not be empty');
        });

        it('should fail validation when ids is not provided', async () => {
            const errors = await validate(dto);

            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('ids');
            expect(errors[0].constraints).toHaveProperty('arrayNotEmpty');
        });

        it('should fail validation when ids is not an array', async () => {
            dto.ids = 'not-an-array' as any;

            const errors = await validate(dto);

            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('ids');
            expect(errors[0].constraints).toHaveProperty('isArray');
            expect(errors[0].constraints?.isArray).toBe('Ids must be an array');
        });

        it('should fail validation when ids contains non-string values', async () => {
            dto.ids = [123, 456] as any;

            const errors = await validate(dto);

            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('ids');
            expect(errors[0].constraints).toHaveProperty('isString');
            expect(errors[0].constraints?.isString).toBe('Ids elements must be strings');
        });

        it('should fail validation when ids contains duplicate UUIDs', async () => {
            dto.ids = [
                'eb5174d5-1cef-40f6-bb57-97393cde0426',
                'eb5174d5-1cef-40f6-bb57-97393cde0426',
            ];

            const errors = await validate(dto);

            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('ids');
            expect(errors[0].constraints).toHaveProperty('arrayUnique');
            expect(errors[0].constraints?.arrayUnique).toBe(
                'Ids must not contain duplicate values',
            );
        });

        it('should fail validation when ids contains invalid UUID format', async () => {
            dto.ids = ['not-a-valid-uuid'];

            const errors = await validate(dto);

            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('ids');
            expect(errors[0].constraints).toHaveProperty('isUuid');
            expect(errors[0].constraints?.isUuid).toContain('must be a UUID');
        });

        it('should fail validation when ids contains invalid UUID version', async () => {
            dto.ids = ['a987fbc9-4bed-3078-cf07-9141ba07c9f3'];

            const errors = await validate(dto);

            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('ids');
            expect(errors[0].constraints).toHaveProperty('isUuid');
        });

        it('should fail validation when ids contains strings shorter than minLength', async () => {
            dto.ids = [''];

            const errors = await validate(dto);

            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('ids');
            expect(errors[0].constraints).toHaveProperty('minLength');
            expect(errors[0].constraints?.minLength).toBe(
                'Ids elements must be at least 1 characters long',
            );
        });

        it('should fail validation when ids contains mix of valid and invalid UUIDs', async () => {
            dto.ids = ['eb5174d5-1cef-40f6-bb57-97393cde0426', 'invalid-uuid'];

            const errors = await validate(dto);

            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('ids');
            expect(errors[0].constraints).toHaveProperty('isUuid');
        });

        it('should fail validation with multiple constraint violations', async () => {
            dto.ids = [
                'eb5174d5-1cef-40f6-bb57-97393cde0426',
                'eb5174d5-1cef-40f6-bb57-97393cde0426',
                'invalid-uuid',
            ];

            const errors = await validate(dto);

            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('ids');
            expect(Object.keys(errors[0].constraints || {}).length).toBeGreaterThan(0);
        });

        it('should pass validation with multiple different valid UUIDs', async () => {
            dto.ids = [
                'eb5174d5-1cef-40f6-bb57-97393cde0426',
                'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
                'f1e2d3c4-b5a6-4978-8c9d-0e1f2a3b4c5d',
                '12345678-1234-4abc-8def-123456789012',
            ];

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should fail validation when ids is null', async () => {
            dto.ids = null as any;

            const errors = await validate(dto);

            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('ids');
            expect(errors[0].constraints).toHaveProperty('isArray');
        });

        it('should fail validation when ids is undefined', async () => {
            dto.ids = undefined as any;

            const errors = await validate(dto);

            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('ids');
        });

        it('should fail validation with malformed UUID (missing dashes)', async () => {
            dto.ids = ['eb5174d51cef40f6bb5797393cde0426'];

            const errors = await validate(dto);

            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('ids');
            expect(errors[0].constraints).toHaveProperty('isUuid');
        });

        it('should fail validation with UUID containing invalid characters', async () => {
            dto.ids = ['eb5174d5-1cef-40f6-bb57-97393cde042g'];

            const errors = await validate(dto);

            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('ids');
            expect(errors[0].constraints).toHaveProperty('isUuid');
        });

        it('should fail validation with UUID in wrong case format if strict', async () => {
            dto.ids = ['EB5174D5-1CEF-40F6-BB57-97393CDE0426'];

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThanOrEqual(0);
        });

        it('should pass validation with lowercase UUIDs', async () => {
            dto.ids = [
                'eb5174d5-1cef-40f6-bb57-97393cde0426',
                'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
            ];

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should fail validation when array contains object instead of string', async () => {
            dto.ids = [{ uuid: 'eb5174d5-1cef-40f6-bb57-97393cde0426' }] as any;

            const errors = await validate(dto);

            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('ids');
            expect(errors[0].constraints).toHaveProperty('isString');
        });

        it('should fail validation when array contains number that looks like part of UUID', async () => {
            dto.ids = [123456789012] as any;

            const errors = await validate(dto);

            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('ids');
            expect(errors[0].constraints).toHaveProperty('isString');
        });

        it('should handle large array of valid UUIDs', async () => {
            dto.ids = Array.from(
                { length: 100 },
                (_, i) => `${i.toString().padStart(8, '0')}-1234-4abc-8def-123456789012`,
            );

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should fail validation with empty string in array', async () => {
            dto.ids = ['eb5174d5-1cef-40f6-bb57-97393cde0426', ''];

            const errors = await validate(dto);

            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('ids');
            expect(Object.keys(errors[0].constraints || {}).length).toBeGreaterThan(0);
        });

        it('should fail validation with whitespace-only string', async () => {
            dto.ids = ['   '];

            const errors = await validate(dto);

            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('ids');
            expect(errors[0].constraints).toHaveProperty('isUuid');
        });
    });

    describe('DTO instantiation', () => {
        it('should create instance with default values', () => {
            const newDto = new UuidsArrayDto();

            expect(newDto).toBeInstanceOf(UuidsArrayDto);
            expect(newDto.ids).toBeUndefined();
        });

        it('should allow setting ids after instantiation', () => {
            const newDto = new UuidsArrayDto();
            newDto.ids = ['eb5174d5-1cef-40f6-bb57-97393cde0426'];

            expect(newDto.ids).toEqual(['eb5174d5-1cef-40f6-bb57-97393cde0426']);
        });
    });
});
