import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ReuseAdsDto } from './reuse-ads.dto';

describe('ReuseAdsDto', () => {
    describe('Valid DTO', () => {
        it('should validate a complete valid DTO', async () => {
            const dto = plainToInstance(ReuseAdsDto, {
                startDate: '2026-12-01T00:00:00.000Z',
                endDate: '2026-12-31T00:00:00.000Z',
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });

    describe('startDate field', () => {
        it('should fail when startDate is missing', async () => {
            const dto = plainToInstance(ReuseAdsDto, {
                endDate: '2026-12-31T00:00:00.000Z',
            });

            const errors = await validate(dto);
            const startDateError = errors.find((e) => e.property === 'startDate');
            expect(startDateError?.constraints).toHaveProperty('isNotEmpty');
        });

        it('should fail when startDate is not a valid ISO 8601 date', async () => {
            const dto = plainToInstance(ReuseAdsDto, {
                startDate: 'invalid-date' as any,
                endDate: '2026-12-31T00:00:00.000Z',
            });

            const errors = await validate(dto);
            const startDateError = errors.find((e) => e.property === 'startDate');
            expect(startDateError?.constraints).toHaveProperty('isIso8601');
        });

        it('should accept valid ISO 8601 date formats', async () => {
            const dto = plainToInstance(ReuseAdsDto, {
                startDate: '2026-12-01T00:00:00Z',
                endDate: '2026-12-31T00:00:00.000Z',
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });

    describe('endDate field', () => {
        it('should fail when endDate is missing', async () => {
            const dto = plainToInstance(ReuseAdsDto, {
                startDate: '2026-12-01T00:00:00.000Z',
            });

            const errors = await validate(dto);
            const endDateError = errors.find((e) => e.property === 'endDate');
            expect(endDateError?.constraints).toHaveProperty('isNotEmpty');
        });

        it('should fail when endDate is not a valid ISO 8601 date', async () => {
            const dto = plainToInstance(ReuseAdsDto, {
                startDate: '2026-12-01T00:00:00.000Z',
                endDate: '2026-13-32' as any,
            });

            const errors = await validate(dto);
            const endDateError = errors.find((e) => e.property === 'endDate');
            expect(endDateError?.constraints).toHaveProperty('isIso8601');
        });
    });

    describe('Multiple validation errors', () => {
        it('should return multiple errors when multiple fields are invalid', async () => {
            const dto = plainToInstance(ReuseAdsDto, {
                startDate: 'not-a-date' as any,
                endDate: 'not-a-date' as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThanOrEqual(2);
        });

        it('should return all field errors when DTO is empty', async () => {
            const dto = plainToInstance(ReuseAdsDto, {});

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThanOrEqual(2);
        });
    });
});
