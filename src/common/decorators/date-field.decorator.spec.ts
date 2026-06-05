import { validate } from 'class-validator';
import { DateFieldDecorator } from './date-field.decorator';

describe('DateFieldDecorator', () => {
    describe('Required date field with strict ISO8601 validation (default)', () => {
        class TestDto {
            @DateFieldDecorator('Date of the schedule', '2024-12-01T00:00:00.000Z')
            date: string;
        }

        it('should pass validation with valid ISO 8601 date string', async () => {
            const dto = new TestDto();
            dto.date = '2024-12-01T00:00:00.000Z';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail validation when date is missing (required)', async () => {
            const dto = new TestDto();

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isNotEmpty');
            expect(errors[0].constraints?.isNotEmpty).toBe('Date of the schedule is required');
        });

        it('should fail validation with invalid ISO 8601 date string', async () => {
            const dto = new TestDto();
            dto.date = 'invalid-date';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isIso8601');
            expect(errors[0].constraints?.isIso8601).toBe(
                'Date of the schedule must be a valid ISO 8601 string',
            );
        });

        it('should pass validation with date-only ISO 8601 format', async () => {
            const dto = new TestDto();
            dto.date = '2024-12-01'; // Valid ISO 8601 format

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail validation with non-ISO 8601 format', async () => {
            const dto = new TestDto();
            dto.date = '01/12/2024'; // Not ISO 8601 format

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isIso8601');
        });
    });

    describe('Optional date field', () => {
        class TestDto {
            @DateFieldDecorator('Optional date', '2024-12-01T00:00:00.000Z', {
                required: false,
            })
            date?: string;
        }

        it('should pass validation when date is not provided (optional)', async () => {
            const dto = new TestDto();

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation when date is undefined (optional)', async () => {
            const dto = new TestDto();
            dto.date = undefined;

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation with valid ISO 8601 date when provided', async () => {
            const dto = new TestDto();
            dto.date = '2024-12-01T00:00:00.000Z';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail validation with invalid ISO 8601 date when provided', async () => {
            const dto = new TestDto();
            dto.date = 'invalid-date';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isIso8601');
        });
    });

    describe('Non-strict ISO8601 validation', () => {
        class TestDto {
            @DateFieldDecorator('Date field', '2024-12-01T00:00:00.000Z', {
                strict: false,
            })
            date: string;
        }

        it('should pass validation with non-strict ISO 8601 format', async () => {
            const dto = new TestDto();
            dto.date = '2024-12-01';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation with strict ISO 8601 format', async () => {
            const dto = new TestDto();
            dto.date = '2024-12-01T00:00:00.000Z';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail validation with invalid date', async () => {
            const dto = new TestDto();
            dto.date = 'not-a-date';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
        });
    });

    describe('Using IsDateString instead of IsISO8601', () => {
        class TestDto {
            @DateFieldDecorator('Date field', '2024-12-01', {
                useISO8601: false,
            })
            date: string;
        }

        it('should pass validation with valid date string', async () => {
            const dto = new TestDto();
            dto.date = '2024-12-01';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation with ISO 8601 format', async () => {
            const dto = new TestDto();
            dto.date = '2024-12-01T00:00:00.000Z';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail validation with invalid date string', async () => {
            const dto = new TestDto();
            dto.date = 'not-a-date';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isDateString');
            expect(errors[0].constraints?.isDateString).toBe(
                'Date field must be a valid date string',
            );
        });
    });

    describe('Combined options: optional and non-strict', () => {
        class TestDto {
            @DateFieldDecorator('Optional date', '2024-12-01', {
                required: false,
                strict: false,
            })
            date?: string;
        }

        it('should pass validation when not provided', async () => {
            const dto = new TestDto();

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation with simple date format', async () => {
            const dto = new TestDto();
            dto.date = '2024-12-01';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail validation with invalid date when provided', async () => {
            const dto = new TestDto();
            dto.date = 'invalid';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
        });
    });

    describe('Combined options: optional and non-ISO8601', () => {
        class TestDto {
            @DateFieldDecorator('Optional date', '2024-12-01', {
                required: false,
                useISO8601: false,
            })
            date?: string;
        }

        it('should pass validation when not provided', async () => {
            const dto = new TestDto();

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass validation with valid date string', async () => {
            const dto = new TestDto();
            dto.date = '2024-12-01';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail validation with invalid date when provided', async () => {
            const dto = new TestDto();
            dto.date = 'not-a-date';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isDateString');
        });
    });

    describe('Edge cases', () => {
        class TestDto {
            @DateFieldDecorator()
            date: string;
        }

        it('should use default description and example', async () => {
            const dto = new TestDto();
            dto.date = '2024-12-01T00:00:00.000Z';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail validation with empty string', async () => {
            const dto = new TestDto();
            dto.date = '';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
        });

        it('should handle null value on required field', async () => {
            const dto = new TestDto();
            (dto as any).date = null;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
        });
    });
});
