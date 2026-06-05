import { validate } from 'class-validator';
import { CalculateDownPaymentPercentageDto } from './calculate-down-payment-percentage.dto';

describe('CalculateDownPaymentPercentageDto', () => {
    const buildDto = (
        overrides: Partial<CalculateDownPaymentPercentageDto> = {},
    ): CalculateDownPaymentPercentageDto => {
        const dto = new CalculateDownPaymentPercentageDto();
        Object.assign(dto, { purchasePrice: 300000, downPaymentAmount: 60000, ...overrides });
        return dto;
    };

    describe('valid cases', () => {
        it('should pass with valid purchasePrice and downPaymentAmount', async () => {
            const dto = buildDto();
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass with downPaymentAmount = 0', async () => {
            const dto = buildDto({ downPaymentAmount: 0 });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass with decimal values (2 decimal places)', async () => {
            const dto = buildDto({ purchasePrice: 250000.5, downPaymentAmount: 50000.25 });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass with purchasePrice = 0', async () => {
            const dto = buildDto({ purchasePrice: 0 });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass with large values', async () => {
            const dto = buildDto({ purchasePrice: 9999999, downPaymentAmount: 1999999 });
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
            const dto = buildDto({ purchasePrice: -500 });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'purchasePrice')).toBe(true);
        });

        it('should fail with string purchasePrice', async () => {
            const dto = buildDto({ purchasePrice: 'three hundred' as any });
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

    describe('downPaymentAmount validation', () => {
        it('should fail when downPaymentAmount is missing', async () => {
            const dto = buildDto({ downPaymentAmount: undefined as any });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'downPaymentAmount')).toBe(true);
        });

        it('should fail with negative downPaymentAmount', async () => {
            const dto = buildDto({ downPaymentAmount: -1000 });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'downPaymentAmount')).toBe(true);
        });

        it('should fail with string downPaymentAmount', async () => {
            const dto = buildDto({ downPaymentAmount: 'sixty thousand' as any });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'downPaymentAmount')).toBe(true);
        });

        it('should fail with NaN downPaymentAmount', async () => {
            const dto = buildDto({ downPaymentAmount: NaN });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'downPaymentAmount')).toBe(true);
        });

        it('should fail with Infinity downPaymentAmount', async () => {
            const dto = buildDto({ downPaymentAmount: Infinity });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'downPaymentAmount')).toBe(true);
        });

        it('should fail with more than 2 decimal places', async () => {
            const dto = buildDto({ downPaymentAmount: 60000.999 });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'downPaymentAmount')).toBe(true);
        });
    });
});
