import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { PasswordHasherService } from './password-hasher.service';

describe('PasswordHasherService', () => {
    let service: PasswordHasherService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [PasswordHasherService],
        }).compile();

        service = module.get<PasswordHasherService>(PasswordHasherService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('hashPassword', () => {
        it('should hash the password', async () => {
            const password = 'testPassword';
            const hashedPassword = await service.hashPassword(password);
            expect(hashedPassword).not.toBe(password);
            expect(typeof hashedPassword).toBe('string');
        });
    });

    describe('comparePassword', () => {
        it('should return true if the password matches the hash', async () => {
            const password = 'testPassword';
            const hashedPassword = await bcrypt.hash(password, 10);
            const isMatch = await service.comparePassword(password, hashedPassword);
            expect(isMatch).toBe(true);
        });

        it('should return false if the password does not match the hash', async () => {
            const password = 'testPassword';
            const wrongPassword = 'wrongPassword';
            const hashedPassword = await bcrypt.hash(password, 10);
            const isMatch = await service.comparePassword(wrongPassword, hashedPassword);
            expect(isMatch).toBe(false);
        });
    });
});
