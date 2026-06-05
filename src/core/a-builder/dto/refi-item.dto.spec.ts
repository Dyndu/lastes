import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RefiItemDto } from './refi-item.dto';

describe('RefiItemDto', () => {
    const validate_ = (plain: object) => validate(plainToInstance(RefiItemDto, plain));

    it('should pass with valid label and value', async () => {
        expect(await validate_({ label: 'Appraisal', value: 500 })).toHaveLength(0);
    });

    describe('label', () => {
        it('should fail when label is missing', async () => {
            const errors = await validate_({ value: 100 });
            expect(errors.some((e) => e.property === 'label')).toBe(true);
        });

        it('should fail when label is too short (< 2 chars)', async () => {
            const errors = await validate_({ label: 'A', value: 100 });
            expect(errors.some((e) => e.property === 'label')).toBe(true);
        });

        it('should fail when label is a number', async () => {
            const errors = await validate_({ label: 123, value: 100 });
            expect(errors.some((e) => e.property === 'label')).toBe(true);
        });

        it('should pass when label is exactly 2 chars', async () => {
            expect(await validate_({ label: 'AB', value: 100 })).toHaveLength(0);
        });
    });

    describe('value', () => {
        it('should fail when value is missing', async () => {
            const errors = await validate_({ label: 'Appraisal' });
            expect(errors.some((e) => e.property === 'value')).toBe(true);
        });

        it('should fail when value is a string', async () => {
            const errors = await validate_({ label: 'Appraisal', value: 'bad' });
            expect(errors.some((e) => e.property === 'value')).toBe(true);
        });

        it('should pass with 0', async () => {
            expect(await validate_({ label: 'Appraisal', value: 0 })).toHaveLength(0);
        });
    });
});
