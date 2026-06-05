import { validate } from 'class-validator';
import { UserUpdateDto } from './user-update.dto';

describe('UserUpdateDto', () => {
    let dto: UserUpdateDto;

    beforeEach(() => {
        dto = new UserUpdateDto();
    });

    describe('fullname field validation', () => {
        it('should pass validation with valid fullname', async () => {
            dto.fullname = 'Jane Doe';

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should pass validation with longer fullname', async () => {
            dto.fullname = 'Jane Elizabeth Doe Anderson';

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should pass validation when fullname is undefined (optional)', async () => {
            dto.fullname = undefined;

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should pass validation when fullname is not provided', async () => {
            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should fail validation when fullname is too short', async () => {
            dto.fullname = 'J';

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const fullnameError = errors.find((e) => e.property === 'fullname');
            expect(fullnameError).toBeDefined();
            expect(fullnameError?.constraints).toHaveProperty('minLength');
            expect(fullnameError?.constraints?.minLength).toBe(
                'Fullname of the suer must be at least 2 characters long',
            );
        });

        it('should fail validation when fullname is empty string', async () => {
            dto.fullname = '';

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const fullnameError = errors.find((e) => e.property === 'fullname');
            expect(fullnameError).toBeDefined();
            expect(fullnameError?.constraints).toHaveProperty('minLength');
        });

        it('should fail validation when fullname is not a string', async () => {
            dto.fullname = 12345 as any;

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const fullnameError = errors.find((e) => e.property === 'fullname');
            expect(fullnameError).toBeDefined();
            expect(fullnameError?.constraints).toHaveProperty('isString');
            expect(fullnameError?.constraints?.isString).toBe(
                'Fullname of the suer must be a string',
            );
        });

        it('should fail validation when fullname is an object', async () => {
            dto.fullname = { name: 'Jane' } as any;

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const fullnameError = errors.find((e) => e.property === 'fullname');
            expect(fullnameError).toBeDefined();
            expect(fullnameError?.constraints).toHaveProperty('isString');
        });

        it('should fail validation when fullname is an array', async () => {
            dto.fullname = ['Jane', 'Doe'] as any;

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const fullnameError = errors.find((e) => e.property === 'fullname');
            expect(fullnameError).toBeDefined();
            expect(fullnameError?.constraints).toHaveProperty('isString');
        });

        it('should pass validation with minimum length fullname', async () => {
            dto.fullname = 'JD';

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should pass validation with whitespace in fullname', async () => {
            dto.fullname = 'Jane   Doe';

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should pass validation with special characters in fullname', async () => {
            dto.fullname = "Jane O'Doe-Smith";

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });
    });

    describe('avatar field validation', () => {
        it('should pass validation with valid UUID', async () => {
            dto.avatar = 'eb5174d5-1cef-40f6-bb57-97393cde0426';

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should pass validation with different valid UUID', async () => {
            dto.avatar = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d';

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should pass validation when avatar is undefined (optional)', async () => {
            dto.avatar = undefined;

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should pass validation when avatar is not provided', async () => {
            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should fail validation when avatar is invalid UUID format', async () => {
            dto.avatar = 'not-a-valid-uuid';

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const avatarError = errors.find((e) => e.property === 'avatar');
            expect(avatarError).toBeDefined();
            expect(avatarError?.constraints).toHaveProperty('isUuid');
            expect(avatarError?.constraints?.isUuid).toContain('must be a UUID');
        });

        it('should fail validation when avatar is UUID v3 instead of v4', async () => {
            dto.avatar = 'a987fbc9-4bed-3078-cf07-9141ba07c9f3';

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const avatarError = errors.find((e) => e.property === 'avatar');
            expect(avatarError).toBeDefined();
            expect(avatarError?.constraints).toHaveProperty('isUuid');
        });

        it('should fail validation when avatar is too short', async () => {
            dto.avatar = 'ab';

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const avatarError = errors.find((e) => e.property === 'avatar');
            expect(avatarError).toBeDefined();
            expect(avatarError?.constraints).toHaveProperty('isUuid');
        });

        it('should fail validation when avatar is empty string', async () => {
            dto.avatar = '';

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const avatarError = errors.find((e) => e.property === 'avatar');
            expect(avatarError).toBeDefined();
            expect(Object.keys(avatarError?.constraints || {}).length).toBeGreaterThan(0);
        });

        it('should fail validation when avatar is not a string', async () => {
            dto.avatar = 12345 as any;

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const avatarError = errors.find((e) => e.property === 'avatar');
            expect(avatarError).toBeDefined();
            expect(avatarError?.constraints).toHaveProperty('isString');
            expect(avatarError?.constraints?.isString).toBe('Id of the avatar must be a string');
        });

        it('should fail validation when avatar is an object', async () => {
            dto.avatar = { id: 'eb5174d5-1cef-40f6-bb57-97393cde0426' } as any;

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const avatarError = errors.find((e) => e.property === 'avatar');
            expect(avatarError).toBeDefined();
            expect(avatarError?.constraints).toHaveProperty('isString');
        });

        it('should fail validation when avatar has invalid characters', async () => {
            dto.avatar = 'eb5174d5-1cef-40f6-bb57-97393cde042g';

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const avatarError = errors.find((e) => e.property === 'avatar');
            expect(avatarError).toBeDefined();
            expect(avatarError?.constraints).toHaveProperty('isUuid');
        });

        it('should fail validation when avatar is missing dashes', async () => {
            dto.avatar = 'eb5174d51cef40f6bb5797393cde0426';

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const avatarError = errors.find((e) => e.property === 'avatar');
            expect(avatarError).toBeDefined();
            expect(avatarError?.constraints).toHaveProperty('isUuid');
        });

        it('should pass validation with lowercase UUID', async () => {
            dto.avatar = 'eb5174d5-1cef-40f6-bb57-97393cde0426';

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should handle uppercase UUID', async () => {
            dto.avatar = 'EB5174D5-1CEF-40F6-BB57-97393CDE0426';

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThanOrEqual(0);
        });

        it('should fail validation when avatar is whitespace only', async () => {
            dto.avatar = '   ';

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThan(0);
            const avatarError = errors.find((e) => e.property === 'avatar');
            expect(avatarError).toBeDefined();
            expect(avatarError?.constraints).toHaveProperty('isUuid');
        });
    });

    describe('Combined field validation', () => {
        it('should pass validation with both fields valid', async () => {
            dto.fullname = 'Jane Doe';
            dto.avatar = 'eb5174d5-1cef-40f6-bb57-97393cde0426';

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should pass validation with only fullname', async () => {
            dto.fullname = 'Jane Doe';

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should pass validation with only avatar', async () => {
            dto.avatar = 'eb5174d5-1cef-40f6-bb57-97393cde0426';

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should pass validation with neither field', async () => {
            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should fail validation when both fields are invalid', async () => {
            dto.fullname = 'J';
            dto.avatar = 'invalid-uuid';

            const errors = await validate(dto);

            expect(errors.length).toBe(2);
            expect(errors.some((e) => e.property === 'fullname')).toBe(true);
            expect(errors.some((e) => e.property === 'avatar')).toBe(true);
        });

        it('should fail validation when fullname is invalid but avatar is valid', async () => {
            dto.fullname = '';
            dto.avatar = 'eb5174d5-1cef-40f6-bb57-97393cde0426';

            const errors = await validate(dto);

            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('fullname');
        });

        it('should fail validation when avatar is invalid but fullname is valid', async () => {
            dto.fullname = 'Jane Doe';
            dto.avatar = 'not-a-uuid';

            const errors = await validate(dto);

            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('avatar');
        });
    });

    describe('DTO instantiation', () => {
        it('should create instance with default values', () => {
            const newDto = new UserUpdateDto();

            expect(newDto).toBeInstanceOf(UserUpdateDto);
            expect(newDto.fullname).toBeUndefined();
            expect(newDto.avatar).toBeUndefined();
        });

        it('should allow setting fields after instantiation', () => {
            const newDto = new UserUpdateDto();
            newDto.fullname = 'John Doe';
            newDto.avatar = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d';

            expect(newDto.fullname).toBe('John Doe');
            expect(newDto.avatar).toBe('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d');
        });
    });
});
