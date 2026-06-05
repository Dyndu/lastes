import { SetMetadata } from '@nestjs/common';

export const Permissions = (permissions: { ui: string; actions: string[] }) =>
    SetMetadata('permissions', permissions);

export const SuperAdminOnly = () => SetMetadata('superAdminOnly', true);

export const AdminOrSuperAdminOnly = () => SetMetadata('adminOrSuperAdminOnly', true);

export const NonAdminOnly = () => SetMetadata('nonAdminOnly', true);
