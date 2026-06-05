import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { HDurationDto } from './h-duration.dto';

const makeValid = (overrides = {}): object => ({
    duration: 6,
    transactionFee: 1500,
    otherFee: 300,
    targetProfit: 20000,
    hasItems: false,
    ...overrides,
});

describe('HDurationDto', () => {
    const validate_ = (plain: object) => validate(plainToInstance(HDurationDto, plain));

    it('should pass with all required fields and no optional', async () => {
        expect(await validate_(makeValid())).toHaveLength(0);
    });

    it('should pass with holdingCoast provided', async () => {
        expect(await validate_(makeValid({ holdingCoast: 5000 }))).toHaveLength(0);
    });

    it('should pass with item provided', async () => {
        expect(
            await validate_(
                makeValid({
                    item: {
                        roof: 100,
                        landscaping: 200,
                        concierge: 300,
                        garage: 400,
                        bathrooms: 500,
                    },
                }),
            ),
        ).toHaveLength(0);
    });

    const requiredFields = ['duration', 'transactionFee', 'otherFee', 'targetProfit'];

    requiredFields.forEach((field) => {
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

    describe('holdingCoast (optional)', () => {
        it('should pass when holdingCoast is omitted', async () => {
            const errors = await validate_(makeValid({ holdingCoast: undefined }));
            expect(errors.some((e) => e.property === 'holdingCoast')).toBe(false);
        });

        it('should fail when holdingCoast is negative', async () => {
            const errors = await validate_(makeValid({ holdingCoast: -1 }));
            expect(errors.some((e) => e.property === 'holdingCoast')).toBe(true);
        });

        it('should fail when holdingCoast is a string', async () => {
            const errors = await validate_(makeValid({ holdingCoast: 'bad' }));
            expect(errors.some((e) => e.property === 'holdingCoast')).toBe(true);
        });

        it('should pass with 0', async () => {
            expect(await validate_(makeValid({ holdingCoast: 0 }))).toHaveLength(0);
        });
    });

    describe('item (optional nested RItemDto)', () => {
        it('should pass when item is omitted', async () => {
            const errors = await validate_(makeValid({ item: undefined }));
            expect(errors.some((e) => e.property === 'item')).toBe(false);
        });

        it('should fail when item has missing required field', async () => {
            const errors = await validate_(
                makeValid({
                    item: { roof: 100, landscaping: 200, concierge: 300, garage: 400 },
                }),
            );
            expect(errors.some((e) => e.property === 'item')).toBe(true);
        });

        it('should fail when item has a negative field', async () => {
            const errors = await validate_(
                makeValid({
                    item: {
                        roof: -1,
                        landscaping: 200,
                        concierge: 300,
                        garage: 400,
                        bathrooms: 500,
                    },
                }),
            );
            expect(errors.some((e) => e.property === 'item')).toBe(true);
        });

        it('should fail when item has a string field', async () => {
            const errors = await validate_(
                makeValid({
                    item: {
                        roof: 'bad',
                        landscaping: 200,
                        concierge: 300,
                        garage: 400,
                        bathrooms: 500,
                    },
                }),
            );
            expect(errors.some((e) => e.property === 'item')).toBe(true);
        });
    });
});
