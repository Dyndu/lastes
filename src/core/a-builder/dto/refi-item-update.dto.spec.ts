import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RefiItemUpdateDto } from './refi-item-update.dto';

describe('RefiItemUpdateDto', () => {
    const validate_ = (plain: object) => validate(plainToInstance(RefiItemUpdateDto, plain));

    it('should pass with valid label, value and no id', async () => {
        expect(await validate_({ label: 'Title', value: 300 })).toHaveLength(0);
    });

    it('should pass with valid label, value and valid UUID id', async () => {
        expect(
            await validate_({
                label: 'Title',
                value: 300,
                id: '2908dec0-a048-4a29-9810-e730e48a057b',
            }),
        ).toHaveLength(0);
    });

    describe('id (optional)', () => {
        it('should pass when id is omitted', async () => {
            const errors = await validate_({ label: 'Title', value: 100 });
            expect(errors.some((e) => e.property === 'id')).toBe(false);
        });

        it('should fail when id is not a valid UUID', async () => {
            const errors = await validate_({ label: 'Title', value: 100, id: 'not-a-uuid' });
            expect(errors.some((e) => e.property === 'id')).toBe(true);
        });

        it('should fail when id is too short (< 2 chars)', async () => {
            const errors = await validate_({ label: 'Title', value: 100, id: 'x' });
            expect(errors.some((e) => e.property === 'id')).toBe(true);
        });
    });

    describe('inherited label', () => {
        it('should fail when label is missing', async () => {
            const errors = await validate_({ value: 100 });
            expect(errors.some((e) => e.property === 'label')).toBe(true);
        });

        it('should fail when label is too short', async () => {
            const errors = await validate_({ label: 'A', value: 100 });
            expect(errors.some((e) => e.property === 'label')).toBe(true);
        });
    });

    describe('inherited value', () => {
        it('should fail when value is missing', async () => {
            const errors = await validate_({ label: 'Title' });
            expect(errors.some((e) => e.property === 'value')).toBe(true);
        });

        it('should fail when value is a string', async () => {
            const errors = await validate_({ label: 'Title', value: 'bad' });
            expect(errors.some((e) => e.property === 'value')).toBe(true);
        });
    });
});
