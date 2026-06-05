import { validate } from 'class-validator';
import { Match } from './match.decorator';

class TestDto {
    password: string;

    @Match('password', {
        message: 'Passwords do not match',
    })
    confirmPassword: string;
}

describe('Match Decorator', () => {
    it('should pass validation when values match', async () => {
        const dto = new TestDto();
        dto.password = 'Test@1234';
        dto.confirmPassword = 'Test@1234';

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should fail validation when values do not match', async () => {
        const dto = new TestDto();
        dto.password = 'Test@1234';
        dto.confirmPassword = 'Different@1234';

        const errors = await validate(dto);
        expect(errors.length).toBe(1);
        expect(errors[0].property).toBe('confirmPassword');
        expect(errors[0].constraints?.match).toBe('Passwords do not match');
    });

    it('should use default message when no custom message is provided', async () => {
        class TestDtoDefaultMessage {
            password: string;

            @Match('password')
            confirmPassword: string;
        }

        const dto = new TestDtoDefaultMessage();
        dto.password = 'Test@1234';
        dto.confirmPassword = 'Different@1234';

        const errors = await validate(dto);
        expect(errors.length).toBe(1);
        expect(errors[0].constraints?.match).toBe('confirmPassword must match password');
    });

    it('should pass when both fields are empty', async () => {
        const dto = new TestDto();
        dto.password = '';
        dto.confirmPassword = '';

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should pass when both fields are undefined', async () => {
        const dto = new TestDto();

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should fail when only confirmPassword is provided', async () => {
        const dto = new TestDto();
        dto.confirmPassword = 'Test@1234';

        const errors = await validate(dto);
        expect(errors.length).toBe(1);
    });
});
