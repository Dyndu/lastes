import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CCoastDto } from './c-coast.dto';

function makeValid(overrides: Partial<CCoastDto> = {}): CCoastDto {
    return plainToInstance(CCoastDto, {
        rContingency: 10,
        duration: 6,
        hasItems: false,
        ...overrides,
    });
}

describe('CCoastDto', () => {
    describe('valid object', () => {
        it('should pass validation with all required fields', async () => {
            const errors = await validate(makeValid());
            expect(errors).toHaveLength(0);
        });

        it('should pass validation with all optional fields included', async () => {
            const errors = await validate(
                makeValid({
                    holdingCoast: 5000,
                    eRepairs: { roof: 1000, landscaping: 0, concierge: 0, garage: 0, bathrooms: 0 },
                    iRepairs: { roof: 0, landscaping: 500, concierge: 0, garage: 0, bathrooms: 0 },
                    oRepairs: { roof: 0, landscaping: 0, concierge: 200, garage: 0, bathrooms: 0 },
                }),
            );
            expect(errors).toHaveLength(0);
        });

        it('should pass with boundary value rContingency = 0', async () => {
            const errors = await validate(makeValid({ rContingency: 0 }));
            expect(errors).toHaveLength(0);
        });

        it('should pass with boundary value rContingency = 100', async () => {
            const errors = await validate(makeValid({ rContingency: 100 }));
            expect(errors).toHaveLength(0);
        });

        it('should pass with hasItems = true', async () => {
            const errors = await validate(makeValid({ hasItems: true }));
            expect(errors).toHaveLength(0);
        });

        it('should pass with decimal values', async () => {
            const errors = await validate(makeValid({ rContingency: 10.5, duration: 6.0 }));
            expect(errors).toHaveLength(0);
        });

        it('should pass with holdingCoast = 0', async () => {
            const errors = await validate(makeValid({ holdingCoast: 0 }));
            expect(errors).toHaveLength(0);
        });
    });

    describe('rContingency', () => {
        it('should fail when rContingency is missing', async () => {
            const errors = await validate(makeValid({ rContingency: undefined }));
            expect(errors.some((e) => e.property === 'rContingency')).toBe(true);
        });

        it('should fail when rContingency exceeds 100', async () => {
            const errors = await validate(makeValid({ rContingency: 101 }));
            expect(errors.some((e) => e.property === 'rContingency')).toBe(true);
        });

        it('should fail when rContingency is negative', async () => {
            const errors = await validate(makeValid({ rContingency: -1 }));
            expect(errors.some((e) => e.property === 'rContingency')).toBe(true);
        });

        it('should fail when rContingency is a string', async () => {
            const errors = await validate(makeValid({ rContingency: 'abc' as any }));
            expect(errors.some((e) => e.property === 'rContingency')).toBe(true);
        });
    });

    describe('duration', () => {
        it('should fail when duration is missing', async () => {
            const errors = await validate(makeValid({ duration: undefined }));
            expect(errors.some((e) => e.property === 'duration')).toBe(true);
        });

        it('should fail when duration is a string', async () => {
            const errors = await validate(makeValid({ duration: 'abc' as any }));
            expect(errors.some((e) => e.property === 'duration')).toBe(true);
        });

        it('should fail when duration is negative', async () => {
            const errors = await validate(makeValid({ duration: -1 }));
            expect(errors.some((e) => e.property === 'duration')).toBe(true);
        });
    });

    describe('hasItems', () => {
        it('should fail when hasItems is missing', async () => {
            const errors = await validate(makeValid({ hasItems: undefined }));
            expect(errors.some((e) => e.property === 'hasItems')).toBe(true);
        });
    });

    describe('holdingCoast (optional)', () => {
        it('should pass when holdingCoast is absent', async () => {
            const errors = await validate(makeValid());
            expect(errors.some((e) => e.property === 'holdingCoast')).toBe(false);
        });

        it('should fail when holdingCoast is a string', async () => {
            const errors = await validate(makeValid({ holdingCoast: 'abc' as any }));
            expect(errors.some((e) => e.property === 'holdingCoast')).toBe(true);
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
