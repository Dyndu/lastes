import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RefiItemResolveDto } from './refi-item-resolve.dto';

const makeValidItem = (overrides = {}) => ({ label: 'Appraisal', value: 500, ...overrides });

describe('RefiItemResolveDto', () => {
    const validate_ = (plain: object) =>
        validate(plainToInstance(RefiItemResolveDto, plain), { whitelist: true });

    it('should pass with one valid item', async () => {
        expect(await validate_({ items: [makeValidItem()] })).toHaveLength(0);
    });

    it('should pass with multiple valid items', async () => {
        expect(
            await validate_({ items: [makeValidItem(), makeValidItem({ label: 'Title' })] }),
        ).toHaveLength(0);
    });

    describe('items', () => {
        it('should fail when items is missing', async () => {
            const errors = await validate_({});
            expect(errors.some((e) => e.property === 'items')).toBe(true);
        });

        it('should fail when items is an empty array', async () => {
            const errors = await validate_({ items: [] });
            expect(errors.some((e) => e.property === 'items')).toBe(true);
        });

        it('should fail when items is not an array', async () => {
            const errors = await validate_({ items: 'not-array' });
            expect(errors.some((e) => e.property === 'items')).toBe(true);
        });

        it('should fail when an item has invalid label', async () => {
            const errors = await validate_({ items: [makeValidItem({ label: 'A' })] });
            expect(errors.some((e) => e.property === 'items')).toBe(true);
        });

        it('should fail when an item has invalid value', async () => {
            const errors = await validate_({ items: [makeValidItem({ value: 'bad' })] });
            expect(errors.some((e) => e.property === 'items')).toBe(true);
        });

        it('should fail when an item is missing value', async () => {
            const errors = await validate_({ items: [{ label: 'Appraisal' }] });
            expect(errors.some((e) => e.property === 'items')).toBe(true);
        });
    });
});
