import { CurrentUserInterface } from './current-user.interface';

describe('CurrentUserInterface Type Tests', () => {
    it('should create a valid CurrentUserInterface object with permissions', () => {
        const user: CurrentUserInterface = {
            id: '123',
            role: 'admin',
            sessionId: 'session-123',
            permissions: {
                users: ['read', 'write'],
                products: ['read'],
            },
        };

        expect(user).toBeDefined();
        expect(user.id).toBe('123');
        expect(user.role).toBe('admin');
        expect(user.sessionId).toBe('session-123');
        expect(user.permissions).toEqual({
            users: ['read', 'write'],
            products: ['read'],
        });
    });

    it('should allow empty permissions object', () => {
        const user: CurrentUserInterface = {
            id: '123',
            role: 'user',
            sessionId: 'session-123',
            permissions: {},
        };

        expect(user.permissions).toEqual({});
    });

    it('should allow undefined permissions', () => {
        const user: CurrentUserInterface = {
            id: '123',
            role: 'super_admin',
            sessionId: 'session-123',
            permissions: undefined as any,
        };

        expect(user.permissions).toBeUndefined();
    });

    it('should validate permissions structure', () => {
        const user: CurrentUserInterface = {
            id: '123',
            role: 'admin',
            sessionId: 'session-123',
            permissions: {
                admin_users: ['view', 'create', 'update', 'delete'],
                module: ['view', 'update'],
                dashboard: ['view'],
            },
        };

        expect(user.permissions['admin_users']).toHaveLength(4);
        expect(user.permissions['module']).toContain('view');
        expect(user.permissions['dashboard']).toEqual(['view']);
    });

    it('should allow all string values for properties', () => {
        const users: CurrentUserInterface[] = [
            { id: '', role: '', sessionId: '', permissions: {} },
            { id: 'a', role: 'b', sessionId: 'c', permissions: {} },
            {
                id: '123',
                role: 'admin',
                sessionId: 'xyz',
                permissions: { users: ['read'] },
            },
        ];

        users.forEach((user) => {
            expect(typeof user.id).toBe('string');
            expect(typeof user.role).toBe('string');
            expect(typeof user.sessionId).toBe('string');
            expect(typeof user.permissions).toBe('object');
        });
    });

    it('should work as a type guard', () => {
        const isCurrentUser = (obj: any): obj is CurrentUserInterface => {
            return (
                typeof obj === 'object' &&
                obj !== null &&
                typeof obj.id === 'string' &&
                typeof obj.role === 'string' &&
                typeof obj.sessionId === 'string' &&
                (obj.permissions === undefined || typeof obj.permissions === 'object')
            );
        };

        const validUsers = [
            { id: '1', role: 'user', sessionId: 's1', permissions: {} },
            {
                id: '1',
                role: 'user',
                sessionId: 's1',
                permissions: { users: ['read'] },
            },
            {
                id: '1',
                role: 'admin',
                sessionId: 's1',
                permissions: undefined,
            },
        ];

        const invalidUsers = [
            { id: '1', role: 'user' },
            { id: '1', role: 'user', sessionId: 's1', permissions: 'invalid' },
            null,
            undefined,
        ];

        validUsers.forEach((user) => {
            expect(isCurrentUser(user)).toBe(true);
        });

        invalidUsers.forEach((user) => {
            expect(isCurrentUser(user)).toBe(false);
        });
    });

    it('should handle different permission structures', () => {
        const scenarios: CurrentUserInterface[] = [
            {
                id: '1',
                role: 'user',
                sessionId: 's1',
                permissions: {},
            },
            {
                id: '2',
                role: 'admin',
                sessionId: 's2',
                permissions: {
                    users: [],
                },
            },
            {
                id: '3',
                role: 'admin',
                sessionId: 's3',
                permissions: {
                    users: ['view', 'create'],
                    products: ['view'],
                },
            },
            {
                id: '4',
                role: 'super_admin',
                sessionId: 's4',
                permissions: undefined as any,
            },
        ];

        scenarios.forEach((user) => {
            expect(user).toHaveProperty('id');
            expect(user).toHaveProperty('role');
            expect(user).toHaveProperty('sessionId');
            expect(user).toHaveProperty('permissions');
        });
    });

    it('should correctly type permissions Record', () => {
        const user: CurrentUserInterface = {
            id: '123',
            role: 'admin',
            sessionId: 'session-123',
            permissions: {
                admin_users: ['view', 'create'],
                user_profile: ['view', 'update'],
            },
        };

        const keys = Object.keys(user.permissions);
        keys.forEach((key) => {
            expect(typeof key).toBe('string');
        });

        Object.values(user.permissions).forEach((actions) => {
            expect(Array.isArray(actions)).toBe(true);
            actions.forEach((action) => {
                expect(typeof action).toBe('string');
            });
        });
    });
});
