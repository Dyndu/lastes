import { validate } from 'class-validator';
import { CalculateDownPaymentDto } from './calculate-down-payment.dto';

describe('CalculateDownPaymentDto', () => {
    const buildDto = (
        overrides: Partial<CalculateDownPaymentDto> = {},
    ): CalculateDownPaymentDto => {
        const dto = new CalculateDownPaymentDto();
        Object.assign(dto, { purchasePrice: 300000, downPaymentPercentage: 20, ...overrides });
        return dto;
    };

    describe('valid cases', () => {
        it('should pass with valid purchasePrice and downPaymentPercentage', async () => {
            const dto = buildDto();
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass with downPaymentPercentage = 0 (min boundary)', async () => {
            const dto = buildDto({ downPaymentPercentage: 0 });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass with downPaymentPercentage = 100 (max boundary)', async () => {
            const dto = buildDto({ downPaymentPercentage: 100 });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass with decimal values (2 decimal places)', async () => {
            const dto = buildDto({ purchasePrice: 350000.5, downPaymentPercentage: 10.25 });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass with minimum purchasePrice = 0', async () => {
            const dto = buildDto({ purchasePrice: 0 });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });

    describe('purchasePrice validation', () => {
        it('should fail when purchasePrice is missing', async () => {
            const dto = buildDto({ purchasePrice: undefined as any });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'purchasePrice')).toBe(true);
        });

        it('should fail with negative purchasePrice', async () => {
            const dto = buildDto({ purchasePrice: -1 });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'purchasePrice')).toBe(true);
        });

        it('should fail with string purchasePrice', async () => {
            const dto = buildDto({ purchasePrice: 'abc' as any });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'purchasePrice')).toBe(true);
        });

        it('should fail with NaN purchasePrice', async () => {
            const dto = buildDto({ purchasePrice: NaN });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'purchasePrice')).toBe(true);
        });

        it('should fail with Infinity purchasePrice', async () => {
            const dto = buildDto({ purchasePrice: Infinity });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'purchasePrice')).toBe(true);
        });

        it('should fail with more than 2 decimal places', async () => {
            const dto = buildDto({ purchasePrice: 300000.999 });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'purchasePrice')).toBe(true);
        });
    });

    describe('downPaymentPercentage validation', () => {
        it('should fail when downPaymentPercentage is missing', async () => {
            const dto = buildDto({ downPaymentPercentage: undefined as any });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'downPaymentPercentage')).toBe(true);
        });

        it('should fail with downPaymentPercentage below 0', async () => {
            const dto = buildDto({ downPaymentPercentage: -1 });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'downPaymentPercentage')).toBe(true);
        });

        it('should fail with downPaymentPercentage above 100', async () => {
            const dto = buildDto({ downPaymentPercentage: 101 });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'downPaymentPercentage')).toBe(true);
        });

        it('should fail with string downPaymentPercentage', async () => {
            const dto = buildDto({ downPaymentPercentage: 'fifty' as any });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'downPaymentPercentage')).toBe(true);
        });

        it('should fail with NaN downPaymentPercentage', async () => {
            const dto = buildDto({ downPaymentPercentage: NaN });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'downPaymentPercentage')).toBe(true);
        });

        it('should fail with more than 2 decimal places', async () => {
            const dto = buildDto({ downPaymentPercentage: 10.999 });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'downPaymentPercentage')).toBe(true);
        });
    });
});
