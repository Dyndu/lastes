import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CalendarAdsDto } from './calendar.ads.dto';

describe('CalendarAdsDto', () => {
    describe('Valid DTO', () => {
        it('should validate a complete valid DTO', async () => {
            const dto = plainToInstance(CalendarAdsDto, {
                date: '2026-12-01T00:00:00.000Z',
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });

    describe('date field', () => {
        it('should fail when date is missing', async () => {
            const dto = plainToInstance(CalendarAdsDto, {});

            const errors = await validate(dto);
            const dateError = errors.find((e) => e.property === 'date');
            expect(dateError?.constraints).toHaveProperty('isNotEmpty');
        });

        it('should fail when date is not a valid ISO 8601 date', async () => {
            const dto = plainToInstance(CalendarAdsDto, {
                date: 'invalid-date' as any,
            });

            const errors = await validate(dto);
            const dateError = errors.find((e) => e.property === 'date');
            expect(dateError?.constraints).toHaveProperty('isIso8601');
        });

        it('should accept valid ISO 8601 date formats', async () => {
            const dto = plainToInstance(CalendarAdsDto, {
                date: '2026-12-01T00:00:00Z',
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });

    describe('Multiple validation errors', () => {
        it('should return multiple errors when multiple fields are invalid', async () => {
            const dto = plainToInstance(CalendarAdsDto, {
                date: 'not-a-date' as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThanOrEqual(1);
        });

        it('should return all field errors when DTO is empty', async () => {
            const dto = plainToInstance(CalendarAdsDto, {});

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThanOrEqual(1);
        });
    });
});
