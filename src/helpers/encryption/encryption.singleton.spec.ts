import { getEncryptionService } from './encryption.singleton';
import { EncryptionService } from './encryption.service';
import { EnvConfigService } from '../../utils/services/config';

jest.mock('../../utils/services/config');
jest.mock('@nestjs/config');
jest.mock('../../utils/services/tools');

describe('getEncryptionService', () => {
    beforeAll(() => {
        (EnvConfigService as jest.Mock).mockImplementation(() => ({
            cryptoSecret: '12345678901234567890123456789012',
            cryptoIv: '1234567890123456',
        }));
    });

    it('should return an EncryptionService instance', () => {
        const service = getEncryptionService();
        expect(service).toBeInstanceOf(EncryptionService);
    });

    it('should return the same instance on multiple calls (singleton pattern)', () => {
        const firstCall = getEncryptionService();
        const secondCall = getEncryptionService();
        const thirdCall = getEncryptionService();

        expect(firstCall).toBe(secondCall);
        expect(secondCall).toBe(thirdCall);
    });

    it('should be able to encrypt and decrypt data', () => {
        const service = getEncryptionService();
        const plainText = 'TestData123';

        const encrypted = service.encrypt(plainText);
        expect(encrypted).toBeDefined();
        expect(typeof encrypted).toBe('string');
        expect(encrypted).not.toBe(plainText);

        const decrypted = service.decrypt(encrypted);
        expect(decrypted).toBe(plainText);
    });
});
