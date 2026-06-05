import { RolesSeeder } from '../../core/roles/roles.seeder';
import { PermissionSeeder } from '../../core/permissions/permissions.seeder';
import { CategoriesSeeder } from '../../core/categories/categories.seeder';
import { SCodesSeeder } from '../../core/s-codes/s-codes.seeder';
import { ModuleSeeder } from '../../core/modules/module.seeder';
import { FInfoSeeder } from '../../core/medias/seeders/f-info.seeder';
import { SocialSeeder } from '../../core/medias/seeders/social.seeder';
import { MetricsSeeder } from '../../core/p-settings/seeder/metrics.seeder';
import { PSettingSeeder } from '../../core/p-settings/seeder/p-setting.seeder';
import { SubscriptionSeeder } from '../../core/subscriptions/subscription.seeder';

export const allSeeder = [
    RolesSeeder,
    PermissionSeeder,
    CategoriesSeeder,
    SCodesSeeder,
    ModuleSeeder,
    FInfoSeeder,
    SocialSeeder,
    PSettingSeeder,
    MetricsSeeder,
    SubscriptionSeeder,
];
