import { validate } from 'class-validator';
import { IsDifferentFrom } from './is-different-from.decorator';

class TestDto {
    oldValue: string;

    @IsDifferentFrom('oldValue', {
        message: 'New value must be different from old value',
    })
    newValue: string;
}

describe('IsDifferentFrom Decorator', () => {
    it('should pass validation when values are different', async () => {
        const dto = new TestDto();
        dto.oldValue = 'OldPassword@123';
        dto.newValue = 'NewPassword@456';

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should fail validation when values are the same', async () => {
        const dto = new TestDto();
        dto.oldValue = 'SamePassword@123';
        dto.newValue = 'SamePassword@123';

        const errors = await validate(dto);
        expect(errors.length).toBe(1);
        expect(errors[0].property).toBe('newValue');
        expect(errors[0].constraints?.isDifferentFrom).toBe(
            'New value must be different from old value',
        );
    });

    it('should use default message when no custom message is provided', async () => {
        class TestDtoDefaultMessage {
            oldPassword: string;

            @IsDifferentFrom('oldPassword')
            newPassword: string;
        }

        const dto = new TestDtoDefaultMessage();
        dto.oldPassword = 'SamePass@123';
        dto.newPassword = 'SamePass@123';

        const errors = await validate(dto);
        expect(errors.length).toBe(1);
        expect(errors[0].constraints?.isDifferentFrom).toBe(
            'newPassword must be different from oldPassword',
        );
    });

    it('should pass when old value is undefined and new value is defined', async () => {
        const dto = new TestDto();
        dto.newValue = 'NewPassword@123';

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should pass when new value is undefined and old value is defined', async () => {
        const dto = new TestDto();
        dto.oldValue = 'OldPassword@123';

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should pass when both values are undefined', async () => {
        const dto = new TestDto();

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should fail when both values are empty strings', async () => {
        const dto = new TestDto();
        dto.oldValue = '';
        dto.newValue = '';

        const errors = await validate(dto);
        expect(errors.length).toBe(1);
        expect(errors[0].property).toBe('newValue');
    });

    it('should pass when values differ only in case', async () => {
        const dto = new TestDto();
        dto.oldValue = 'Password@123';
        dto.newValue = 'password@123';

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should pass when values differ only in whitespace', async () => {
        const dto = new TestDto();
        dto.oldValue = 'Password@123';
        dto.newValue = 'Password@123 ';

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should fail when comparing identical numbers', async () => {
        class TestDtoNumber {
            oldPin: number;

            @IsDifferentFrom('oldPin', {
                message: 'New PIN must be different from old PIN',
            })
            newPin: number;
        }

        const dto = new TestDtoNumber();
        dto.oldPin = 1234;
        dto.newPin = 1234;

        const errors = await validate(dto);
        expect(errors.length).toBe(1);
        expect(errors[0].constraints?.isDifferentFrom).toBe(
            'New PIN must be different from old PIN',
        );
    });

    it('should pass when comparing different numbers', async () => {
        class TestDtoNumber {
            oldPin: number;

            @IsDifferentFrom('oldPin')
            newPin: number;
        }

        const dto = new TestDtoNumber();
        dto.oldPin = 1234;
        dto.newPin = 5678;

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should fail when comparing identical complex strings', async () => {
        const dto = new TestDto();
        dto.oldValue = 'Complex!@#$%^&*()Password123';
        dto.newValue = 'Complex!@#$%^&*()Password123';

        const errors = await validate(dto);
        expect(errors.length).toBe(1);
    });

    it('should pass when old value is null and new value is defined', async () => {
        const dto = new TestDto();
        dto.oldValue = null!;
        dto.newValue = 'NewPassword@123';

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should pass when new value is null and old value is defined', async () => {
        const dto = new TestDto();
        dto.oldValue = 'OldPassword@123';
        dto.newValue = null!;

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });
});
