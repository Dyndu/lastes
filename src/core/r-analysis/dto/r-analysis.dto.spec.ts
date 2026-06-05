import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RAnalysisDto } from './r-analysis.dto';

describe('RAnalysisDto', () => {
    const validPayload = {
        ltv: 80,
        occupancyRate: 95,
        managementFeePercent: 10,
        maintenanceEscrowPercent: 5,
    };

    const build = (data: object) => plainToInstance(RAnalysisDto, data);
    const check = (data: object) => validate(build(data));

    describe('valid cases', () => {
        it('should pass with only required inherited fields', async () => {
            const errors = await check(validPayload);
            expect(errors).toHaveLength(0);
        });

        it('should pass with pmi provided', async () => {
            const errors = await check({ ...validPayload, pmi: 150 });
            expect(errors).toHaveLength(0);
        });

        it('should pass with pmi at boundary 0', async () => {
            const errors = await check({ ...validPayload, pmi: 0 });
            expect(errors).toHaveLength(0);
        });
    });

    describe('pmi', () => {
        it('should pass when missing (optional)', async () => {
            const errors = await check(validPayload);
            expect(errors.some((e) => e.property === 'pmi')).toBe(false);
        });

        it('should fail when below 0', async () => {
            const errors = await check({ ...validPayload, pmi: -1 });
            expect(errors.some((e) => e.property === 'pmi')).toBe(true);
        });

        it('should fail when not a number', async () => {
            const errors = await check({ ...validPayload, pmi: 'abc' });
            expect(errors.some((e) => e.property === 'pmi')).toBe(true);
        });

        it('should fail when NaN', async () => {
            const errors = await check({ ...validPayload, pmi: NaN });
            expect(errors.some((e) => e.property === 'pmi')).toBe(true);
        });
    });
});
