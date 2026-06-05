import { Global, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Global()
@Injectable()
export class PasswordHasherService {
    private readonly saltRounds = 10;

    /**
     * Hashes a plain-text password using bcrypt with the configured salt rounds.
     * Returns the resulting bcrypt hash suitable for secure password storage.
     */
    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, this.saltRounds);
    }

    /**
     * Compares a plain-text password against a stored bcrypt hash.
     * Returns `true` if the password matches the hash, otherwise `false`.
     */
    async comparePassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }
}
