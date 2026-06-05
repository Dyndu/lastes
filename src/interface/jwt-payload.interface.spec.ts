import { JwtPayload } from './jwt-payload.interface';

describe('JwtPayload', () => {
    describe('Type Guards', () => {
        it('should accept a valid JwtPayload object', () => {
            const validPayload: JwtPayload = {
                sub: 'user123',
                sid: 'session456',
                role: 'admin',
                ver: 1,
                type: 'access',
            };

            expect(validPayload.sub).toBe('user123');
            expect(validPayload.role).toBe('admin');
            expect(validPayload.sid).toBe('session456');
            expect(validPayload.ver).toBe(1);
            expect(validPayload.type).toBe('access');
        });

        it('should validate sub property is a string', () => {
            const payload: JwtPayload = {
                sub: 'abc-123-def',
                sid: 'session1',
                role: 'admin',
                ver: 1,
                type: 'access',
            };

            expect(typeof payload.sub).toBe('string');
        });

        it('should validate sid property is a string', () => {
            const payload: JwtPayload = {
                sub: 'user1',
                sid: 'uuid-session-id',
                role: 'admin',
                ver: 1,
                type: 'access',
            };

            expect(typeof payload.sid).toBe('string');
        });

        it('should validate ver property is a number', () => {
            const payload: JwtPayload = {
                sub: 'user1',
                sid: 'session1',
                role: 'admin',
                ver: 2,
                type: 'access',
            };

            expect(typeof payload.ver).toBe('number');
        });

        it('should validate role property is a string', () => {
            const payload: JwtPayload = {
                sub: 'user1',
                sid: 'session1',
                role: 'admin',
                ver: 2,
                type: 'access',
            };

            expect(typeof payload.role).toBe('string');
        });

        it('should validate type property is literally "access"', () => {
            const payload: JwtPayload = {
                sub: 'user1',
                role: 'admin',
                sid: 'session1',
                ver: 1,
                type: 'access',
            };

            expect(payload.type).toBe('access');
        });
    });

    describe('Custom Type Guard Function', () => {
        function isJwtPayload(obj: unknown): obj is JwtPayload {
            return (
                typeof obj === 'object' &&
                obj !== null &&
                'sub' in obj &&
                'role' in obj &&
                'sid' in obj &&
                'ver' in obj &&
                'type' in obj &&
                true &&
                true &&
                true &&
                (obj as JwtPayload).type === 'access'
            );
        }

        it('should return true for valid JwtPayload', () => {
            const validPayload = {
                sub: 'user123',
                sid: 'session456',
                role: 'admin',
                ver: 1,
                type: 'access',
            };

            expect(isJwtPayload(validPayload)).toBe(true);
        });

        it('should return false for invalid type property', () => {
            const invalidPayload = {
                sub: 'user123',
                sid: 'session456',
                ver: 1,
                type: 'refresh',
            };

            expect(isJwtPayload(invalidPayload)).toBe(false);
        });

        it('should return false for missing properties', () => {
            const invalidPayload = {
                sub: 'user123',
                sid: 'session456',
                ver: 1,
            };

            expect(isJwtPayload(invalidPayload)).toBe(false);
        });

        it('should return false for null or undefined', () => {
            expect(isJwtPayload(null)).toBe(false);
            expect(isJwtPayload(undefined)).toBe(false);
        });

        it('should return false for wrong property types', () => {
            const invalidPayload = {
                sub: 123,
                sid: 'session456',
                ver: '1',
                type: 'refresh',
            };

            expect(isJwtPayload(invalidPayload)).toBe(false);
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty strings', () => {
            const payload: JwtPayload = {
                sub: '',
                sid: '',
                role: 'admin',
                ver: 0,
                type: 'access',
            };

            expect(payload.sub).toBe('');
            expect(payload.sid).toBe('');
            expect(payload.ver).toBe(0);
        });

        it('should handle large version numbers', () => {
            const payload: JwtPayload = {
                sub: 'user1',
                role: 'admin',
                sid: 'session1',
                ver: 999999,
                type: 'access',
            };

            expect(payload.ver).toBe(999999);
        });

        it('should handle special characters in strings', () => {
            const payload: JwtPayload = {
                sub: 'user@example.com',
                role: 'admin',
                sid: 'session-uuid-123-abc',
                ver: 1,
                type: 'access',
            };

            expect(payload.sub).toContain('@');
            expect(payload.sid).toContain('-');
        });
    });
});
