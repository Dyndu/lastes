import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AppreciationDto } from './appreciation.dto';

describe('AppreciationDto', () => {
    const validPayload = {
        ltv: 80,
        occupancyRate: 95,
        managementFeePercent: 10,
        maintenanceEscrowPercent: 5,
        depreciationPercent: 20,
    };

    const build = (data: object) => plainToInstance(AppreciationDto, data);
    const check = (data: object) => validate(build(data));

    describe('valid cases', () => {
        it('should pass without optional annualAppreciationRate', async () => {
            const errors = await check(validPayload);
            expect(errors).toHaveLength(0);
        });

        it('should pass with annualAppreciationRate provided', async () => {
            const errors = await check({ ...validPayload, annualAppreciationRate: 3 });
            expect(errors).toHaveLength(0);
        });

        it('should pass with boundary values 0 and 100', async () => {
            const errors = await check({ ...validPayload, annualAppreciationRate: 0 });
            expect(errors).toHaveLength(0);
        });

        it('should pass with annualAppreciationRate at max boundary 100', async () => {
            const errors = await check({ ...validPayload, annualAppreciationRate: 100 });
            expect(errors).toHaveLength(0);
        });
    });

    describe('annualAppreciationRate', () => {
        it('should pass when missing (optional)', async () => {
            const errors = await check(validPayload);
            expect(errors.some((e) => e.property === 'annualAppreciationRate')).toBe(false);
        });

        it('should fail when below 0', async () => {
            const errors = await check({ ...validPayload, annualAppreciationRate: -1 });
            expect(errors.some((e) => e.property === 'annualAppreciationRate')).toBe(true);
        });

        it('should fail when above 100', async () => {
            const errors = await check({ ...validPayload, annualAppreciationRate: 101 });
            expect(errors.some((e) => e.property === 'annualAppreciationRate')).toBe(true);
        });

        it('should fail when not a number', async () => {
            const errors = await check({ ...validPayload, annualAppreciationRate: 'abc' });
            expect(errors.some((e) => e.property === 'annualAppreciationRate')).toBe(true);
        });

        it('should fail when NaN', async () => {
            const errors = await check({ ...validPayload, annualAppreciationRate: NaN });
            expect(errors.some((e) => e.property === 'annualAppreciationRate')).toBe(true);
        });
    });
});
