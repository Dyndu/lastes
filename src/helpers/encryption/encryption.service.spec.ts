import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionService } from './encryption.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { EnvConfigService } from '../../utils/services/config';

describe('EncryptionService', () => {
    let service: EncryptionService;

    const mockLogger = {
        error: jest.fn(),
    } as unknown as Logger;

    const mockEnvConfigService = {
        cryptoSecret: '12345678901234567890123456789012',
        cryptoIv: '1234567890123456',
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EncryptionService,
                { provide: WINSTON_MODULE_PROVIDER, useValue: mockLogger },
                { provide: EnvConfigService, useValue: mockEnvConfigService },
            ],
        }).compile();

        service = module.get<EncryptionService>(EncryptionService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('encrypt and decrypt', () => {
        it('should correctly encrypt and decrypt data', () => {
            const plainText = 'HelloWorld';
            const encrypted = service.encrypt(plainText);
            expect(typeof encrypted).toBe('string');
            const decrypted = service.decrypt(encrypted);
            expect(decrypted).toBe(plainText);
        });

        it('should log and throw an error if encryption fails', () => {
            const cryptoModule = require('crypto');
            jest.spyOn(cryptoModule, 'createCipheriv').mockImplementationOnce(() => {
                throw new Error('Invalid IV length');
            });

            expect(() => service.encrypt('test')).toThrow('Encryption failed');
            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.stringContaining('Encryption failed'),
            );
        });

        it('should log and throw an error if decryption fails', () => {
            expect(() => service.decrypt('invaliddata')).toThrow('Decryption failed');
            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.stringContaining('Decryption failed'),
            );
        });
    });
});
