import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RItemDto } from './r-item.dto';

const makeValid = (overrides = {}): object => ({
    roof: 100,
    landscaping: 200,
    concierge: 300,
    garage: 400,
    bathrooms: 500,
    ...overrides,
});

describe('RItemDto', () => {
    const validate_ = (plain: object) => validate(plainToInstance(RItemDto, plain));

    describe('roof', () => {
        it('should pass with a valid positive number', async () => {
            expect(await validate_(makeValid())).toHaveLength(0);
        });

        it('should pass with 0', async () => {
            expect(await validate_(makeValid({ roof: 0 }))).toHaveLength(0);
        });

        it('should fail when roof is missing', async () => {
            const errors = await validate_(makeValid({ roof: undefined }));
            expect(errors.some((e) => e.property === 'roof')).toBe(true);
        });

        it('should fail when roof is negative', async () => {
            const errors = await validate_(makeValid({ roof: -1 }));
            expect(errors.some((e) => e.property === 'roof')).toBe(true);
        });

        it('should fail when roof is a string', async () => {
            const errors = await validate_(makeValid({ roof: 'abc' }));
            expect(errors.some((e) => e.property === 'roof')).toBe(true);
        });
    });

    describe('landscaping', () => {
        it('should pass with 0', async () => {
            expect(await validate_(makeValid({ landscaping: 0 }))).toHaveLength(0);
        });

        it('should fail when landscaping is missing', async () => {
            const errors = await validate_(makeValid({ landscaping: undefined }));
            expect(errors.some((e) => e.property === 'landscaping')).toBe(true);
        });

        it('should fail when landscaping is negative', async () => {
            const errors = await validate_(makeValid({ landscaping: -5 }));
            expect(errors.some((e) => e.property === 'landscaping')).toBe(true);
        });

        it('should fail when landscaping is a string', async () => {
            const errors = await validate_(makeValid({ landscaping: 'x' }));
            expect(errors.some((e) => e.property === 'landscaping')).toBe(true);
        });
    });

    describe('concierge', () => {
        it('should pass with a valid number', async () => {
            expect(await validate_(makeValid({ concierge: 50 }))).toHaveLength(0);
        });

        it('should fail when concierge is missing', async () => {
            const errors = await validate_(makeValid({ concierge: undefined }));
            expect(errors.some((e) => e.property === 'concierge')).toBe(true);
        });

        it('should fail when concierge is negative', async () => {
            const errors = await validate_(makeValid({ concierge: -10 }));
            expect(errors.some((e) => e.property === 'concierge')).toBe(true);
        });

        it('should fail when concierge is a string', async () => {
            const errors = await validate_(makeValid({ concierge: 'bad' }));
            expect(errors.some((e) => e.property === 'concierge')).toBe(true);
        });
    });

    describe('garage', () => {
        it('should pass with 0', async () => {
            expect(await validate_(makeValid({ garage: 0 }))).toHaveLength(0);
        });

        it('should fail when garage is missing', async () => {
            const errors = await validate_(makeValid({ garage: undefined }));
            expect(errors.some((e) => e.property === 'garage')).toBe(true);
        });

        it('should fail when garage is negative', async () => {
            const errors = await validate_(makeValid({ garage: -1 }));
            expect(errors.some((e) => e.property === 'garage')).toBe(true);
        });

        it('should fail when garage is a string', async () => {
            const errors = await validate_(makeValid({ garage: 'nope' }));
            expect(errors.some((e) => e.property === 'garage')).toBe(true);
        });
    });

    describe('bathrooms', () => {
        it('should pass with 0', async () => {
            expect(await validate_(makeValid({ bathrooms: 0 }))).toHaveLength(0);
        });

        it('should fail when bathrooms is missing', async () => {
            const errors = await validate_(makeValid({ bathrooms: undefined }));
            expect(errors.some((e) => e.property === 'bathrooms')).toBe(true);
        });

        it('should fail when bathrooms is negative', async () => {
            const errors = await validate_(makeValid({ bathrooms: -3 }));
            expect(errors.some((e) => e.property === 'bathrooms')).toBe(true);
        });

        it('should fail when bathrooms is a string', async () => {
            const errors = await validate_(makeValid({ bathrooms: 'bad' }));
            expect(errors.some((e) => e.property === 'bathrooms')).toBe(true);
        });
    });
});
