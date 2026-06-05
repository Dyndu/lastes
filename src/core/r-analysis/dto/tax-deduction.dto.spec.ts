import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { TaxDeductionDto } from './tax-deduction.dto';

describe('TaxDeductionDto', () => {
    const validPayload = {
        ltv: 80,
        occupancyRate: 95,
        managementFeePercent: 10,
        maintenanceEscrowPercent: 5,
        depreciationPercent: 20,
    };

    const build = (data: object) => plainToInstance(TaxDeductionDto, data);
    const check = (data: object) => validate(build(data));

    describe('valid cases', () => {
        it('should pass with all required fields', async () => {
            const errors = await check(validPayload);
            expect(errors).toHaveLength(0);
        });

        it('should pass without optional incomeTaxRateOverride', async () => {
            const errors = await check(validPayload);
            expect(errors).toHaveLength(0);
        });

        it('should pass with incomeTaxRateOverride provided', async () => {
            const errors = await check({ ...validPayload, incomeTaxRateOverride: 25 });
            expect(errors).toHaveLength(0);
        });

        it('should pass with boundary values 0 and 100 for own fields', async () => {
            const errors = await check({
                ...validPayload,
                depreciationPercent: 0,
                incomeTaxRateOverride: 100,
            });
            expect(errors).toHaveLength(0);
        });
    });

    describe('depreciationPercent', () => {
        it('should fail when missing', async () => {
            const { depreciationPercent, ...rest } = validPayload;
            const errors = await check(rest);
            expect(errors.some((e) => e.property === 'depreciationPercent')).toBe(true);
        });

        it('should fail when below 0', async () => {
            const errors = await check({ ...validPayload, depreciationPercent: -1 });
            expect(errors.some((e) => e.property === 'depreciationPercent')).toBe(true);
        });

        it('should fail when above 100', async () => {
            const errors = await check({ ...validPayload, depreciationPercent: 101 });
            expect(errors.some((e) => e.property === 'depreciationPercent')).toBe(true);
        });

        it('should fail when not a number', async () => {
            const errors = await check({ ...validPayload, depreciationPercent: 'abc' });
            expect(errors.some((e) => e.property === 'depreciationPercent')).toBe(true);
        });
    });

    describe('incomeTaxRateOverride', () => {
        it('should pass when missing (optional)', async () => {
            const errors = await check(validPayload);
            expect(errors.some((e) => e.property === 'incomeTaxRateOverride')).toBe(false);
        });

        it('should fail when below 0', async () => {
            const errors = await check({ ...validPayload, incomeTaxRateOverride: -1 });
            expect(errors.some((e) => e.property === 'incomeTaxRateOverride')).toBe(true);
        });

        it('should fail when above 100', async () => {
            const errors = await check({ ...validPayload, incomeTaxRateOverride: 101 });
            expect(errors.some((e) => e.property === 'incomeTaxRateOverride')).toBe(true);
        });

        it('should fail when not a number', async () => {
            const errors = await check({ ...validPayload, incomeTaxRateOverride: 'abc' });
            expect(errors.some((e) => e.property === 'incomeTaxRateOverride')).toBe(true);
        });
    });
});
