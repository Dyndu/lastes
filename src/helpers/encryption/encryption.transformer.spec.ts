jest.mock('./encryption.singleton', () => ({
    getEncryptionService: jest.fn(),
}));

const mockEncrypt = jest.fn((v) => `encrypted(${v})`);
const mockDecrypt = jest.fn((v) => `decrypted(${v})`);

import { getEncryptionService } from './encryption.singleton';

(getEncryptionService as jest.Mock).mockReturnValue({
    encrypt: mockEncrypt,
    decrypt: mockDecrypt,
});

import { EncryptionTransformer } from './encryption.transformer';

describe('EncryptionTransformer', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('to()', () => {
        it('should encrypt a non-null value', () => {
            const result = EncryptionTransformer.to('mySecret');
            expect(mockEncrypt).toHaveBeenCalledWith('mySecret');
            expect(result).toBe('encrypted(mySecret)');
        });
        it('should return null when value is null', () => {
            const result = EncryptionTransformer.to(null);
            expect(result).toBeNull();
            expect(mockEncrypt).not.toHaveBeenCalled();
        });
    });

    describe('from()', () => {
        it('should decrypt a non-null value', () => {
            const result = EncryptionTransformer.from('encryptedValue');
            expect(mockDecrypt).toHaveBeenCalledWith('encryptedValue');
            expect(result).toBe('decrypted(encryptedValue)');
        });
        it('should return null when value is null', () => {
            const result = EncryptionTransformer.from(null);
            expect(result).toBeNull();
            expect(mockDecrypt).not.toHaveBeenCalled();
        });
    });
});
