import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RefiCreateDto } from './refi-create.dto';

const makeValid = (overrides = {}): object => ({
    afterRepairValue: 300000,
    refiLTV: 75,
    oldLoanAmount: 180000,
    pInterest: 1200,
    interestRate: 4.5,
    pmi: 100,
    hoa: 200,
    point: 1,
    hasItems: false,
    ...overrides,
});

describe('RefiCreateDto', () => {
    const validate_ = (plain: object) => validate(plainToInstance(RefiCreateDto, plain));

    it('should pass with all required fields and no optional', async () => {
        expect(await validate_(makeValid())).toHaveLength(0);
    });

    it('should pass with valid closingCoast provided', async () => {
        expect(await validate_(makeValid({ closingCoast: 3000 }))).toHaveLength(0);
    });

    it('should pass with valid item provided', async () => {
        expect(
            await validate_(
                makeValid({
                    item: { items: [{ label: 'Appraisal', value: 500 }] },
                }),
            ),
        ).toHaveLength(0);
    });

    const requiredNumericFields = [
        { field: 'afterRepairValue', min: 0 },
        { field: 'oldLoanAmount', min: 0 },
        { field: 'pInterest', min: 0 },
        { field: 'pmi', min: 0 },
        { field: 'hoa', min: 0 },
        { field: 'point', min: 0 },
    ];

    const rangeFields = [
        { field: 'refiLTV', min: 0, max: 100 },
        { field: 'interestRate', min: 0, max: 100 },
    ];

    requiredNumericFields.forEach(({ field }) => {
        describe(`${field} (required)`, () => {
            it(`should fail when ${field} is missing`, async () => {
                const errors = await validate_(makeValid({ [field]: undefined }));
                expect(errors.some((e) => e.property === field)).toBe(true);
            });

            it(`should fail when ${field} is a string`, async () => {
                const errors = await validate_(makeValid({ [field]: 'bad' }));
                expect(errors.some((e) => e.property === field)).toBe(true);
            });

            it(`should pass when ${field} is 0`, async () => {
                expect(await validate_(makeValid({ [field]: 0 }))).toHaveLength(0);
            });
        });
    });

    rangeFields.forEach(({ field, max }) => {
        describe(`${field} (required, 0-${max})`, () => {
            it(`should fail when ${field} is missing`, async () => {
                const errors = await validate_(makeValid({ [field]: undefined }));
                expect(errors.some((e) => e.property === field)).toBe(true);
            });

            it(`should fail when ${field} exceeds ${max}`, async () => {
                const errors = await validate_(makeValid({ [field]: max + 1 }));
                expect(errors.some((e) => e.property === field)).toBe(true);
            });

            it(`should pass when ${field} is exactly ${max}`, async () => {
                expect(await validate_(makeValid({ [field]: max }))).toHaveLength(0);
            });

            it(`should pass when ${field} is 0`, async () => {
                expect(await validate_(makeValid({ [field]: 0 }))).toHaveLength(0);
            });
        });
    });

    describe('hasItems (required boolean)', () => {
        it('should fail when hasItems is missing', async () => {
            const errors = await validate_(makeValid({ hasItems: undefined }));
            expect(errors.some((e) => e.property === 'hasItems')).toBe(true);
        });

        it('should fail when hasItems is a string', async () => {
            const errors = await validate_(makeValid({ hasItems: 'yes' }));
            expect(errors.some((e) => e.property === 'hasItems')).toBe(true);
        });

        it('should pass with true', async () => {
            expect(await validate_(makeValid({ hasItems: true }))).toHaveLength(0);
        });

        it('should pass with false', async () => {
            expect(await validate_(makeValid({ hasItems: false }))).toHaveLength(0);
        });
    });

    describe('closingCoast (optional)', () => {
        it('should pass when closingCoast is omitted', async () => {
            const errors = await validate_(makeValid({ closingCoast: undefined }));
            expect(errors.some((e) => e.property === 'closingCoast')).toBe(false);
        });

        it('should fail when closingCoast is negative', async () => {
            const errors = await validate_(makeValid({ closingCoast: -1 }));
            expect(errors.some((e) => e.property === 'closingCoast')).toBe(true);
        });

        it('should fail when closingCoast is a string', async () => {
            const errors = await validate_(makeValid({ closingCoast: 'bad' }));
            expect(errors.some((e) => e.property === 'closingCoast')).toBe(true);
        });

        it('should pass with 0', async () => {
            expect(await validate_(makeValid({ closingCoast: 0 }))).toHaveLength(0);
        });
    });

    describe('item (optional nested)', () => {
        it('should pass when item is omitted', async () => {
            const errors = await validate_(makeValid({ item: undefined }));
            expect(errors.some((e) => e.property === 'item')).toBe(false);
        });

        it('should fail when item.items is empty array', async () => {
            const errors = await validate_(makeValid({ item: { items: [] } }));
            expect(errors.some((e) => e.property === 'item')).toBe(true);
        });

        it('should fail when item.items contains invalid entry', async () => {
            const errors = await validate_(
                makeValid({ item: { items: [{ label: 'A', value: 'bad' }] } }),
            );
            expect(errors.some((e) => e.property === 'item')).toBe(true);
        });
    });
});
