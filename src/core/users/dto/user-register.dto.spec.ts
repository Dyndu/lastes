import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UserRegisterDto } from './user-register.dto';

describe('UserRegisterDto', () => {
    describe('Successful validation', () => {
        it('should validate a complete valid DTO', async () => {
            const dto = plainToInstance(UserRegisterDto, {
                fullname: 'Lazare SAGBOHAN',
                email: 'lazaresagbo@gmail.com',
                password: 'Abcd@1234546789',
                confirmPassword: 'Abcd@1234546789',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should accept valid fullname with minimum length', async () => {
            const dto = plainToInstance(UserRegisterDto, {
                fullname: 'Johny',
                email: 'john@example.com',
                password: 'Valid@Pass123',
                confirmPassword: 'Valid@Pass123',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should accept valid email format', async () => {
            const dto = plainToInstance(UserRegisterDto, {
                fullname: 'Test User',
                email: 'test.user@example.com',
                password: 'Valid@Pass123',
                confirmPassword: 'Valid@Pass123',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should accept password with all required characters', async () => {
            const dto = plainToInstance(UserRegisterDto, {
                fullname: 'Test User',
                email: 'test@example.com',
                password: 'MyP@ssw0rd123',
                confirmPassword: 'MyP@ssw0rd123',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should accept matching passwords', async () => {
            const dto = plainToInstance(UserRegisterDto, {
                fullname: 'Test User',
                email: 'test@example.com',
                password: 'SamePassword#123',
                confirmPassword: 'SamePassword#123',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('Failed validation - Fullname', () => {
        it('should fail if fullname is empty', async () => {
            const dto = plainToInstance(UserRegisterDto, {
                fullname: '',
                email: 'test@example.com',
                password: 'Valid@Pass123',
                confirmPassword: 'Valid@Pass123',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const fullnameError = errors.find((err) => err.property === 'fullname');
            expect(fullnameError).toBeDefined();
        });

        it('should fail if fullname is missing', async () => {
            const dto = plainToInstance(UserRegisterDto, {
                email: 'test@example.com',
                password: 'Valid@Pass123',
                confirmPassword: 'Valid@Pass123',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const fullnameError = errors.find((err) => err.property === 'fullname');
            expect(fullnameError).toBeDefined();
        });

        it('should fail if fullname is too short (less than 5 characters)', async () => {
            const dto = plainToInstance(UserRegisterDto, {
                fullname: 'John',
                email: 'test@example.com',
                password: 'Valid@Pass123',
                confirmPassword: 'Valid@Pass123',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const fullnameError = errors.find((err) => err.property === 'fullname');
            expect(fullnameError).toBeDefined();
        });
    });

    describe('Failed validation - Email', () => {
        it('should fail if email is empty', async () => {
            const dto = plainToInstance(UserRegisterDto, {
                fullname: 'Test User',
                email: '',
                password: 'Valid@Pass123',
                confirmPassword: 'Valid@Pass123',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const emailError = errors.find((err) => err.property === 'email');
            expect(emailError).toBeDefined();
        });

        it('should fail if email is missing', async () => {
            const dto = plainToInstance(UserRegisterDto, {
                fullname: 'Test User',
                password: 'Valid@Pass123',
                confirmPassword: 'Valid@Pass123',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const emailError = errors.find((err) => err.property === 'email');
            expect(emailError).toBeDefined();
        });

        it('should fail if email is too short (less than 5 characters)', async () => {
            const dto = plainToInstance(UserRegisterDto, {
                fullname: 'Test User',
                email: 'a@b',
                password: 'Valid@Pass123',
                confirmPassword: 'Valid@Pass123',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const emailError = errors.find((err) => err.property === 'email');
            expect(emailError).toBeDefined();
        });

        it('should fail if email format is invalid', async () => {
            const dto = plainToInstance(UserRegisterDto, {
                fullname: 'Test User',
                email: 'invalid-email',
                password: 'Valid@Pass123',
                confirmPassword: 'Valid@Pass123',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const emailError = errors.find((err) => err.property === 'email');
            expect(emailError).toBeDefined();
        });
    });

    describe('Failed validation - Password', () => {
        it('should fail if password is empty', async () => {
            const dto = plainToInstance(UserRegisterDto, {
                fullname: 'Test User',
                email: 'test@example.com',
                password: '',
                confirmPassword: '',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const passwordError = errors.find((err) => err.property === 'password');
            expect(passwordError).toBeDefined();
        });

        it('should fail if password is missing', async () => {
            const dto = plainToInstance(UserRegisterDto, {
                fullname: 'Test User',
                email: 'test@example.com',
                confirmPassword: 'Valid@Pass123',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const passwordError = errors.find((err) => err.property === 'password');
            expect(passwordError).toBeDefined();
        });

        it('should fail if password is too short (less than 12 characters)', async () => {
            const dto = plainToInstance(UserRegisterDto, {
                fullname: 'Test User',
                email: 'test@example.com',
                password: 'Short@1',
                confirmPassword: 'Short@1',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const passwordError = errors.find((err) => err.property === 'password');
            expect(passwordError).toBeDefined();
        });

        it('should fail if password has no uppercase letter', async () => {
            const dto = plainToInstance(UserRegisterDto, {
                fullname: 'Test User',
                email: 'test@example.com',
                password: 'nouppercase@123',
                confirmPassword: 'nouppercase@123',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const passwordError = errors.find((err) => err.property === 'password');
            expect(passwordError).toBeDefined();
            expect(passwordError?.constraints).toHaveProperty('matches');
            expect(passwordError?.constraints?.matches).toContain('uppercase letter');
        });

        it('should fail if password has no lowercase letter', async () => {
            const dto = plainToInstance(UserRegisterDto, {
                fullname: 'Test User',
                email: 'test@example.com',
                password: 'NOLOWERCASE@123',
                confirmPassword: 'NOLOWERCASE@123',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const passwordError = errors.find((err) => err.property === 'password');
            expect(passwordError).toBeDefined();
            expect(passwordError?.constraints).toHaveProperty('matches');
            expect(passwordError?.constraints?.matches).toContain('lowercase letter');
        });

        it('should fail if password has no number', async () => {
            const dto = plainToInstance(UserRegisterDto, {
                fullname: 'Test User',
                email: 'test@example.com',
                password: 'NoNumber@Pass',
                confirmPassword: 'NoNumber@Pass',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const passwordError = errors.find((err) => err.property === 'password');
            expect(passwordError).toBeDefined();
            expect(passwordError?.constraints).toHaveProperty('matches');
            expect(passwordError?.constraints?.matches).toContain('number');
        });

        it('should fail if password has no special character', async () => {
            const dto = plainToInstance(UserRegisterDto, {
                fullname: 'Test User',
                email: 'test@example.com',
                password: 'NoSpecialChar123',
                confirmPassword: 'NoSpecialChar123',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const passwordError = errors.find((err) => err.property === 'password');
            expect(passwordError).toBeDefined();
            expect(passwordError?.constraints).toHaveProperty('matches');
            expect(passwordError?.constraints?.matches).toContain('special character');
        });

        it('should accept password with various special characters', async () => {
            const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '_'];

            for (const char of specialChars) {
                const dto = plainToInstance(UserRegisterDto, {
                    fullname: 'Test User',
                    email: 'test@example.com',
                    password: `Valid${char}Pass123`,
                    confirmPassword: `Valid${char}Pass123`,
                });

                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            }
        });
    });

    describe('Failed validation - Confirm Password', () => {
        it('should fail if confirmPassword is empty', async () => {
            const dto = plainToInstance(UserRegisterDto, {
                fullname: 'Test User',
                email: 'test@example.com',
                password: 'Valid@Pass123',
                confirmPassword: '',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const confirmPasswordError = errors.find((err) => err.property === 'confirmPassword');
            expect(confirmPasswordError).toBeDefined();
        });

        it('should fail if confirmPassword is missing', async () => {
            const dto = plainToInstance(UserRegisterDto, {
                fullname: 'Test User',
                email: 'test@example.com',
                password: 'Valid@Pass123',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const confirmPasswordError = errors.find((err) => err.property === 'confirmPassword');
            expect(confirmPasswordError).toBeDefined();
        });

        it('should fail if passwords do not match', async () => {
            const dto = plainToInstance(UserRegisterDto, {
                fullname: 'Test User',
                email: 'test@example.com',
                password: 'Valid@Pass123',
                confirmPassword: 'Different@Pass123',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const confirmPasswordError = errors.find((err) => err.property === 'confirmPassword');
            expect(confirmPasswordError).toBeDefined();
            expect(confirmPasswordError?.constraints).toHaveProperty('match');
            expect(confirmPasswordError?.constraints?.match).toBe('Passwords do not match');
        });

        it('should fail if confirmPassword matches but password is invalid', async () => {
            const dto = plainToInstance(UserRegisterDto, {
                fullname: 'Test User',
                email: 'test@example.com',
                password: 'weakpass',
                confirmPassword: 'weakpass',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const passwordError = errors.find((err) => err.property === 'password');
            expect(passwordError).toBeDefined();
        });
    });

    describe('Failed validation - Multiple fields', () => {
        it('should fail if all fields are empty', async () => {
            const dto = plainToInstance(UserRegisterDto, {
                fullname: '',
                email: '',
                password: '',
                confirmPassword: '',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThanOrEqual(4);
        });

        it('should fail if all fields are missing', async () => {
            const dto = plainToInstance(UserRegisterDto, {});

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThanOrEqual(4);
        });

        it('should return multiple errors for invalid fields', async () => {
            const dto = plainToInstance(UserRegisterDto, {
                fullname: 'abc',
                email: 'invalid',
                password: 'weak',
                confirmPassword: 'different',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some((err) => err.property === 'fullname')).toBeTruthy();
            expect(errors.some((err) => err.property === 'email')).toBeTruthy();
            expect(errors.some((err) => err.property === 'password')).toBeTruthy();
            expect(errors.some((err) => err.property === 'confirmPassword')).toBeTruthy();
        });
    });

    describe('Edge cases', () => {
        it('should handle password with exactly 12 characters', async () => {
            const dto = plainToInstance(UserRegisterDto, {
                fullname: 'Test User',
                email: 'test@example.com',
                password: 'Valid@Pass12',
                confirmPassword: 'Valid@Pass12',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should handle very long valid password', async () => {
            const dto = plainToInstance(UserRegisterDto, {
                fullname: 'Test User',
                email: 'test@example.com',
                password: 'VeryLong@ValidPassword123456789',
                confirmPassword: 'VeryLong@ValidPassword123456789',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should handle fullname with special characters', async () => {
            const dto = plainToInstance(UserRegisterDto, {
                fullname: "O'Connor-Smith",
                email: 'test@example.com',
                password: 'Valid@Pass123',
                confirmPassword: 'Valid@Pass123',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('Transformation and types', () => {
        it('should create an instance with correct properties', () => {
            const dto = plainToInstance(UserRegisterDto, {
                fullname: 'Test User',
                email: 'test@example.com',
                password: 'Valid@Pass123',
                confirmPassword: 'Valid@Pass123',
            });

            expect(dto).toBeInstanceOf(UserRegisterDto);
            expect(dto.fullname).toBe('Test User');
            expect(dto.email).toBe('test@example.com');
            expect(dto.password).toBe('Valid@Pass123');
            expect(dto.confirmPassword).toBe('Valid@Pass123');
        });
    });
});
