import { validate } from 'class-validator';
import { AmortizationQueryDto } from './amortization-query.dto';
import { ExtraPaymentFrequencyEnum } from '../../../common/enum';

describe('AmortizationQueryDto', () => {
    const buildDto = (overrides: Partial<AmortizationQueryDto> = {}): AmortizationQueryDto => {
        const dto = new AmortizationQueryDto();
        Object.assign(dto, overrides);
        return dto;
    };

    describe('valid cases', () => {
        it('should pass with no fields provided (all optional)', async () => {
            const dto = buildDto();
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass with valid extraPayment only', async () => {
            const dto = buildDto({ extraPayment: 500 });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass with valid frequency only', async () => {
            const dto = buildDto({ frequency: ExtraPaymentFrequencyEnum.MONTHLY });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass with extraPayment = 0', async () => {
            const dto = buildDto({ extraPayment: 0 });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass with all valid fields - MONTHLY', async () => {
            const dto = buildDto({
                extraPayment: 200,
                frequency: ExtraPaymentFrequencyEnum.MONTHLY,
            });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass with all valid fields - YEARLY', async () => {
            const dto = buildDto({
                extraPayment: 1200,
                frequency: ExtraPaymentFrequencyEnum.YEARLY,
            });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass with all valid fields - WEEKLY', async () => {
            const dto = buildDto({ extraPayment: 50, frequency: ExtraPaymentFrequencyEnum.WEEKLY });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass with decimal extraPayment (2 decimal places)', async () => {
            const dto = buildDto({ extraPayment: 100.5 });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });

    describe('extraPayment validation', () => {
        it('should fail with negative extraPayment', async () => {
            const dto = buildDto({ extraPayment: -100 });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'extraPayment')).toBe(true);
        });

        it('should fail with string extraPayment', async () => {
            const dto = buildDto({ extraPayment: 'abc' as any });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'extraPayment')).toBe(true);
        });

        it('should fail with NaN extraPayment', async () => {
            const dto = buildDto({ extraPayment: NaN });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'extraPayment')).toBe(true);
        });

        it('should fail with Infinity extraPayment', async () => {
            const dto = buildDto({ extraPayment: Infinity });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'extraPayment')).toBe(true);
        });

        it('should fail with more than 2 decimal places', async () => {
            const dto = buildDto({ extraPayment: 100.999 });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'extraPayment')).toBe(true);
        });
    });

    describe('frequency validation', () => {
        it('should fail with invalid frequency value', async () => {
            const dto = buildDto({ frequency: 'DAILY' as any });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'frequency')).toBe(true);
        });

        it('should fail with numeric frequency', async () => {
            const dto = buildDto({ frequency: 123 as any });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'frequency')).toBe(true);
        });
    });
});
