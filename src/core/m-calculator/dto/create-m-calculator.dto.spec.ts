import { validate } from 'class-validator';
import { CreateMCalculatorDto } from './create-m-calculator.dto';
import { CreditScoreEnum, MCalculatorTypeEnum } from '../../../common/enum';

describe('CreateMCalculatorDto', () => {
    const buildDto = (overrides: Partial<CreateMCalculatorDto> = {}): CreateMCalculatorDto => {
        const dto = new CreateMCalculatorDto();
        Object.assign(dto, {
            purchasePrice: 400000,
            downPaymentAmount: 80000,
            downPaymentPercentage: 20,
            interestRate: 6.5,
            loanTerm: 30,
            typeEnum: MCalculatorTypeEnum.BASIC,
            ...overrides,
        });
        return dto;
    };

    describe('valid cases', () => {
        it('should pass with all required fields valid - BASIC', async () => {
            const dto = buildDto();
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass with all required fields valid - ADVANCED', async () => {
            const dto = buildDto({ typeEnum: MCalculatorTypeEnum.ADVANCED });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass with all fields including optional ones', async () => {
            const dto = buildDto({
                typeEnum: MCalculatorTypeEnum.ADVANCED,
                loanStartDate: '2024-12-01T00:00:00.000Z',
                annualPropertyTaxes: 5000,
                annualHomeInsurance: 1200,
                additionalMonthlyPayment: 200,
                creditScore: CreditScoreEnum.EXCELLENT,
            });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass without optional fields', async () => {
            const dto = buildDto({
                loanStartDate: undefined,
                annualPropertyTaxes: undefined,
                annualHomeInsurance: undefined,
                additionalMonthlyPayment: undefined,
                creditScore: undefined,
            });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass with interestRate = 0 (min boundary)', async () => {
            const dto = buildDto({ interestRate: 0 });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should pass with interestRate = 100 (max boundary)', async () => {
            const dto = buildDto({ interestRate: 100 });
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

        it('should pass with all CreditScoreEnum values', async () => {
            for (const score of Object.values(CreditScoreEnum)) {
                const dto = buildDto({ creditScore: score });
                const errors = await validate(dto);
                expect(errors).toHaveLength(0);
            }
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

        it('should fail with more than 2 decimal places', async () => {
            const dto = buildDto({ purchasePrice: 400000.999 });
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
            const dto = buildDto({ downPaymentAmount: -1 });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'downPaymentAmount')).toBe(true);
        });

        it('should fail with NaN downPaymentAmount', async () => {
            const dto = buildDto({ downPaymentAmount: NaN });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'downPaymentAmount')).toBe(true);
        });

        it('should fail with more than 2 decimal places', async () => {
            const dto = buildDto({ downPaymentAmount: 80000.999 });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'downPaymentAmount')).toBe(true);
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

        it('should fail with more than 2 decimal places', async () => {
            const dto = buildDto({ downPaymentPercentage: 20.999 });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'downPaymentPercentage')).toBe(true);
        });
    });

    describe('interestRate validation', () => {
        it('should fail when interestRate is missing', async () => {
            const dto = buildDto({ interestRate: undefined as any });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'interestRate')).toBe(true);
        });

        it('should fail with interestRate below 0', async () => {
            const dto = buildDto({ interestRate: -0.1 });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'interestRate')).toBe(true);
        });

        it('should fail with interestRate above 100', async () => {
            const dto = buildDto({ interestRate: 100.1 });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'interestRate')).toBe(true);
        });

        it('should fail with NaN interestRate', async () => {
            const dto = buildDto({ interestRate: NaN });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'interestRate')).toBe(true);
        });
    });

    describe('loanTerm validation', () => {
        it('should fail when loanTerm is missing', async () => {
            const dto = buildDto({ loanTerm: undefined as any });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'loanTerm')).toBe(true);
        });

        it('should fail with negative loanTerm', async () => {
            const dto = buildDto({ loanTerm: -1 });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'loanTerm')).toBe(true);
        });

        it('should fail with string loanTerm', async () => {
            const dto = buildDto({ loanTerm: 'thirty' as any });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'loanTerm')).toBe(true);
        });
    });

    describe('typeEnum validation', () => {
        it('should fail when typeEnum is missing', async () => {
            const dto = buildDto({ typeEnum: undefined as any });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'typeEnum')).toBe(true);
        });

        it('should fail with invalid typeEnum value', async () => {
            const dto = buildDto({ typeEnum: 'PREMIUM' as any });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'typeEnum')).toBe(true);
        });
    });

    describe('loanStartDate validation (optional)', () => {
        it('should pass with valid ISO 8601 date string', async () => {
            const dto = buildDto({ loanStartDate: '2024-12-01T00:00:00.000Z' as any });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

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

    describe('optional numeric fields validation', () => {
        const optionalNumericFields: Array<keyof CreateMCalculatorDto> = [
            'annualPropertyTaxes',
            'annualHomeInsurance',
            'additionalMonthlyPayment',
        ];

        for (const field of optionalNumericFields) {
            it(`should pass when ${field} is absent`, async () => {
                const dto = buildDto({ [field]: undefined });
                const errors = await validate(dto);
                expect(errors).toHaveLength(0);
            });

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

    describe('creditScore validation (optional)', () => {
        it('should pass when creditScore is absent', async () => {
            const dto = buildDto({ creditScore: undefined });
            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should fail with invalid creditScore value', async () => {
            const dto = buildDto({ creditScore: 'SUPER' as any });
            const errors = await validate(dto);
            expect(errors.some((e) => e.property === 'creditScore')).toBe(true);
        });
    });
});
