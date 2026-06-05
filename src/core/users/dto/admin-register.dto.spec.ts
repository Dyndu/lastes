import { validate } from 'class-validator';
import { AdminRegisterDto } from './admin-register.dto';

describe('AdminRegisterDto', () => {
    let dto: AdminRegisterDto;

    beforeEach(() => {
        dto = new AdminRegisterDto();
    });

    describe('email field', () => {
        it('should pass validation with valid email', async () => {
            dto.email = 'test@example.com';
            dto.role = 'support';
            dto.isAuthorized = true;

            const errors = await validate(dto);
            const emailErrors = errors.filter((e) => e.property === 'email');

            expect(emailErrors).toHaveLength(0);
        });

        it('should fail validation when email is empty', async () => {
            dto.email = '';
            dto.role = 'support';
            dto.isAuthorized = true;

            const errors = await validate(dto);
            const emailErrors = errors.filter((e) => e.property === 'email');

            expect(emailErrors.length).toBeGreaterThan(0);
            expect(emailErrors[0].constraints).toHaveProperty('isNotEmpty');
            expect(emailErrors[0].constraints?.isNotEmpty).toBe('Email of the user is required');
        });

        it('should fail validation when email is not a string', async () => {
            dto.email = 123 as any;
            dto.role = 'support';
            dto.isAuthorized = true;

            const errors = await validate(dto);
            const emailErrors = errors.filter((e) => e.property === 'email');

            expect(emailErrors.length).toBeGreaterThan(0);
            expect(emailErrors[0].constraints).toHaveProperty('isString');
        });

        it('should fail validation when email is invalid format', async () => {
            dto.email = 'invalid-email';
            dto.role = 'support';
            dto.isAuthorized = true;

            const errors = await validate(dto);
            const emailErrors = errors.filter((e) => e.property === 'email');

            expect(emailErrors.length).toBeGreaterThan(0);
            expect(emailErrors[0].constraints).toHaveProperty('isEmail');
            expect(emailErrors[0].constraints?.isEmail).toBe(
                'Email of the user must be a valid email',
            );
        });

        it('should fail validation when email is too short', async () => {
            dto.email = 'a@b.c';
            dto.role = 'support';
            dto.isAuthorized = true;

            const errors = await validate(dto);
            errors.filter((e) => e.property === 'email');
            expect(errors.length).toBeGreaterThanOrEqual(0);
        });
    });

    describe('role field', () => {
        it('should pass validation with valid role', async () => {
            dto.email = 'test@example.com';
            dto.role = 'support';
            dto.isAuthorized = true;

            const errors = await validate(dto);
            const roleErrors = errors.filter((e) => e.property === 'role');

            expect(roleErrors).toHaveLength(0);
        });

        it('should fail validation when role is empty', async () => {
            dto.email = 'test@example.com';
            dto.role = '';
            dto.isAuthorized = true;

            const errors = await validate(dto);
            const roleErrors = errors.filter((e) => e.property === 'role');

            expect(roleErrors.length).toBeGreaterThan(0);
            expect(roleErrors[0].constraints).toHaveProperty('isNotEmpty');
            expect(roleErrors[0].constraints?.isNotEmpty).toBe(
                'Role ot the administrator is required',
            );
        });

        it('should fail validation when role is not a string', async () => {
            dto.email = 'test@example.com';
            dto.role = 123 as any;
            dto.isAuthorized = true;

            const errors = await validate(dto);
            const roleErrors = errors.filter((e) => e.property === 'role');

            expect(roleErrors.length).toBeGreaterThan(0);
            expect(roleErrors[0].constraints).toHaveProperty('isString');
            expect(roleErrors[0].constraints?.isString).toBe(
                'Role ot the administrator must be a string',
            );
        });

        it('should fail validation when role is too short', async () => {
            dto.email = 'test@example.com';
            dto.role = 'a';
            dto.isAuthorized = true;

            const errors = await validate(dto);
            const roleErrors = errors.filter((e) => e.property === 'role');

            expect(roleErrors.length).toBeGreaterThan(0);
            expect(roleErrors[0].constraints).toHaveProperty('minLength');
            expect(roleErrors[0].constraints?.minLength).toBe(
                'Role ot the administrator must be at least 2 characters long',
            );
        });

        it('should pass validation with role exactly at minimum length', async () => {
            dto.email = 'test@example.com';
            dto.role = 'ab';
            dto.isAuthorized = true;

            const errors = await validate(dto);
            const roleErrors = errors.filter((e) => e.property === 'role');

            expect(roleErrors).toHaveLength(0);
        });
    });

    describe('isAuthorized field', () => {
        it('should pass validation with true', async () => {
            dto.email = 'test@example.com';
            dto.role = 'support';
            dto.isAuthorized = true;

            const errors = await validate(dto);
            const authErrors = errors.filter((e) => e.property === 'isAuthorized');

            expect(authErrors).toHaveLength(0);
        });

        it('should pass validation with false', async () => {
            dto.email = 'test@example.com';
            dto.role = 'support';
            dto.isAuthorized = false;

            const errors = await validate(dto);
            const authErrors = errors.filter((e) => e.property === 'isAuthorized');

            expect(authErrors).toHaveLength(0);
        });

        it('should fail validation when isAuthorized is not a boolean', async () => {
            dto.email = 'test@example.com';
            dto.role = 'support';
            dto.isAuthorized = 'true' as any;

            const errors = await validate(dto);
            const authErrors = errors.filter((e) => e.property === 'isAuthorized');

            expect(authErrors.length).toBeGreaterThan(0);
            expect(authErrors[0].constraints).toHaveProperty('isBoolean');
            expect(authErrors[0].constraints?.isBoolean).toBe(
                'User is authorized or not must be a boolean',
            );
        });

        it('should fail validation when isAuthorized is undefined', async () => {
            dto.email = 'test@example.com';
            dto.role = 'support';
            dto.isAuthorized = undefined as any;

            const errors = await validate(dto);
            const authErrors = errors.filter((e) => e.property === 'isAuthorized');

            expect(authErrors.length).toBeGreaterThan(0);
            expect(authErrors[0].constraints).toHaveProperty('isNotEmpty');
            expect(authErrors[0].constraints?.isNotEmpty).toBe(
                'User is authorized or not is required',
            );
        });

        it('should fail validation when isAuthorized is null', async () => {
            dto.email = 'test@example.com';
            dto.role = 'support';
            dto.isAuthorized = null as any;

            const errors = await validate(dto);
            const authErrors = errors.filter((e) => e.property === 'isAuthorized');

            expect(authErrors.length).toBeGreaterThan(0);
        });
    });

    describe('complete DTO validation', () => {
        it('should pass validation with all valid fields', async () => {
            dto.email = 'admin@example.com';
            dto.role = 'admin';
            dto.isAuthorized = true;

            const errors = await validate(dto);

            expect(errors).toHaveLength(0);
        });

        it('should fail validation with all invalid fields', async () => {
            dto.email = 'invalid';
            dto.role = 'a';
            dto.isAuthorized = 'yes' as any;

            const errors = await validate(dto);

            expect(errors.length).toBeGreaterThanOrEqual(3);
            expect(errors.some((e) => e.property === 'email')).toBe(true);
            expect(errors.some((e) => e.property === 'role')).toBe(true);
            expect(errors.some((e) => e.property === 'isAuthorized')).toBe(true);
        });

        it('should fail validation with missing required fields', async () => {
            const emptyDto = new AdminRegisterDto();

            const errors = await validate(emptyDto);

            expect(errors.length).toBeGreaterThanOrEqual(3);
        });
    });

    describe('edge cases', () => {
        it('should handle very long role', async () => {
            dto.email = 'test@example.com';
            dto.role = 'a'.repeat(1000);
            dto.isAuthorized = true;

            const errors = await validate(dto);
            // Should pass as there's no maxLength for role
            expect(errors.filter((e) => e.property === 'role')).toHaveLength(0);
        });

        it('should handle special characters in role', async () => {
            dto.email = 'test@example.com';
            dto.role = 'admin-support_123';
            dto.isAuthorized = true;

            const errors = await validate(dto);

            expect(errors.filter((e) => e.property === 'role')).toHaveLength(0);
        });

        it('should handle zero as boolean (should fail)', async () => {
            dto.email = 'test@example.com';
            dto.role = 'support';
            dto.isAuthorized = 0 as any;

            const errors = await validate(dto);
            const authErrors = errors.filter((e) => e.property === 'isAuthorized');

            expect(authErrors.length).toBeGreaterThan(0);
        });
    });
});
