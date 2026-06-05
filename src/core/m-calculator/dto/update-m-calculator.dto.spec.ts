import { validate } from 'class-validator';
import { UpdateMCalculatorDto } from './update-m-calculator.dto';
import { CreditScoreEnum, MCalculatorTypeEnum } from '../../../common/enum';

describe('UpdateMCalculatorDto', () => {
    const buildDto = (overrides: Partial<UpdateMCalculatorDto> = {}): UpdateMCalculatorDto => {
        const dto = new UpdateMCalculatorDto();
        Object.assign(dto, overrides);
        return dto;
    };

    describe('valid cases — all fields optional via PartialType', () => {
        it('should pass with empty object (all fields optional)', async () => {
            const dto = buildDto();
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass with only purchasePrice provided', async () => {
            const dto = buildDto({ purchasePrice: 500000 });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass with only typeEnum provided', async () => {
            const dto = buildDto({ typeEnum: MCalculatorTypeEnum.ADVANCED });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass with only creditScore provided', async () => {
            const dto = buildDto({ creditScore: CreditScoreEnum.GOOD });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass with only loanStartDate provided as ISO 8601', async () => {
            const dto = buildDto({ loanStartDate: '2025-06-01T00:00:00.000Z' as any });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass with all fields provided and valid', async () => {
            const dto = buildDto({
                purchasePrice: 400000,
                downPaymentAmount: 80000,
                downPaymentPercentage: 20,
                interestRate: 6.5,
                loanTerm: 30,
                typeEnum: MCalculatorTypeEnum.ADVANCED,
                loanStartDate: '2025-01-01T00:00:00.000Z',
                annualPropertyTaxes: 5000,
                annualHomeInsurance: 1200,
                additionalMonthlyPayment: 200,
                creditScore: CreditScoreEnum.EXCELLENT,
            });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass with downPaymentPercentage at boundaries (0 and 100)', async () => {
            for (const val of [0, 100]) {
                const dto = buildDto({ downPaymentPercentage: val });
                const errors = await validate(dto);
                expect(errors).toHaveLength(0);
            }
        });

        it('should pass with interestRate at boundaries (0 and 100)', async () => {
            for (const val of [0, 100]) {
                const dto = buildDto({ interestRate: val });
                const errors = await validate(dto);
                expect(errors).toHaveLength(0);
            }
        });
    });

    describe('purchasePrice validation (when provided)', () => {
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
            const dto = buildDto({ purchasePrice: 400000.999 });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'purchasePrice')).toBe(true);
        });
    });

    describe('downPaymentPercentage validation (when provided)', () => {
        it('should fail below 0', async () => {
            const dto = buildDto({ downPaymentPercentage: -1 });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'downPaymentPercentage')).toBe(true);
        });

        it('should fail above 100', async () => {
            const dto = buildDto({ downPaymentPercentage: 101 });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'downPaymentPercentage')).toBe(true);
        });

        it('should fail with more than 2 decimal places', async () => {
            const dto = buildDto({ downPaymentPercentage: 20.999 });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'downPaymentPercentage')).toBe(true);
        });
    });

    describe('interestRate validation (when provided)', () => {
        it('should fail below 0', async () => {
            const dto = buildDto({ interestRate: -0.1 });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'interestRate')).toBe(true);
        });

        it('should fail above 100', async () => {
            const dto = buildDto({ interestRate: 100.1 });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'interestRate')).toBe(true);
        });

        it('should fail with NaN', async () => {
            const dto = buildDto({ interestRate: NaN });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'interestRate')).toBe(true);
        });
    });

    describe('typeEnum validation (when provided)', () => {
        it('should fail with invalid typeEnum', async () => {
            const dto = buildDto({ typeEnum: 'PREMIUM' as any });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'typeEnum')).toBe(true);
        });
    });

    describe('creditScore validation (when provided)', () => {
        it('should fail with invalid creditScore', async () => {
            const dto = buildDto({ creditScore: 'SUPER' as any });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'creditScore')).toBe(true);
        });

        it('should pass with all valid CreditScoreEnum values', async () => {
            for (const score of Object.values(CreditScoreEnum)) {
                const dto = buildDto({ creditScore: score });
                const errors = await validate(dto);
                expect(errors).toHaveLength(0);
            }
        });
    });

    describe('loanStartDate validation (when provided)', () => {
        it('should fail with invalid date string', async () => {
            const dto = buildDto({ loanStartDate: 'not-a-date' as any });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'loanStartDate')).toBe(true);
        });

        it('should fail with numeric date', async () => {
            const dto = buildDto({ loanStartDate: 20241201 as any });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'loanStartDate')).toBe(true);
        });
    });

    describe('optional numeric fields (when provided)', () => {
        const fields: Array<keyof UpdateMCalculatorDto> = [
            'annualPropertyTaxes',
            'annualHomeInsurance',
            'additionalMonthlyPayment',
            'downPaymentAmount',
            'loanTerm',
        ];

        for (const field of fields) {
            it(`should fail when ${field} is negative`, async () => {
                const dto = buildDto({ [field]: -1 });
                const errors = await validate(dto);
                expect(errors.some((e) => e.property === field)).toBe(true);
            });

            it(`should fail when ${field} has more than 2 decimal places`, async () => {
                const dto = buildDto({ [field]: 100.999 });
                const errors = await validate(dto);
                expect(errors.some((e) => e.property === field)).toBe(true);
            });

            it(`should fail when ${field} is a string`, async () => {
                const dto = buildDto({ [field]: 'abc' as any });
                const errors = await validate(dto);
                expect(errors.some((e) => e.property === field)).toBe(true);
            });
        }
    });
});
