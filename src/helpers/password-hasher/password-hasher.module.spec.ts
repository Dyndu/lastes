import { Test, TestingModule } from '@nestjs/testing';
import { PasswordHasherModule } from './password-hasher.module';
import { PasswordHasherService } from './password-hasher.service';

describe('PasswordHasherModule', () => {
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [PasswordHasherModule],
        }).compile();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    it('should provide Password_hashService', () => {
        const passwordHash = module.get<PasswordHasherService>(PasswordHasherService);
        expect(passwordHash).toBeDefined();
    });
});
