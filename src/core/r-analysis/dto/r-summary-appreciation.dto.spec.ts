import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RentalSummaryAppreciationDto } from './r-summary-appreciation.dto';

describe('RentalSummaryAppreciationDto', () => {
    const build = (data: object) => plainToInstance(RentalSummaryAppreciationDto, data);
    const check = (data: object) => validate(build(data));

    describe('valid cases', () => {
        it('should pass with no fields provided (all optional)', async () => {
            const errors = await check({});
            expect(errors).toHaveLength(0);
        });

        it('should pass with all fields provided', async () => {
            const errors = await check({
                yearsToExit: 30,
                annualAppreciationRate: 3,
                additionalEquity: 0,
            });
            expect(errors).toHaveLength(0);
        });

        it('should pass with yearsToExit at min boundary 1', async () => {
            const errors = await check({ yearsToExit: 1 });
            expect(errors).toHaveLength(0);
        });

        it('should pass with annualAppreciationRate at boundaries 0 and 100', async () => {
            const errors1 = await check({ annualAppreciationRate: 0 });
            expect(errors1).toHaveLength(0);

            const errors2 = await check({ annualAppreciationRate: 100 });
            expect(errors2).toHaveLength(0);
        });

        it('should pass with additionalEquity at boundary 0', async () => {
            const errors = await check({ additionalEquity: 0 });
            expect(errors).toHaveLength(0);
        });
    });

    describe('yearsToExit', () => {
        it('should pass when missing (optional)', async () => {
            const errors = await check({});
            expect(errors.some((e) => e.property === 'yearsToExit')).toBe(false);
        });

        it('should fail when below min boundary 1', async () => {
            const errors = await check({ yearsToExit: 0 });
            expect(errors.some((e) => e.property === 'yearsToExit')).toBe(true);
        });

        it('should fail when negative', async () => {
            const errors = await check({ yearsToExit: -1 });
            expect(errors.some((e) => e.property === 'yearsToExit')).toBe(true);
        });

        it('should fail when not a number', async () => {
            const errors = await check({ yearsToExit: 'abc' });
            expect(errors.some((e) => e.property === 'yearsToExit')).toBe(true);
        });

        it('should fail when NaN', async () => {
            const errors = await check({ yearsToExit: NaN });
            expect(errors.some((e) => e.property === 'yearsToExit')).toBe(true);
        });
    });

    describe('annualAppreciationRate', () => {
        it('should pass when missing (optional)', async () => {
            const errors = await check({});
            expect(errors.some((e) => e.property === 'annualAppreciationRate')).toBe(false);
        });

        it('should fail when negative', async () => {
            const errors = await check({ annualAppreciationRate: -1 });
            expect(errors.some((e) => e.property === 'annualAppreciationRate')).toBe(true);
        });

        it('should fail when not a number', async () => {
            const errors = await check({ annualAppreciationRate: 'abc' });
            expect(errors.some((e) => e.property === 'annualAppreciationRate')).toBe(true);
        });

        it('should fail when NaN', async () => {
            const errors = await check({ annualAppreciationRate: NaN });
            expect(errors.some((e) => e.property === 'annualAppreciationRate')).toBe(true);
        });
    });

    describe('additionalEquity', () => {
        it('should pass when missing (optional)', async () => {
            const errors = await check({});
            expect(errors.some((e) => e.property === 'additionalEquity')).toBe(false);
        });

        it('should fail when negative', async () => {
            const errors = await check({ additionalEquity: -1 });
            expect(errors.some((e) => e.property === 'additionalEquity')).toBe(true);
        });

        it('should fail when not a number', async () => {
            const errors = await check({ additionalEquity: 'abc' });
            expect(errors.some((e) => e.property === 'additionalEquity')).toBe(true);
        });

        it('should fail when NaN', async () => {
            const errors = await check({ additionalEquity: NaN });
            expect(errors.some((e) => e.property === 'additionalEquity')).toBe(true);
        });
    });
});
