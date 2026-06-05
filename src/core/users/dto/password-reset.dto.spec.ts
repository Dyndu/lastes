import { validate } from 'class-validator';
import { PasswordResetDto } from './password-reset.dto';

describe('PasswordResetDto', () => {
    let dto: PasswordResetDto;

    beforeEach(() => {
        dto = new PasswordResetDto();
    });

    describe('newPassword', () => {
        it('should pass validation with valid new password', async () => {
            dto.newPassword = 'ValidPass@1234';
            dto.confirmPassword = 'ValidPass@1234';

            const errors = await validate(dto);
            const newPasswordErrors = errors.filter((e) => e.property === 'newPassword');
            expect(newPasswordErrors.length).toBe(0);
        });

        it('should fail validation when new password is too short', async () => {
            dto.newPassword = 'Short@1';
            dto.confirmPassword = 'Short@1';

            const errors = await validate(dto);
            const newPasswordErrors = errors.filter((e) => e.property === 'newPassword');
            expect(newPasswordErrors.length).toBeGreaterThan(0);
        });

        it('should fail validation when new password has no uppercase letter', async () => {
            dto.newPassword = 'noupppercase@123456';
            dto.confirmPassword = 'noupppercase@123456';

            const errors = await validate(dto);
            const newPasswordErrors = errors.filter((e) => e.property === 'newPassword');
            expect(newPasswordErrors.length).toBeGreaterThan(0);
            expect(newPasswordErrors[0].constraints?.matches).toContain('uppercase');
        });

        it('should fail validation when new password has no lowercase letter', async () => {
            dto.newPassword = 'NOLOWERCASE@12345';
            dto.confirmPassword = 'NOLOWERCASE@12345';

            const errors = await validate(dto);
            const newPasswordErrors = errors.filter((e) => e.property === 'newPassword');
            expect(newPasswordErrors.length).toBeGreaterThan(0);
            expect(newPasswordErrors[0].constraints?.matches).toContain('lowercase');
        });

        it('should fail validation when new password has no number', async () => {
            dto.newPassword = 'NoNumber@Passs';
            dto.confirmPassword = 'NoNumber@Pass';

            const errors = await validate(dto);
            const newPasswordErrors = errors.filter((e) => e.property === 'newPassword');
            expect(newPasswordErrors.length).toBeGreaterThan(0);
            expect(newPasswordErrors[0].constraints?.matches).toContain('number');
        });

        it('should fail validation when new password has no special character', async () => {
            dto.newPassword = 'NoSpecial1234Password';
            dto.confirmPassword = 'NoSpecial1234Password';

            const errors = await validate(dto);
            const newPasswordErrors = errors.filter((e) => e.property === 'newPassword');
            expect(newPasswordErrors.length).toBeGreaterThan(0);
            expect(newPasswordErrors[0].constraints?.matches).toContain('special character');
        });

        it('should fail validation when new password is empty', async () => {
            dto.newPassword = '';
            dto.confirmPassword = '';

            const errors = await validate(dto);
            const newPasswordErrors = errors.filter((e) => e.property === 'newPassword');
            expect(newPasswordErrors.length).toBeGreaterThan(0);
        });

        it('should pass validation with minimum length password (12 characters)', async () => {
            dto.newPassword = 'Password@123';
            dto.confirmPassword = 'Password@123';

            const errors = await validate(dto);
            const newPasswordErrors = errors.filter((e) => e.property === 'newPassword');
            expect(newPasswordErrors.length).toBe(0);
        });

        it('should pass validation with exactly 12 characters password', async () => {
            dto.newPassword = 'Pass@1234567';
            dto.confirmPassword = 'Pass@1234567';

            const errors = await validate(dto);
            const newPasswordErrors = errors.filter((e) => e.property === 'newPassword');
            expect(newPasswordErrors.length).toBe(0);
        });

        it('should pass validation with long password', async () => {
            dto.newPassword = 'VeryLongSecurePassword@123456789!';
            dto.confirmPassword = 'VeryLongSecurePassword@123456789!';

            const errors = await validate(dto);
            const newPasswordErrors = errors.filter((e) => e.property === 'newPassword');
            expect(newPasswordErrors.length).toBe(0);
        });

        it('should pass validation with various special characters', async () => {
            dto.newPassword = 'Password!@#$%123';
            dto.confirmPassword = 'Password!@#$%123';

            const errors = await validate(dto);
            const newPasswordErrors = errors.filter((e) => e.property === 'newPassword');
            expect(newPasswordErrors.length).toBe(0);
        });
    });

    describe('confirmPassword', () => {
        it('should pass validation when passwords match', async () => {
            dto.newPassword = 'NewPass@1234';
            dto.confirmPassword = 'NewPass@1234';

            const errors = await validate(dto);
            const confirmPasswordErrors = errors.filter((e) => e.property === 'confirmPassword');
            expect(confirmPasswordErrors.length).toBe(0);
        });

        it('should fail validation when passwords do not match', async () => {
            dto.newPassword = 'NewPass@123490';
            dto.confirmPassword = 'DifferentPass@1234';

            const errors = await validate(dto);
            const confirmPasswordErrors = errors.filter((e) => e.property === 'confirmPassword');
            expect(confirmPasswordErrors.length).toBeGreaterThan(0);
            expect(confirmPasswordErrors[0].constraints?.match).toBe('Passwords do not match');
        });

        it('should fail validation when confirm password is empty but new password is not', async () => {
            dto.newPassword = 'NewPass@1234';
            dto.confirmPassword = '';

            const errors = await validate(dto);
            const confirmPasswordErrors = errors.filter((e) => e.property === 'confirmPassword');
            expect(confirmPasswordErrors.length).toBeGreaterThan(0);
        });

        it('should fail validation when confirm password is too short', async () => {
            dto.newPassword = 'NewPass@1234';
            dto.confirmPassword = '';

            const errors = await validate(dto);
            const confirmPasswordErrors = errors.filter((e) => e.property === 'confirmPassword');
            expect(confirmPasswordErrors.length).toBeGreaterThan(0);
        });

        it('should fail validation with case-sensitive mismatch', async () => {
            dto.newPassword = 'NewPass@1234';
            dto.confirmPassword = 'newpass@1234';

            const errors = await validate(dto);
            const confirmPasswordErrors = errors.filter((e) => e.property === 'confirmPassword');
            expect(confirmPasswordErrors.length).toBeGreaterThan(0);
            expect(confirmPasswordErrors[0].constraints?.match).toBe('Passwords do not match');
        });
    });

    describe('Complete DTO validation', () => {
        it('should pass validation with all valid fields', async () => {
            dto.newPassword = 'Password@1234!';
            dto.confirmPassword = 'Password@1234!';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail validation with multiple invalid fields', async () => {
            dto.newPassword = 'weak';
            dto.confirmPassword = 'different';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(1);
            expect(errors.some((e) => e.property === 'newPassword')).toBe(true);
            expect(errors.some((e) => e.property === 'confirmPassword')).toBe(true);
        });

        it('should fail when all fields are empty', async () => {
            dto.newPassword = '';
            dto.confirmPassword = '';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
        });

        it('should pass with special characters in passwords', async () => {
            dto.newPassword = 'New!Pass@123_';
            dto.confirmPassword = 'New!Pass@123_';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass with long passwords', async () => {
            dto.newPassword = 'VeryLongNewPassword@123456789';
            dto.confirmPassword = 'VeryLongNewPassword@123456789';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail validation with valid new password but mismatched confirm', async () => {
            dto.newPassword = 'ValidPassword@1234';
            dto.confirmPassword = 'DifferentPass@1234';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(
                errors.some((e) => e.property === 'confirmPassword' && e.constraints?.match),
            ).toBe(true);
        });

        it('should fail validation with weak new password and matching confirm', async () => {
            dto.newPassword = 'weak';
            dto.confirmPassword = 'weak';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some((e) => e.property === 'newPassword')).toBe(true);
        });

        it('should pass with underscore as special character', async () => {
            dto.newPassword = 'Password_1234';
            dto.confirmPassword = 'Password_1234';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass with mixed special characters', async () => {
            dto.newPassword = 'P@ssw0rd!_2024';
            dto.confirmPassword = 'P@ssw0rd!_2024';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail with only numbers', async () => {
            dto.newPassword = '123456789012';
            dto.confirmPassword = '123456789012';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some((e) => e.property === 'newPassword')).toBe(true);
        });

        it('should fail with only letters', async () => {
            dto.newPassword = 'OnlyLettersHere';
            dto.confirmPassword = 'OnlyLettersHere';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some((e) => e.property === 'newPassword')).toBe(true);
        });
    });
});
