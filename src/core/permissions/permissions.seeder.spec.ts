import { Test, TestingModule } from '@nestjs/testing';
import { PermissionRepository } from './permissions.repository';
import { PermissionEntity } from './entities/permission.entity';
import { PermissionSeeder } from './permissions.seeder';

describe('PermissionSeeder', () => {
    let seeder: PermissionSeeder;
    let permissionRepository: jest.Mocked<PermissionRepository>;

    const createMockPermission = (label: string, action: string, ui: string): PermissionEntity => {
        const perm = new PermissionEntity();
        perm.id = `${ui}-${action}`;
        perm.label = label;
        perm.action = action;
        perm.ui = ui;
        perm.deleted = false;
        return perm;
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PermissionSeeder,
                {
                    provide: PermissionRepository,
                    useValue: {
                        find: jest.fn(),
                        createMany: jest.fn(),
                    },
                },
            ],
        }).compile();

        seeder = module.get<PermissionSeeder>(PermissionSeeder);
        permissionRepository = module.get(PermissionRepository);

        jest.clearAllMocks();
    });

    describe('seed', () => {
        it('should insert all permissions when database is empty', async () => {
            permissionRepository.find.mockResolvedValue([]);

            await seeder.seed();

            expect(permissionRepository.find).toHaveBeenCalledWith({
                where: { deleted: false },
            });
            expect(permissionRepository.createMany).toHaveBeenCalledTimes(1);

            const insertedPerms = permissionRepository.createMany.mock.calls[0][0];
            expect(insertedPerms).toHaveLength(52);
        });

        it('should not insert any permissions when all already exist', async () => {
            const existingPermissions = [
                createMockPermission('View', 'view', 'module'),
                createMockPermission('Add new module', 'create', 'module'),
                createMockPermission('Update module', 'update', 'module'),
                createMockPermission('Delete module', 'delete', 'module'),
                createMockPermission('View', 'view', 'user'),
                createMockPermission('Add new user', 'create', 'user'),
                createMockPermission('Update user', 'update', 'user'),
                createMockPermission('Delete user', 'delete', 'user'),
                createMockPermission('View', 'view', 'billing'),
                createMockPermission('Add new billing', 'create', 'billing'),
                createMockPermission('Update billing', 'update', 'billing'),
                createMockPermission('Delete billing', 'delete', 'billing'),
                createMockPermission('View', 'view', 'affiliation'),
                createMockPermission('Add new affiliation', 'create', 'affiliation'),
                createMockPermission('Update affiliation', 'update', 'affiliation'),
                createMockPermission('Delete affiliation', 'delete', 'affiliation'),
                createMockPermission('View', 'view', 'guides'),
                createMockPermission('Add new guides', 'create', 'guides'),
                createMockPermission('Update guides', 'update', 'guides'),
                createMockPermission('Delete guides', 'delete', 'guides'),
                createMockPermission('View', 'view', 'media'),
                createMockPermission('Add new media', 'create', 'media'),
                createMockPermission('Update media', 'update', 'media'),
                createMockPermission('Delete media', 'delete', 'media'),
                createMockPermission('View', 'view', 'dataset'),
                createMockPermission('Add new dataset', 'create', 'dataset'),
                createMockPermission('Update dataset', 'update', 'dataset'),
                createMockPermission('Delete dataset', 'delete', 'dataset'),
                createMockPermission('View', 'view', 'newsletter'),
                createMockPermission('Add new newsletter', 'create', 'newsletter'),
                createMockPermission('Update newsletter', 'update', 'newsletter'),
                createMockPermission('Delete newsletter', 'delete', 'newsletter'),
                createMockPermission('View', 'view', 'ads_spaces'),
                createMockPermission('Add new ads_spaces', 'create', 'ads_spaces'),
                createMockPermission('Update ads_spaces', 'update', 'ads_spaces'),
                createMockPermission('Delete ads_spaces', 'delete', 'ads_spaces'),
                createMockPermission('View', 'view', 'help_support'),
                createMockPermission('Add new help_support', 'create', 'help_support'),
                createMockPermission('Update help_support', 'update', 'help_support'),
                createMockPermission('Delete help_support', 'delete', 'help_support'),
                createMockPermission('View', 'view', 'admin_users'),
                createMockPermission('Add new admin_users', 'create', 'admin_users'),
                createMockPermission('Update admin_users', 'update', 'admin_users'),
                createMockPermission('Delete admin_users', 'delete', 'admin_users'),
                createMockPermission('View', 'view', 'categories'),
                createMockPermission('Add new categories', 'create', 'categories'),
                createMockPermission('Update categories', 'update', 'categories'),
                createMockPermission('Delete categories', 'delete', 'categories'),
                createMockPermission('View', 'view', 'dashboard'),
                createMockPermission('Add new dashboard', 'create', 'dashboard'),
                createMockPermission('Update dashboard', 'update', 'dashboard'),
                createMockPermission('Delete dashboard', 'delete', 'dashboard'),
            ];

            permissionRepository.find.mockResolvedValue(existingPermissions);

            await seeder.seed();

            expect(permissionRepository.find).toHaveBeenCalledWith({
                where: { deleted: false },
            });
            expect(permissionRepository.createMany).not.toHaveBeenCalled();
        });

        it('should insert only missing permissions when some already exist', async () => {
            const existingPermissions = [
                createMockPermission('View', 'view', 'module'),
                createMockPermission('Add new module', 'create', 'module'),
                createMockPermission('View', 'view', 'user'),
            ];

            permissionRepository.find.mockResolvedValue(existingPermissions);

            await seeder.seed();

            expect(permissionRepository.createMany).toHaveBeenCalledTimes(1);

            const insertedPerms = permissionRepository.createMany.mock.calls[0][0];
            expect(insertedPerms).toHaveLength(49);

            const insertedKeys = insertedPerms.map(
                (p: PermissionEntity) => `${p.label}|${p.action}|${p.ui}`,
            );
            expect(insertedKeys).not.toContain('View|view|module');
            expect(insertedKeys).not.toContain('Add new module|create|module');
            expect(insertedKeys).not.toContain('View|view|user');
        });

        it('should handle permissions with extra whitespace', async () => {
            const existingPermissions = [
                {
                    ...createMockPermission('View', 'view', 'module'),
                    label: '  View  ',
                    action: '  view  ',
                    ui: '  module  ',
                },
            ];

            permissionRepository.find.mockResolvedValue(existingPermissions as any);

            await seeder.seed();

            const insertedPerms = permissionRepository.createMany.mock.calls[0][0];

            const insertedKeys = insertedPerms.map(
                (p: PermissionEntity) => `${p.label}|${p.action}|${p.ui}`,
            );
            expect(insertedKeys).not.toContain('View|view|module');
        });

        it('should create PermissionEntity instances with correct properties', async () => {
            permissionRepository.find.mockResolvedValue([]);

            await seeder.seed();

            const insertedPerms = permissionRepository.createMany.mock.calls[0][0];
            const firstPerm = insertedPerms[0];

            expect(firstPerm).toBeInstanceOf(PermissionEntity);
            expect(firstPerm).toHaveProperty('label');
            expect(firstPerm).toHaveProperty('action');
            expect(firstPerm).toHaveProperty('ui');
            expect(typeof firstPerm.label).toBe('string');
            expect(typeof firstPerm.action).toBe('string');
            expect(typeof firstPerm.ui).toBe('string');
        });

        it('should verify all modules have 4 CRUD permissions', async () => {
            permissionRepository.find.mockResolvedValue([]);

            await seeder.seed();

            const insertedPerms = permissionRepository.createMany.mock.calls[0][0];

            const modules = [
                'module',
                'user',
                'billing',
                'affiliation',
                'guides',
                'media',
                'dataset',
                'newsletter',
                'ads_spaces',
                'help_support',
                'admin_users',
                'categories',
            ];

            modules.forEach((moduleName) => {
                const modulePerms = insertedPerms.filter(
                    (p: PermissionEntity) => p.ui === moduleName,
                );
                expect(modulePerms).toHaveLength(4);

                const actions = modulePerms.map((p: PermissionEntity) => p.action);
                expect(actions).toContain('view');
                expect(actions).toContain('create');
                expect(actions).toContain('update');
                expect(actions).toContain('delete');
            });
        });

        it('should trim whitespace from permission properties before inserting', async () => {
            permissionRepository.find.mockResolvedValue([]);

            await seeder.seed();

            const insertedPerms = permissionRepository.createMany.mock.calls[0][0];

            insertedPerms.forEach((perm: PermissionEntity) => {
                expect(perm.label).toBe(perm.label.trim());
                expect(perm.action).toBe(perm.action.trim());
                expect(perm.ui).toBe(perm.ui.trim());
            });
        });
    });

    describe('Service initialization', () => {
        it('should be defined', () => {
            expect(seeder).toBeDefined();
        });

        it('should have permissionRepository injected', () => {
            expect(seeder['permissionRepository']).toBeDefined();
        });
    });
});
