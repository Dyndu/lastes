import { GoogleUserInterface } from './google-user.interface';

describe('GoogleUserInterface', () => {
    describe('Valid GoogleUserInterface objects', () => {
        it('should accept a valid GoogleUserInterface with all required fields', () => {
            const googleUser: GoogleUserInterface = {
                googleId: '123456789',
                email: 'test@example.com',
                firstName: 'John',
                lastName: 'Doe',
            };

            expect(googleUser.googleId).toBe('123456789');
            expect(googleUser.email).toBe('test@example.com');
            expect(googleUser.firstName).toBe('John');
            expect(googleUser.lastName).toBe('Doe');
            expect(googleUser.picture).toBeUndefined();
        });

        it('should accept a valid GoogleUserInterface with optional picture field', () => {
            const googleUser: GoogleUserInterface = {
                googleId: '987654321',
                email: 'jane@example.com',
                firstName: 'Jane',
                lastName: 'Smith',
                picture: 'https://example.com/photo.jpg',
            };

            expect(googleUser.googleId).toBe('987654321');
            expect(googleUser.email).toBe('jane@example.com');
            expect(googleUser.firstName).toBe('Jane');
            expect(googleUser.lastName).toBe('Smith');
            expect(googleUser.picture).toBe('https://example.com/photo.jpg');
        });

        it('should accept picture as undefined explicitly', () => {
            const googleUser: GoogleUserInterface = {
                googleId: '111222333',
                email: 'user@example.com',
                firstName: 'Alice',
                lastName: 'Johnson',
                picture: undefined,
            };

            expect(googleUser.picture).toBeUndefined();
        });
    });

    describe('Type checking', () => {
        it('should have correct types for all fields', () => {
            const googleUser: GoogleUserInterface = {
                googleId: '123456789',
                email: 'test@example.com',
                firstName: 'John',
                lastName: 'Doe',
                picture: 'https://example.com/photo.jpg',
            };

            expect(typeof googleUser.googleId).toBe('string');
            expect(typeof googleUser.email).toBe('string');
            expect(typeof googleUser.firstName).toBe('string');
            expect(typeof googleUser.lastName).toBe('string');
            expect(typeof googleUser.picture).toBe('string');
        });
    });

    describe('Object structure validation', () => {
        it('should contain all required properties', () => {
            const googleUser: GoogleUserInterface = {
                googleId: '123456789',
                email: 'test@example.com',
                firstName: 'John',
                lastName: 'Doe',
            };

            expect(googleUser).toHaveProperty('googleId');
            expect(googleUser).toHaveProperty('email');
            expect(googleUser).toHaveProperty('firstName');
            expect(googleUser).toHaveProperty('lastName');
        });

        it('should match the expected structure', () => {
            const googleUser: GoogleUserInterface = {
                googleId: '123456789',
                email: 'test@example.com',
                firstName: 'John',
                lastName: 'Doe',
                picture: 'https://example.com/photo.jpg',
            };

            expect(googleUser).toEqual({
                googleId: expect.any(String),
                email: expect.any(String),
                firstName: expect.any(String),
                lastName: expect.any(String),
                picture: expect.any(String),
            });
        });
    });

    describe('Edge cases', () => {
        it('should accept empty strings for required fields', () => {
            const googleUser: GoogleUserInterface = {
                googleId: '',
                email: '',
                firstName: '',
                lastName: '',
            };

            expect(googleUser.googleId).toBe('');
            expect(googleUser.email).toBe('');
            expect(googleUser.firstName).toBe('');
            expect(googleUser.lastName).toBe('');
        });

        it('should accept empty string for picture', () => {
            const googleUser: GoogleUserInterface = {
                googleId: '123456789',
                email: 'test@example.com',
                firstName: 'John',
                lastName: 'Doe',
                picture: '',
            };

            expect(googleUser.picture).toBe('');
        });
    });
});
