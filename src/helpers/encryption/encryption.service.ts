import { Inject, Injectable } from '@nestjs/common';
import * as crypto from 'node:crypto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { EnvConfigService } from '../../utils/services/config';

@Injectable()
export class EncryptionService {
    private readonly algorithm = 'aes-256-cbc';
    private readonly key: Buffer;
    private readonly iv: Buffer;

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
        private readonly envConfig: EnvConfigService,
    ) {
        const [secret, iv] = [this.envConfig.cryptoSecret, this.envConfig.cryptoIv];

        this.key = Buffer.from(secret.padEnd(32), 'utf-8');
        this.iv = Buffer.from(iv.padEnd(16), 'utf-8');
    }

    /**
     * Encrypts a string using AES encryption.
     * Uses a cipher to encrypt the data with the specified algorithm, key, and initialization vector (IV).
     * Returns the encrypted data as a base64 string.
     * Throws an error if encryption fails.
     */
    encrypt(data: string): string {
        try {
            const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
            let encrypted = cipher.update(data, 'utf8', 'base64');
            encrypted += cipher.final('base64');
            return encrypted;
        } catch (error) {
            this.logger.error(`Encryption failed: ${error.message}`);
            throw new Error('Encryption failed');
        }
    }

    /**
     * Decrypts a base64 encoded string using AES decryption.
     * Uses a deciphering to decrypt the data with the specified algorithm, key, and initialization vector (IV).
     * Returns the decrypted data as a UTF-8 string.
     * Throws an error if decryption fails.
     */
    decrypt(data: string): string {
        try {
            const decipher = crypto.createDecipheriv(this.algorithm, this.key, this.iv);
            let decrypted = decipher.update(data, 'base64', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (error) {
            this.logger.error(`Decryption failed: ${error.message}`);
            throw new Error('Decryption failed');
        }
    }
}
