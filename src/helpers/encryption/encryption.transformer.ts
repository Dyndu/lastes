import { ValueTransformer } from 'typeorm';
import { getEncryptionService } from './encryption.singleton';

export const EncryptionTransformer: ValueTransformer = {
    to(value: string): string {
        return value ? getEncryptionService().encrypt(value) : null!;
    },
    from(value: string): string {
        return value ? getEncryptionService().decrypt(value) : null!;
    },
};
