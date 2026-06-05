import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { BrRefiDto } from './br-refi.dto';

function makeValid(overrides: Partial<BrRefiDto> = {}): BrRefiDto {
    return plainToInstance(BrRefiDto, {
        afterRepairValue: 300000,
        refiLTV: 75,
        oldLoanAmount: 200000,
        pInterest: 1200,
        interestRate: 6.5,
        pmi: 150,
        point: 1,
        hasItems: false,
        ...overrides,
    });
}

describe('BrRefiDto', () => {
    describe('valid object', () => {
        it('should pass validation with all required fields', async () => {
            const errors = await validate(makeValid());
            expect(errors).toHaveLength(0);
        });

        it('should pass validation with all optional fields included', async () => {
            const errors = await validate(
                makeValid({
                    closingCoast: 3000,
                    eRepairs: { roof: 1000, landscaping: 0, concierge: 0, garage: 0, bathrooms: 0 },
                    iRepairs: { roof: 0, landscaping: 500, concierge: 0, garage: 0, bathrooms: 0 },
                    oRepairs: { roof: 0, landscaping: 0, concierge: 200, garage: 0, bathrooms: 0 },
                }),
            );
            expect(errors).toHaveLength(0);
        });

        it('should pass when optional fields are omitted', async () => {
            const errors = await validate(makeValid());
            expect(errors).toHaveLength(0);
        });

        it('should pass with boundary value refiLTV = 0', async () => {
            const errors = await validate(makeValid({ refiLTV: 0 }));
            expect(errors).toHaveLength(0);
        });

        it('should pass with boundary value refiLTV = 100', async () => {
            const errors = await validate(makeValid({ refiLTV: 100 }));
            expect(errors).toHaveLength(0);
        });

        it('should pass with boundary value interestRate = 0', async () => {
            const errors = await validate(makeValid({ interestRate: 0 }));
            expect(errors).toHaveLength(0);
        });

        it('should pass with boundary value interestRate = 100', async () => {
            const errors = await validate(makeValid({ interestRate: 100 }));
            expect(errors).toHaveLength(0);
        });

        it('should pass with closingCoast = 0', async () => {
            const errors = await validate(makeValid({ closingCoast: 0 }));
            expect(errors).toHaveLength(0);
        });

        it('should pass with hasItems = true', async () => {
            const errors = await validate(makeValid({ hasItems: true }));
            expect(errors).toHaveLength(0);
        });

        it('should pass with decimal values', async () => {
            const errors = await validate(
                makeValid({ afterRepairValue: 299999.99, refiLTV: 75.5 }),
            );
            expect(errors).toHaveLength(0);
        });
    });

    describe('afterRepairValue', () => {
        it('should fail when afterRepairValue is missing', async () => {
            const errors = await validate(makeValid({ afterRepairValue: undefined }));
            expect(errors.some((e) => e.property === 'afterRepairValue')).toBe(true);
        });

        it('should fail when afterRepairValue is a string', async () => {
            const errors = await validate(makeValid({ afterRepairValue: 'abc' as any }));
            expect(errors.some((e) => e.property === 'afterRepairValue')).toBe(true);
        });
    });

    describe('refiLTV', () => {
        it('should fail when refiLTV is missing', async () => {
            const errors = await validate(makeValid({ refiLTV: undefined }));
            expect(errors.some((e) => e.property === 'refiLTV')).toBe(true);
        });

        it('should fail when refiLTV exceeds 100', async () => {
            const errors = await validate(makeValid({ refiLTV: 101 }));
            expect(errors.some((e) => e.property === 'refiLTV')).toBe(true);
        });

        it('should fail when refiLTV is negative', async () => {
            const errors = await validate(makeValid({ refiLTV: -1 }));
            expect(errors.some((e) => e.property === 'refiLTV')).toBe(true);
        });
    });

    describe('oldLoanAmount', () => {
        it('should fail when oldLoanAmount is missing', async () => {
            const errors = await validate(makeValid({ oldLoanAmount: undefined }));
            expect(errors.some((e) => e.property === 'oldLoanAmount')).toBe(true);
        });

        it('should fail when oldLoanAmount is a string', async () => {
            const errors = await validate(makeValid({ oldLoanAmount: 'abc' as any }));
            expect(errors.some((e) => e.property === 'oldLoanAmount')).toBe(true);
        });
    });

    describe('pInterest', () => {
        it('should fail when pInterest is missing', async () => {
            const errors = await validate(makeValid({ pInterest: undefined }));
            expect(errors.some((e) => e.property === 'pInterest')).toBe(true);
        });

        it('should fail when pInterest is a string', async () => {
            const errors = await validate(makeValid({ pInterest: 'abc' as any }));
            expect(errors.some((e) => e.property === 'pInterest')).toBe(true);
        });
    });

    describe('interestRate', () => {
        it('should fail when interestRate is missing', async () => {
            const errors = await validate(makeValid({ interestRate: undefined }));
            expect(errors.some((e) => e.property === 'interestRate')).toBe(true);
        });

        it('should fail when interestRate exceeds 100', async () => {
            const errors = await validate(makeValid({ interestRate: 101 }));
            expect(errors.some((e) => e.property === 'interestRate')).toBe(true);
        });

        it('should fail when interestRate is negative', async () => {
            const errors = await validate(makeValid({ interestRate: -1 }));
            expect(errors.some((e) => e.property === 'interestRate')).toBe(true);
        });
    });

    describe('pmi', () => {
        it('should fail when pmi is missing', async () => {
            const errors = await validate(makeValid({ pmi: undefined }));
            expect(errors.some((e) => e.property === 'pmi')).toBe(true);
        });

        it('should fail when pmi is a string', async () => {
            const errors = await validate(makeValid({ pmi: 'abc' as any }));
            expect(errors.some((e) => e.property === 'pmi')).toBe(true);
        });
    });

    describe('point', () => {
        it('should fail when point is missing', async () => {
            const errors = await validate(makeValid({ point: undefined }));
            expect(errors.some((e) => e.property === 'point')).toBe(true);
        });

        it('should fail when point is a string', async () => {
            const errors = await validate(makeValid({ point: 'abc' as any }));
            expect(errors.some((e) => e.property === 'point')).toBe(true);
        });
    });

    describe('hasItems', () => {
        it('should fail when hasItems is missing', async () => {
            const errors = await validate(makeValid({ hasItems: undefined }));
            expect(errors.some((e) => e.property === 'hasItems')).toBe(true);
        });
    });

    describe('closingCoast (optional)', () => {
        it('should pass when closingCoast is absent', async () => {
            const errors = await validate(makeValid());
            expect(errors.some((e) => e.property === 'closingCoast')).toBe(false);
        });

        it('should fail when closingCoast is negative', async () => {
            const errors = await validate(makeValid({ closingCoast: -1 }));
            expect(errors.some((e) => e.property === 'closingCoast')).toBe(true);
        });

        it('should fail when closingCoast is a string', async () => {
            const errors = await validate(makeValid({ closingCoast: 'abc' as any }));
            expect(errors.some((e) => e.property === 'closingCoast')).toBe(true);
        });
    });

    describe('eRepairs (optional, nested)', () => {
        it('should pass when eRepairs is absent', async () => {
            const errors = await validate(makeValid());
            expect(errors.some((e) => e.property === 'eRepairs')).toBe(false);
        });

        it('should pass with valid eRepairs', async () => {
            const errors = await validate(
                makeValid({
                    eRepairs: { roof: 100, landscaping: 50, concierge: 0, garage: 0, bathrooms: 0 },
                }),
            );
            expect(errors.some((e) => e.property === 'eRepairs')).toBe(false);
        });

        it('should fail when eRepairs has invalid nested field', async () => {
            const errors = await validate(
                makeValid({
                    eRepairs: { roof: -1, landscaping: 0, concierge: 0, garage: 0, bathrooms: 0 },
                }),
            );
            expect(errors.some((e) => e.property === 'eRepairs')).toBe(true);
        });
    });

    describe('iRepairs (optional, nested)', () => {
        it('should pass when iRepairs is absent', async () => {
            const errors = await validate(makeValid());
            expect(errors.some((e) => e.property === 'iRepairs')).toBe(false);
        });

        it('should fail when iRepairs has invalid nested field', async () => {
            const errors = await validate(
                makeValid({
                    iRepairs: { roof: -5, landscaping: 0, concierge: 0, garage: 0, bathrooms: 0 },
                }),
            );
            expect(errors.some((e) => e.property === 'iRepairs')).toBe(true);
        });
    });

    describe('oRepairs (optional, nested)', () => {
        it('should pass when oRepairs is absent', async () => {
            const errors = await validate(makeValid());
            expect(errors.some((e) => e.property === 'oRepairs')).toBe(false);
        });

        it('should fail when oRepairs has invalid nested field', async () => {
            const errors = await validate(
                makeValid({
                    oRepairs: { roof: -5, landscaping: 0, concierge: 0, garage: 0, bathrooms: 0 },
                }),
            );
            expect(errors.some((e) => e.property === 'oRepairs')).toBe(true);
        });
    });
});
