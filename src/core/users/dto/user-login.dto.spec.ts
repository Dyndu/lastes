import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UserLoginDto } from './user-login.dto';

describe('UserLoginDto', () => {
    describe('Successful validation', () => {
        it('should validate a complete valid DTO with rememberMe true', async () => {
            const dto = plainToInstance(UserLoginDto, {
                email: 'lazaresagbo@gmail.com',
                password: 'Abcd@1234546789',
                rememberMe: true,
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should validate a complete valid DTO with rememberMe false', async () => {
            const dto = plainToInstance(UserLoginDto, {
                email: 'lazaresagbo@gmail.com',
                password: 'Abcd@1234546789',
                rememberMe: false,
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should validate when rememberMe is not provided (optional)', async () => {
            const dto = plainToInstance(UserLoginDto, {
                email: 'lazaresagbo@gmail.com',
                password: 'Abcd@1234546789',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should accept valid email format', async () => {
            const dto = plainToInstance(UserLoginDto, {
                email: 'test.user@example.com',
                password: 'Valid@Pass123',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should accept password with all required characters', async () => {
            const dto = plainToInstance(UserLoginDto, {
                email: 'test@example.com',
                password: 'MyP@ssw0rd123',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should accept password with various special characters', async () => {
            const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '_'];

            for (const char of specialChars) {
                const dto = plainToInstance(UserLoginDto, {
                    email: 'test@example.com',
                    password: `Valid${char}Pass123`,
                    rememberMe: true,
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            }
        });
    });

    describe('Failed validation - Email', () => {
        it('should fail if email is empty', async () => {
            const dto = plainToInstance(UserLoginDto, {
                email: '',
                password: 'Valid@Pass123',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const emailError = errors.find((err) => err.property === 'email');
            expect(emailError).toBeDefined();
        });

        it('should fail if email is missing', async () => {
            const dto = plainToInstance(UserLoginDto, {
                password: 'Valid@Pass123',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const emailError = errors.find((err) => err.property === 'email');
            expect(emailError).toBeDefined();
        });

        it('should fail if email is too short (less than 5 characters)', async () => {
            const dto = plainToInstance(UserLoginDto, {
                email: 'a@b',
                password: 'Valid@Pass123',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const emailError = errors.find((err) => err.property === 'email');
            expect(emailError).toBeDefined();
        });

        it('should fail if email format is invalid', async () => {
            const dto = plainToInstance(UserLoginDto, {
                email: 'invalid-email',
                password: 'Valid@Pass123',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const emailError = errors.find((err) => err.property === 'email');
            expect(emailError).toBeDefined();
        });

        it('should fail with email without @ symbol', async () => {
            const dto = plainToInstance(UserLoginDto, {
                email: 'invalidemail.com',
                password: 'Valid@Pass123',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const emailError = errors.find((err) => err.property === 'email');
            expect(emailError).toBeDefined();
        });
    });

    describe('Failed validation - Password', () => {
        it('should fail if password is empty', async () => {
            const dto = plainToInstance(UserLoginDto, {
                email: 'test@example.com',
                password: '',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const passwordError = errors.find((err) => err.property === 'password');
            expect(passwordError).toBeDefined();
        });

        it('should fail if password is missing', async () => {
            const dto = plainToInstance(UserLoginDto, {
                email: 'test@example.com',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const passwordError = errors.find((err) => err.property === 'password');
            expect(passwordError).toBeDefined();
        });

        it('should pass if password is too short (less than 12 characters)', async () => {
            const dto = plainToInstance(UserLoginDto, {
                email: 'test@example.com',
                password: 'Short@1',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should pass if password has exactly 11 characters', async () => {
            const dto = plainToInstance(UserLoginDto, {
                email: 'test@example.com',
                password: 'Valid@Pas11',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('Failed validation - RememberMe', () => {
        it('should fail if rememberMe is not a boolean (string)', async () => {
            const dto = plainToInstance(UserLoginDto, {
                email: 'test@example.com',
                password: 'Valid@Pass123',
                rememberMe: 'true' as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const rememberMeError = errors.find((err) => err.property === 'rememberMe');
            expect(rememberMeError).toBeDefined();
        });

        it('should fail if rememberMe is not a boolean (number)', async () => {
            const dto = plainToInstance(UserLoginDto, {
                email: 'test@example.com',
                password: 'Valid@Pass123',
                rememberMe: 1 as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const rememberMeError = errors.find((err) => err.property === 'rememberMe');
            expect(rememberMeError).toBeDefined();
        });
    });

    describe('Failed validation - Multiple fields', () => {
        it('should fail if all required fields are empty', async () => {
            const dto = plainToInstance(UserLoginDto, {
                email: '',
                password: '',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThanOrEqual(2);
        });

        it('should fail if all required fields are missing', async () => {
            const dto = plainToInstance(UserLoginDto, {});

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThanOrEqual(2);
        });

        it('should return multiple errors for invalid fields', async () => {
            const dto = plainToInstance(UserLoginDto, {
                email: 'invalid',
                password: null,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some((err) => err.property === 'email')).toBeTruthy();
            expect(errors.some((err) => err.property === 'password')).toBeTruthy();
        });

        it('should fail with all invalid fields', async () => {
            const dto = plainToInstance(UserLoginDto, {
                email: 'not-email',
                password: undefined,
                rememberMe: 'yes' as any,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThanOrEqual(3);
            expect(errors.some((err) => err.property === 'email')).toBeTruthy();
            expect(errors.some((err) => err.property === 'password')).toBeTruthy();
            expect(errors.some((err) => err.property === 'rememberMe')).toBeTruthy();
        });
    });

    describe('Edge cases', () => {
        it('should handle password with exactly 12 characters', async () => {
            const dto = plainToInstance(UserLoginDto, {
                email: 'test@example.com',
                password: 'Valid@Pass12',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should handle very long valid password', async () => {
            const dto = plainToInstance(UserLoginDto, {
                email: 'test@example.com',
                password: 'VeryLong@ValidPassword123456789',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should handle complex email formats', async () => {
            const complexEmails = [
                'user+tag@example.com',
                'user.name@example.co.uk',
                'user_name@example-domain.com',
            ];

            for (const email of complexEmails) {
                const dto = plainToInstance(UserLoginDto, {
                    email,
                    password: 'Valid@Pass123',
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            }
        });

        it('should handle rememberMe with explicit undefined', async () => {
            const dto = plainToInstance(UserLoginDto, {
                email: 'test@example.com',
                password: 'Valid@Pass123',
                rememberMe: undefined,
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('Transformation and types', () => {
        it('should create an instance with correct properties', () => {
            const dto = plainToInstance(UserLoginDto, {
                email: 'test@example.com',
                password: 'Valid@Pass123',
                rememberMe: true,
            });

            expect(dto).toBeInstanceOf(UserLoginDto);
            expect(dto.email).toBe('test@example.com');
            expect(dto.password).toBe('Valid@Pass123');
            expect(dto.rememberMe).toBe(true);
        });

        it('should create instance without rememberMe', () => {
            const dto = plainToInstance(UserLoginDto, {
                email: 'test@example.com',
                password: 'Valid@Pass123',
            });

            expect(dto).toBeInstanceOf(UserLoginDto);
            expect(dto.email).toBe('test@example.com');
            expect(dto.password).toBe('Valid@Pass123');
            expect(dto.rememberMe).toBeUndefined();
        });

        it('should preserve boolean values correctly', () => {
            const dtoTrue = plainToInstance(UserLoginDto, {
                email: 'test@example.com',
                password: 'Valid@Pass123',
                rememberMe: true,
            });

            const dtoFalse = plainToInstance(UserLoginDto, {
                email: 'test@example.com',
                password: 'Valid@Pass123',
                rememberMe: false,
            });

            expect(dtoTrue.rememberMe).toBe(true);
            expect(dtoFalse.rememberMe).toBe(false);
        });
    });
});
