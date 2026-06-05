import { validate } from 'class-validator';
import { PasswordChangeDto } from './password-change.dto';

describe('PasswordChangeDto', () => {
    let dto: PasswordChangeDto;

    beforeEach(() => {
        dto = new PasswordChangeDto();
    });

    describe('oldPassword', () => {
        it('should pass validation with valid old password', async () => {
            dto.oldPassword = 'OldPass@1234';
            dto.newPassword = 'NewPass@1234';
            dto.confirmPassword = 'NewPass@1234';

            const errors = await validate(dto);
            const oldPasswordErrors = errors.filter((e) => e.property === 'oldPassword');
            expect(oldPasswordErrors.length).toBe(0);
        });

        it('should fail validation when old password is too short', async () => {
            dto.oldPassword = 'A';
            dto.newPassword = 'NewPass@1234';
            dto.confirmPassword = 'NewPass@1234';

            const errors = await validate(dto);
            const oldPasswordErrors = errors.filter((e) => e.property === 'oldPassword');
            expect(oldPasswordErrors.length).toBeGreaterThan(0);
        });

        it('should fail validation when old password is empty', async () => {
            dto.oldPassword = '';
            dto.newPassword = 'NewPass@1234';
            dto.confirmPassword = 'NewPass@1234';

            const errors = await validate(dto);
            const oldPasswordErrors = errors.filter((e) => e.property === 'oldPassword');
            expect(oldPasswordErrors.length).toBeGreaterThan(0);
        });
    });

    describe('newPassword', () => {
        it('should pass validation with valid new password', async () => {
            dto.oldPassword = 'OldPass@1234';
            dto.newPassword = 'ValidPass@1234';
            dto.confirmPassword = 'ValidPass@1234';

            const errors = await validate(dto);
            const newPasswordErrors = errors.filter((e) => e.property === 'newPassword');
            expect(newPasswordErrors.length).toBe(0);
        });

        it('should fail validation when new password is too short', async () => {
            dto.oldPassword = 'OldPass@1234';
            dto.newPassword = 'Short@1';
            dto.confirmPassword = 'Short@1';

            const errors = await validate(dto);
            const newPasswordErrors = errors.filter((e) => e.property === 'newPassword');
            expect(newPasswordErrors.length).toBeGreaterThan(0);
        });

        it('should fail validation when new password has no uppercase letter', async () => {
            dto.oldPassword = 'OldPass@1234';
            dto.newPassword = 'noupppercase@1234';
            dto.confirmPassword = 'noupppercase@1234';

            const errors = await validate(dto);
            const newPasswordErrors = errors.filter((e) => e.property === 'newPassword');
            expect(newPasswordErrors.length).toBeGreaterThan(0);
            expect(newPasswordErrors[0].constraints?.matches).toContain('uppercase');
        });

        it('should fail validation when new password has no lowercase letter', async () => {
            dto.oldPassword = 'OldPass@1234';
            dto.newPassword = 'NOLOWERCASE@1234';
            dto.confirmPassword = 'NOLOWERCASE@1234';

            const errors = await validate(dto);
            const newPasswordErrors = errors.filter((e) => e.property === 'newPassword');
            expect(newPasswordErrors.length).toBeGreaterThan(0);
            expect(newPasswordErrors[0].constraints?.matches).toContain('lowercase');
        });

        it('should fail validation when new password has no number', async () => {
            dto.oldPassword = 'OldPass@1234';
            dto.newPassword = 'NoNumber@Pass';
            dto.confirmPassword = 'NoNumber@Pass';

            const errors = await validate(dto);
            const newPasswordErrors = errors.filter((e) => e.property === 'newPassword');
            expect(newPasswordErrors.length).toBeGreaterThan(0);
            expect(newPasswordErrors[0].constraints?.matches).toContain('number');
        });

        it('should fail validation when new password has no special character', async () => {
            dto.oldPassword = 'OldPass@1234';
            dto.newPassword = 'NoSpecial1234Pass';
            dto.confirmPassword = 'NoSpecial1234Pass';

            const errors = await validate(dto);
            const newPasswordErrors = errors.filter((e) => e.property === 'newPassword');
            expect(newPasswordErrors.length).toBeGreaterThan(0);
            expect(newPasswordErrors[0].constraints?.matches).toContain('special character');
        });

        it('should fail validation when new password is empty', async () => {
            dto.oldPassword = 'OldPass@1234';
            dto.newPassword = '';
            dto.confirmPassword = '';

            const errors = await validate(dto);
            const newPasswordErrors = errors.filter((e) => e.property === 'newPassword');
            expect(newPasswordErrors.length).toBeGreaterThan(0);
        });

        it('should pass validation with minimum length password (12 characters)', async () => {
            dto.oldPassword = 'OldPass@1234';
            dto.newPassword = 'Password@1234';
            dto.confirmPassword = 'Password@1234';

            const errors = await validate(dto);
            const newPasswordErrors = errors.filter((e) => e.property === 'newPassword');
            expect(newPasswordErrors.length).toBe(0);
        });

        it('should fail validation when new password is same as old password', async () => {
            dto.oldPassword = 'SamePass@1234';
            dto.newPassword = 'SamePass@1234';
            dto.confirmPassword = 'SamePass@1234';

            const errors = await validate(dto);
            const newPasswordErrors = errors.filter((e) => e.property === 'newPassword');
            expect(newPasswordErrors.length).toBeGreaterThan(0);
            expect(newPasswordErrors.some((e) => e.constraints?.isDifferentFrom)).toBe(true);
            expect(
                newPasswordErrors.find((e) => e.constraints?.isDifferentFrom)?.constraints
                    ?.isDifferentFrom,
            ).toBe('New password must be different from old password');
        });

        it('should pass validation when new password is different from old password', async () => {
            dto.oldPassword = 'OldPassword@1234';
            dto.newPassword = 'NewPassword@1234';
            dto.confirmPassword = 'NewPassword@1234';

            const errors = await validate(dto);
            const newPasswordErrors = errors.filter((e) => e.property === 'newPassword');
            expect(newPasswordErrors.length).toBe(0);
        });

        it('should fail validation when new password differs only in case from old password', async () => {
            dto.oldPassword = 'Password@1234';
            dto.newPassword = 'Password@1234';
            dto.confirmPassword = 'Password@1234';

            const errors = await validate(dto);
            const newPasswordErrors = errors.filter((e) => e.property === 'newPassword');
            expect(newPasswordErrors.some((e) => e.constraints?.isDifferentFrom)).toBe(true);
        });
    });

    describe('confirmPassword', () => {
        it('should pass validation when passwords match', async () => {
            dto.oldPassword = 'OldPass@1234';
            dto.newPassword = 'NewPass@1234';
            dto.confirmPassword = 'NewPass@1234';

            const errors = await validate(dto);
            const confirmPasswordErrors = errors.filter((e) => e.property === 'confirmPassword');
            expect(confirmPasswordErrors.length).toBe(0);
        });

        it('should fail validation when passwords do not match', async () => {
            dto.oldPassword = 'OldPass@1234';
            dto.newPassword = 'NewPass@1234';
            dto.confirmPassword = 'DifferentPass@1234';

            const errors = await validate(dto);
            const confirmPasswordErrors = errors.filter((e) => e.property === 'confirmPassword');
            expect(confirmPasswordErrors.length).toBeGreaterThan(0);
            expect(confirmPasswordErrors[0].constraints?.match).toBe('Passwords do not match');
        });

        it('should fail validation when confirm password is empty but new password is not', async () => {
            dto.oldPassword = 'OldPass@1234';
            dto.newPassword = 'NewPass@12345';
            dto.confirmPassword = '';

            const errors = await validate(dto);
            const confirmPasswordErrors = errors.filter((e) => e.property === 'confirmPassword');
            expect(confirmPasswordErrors.length).toBeGreaterThan(0);
        });

        it('should fail validation when confirm password is too short', async () => {
            dto.oldPassword = 'OldPass@1234';
            dto.newPassword = 'NewPass@1234';
            dto.confirmPassword = '';

            const errors = await validate(dto);
            const confirmPasswordErrors = errors.filter((e) => e.property === 'confirmPassword');
            expect(confirmPasswordErrors.length).toBeGreaterThan(0);
        });
    });

    describe('Complete DTO validation', () => {
        it('should pass validation with all valid fields', async () => {
            dto.oldPassword = 'OldPass@1234';
            dto.newPassword = 'Password@1234!';
            dto.confirmPassword = 'Password@1234!';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail validation with multiple invalid fields', async () => {
            dto.oldPassword = '';
            dto.newPassword = 'weak';
            dto.confirmPassword = 'different';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(2);
            expect(errors.some((e) => e.property === 'oldPassword')).toBe(true);
            expect(errors.some((e) => e.property === 'newPassword')).toBe(true);
            expect(errors.some((e) => e.property === 'confirmPassword')).toBe(true);
        });

        it('should fail when all fields are empty', async () => {
            dto.oldPassword = '';
            dto.newPassword = '';
            dto.confirmPassword = '';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
        });

        it('should pass with special characters in passwords', async () => {
            dto.oldPassword = 'Old!@#$%^&*()12';
            dto.newPassword = 'New!Pass@123_';
            dto.confirmPassword = 'New!Pass@123_';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass with long passwords', async () => {
            dto.oldPassword = 'VeryLongOldPassword@123456789';
            dto.newPassword = 'VeryLongNewPassword@123456789';
            dto.confirmPassword = 'VeryLongNewPassword@123456789';

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail when new password equals old password and confirm password matches', async () => {
            dto.oldPassword = 'SamePassword@1234';
            dto.newPassword = 'SamePassword@1234';
            dto.confirmPassword = 'SamePassword@1234';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(
                errors.some((e) => e.property === 'newPassword' && e.constraints?.isDifferentFrom),
            ).toBe(true);
        });

        it('should fail validation with new password same as old and mismatched confirm', async () => {
            dto.oldPassword = 'SamePassword@1234';
            dto.newPassword = 'SamePassword@1234';
            dto.confirmPassword = 'DifferentPass@1234';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(
                errors.some((e) => e.property === 'newPassword' && e.constraints?.isDifferentFrom),
            ).toBe(true);
            expect(
                errors.some((e) => e.property === 'confirmPassword' && e.constraints?.match),
            ).toBe(true);
        });
    });
});
