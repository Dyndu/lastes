import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { StringArrayFieldDecorator } from './string-array-field.decorator';

class RequiredArrayDto {
    @StringArrayFieldDecorator('Tags', ['tag1', 'tag2'], 2, true)
    tags: string[];
}

class OptionalArrayDto {
    @StringArrayFieldDecorator('Optional Tags', ['tag1'], 2, false)
    tags?: string[];
}

class MaxItemsArrayDto {
    @StringArrayFieldDecorator('Limited Tags', ['tag1'], 2, true, 3)
    tags: string[];
}

describe('StringArrayFieldDecorator decorator', () => {
    it('should fail if required array is empty', async () => {
        const dto = plainToInstance(RequiredArrayDto, { tags: [] });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('arrayNotEmpty');
        expect(errors[0].constraints?.arrayNotEmpty).toContain('Tags should not be empty');
    });

    it('should fail if required array has invalid elements', async () => {
        const dto = plainToInstance(RequiredArrayDto, {
            tags: ['a', 123] as any,
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('isString');
        expect(errors[0].constraints?.isString).toContain('Tags elements must be strings');
    });

    it('should fail if required array elements are too short', async () => {
        const dto = plainToInstance(RequiredArrayDto, { tags: ['a', 'b'] });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('minLength');
        expect(errors[0].constraints?.minLength).toContain(
            'Tags elements must be at least 2 characters long',
        );
    });

    it('should pass if required array is valid', async () => {
        const dto = plainToInstance(RequiredArrayDto, {
            tags: ['tag1', 'tag2'],
        });
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should pass if optional array is undefined', async () => {
        const dto = plainToInstance(OptionalArrayDto, {});
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should fail if optional array has invalid elements', async () => {
        const dto = plainToInstance(OptionalArrayDto, {
            tags: ['ok', 123] as any,
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('isString');
        expect(errors[0].constraints?.isString).toContain('Optional Tags elements must be strings');
    });

    it('should pass if optional array is valid', async () => {
        const dto = plainToInstance(OptionalArrayDto, {
            tags: ['tag1', 'tag2'],
        });
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should fail if array contains duplicates', async () => {
        const dto = plainToInstance(RequiredArrayDto, { tags: ['api', 'api'] });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('arrayUnique');
        expect(errors[0].constraints?.arrayUnique).toContain(
            'Tags must not contain duplicate values',
        );
    });

    it('should fail if array exceeds maxItems', async () => {
        const dto = plainToInstance(MaxItemsArrayDto, {
            tags: ['tag1', 'tag2', 'tag3', 'tag4'],
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].constraints).toHaveProperty('arrayMaxSize');
        expect(errors[0].constraints?.arrayMaxSize).toContain(
            'Limited Tags must contain at most 3 items',
        );
    });

    it('should pass if array is exactly at maxItems limit', async () => {
        const dto = plainToInstance(MaxItemsArrayDto, {
            tags: ['tag1', 'tag2', 'tag3'],
        });
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should pass if no maxItems is set and array is large', async () => {
        const dto = plainToInstance(RequiredArrayDto, {
            tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
        });
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });
});
