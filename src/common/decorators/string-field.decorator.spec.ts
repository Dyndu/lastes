import 'reflect-metadata';
import { StringFieldDecorator } from './string-field.decorator';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

class TestDto {
    @StringFieldDecorator('Test Label', 'Example', 2, true)
    label: string;
}

class OptionalLabelDto {
    @StringFieldDecorator('Optional Label', 'Example', 2, false)
    label?: string;
}

class EmailDto {
    @StringFieldDecorator('User Email', 'user@example.com', 2, true, true)
    email: string;
}

class OptionalEmailDto {
    @StringFieldDecorator('Optional Email', 'user@example.com', 2, false, true)
    email?: string;
}

class MaxLengthDto {
    @StringFieldDecorator('Username', 'john_doe', 3, true, false, 20)
    username: string;
}

class OptionalMaxLengthDto {
    @StringFieldDecorator('Bio', 'Short bio', 5, false, false, 100)
    bio?: string;
}

describe('StringFieldDecorator decorator', () => {
    describe('String validation', () => {
        it('should apply validation rules for empty required label', async () => {
            const dto = plainToInstance(TestDto, { label: '' });
            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isNotEmpty');
            expect(errors[0].constraints?.isNotEmpty).toContain('Test Label is required');
        });

        it('should accept valid required label', async () => {
            const dto = plainToInstance(TestDto, { label: 'Valid Label' });
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should reject label shorter than minimum length', async () => {
            const dto = plainToInstance(TestDto, { label: 'A' });
            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('minLength');
            expect(errors[0].constraints?.minLength).toContain(
                'Test Label must be at least 2 characters long',
            );
        });

        it('should reject optional label when empty string is provided', async () => {
            const dto = plainToInstance(OptionalLabelDto, { label: '' });
            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('minLength');
        });

        it('should allow optional label to be undefined', async () => {
            const dto = plainToInstance(OptionalLabelDto, {});
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should accept valid optional label when provided', async () => {
            const dto = plainToInstance(OptionalLabelDto, {
                label: 'Valid optional label',
            });
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('Email validation', () => {
        it('should reject invalid email format', async () => {
            const dto = plainToInstance(EmailDto, { email: 'invalid-email' });
            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isEmail');
            expect(errors[0].constraints?.isEmail).toContain('User Email must be a valid email');
        });

        it('should accept valid email', async () => {
            const dto = plainToInstance(EmailDto, {
                email: 'user@example.com',
            });
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should reject empty required email', async () => {
            const dto = plainToInstance(EmailDto, { email: '' });
            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isNotEmpty');
            expect(errors[0].constraints?.isNotEmpty).toContain('User Email is required');
        });

        it('should allow optional email to be undefined', async () => {
            const dto = plainToInstance(OptionalEmailDto, {});
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should reject invalid optional email when provided', async () => {
            const dto = plainToInstance(OptionalEmailDto, {
                email: 'not-an-email',
            });
            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('isEmail');
        });

        it('should accept valid optional email when provided', async () => {
            const dto = plainToInstance(OptionalEmailDto, {
                email: 'optional@example.com',
            });
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('MaxLength validation', () => {
        it('should reject string exceeding maximum length', async () => {
            const dto = plainToInstance(MaxLengthDto, {
                username: 'this_username_is_way_too_long_to_be_accepted',
            });
            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('maxLength');
            expect(errors[0].constraints?.maxLength).toContain(
                'Username must not exceed 20 characters',
            );
        });

        it('should accept string within maximum length', async () => {
            const dto = plainToInstance(MaxLengthDto, {
                username: 'valid_username',
            });
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should accept string exactly at maximum length', async () => {
            const dto = plainToInstance(MaxLengthDto, {
                username: 'exactly_20_chars_str',
            });
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should reject string shorter than minimum length even with maxLength', async () => {
            const dto = plainToInstance(MaxLengthDto, {
                username: 'ab',
            });
            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('minLength');
            expect(errors[0].constraints?.minLength).toContain(
                'Username must be at least 3 characters long',
            );
        });

        it('should allow optional field with maxLength to be undefined', async () => {
            const dto = plainToInstance(OptionalMaxLengthDto, {});
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should reject optional field exceeding maxLength when provided', async () => {
            const longBio = 'a'.repeat(101);
            const dto = plainToInstance(OptionalMaxLengthDto, {
                bio: longBio,
            });
            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('maxLength');
            expect(errors[0].constraints?.maxLength).toContain(
                'Bio must not exceed 100 characters',
            );
        });

        it('should accept optional field within limits when provided', async () => {
            const dto = plainToInstance(OptionalMaxLengthDto, {
                bio: 'This is a valid bio within the character limit.',
            });
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });
});
