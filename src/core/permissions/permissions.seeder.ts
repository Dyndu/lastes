import { Injectable } from '@nestjs/common';
import { PermissionRepository } from './permissions.repository';
import { PermissionEntity } from './entities/permission.entity';

const createPermission = (label: string, action: string, ui: string) => ({
    label,
    action,
    ui,
});

const adminPermission = [
    createPermission('View', 'view', 'module'),
    createPermission('Add new module', 'create', 'module'),
    createPermission('Update module', 'update', 'module'),
    createPermission('Delete module', 'delete', 'module'),

    createPermission('View', 'view', 'user'),
    createPermission('Add new user', 'create', 'user'),
    createPermission('Update user', 'update', 'user'),
    createPermission('Delete user', 'delete', 'user'),

    createPermission('View', 'view', 'billing'),
    createPermission('Add new billing', 'create', 'billing'),
    createPermission('Update billing', 'update', 'billing'),
    createPermission('Delete billing', 'delete', 'billing'),

    createPermission('View', 'view', 'affiliation'),
    createPermission('Add new affiliation', 'create', 'affiliation'),
    createPermission('Update affiliation', 'update', 'affiliation'),
    createPermission('Delete affiliation', 'delete', 'affiliation'),

    createPermission('View', 'view', 'guides'),
    createPermission('Add new guides', 'create', 'guides'),
    createPermission('Update guides', 'update', 'guides'),
    createPermission('Delete guides', 'delete', 'guides'),

    createPermission('View', 'view', 'media'),
    createPermission('Add new media', 'create', 'media'),
    createPermission('Update media', 'update', 'media'),
    createPermission('Delete media', 'delete', 'media'),

    createPermission('View', 'view', 'dataset'),
    createPermission('Add new dataset', 'create', 'dataset'),
    createPermission('Update dataset', 'update', 'dataset'),
    createPermission('Delete dataset', 'delete', 'dataset'),

    createPermission('View', 'view', 'newsletter'),
    createPermission('Add new newsletter', 'create', 'newsletter'),
    createPermission('Update newsletter', 'update', 'newsletter'),
    createPermission('Delete newsletter', 'delete', 'newsletter'),

    createPermission('View', 'view', 'ads_spaces'),
    createPermission('Add new ads_spaces', 'create', 'ads_spaces'),
    createPermission('Update ads_spaces', 'update', 'ads_spaces'),
    createPermission('Delete ads_spaces', 'delete', 'ads_spaces'),

    createPermission('View', 'view', 'help_support'),
    createPermission('Add new help_support', 'create', 'help_support'),
    createPermission('Update help_support', 'update', 'help_support'),
    createPermission('Delete help_support', 'delete', 'help_support'),

    createPermission('View', 'view', 'admin_users'),
    createPermission('Add new admin_users', 'create', 'admin_users'),
    createPermission('Update admin_users', 'update', 'admin_users'),
    createPermission('Delete admin_users', 'delete', 'admin_users'),

    createPermission('View', 'view', 'categories'),
    createPermission('Add new categories', 'create', 'categories'),
    createPermission('Update categories', 'update', 'categories'),
    createPermission('Delete categories', 'delete', 'categories'),

    createPermission('View', 'view', 'dashboard'),
    createPermission('Add new dashboard', 'create', 'dashboard'),
    createPermission('Update dashboard', 'update', 'dashboard'),
    createPermission('Delete dashboard', 'delete', 'dashboard'),

    createPermission('View', 'view', 'statistics'),
    createPermission('Add statistics', 'create', 'statistics'),
    createPermission('Update statistics', 'update', 'statistics'),
    createPermission('Delete statistics', 'delete', 'statistics'),
];

@Injectable()
export class PermissionSeeder {
    constructor(private readonly permissionRepository: PermissionRepository) {}

    async seed() {
        const existingPermissions = await this.permissionRepository.find({
            where: { deleted: false },
        });

        const existingKeySet = new Set(
            existingPermissions.map(
                (p) => `${p.label.trim()}|${p.action.trim()}|${p.ui.trim()} ?? 'null'}`,
            ),
        );

        const getMissingPermissions = (rawPermissions: typeof adminPermission) => {
            return rawPermissions
                .filter((perm) => {
                    const key = `${perm.label.trim()}|${perm.action.trim()}|${perm.ui.trim()} ?? 'null'}`;
                    return !existingKeySet.has(key);
                })
                .map((perm) => {
                    const result = new PermissionEntity();
                    result.label = perm.label.trim();
                    result.action = perm.action.trim();
                    result.ui = perm.ui.trim();

                    return result;
                });
        };

        const adminPerms = getMissingPermissions(adminPermission);

        const allToInsert = [...adminPerms];

        if (allToInsert.length > 0) await this.permissionRepository.createMany(allToInsert);
    }
}
