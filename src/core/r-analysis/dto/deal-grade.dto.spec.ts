import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { DealGradeDto } from './deal-grade.dto';

describe('DealGradeDto', () => {
    const validPayload = {
        ltv: 80,
        occupancyRate: 95,
        managementFeePercent: 10,
        maintenanceEscrowPercent: 5,
        zipCapAvg: 7,
    };

    const build = (data: object) => plainToInstance(DealGradeDto, data);
    const check = (data: object) => validate(build(data));

    describe('valid cases', () => {
        it('should pass with only required fields', async () => {
            const errors = await check(validPayload);
            expect(errors).toHaveLength(0);
        });

        it('should pass with all optional fields provided', async () => {
            const errors = await check({
                ...validPayload,
                minCashflowTarget: 200,
                debtRiskFlag: 1,
                capitalExtracted: 5000,
            });
            expect(errors).toHaveLength(0);
        });

        it('should pass with zipCapAvg at boundaries 0 and 100', async () => {
            const errors1 = await check({ ...validPayload, zipCapAvg: 0 });
            expect(errors1).toHaveLength(0);

            const errors2 = await check({ ...validPayload, zipCapAvg: 100 });
            expect(errors2).toHaveLength(0);
        });

        it('should pass with debtRiskFlag at all valid values 0, 1, 2', async () => {
            for (const flag of [0, 1, 2]) {
                const errors = await check({ ...validPayload, debtRiskFlag: flag });
                expect(errors).toHaveLength(0);
            }
        });
    });

    describe('zipCapAvg', () => {
        it('should fail when missing', async () => {
            const { zipCapAvg, ...rest } = validPayload;
            const errors = await check(rest);
            expect(errors.some((e) => e.property === 'zipCapAvg')).toBe(true);
        });

        it('should fail when below 0', async () => {
            const errors = await check({ ...validPayload, zipCapAvg: -1 });
            expect(errors.some((e) => e.property === 'zipCapAvg')).toBe(true);
        });

        it('should fail when above 100', async () => {
            const errors = await check({ ...validPayload, zipCapAvg: 101 });
            expect(errors.some((e) => e.property === 'zipCapAvg')).toBe(true);
        });

        it('should fail when not a number', async () => {
            const errors = await check({ ...validPayload, zipCapAvg: 'abc' });
            expect(errors.some((e) => e.property === 'zipCapAvg')).toBe(true);
        });
    });

    describe('minCashflowTarget', () => {
        it('should pass when missing (optional)', async () => {
            const errors = await check(validPayload);
            expect(errors.some((e) => e.property === 'minCashflowTarget')).toBe(false);
        });

        it('should pass with value 0 (min boundary)', async () => {
            const errors = await check({ ...validPayload, minCashflowTarget: 0 });
            expect(errors).toHaveLength(0);
        });

        it('should fail when below 0', async () => {
            const errors = await check({ ...validPayload, minCashflowTarget: -1 });
            expect(errors.some((e) => e.property === 'minCashflowTarget')).toBe(true);
        });

        it('should fail when not a number', async () => {
            const errors = await check({ ...validPayload, minCashflowTarget: 'abc' });
            expect(errors.some((e) => e.property === 'minCashflowTarget')).toBe(true);
        });
    });

    describe('debtRiskFlag', () => {
        it('should pass when missing (optional)', async () => {
            const errors = await check(validPayload);
            expect(errors.some((e) => e.property === 'debtRiskFlag')).toBe(false);
        });

        it('should fail when above 2', async () => {
            const errors = await check({ ...validPayload, debtRiskFlag: 3 });
            expect(errors.some((e) => e.property === 'debtRiskFlag')).toBe(true);
        });

        it('should fail when below 0', async () => {
            const errors = await check({ ...validPayload, debtRiskFlag: -1 });
            expect(errors.some((e) => e.property === 'debtRiskFlag')).toBe(true);
        });

        it('should fail when not a number', async () => {
            const errors = await check({ ...validPayload, debtRiskFlag: 'abc' });
            expect(errors.some((e) => e.property === 'debtRiskFlag')).toBe(true);
        });
    });

    describe('capitalExtracted', () => {
        it('should pass when missing (optional)', async () => {
            const errors = await check(validPayload);
            expect(errors.some((e) => e.property === 'capitalExtracted')).toBe(false);
        });

        it('should pass with value 0 (min boundary)', async () => {
            const errors = await check({ ...validPayload, capitalExtracted: 0 });
            expect(errors).toHaveLength(0);
        });

        it('should fail when below 0', async () => {
            const errors = await check({ ...validPayload, capitalExtracted: -1 });
            expect(errors.some((e) => e.property === 'capitalExtracted')).toBe(true);
        });

        it('should fail when not a number', async () => {
            const errors = await check({ ...validPayload, capitalExtracted: 'abc' });
            expect(errors.some((e) => e.property === 'capitalExtracted')).toBe(true);
        });
    });
});
