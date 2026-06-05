import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { VerifyUserCodeDto } from './verify-user-code.dto';

describe('VerifyUserCodeDto', () => {
    describe('Successful validation', () => {
        it('should validate a valid DTO with correct email and numeric code', async () => {
            const dto = plainToInstance(VerifyUserCodeDto, {
                email: 'lazaresa@gmail.com',
                code: '123456',
            });

            const errors = await validate(dto);

            expect(errors.length).toBe(0);
        });

        it('should accept a valid email', async () => {
            const dto = plainToInstance(VerifyUserCodeDto, {
                email: 'test@example.com',
                code: '123456',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should accept a 6 digit numeric code', async () => {
            const dto = plainToInstance(VerifyUserCodeDto, {
                email: 'test@example.com',
                code: '999999',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should accept a 5 digit numeric code (minimum length)', async () => {
            const dto = plainToInstance(VerifyUserCodeDto, {
                email: 'test@example.com',
                code: '12345',
            });

            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('Failed validation - Email', () => {
        it('should fail if email is empty', async () => {
            const dto = plainToInstance(VerifyUserCodeDto, {
                email: '',
                code: '123456',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const emailError = errors.find((err) => err.property === 'email');
            expect(emailError).toBeDefined();
        });

        it('should fail if email is missing', async () => {
            const dto = plainToInstance(VerifyUserCodeDto, {
                code: '123456',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const emailError = errors.find((err) => err.property === 'email');
            expect(emailError).toBeDefined();
        });

        it('should fail if email is too short (less than 5 characters)', async () => {
            const dto = plainToInstance(VerifyUserCodeDto, {
                email: 'a@b',
                code: '123456',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const emailError = errors.find((err) => err.property === 'email');
            expect(emailError).toBeDefined();
        });

        it('should fail if email is not a string', async () => {
            const dto = plainToInstance(VerifyUserCodeDto, {
                email: 12345,
                code: '123456',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const emailError = errors.find((err) => err.property === 'email');
            expect(emailError).toBeDefined();
        });
    });

    describe('Failed validation - Code', () => {
        it('should fail if code is empty', async () => {
            const dto = plainToInstance(VerifyUserCodeDto, {
                email: 'test@example.com',
                code: '',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const codeError = errors.find((err) => err.property === 'code');
            expect(codeError).toBeDefined();
        });

        it('should fail if code is missing', async () => {
            const dto = plainToInstance(VerifyUserCodeDto, {
                email: 'test@example.com',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const codeError = errors.find((err) => err.property === 'code');
            expect(codeError).toBeDefined();
        });

        it('should fail if code is too short (less than 5 characters)', async () => {
            const dto = plainToInstance(VerifyUserCodeDto, {
                email: 'test@example.com',
                code: '1234',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const codeError = errors.find((err) => err.property === 'code');
            expect(codeError).toBeDefined();
        });

        it('should fail if code exceeds 6 characters', async () => {
            const dto = plainToInstance(VerifyUserCodeDto, {
                email: 'test@example.com',
                code: '1234567',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const codeError = errors.find((err) => err.property === 'code');
            expect(codeError).toBeDefined();
        });

        it('should fail if code is not a string', async () => {
            const dto = plainToInstance(VerifyUserCodeDto, {
                email: 'test@example.com',
                code: 123456,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const codeError = errors.find((err) => err.property === 'code');
            expect(codeError).toBeDefined();
        });

        it('should fail if code contains letters', async () => {
            const dto = plainToInstance(VerifyUserCodeDto, {
                email: 'test@example.com',
                code: 'ABC123',
            });

            const error = await validate(dto);
            expect(error.length).toBeGreaterThan(0);
            const codeError = error.find((err) => err.property === 'code');
            expect(codeError).toBeDefined();
            expect(codeError!.constraints).toHaveProperty('matches');
            expect(codeError?.constraints?.matches).toBe('Code must contain only numbers');
        });

        it('should fail if code contains special characters', async () => {
            const dto = plainToInstance(VerifyUserCodeDto, {
                email: 'test@example.com',
                code: '123-45',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const codeError = errors.find((err) => err.property === 'code');
            expect(codeError).toBeDefined();
            expect(codeError!.constraints).toHaveProperty('matches');
            expect(codeError?.constraints?.matches).toBe('Code must contain only numbers');
        });

        it('should fail if code contains spaces', async () => {
            const dto = plainToInstance(VerifyUserCodeDto, {
                email: 'test@example.com',
                code: '123 456',
            });

            const newErrors = await validate(dto);
            expect(newErrors.length).toBeGreaterThan(0);
            const codeError = newErrors.find((err) => err.property === 'code');
            expect(codeError).toBeDefined();
            expect(codeError?.constraints).toHaveProperty('matches');
            expect(codeError?.constraints?.matches).toBe('Code must contain only numbers');
        });

        it('should fail if code contains alphanumeric mix', async () => {
            const dto = plainToInstance(VerifyUserCodeDto, {
                email: 'test@example.com',
                code: '12A45B',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const codeError = errors.find((err) => err.property === 'code');
            expect(codeError).toBeDefined();
            expect(codeError!.constraints).toHaveProperty('matches');
            expect(codeError!.constraints?.matches).toBe('Code must contain only numbers');
        });
    });

    describe('Failed validation - Multiple fields', () => {
        it('should fail if both email and code are invalid', async () => {
            const dto = plainToInstance(VerifyUserCodeDto, {
                email: '',
                code: '',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThanOrEqual(2);
            expect(errors.some((err) => err.property === 'email')).toBeTruthy();
            expect(errors.some((err) => err.property === 'code')).toBeTruthy();
        });

        it('should fail if all fields are missing', async () => {
            const dto = plainToInstance(VerifyUserCodeDto, {});

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThanOrEqual(2);
        });

        it('should fail if email is valid but code contains non-numeric characters', async () => {
            const dto = plainToInstance(VerifyUserCodeDto, {
                email: 'valid@example.com',
                code: 'ABCDEF',
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const codeError = errors.find((err) => err.property === 'code');
            expect(codeError).toBeDefined();
            expect(codeError!.constraints).toHaveProperty('matches');
        });
    });

    describe('Transformation and types', () => {
        it('should create an instance with correct properties', () => {
            const dto = plainToInstance(VerifyUserCodeDto, {
                email: 'test@example.com',
                code: '123456',
            });

            expect(dto).toBeInstanceOf(VerifyUserCodeDto);
            expect(dto.email).toBe('test@example.com');
            expect(dto.code).toBe('123456');
        });
    });
});
