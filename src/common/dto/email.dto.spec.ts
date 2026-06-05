import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { EmailDto } from './email.dto';

describe('EmailDto', () => {
    describe('Successful validation', () => {
        it('should validate a valid DTO with correct email', async () => {
            const dto = plainToInstance(EmailDto, {
                email: 'lazaresa@gmail.com',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('Failed validation - Email', () => {
        it('should fail if email is empty', async () => {
            const dto = plainToInstance(EmailDto, {
                email: '',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const emailError = errors.find((err) => err.property === 'email');
            expect(emailError).toBeDefined();
        });

        it('should fail if email is missing', async () => {
            const dto = plainToInstance(EmailDto, {});

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const emailError = errors.find((err) => err.property === 'email');
            expect(emailError).toBeDefined();
        });

        it('should fail if email is too short (less than 5 characters)', async () => {
            const dto = plainToInstance(EmailDto, {
                email: 'a@b',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const emailError = errors.find((err) => err.property === 'email');
            expect(emailError).toBeDefined();
        });

        it('should fail if email is not a string', async () => {
            const dto = plainToInstance(EmailDto, {
                email: 12345,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const emailError = errors.find((err) => err.property === 'email');
            expect(emailError).toBeDefined();
        });
    });

    describe('Transformation and types', () => {
        it('should create an instance with correct properties', () => {
            const dto = plainToInstance(EmailDto, {
                email: 'test@example.com',
            });

            expect(dto).toBeInstanceOf(EmailDto);
            expect(dto.email).toBe('test@example.com');
        });
    });
});
