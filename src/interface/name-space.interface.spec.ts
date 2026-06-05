import { NameSpaceInterface } from './name-space.interface';

describe('NameSpaceInterface', () => {
    describe('Valid NameSpaceInterface objects', () => {
        it('should accept a minimal valid namespace with only name', () => {
            const namespace: NameSpaceInterface = {
                name: 'testNamespace',
                options: {},
            };

            expect(namespace.name).toBe('testNamespace');
            expect(namespace.options).toEqual({});
        });

        it('should accept a namespace with roomPrefix', () => {
            const namespace: NameSpaceInterface = {
                name: 'chat',
                options: {
                    roomPrefix: 'room_',
                },
            };

            expect(namespace.options.roomPrefix).toBe('room_');
        });

        it('should accept a namespace with queryParam', () => {
            const namespace: NameSpaceInterface = {
                name: 'notifications',
                options: {
                    queryParam: 'userId',
                },
            };

            expect(namespace.options.queryParam).toBe('userId');
        });

        it('should accept a namespace with defaultRoom', () => {
            const namespace: NameSpaceInterface = {
                name: 'lobby',
                options: {
                    defaultRoom: 'general',
                },
            };

            expect(namespace.options.defaultRoom).toBe('general');
        });

        it('should accept a namespace with requireAuth set to true', () => {
            const namespace: NameSpaceInterface = {
                name: 'secure',
                options: {
                    requireAuth: true,
                },
            };

            expect(namespace.options.requireAuth).toBe(true);
        });

        it('should accept a namespace with requireAuth set to false', () => {
            const namespace: NameSpaceInterface = {
                name: 'public',
                options: {
                    requireAuth: false,
                },
            };

            expect(namespace.options.requireAuth).toBe(false);
        });

        it('should accept a namespace with sAdminOnly set to true', () => {
            const namespace: NameSpaceInterface = {
                name: 'superAdmin',
                options: {
                    sAdminOnly: true,
                },
            };

            expect(namespace.options.sAdminOnly).toBe(true);
        });

        it('should accept a namespace with sAdminOnly set to false', () => {
            const namespace: NameSpaceInterface = {
                name: 'regularUsers',
                options: {
                    sAdminOnly: false,
                },
            };

            expect(namespace.options.sAdminOnly).toBe(false);
        });

        it('should accept a namespace with adminOnly set to true', () => {
            const namespace: NameSpaceInterface = {
                name: 'adminPanel',
                options: {
                    adminOnly: true,
                },
            };

            expect(namespace.options.adminOnly).toBe(true);
        });

        it('should accept a namespace with adminOnly set to false', () => {
            const namespace: NameSpaceInterface = {
                name: 'userPanel',
                options: {
                    adminOnly: false,
                },
            };

            expect(namespace.options.adminOnly).toBe(false);
        });

        it('should accept a namespace with requiredPermissions', () => {
            const namespace: NameSpaceInterface = {
                name: 'documents',
                options: {
                    requiredPermissions: {
                        ui: 'documents',
                        actions: ['read', 'write'],
                    },
                },
            };

            expect(namespace.options.requiredPermissions).toEqual({
                ui: 'documents',
                actions: ['read', 'write'],
            });
        });

        it('should accept a namespace with empty actions array in requiredPermissions', () => {
            const namespace: NameSpaceInterface = {
                name: 'restricted',
                options: {
                    requiredPermissions: {
                        ui: 'restricted',
                        actions: [],
                    },
                },
            };

            expect(namespace.options.requiredPermissions?.actions).toEqual([]);
        });

        it('should accept a namespace with multiple actions in requiredPermissions', () => {
            const namespace: NameSpaceInterface = {
                name: 'files',
                options: {
                    requiredPermissions: {
                        ui: 'files',
                        actions: ['create', 'read', 'update', 'delete', 'share'],
                    },
                },
            };

            expect(namespace.options.requiredPermissions?.actions).toHaveLength(5);
            expect(namespace.options.requiredPermissions?.actions).toContain('share');
        });

        it('should accept a namespace with all options combined', () => {
            const namespace: NameSpaceInterface = {
                name: 'fullNamespace',
                options: {
                    roomPrefix: 'prefix_',
                    queryParam: 'token',
                    defaultRoom: 'lobby',
                    requireAuth: true,
                    sAdminOnly: false,
                    adminOnly: true,
                    requiredPermissions: {
                        ui: 'admin',
                        actions: ['manage', 'configure'],
                    },
                },
            };

            expect(namespace.name).toBe('fullNamespace');
            expect(namespace.options.roomPrefix).toBe('prefix_');
            expect(namespace.options.queryParam).toBe('token');
            expect(namespace.options.defaultRoom).toBe('lobby');
            expect(namespace.options.requireAuth).toBe(true);
            expect(namespace.options.sAdminOnly).toBe(false);
            expect(namespace.options.adminOnly).toBe(true);
            expect(namespace.options.requiredPermissions).toBeDefined();
            expect(namespace.options.requiredPermissions?.ui).toBe('admin');
            expect(namespace.options.requiredPermissions?.actions).toEqual(['manage', 'configure']);
        });
    });

    describe('Edge cases and special values', () => {
        it('should accept empty string as name', () => {
            const namespace: NameSpaceInterface = {
                name: '',
                options: {},
            };

            expect(namespace.name).toBe('');
        });

        it('should accept special characters in name', () => {
            const namespace: NameSpaceInterface = {
                name: '/admin-panel_v2',
                options: {},
            };

            expect(namespace.name).toBe('/admin-panel_v2');
        });

        it('should accept empty string values in options', () => {
            const namespace: NameSpaceInterface = {
                name: 'test',
                options: {
                    roomPrefix: '',
                    queryParam: '',
                    defaultRoom: '',
                },
            };

            expect(namespace.options.roomPrefix).toBe('');
            expect(namespace.options.queryParam).toBe('');
            expect(namespace.options.defaultRoom).toBe('');
        });

        it('should accept undefined values for optional fields', () => {
            const namespace: NameSpaceInterface = {
                name: 'test',
                options: {
                    roomPrefix: undefined,
                    queryParam: undefined,
                    defaultRoom: undefined,
                    requireAuth: undefined,
                    sAdminOnly: undefined,
                    adminOnly: undefined,
                    requiredPermissions: undefined,
                },
            };

            expect(namespace.options.roomPrefix).toBeUndefined();
            expect(namespace.options.queryParam).toBeUndefined();
            expect(namespace.options.defaultRoom).toBeUndefined();
            expect(namespace.options.requireAuth).toBeUndefined();
            expect(namespace.options.sAdminOnly).toBeUndefined();
            expect(namespace.options.adminOnly).toBeUndefined();
            expect(namespace.options.requiredPermissions).toBeUndefined();
        });

        it('should handle long string values', () => {
            const longString = 'a'.repeat(1000);
            const namespace: NameSpaceInterface = {
                name: longString,
                options: {
                    roomPrefix: longString,
                    queryParam: longString,
                    defaultRoom: longString,
                },
            };

            expect(namespace.name).toHaveLength(1000);
            expect(namespace.options.roomPrefix).toHaveLength(1000);
        });

        it('should accept unicode characters in string fields', () => {
            const namespace: NameSpaceInterface = {
                name: '名前空間',
                options: {
                    roomPrefix: '部屋_',
                    defaultRoom: 'デフォルト',
                    requiredPermissions: {
                        ui: 'ユーザーインターフェース',
                        actions: ['読む', '書く'],
                    },
                },
            };

            expect(namespace.name).toBe('名前空間');
            expect(namespace.options.requiredPermissions?.ui).toBe('ユーザーインターフェース');
        });
    });

    describe('Type safety and structure validation', () => {
        it('should maintain correct structure when spread into new object', () => {
            const original: NameSpaceInterface = {
                name: 'original',
                options: {
                    requireAuth: true,
                    adminOnly: false,
                },
            };

            const copied = { ...original };

            expect(copied).toEqual(original);
            expect(copied.name).toBe('original');
            expect(copied.options.requireAuth).toBe(true);
        });

        it('should allow partial updates to options', () => {
            const namespace: NameSpaceInterface = {
                name: 'test',
                options: {
                    requireAuth: true,
                },
            };

            const updatedNamespace: NameSpaceInterface = {
                ...namespace,
                options: {
                    ...namespace.options,
                    adminOnly: true,
                },
            };

            expect(updatedNamespace.options.requireAuth).toBe(true);
            expect(updatedNamespace.options.adminOnly).toBe(true);
        });

        it('should preserve requiredPermissions structure after modification', () => {
            const namespace: NameSpaceInterface = {
                name: 'test',
                options: {
                    requiredPermissions: {
                        ui: 'settings',
                        actions: ['view'],
                    },
                },
            };

            const updatedNamespace: NameSpaceInterface = {
                ...namespace,
                options: {
                    ...namespace.options,
                    requiredPermissions: {
                        ...namespace.options.requiredPermissions!,
                        actions: [...namespace.options.requiredPermissions!.actions, 'edit'],
                    },
                },
            };

            expect(updatedNamespace.options.requiredPermissions?.actions).toEqual(['view', 'edit']);
        });
    });

    describe('Array of NameSpaceInterface', () => {
        it('should handle array of namespaces', () => {
            const namespaces: NameSpaceInterface[] = [
                {
                    name: 'public',
                    options: { requireAuth: false },
                },
                {
                    name: 'private',
                    options: { requireAuth: true },
                },
                {
                    name: 'admin',
                    options: { requireAuth: true, adminOnly: true },
                },
            ];

            expect(namespaces).toHaveLength(3);
            expect(namespaces[0].name).toBe('public');
            expect(namespaces[2].options.adminOnly).toBe(true);
        });

        it('should filter namespaces based on options', () => {
            const namespaces: NameSpaceInterface[] = [
                { name: 'public', options: { requireAuth: false } },
                { name: 'private', options: { requireAuth: true } },
                {
                    name: 'admin',
                    options: { requireAuth: true, adminOnly: true },
                },
            ];

            const authRequired = namespaces.filter((ns) => ns.options.requireAuth === true);

            expect(authRequired).toHaveLength(2);
            expect(authRequired.map((ns) => ns.name)).toEqual(['private', 'admin']);
        });
    });

    describe('Real-world usage scenarios', () => {
        it('should represent a public chat namespace', () => {
            const publicChat: NameSpaceInterface = {
                name: '/chat',
                options: {
                    roomPrefix: 'chat_',
                    defaultRoom: 'general',
                    requireAuth: false,
                },
            };

            expect(publicChat.options.requireAuth).toBe(false);
            expect(publicChat.options.defaultRoom).toBe('general');
        });

        it('should represent an admin-only namespace', () => {
            const adminNamespace: NameSpaceInterface = {
                name: '/admin',
                options: {
                    requireAuth: true,
                    adminOnly: true,
                    requiredPermissions: {
                        ui: 'admin',
                        actions: ['read', 'write', 'delete'],
                    },
                },
            };

            expect(adminNamespace.options.adminOnly).toBe(true);
            expect(adminNamespace.options.requiredPermissions?.actions).toContain('delete');
        });

        it('should represent a super admin namespace', () => {
            const superAdminNamespace: NameSpaceInterface = {
                name: '/superadmin',
                options: {
                    requireAuth: true,
                    sAdminOnly: true,
                    adminOnly: true,
                    queryParam: 'superAdminToken',
                },
            };

            expect(superAdminNamespace.options.sAdminOnly).toBe(true);
            expect(superAdminNamespace.options.queryParam).toBe('superAdminToken');
        });

        it('should represent a notification namespace with specific permissions', () => {
            const notificationNamespace: NameSpaceInterface = {
                name: '/notifications',
                options: {
                    roomPrefix: 'notification_',
                    requireAuth: true,
                    queryParam: 'userId',
                    requiredPermissions: {
                        ui: 'notifications',
                        actions: ['subscribe', 'receive'],
                    },
                },
            };

            expect(notificationNamespace.options.queryParam).toBe('userId');
            expect(notificationNamespace.options.requiredPermissions?.actions).toContain(
                'subscribe',
            );
        });
    });
});
