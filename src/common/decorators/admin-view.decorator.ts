import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, PermissionsGuard } from '../guard';
import { AdminOrSuperAdminOnly, Permissions } from './';

export function AdminViewDecorator(ui: string) {
    return applyDecorators(
        ApiBearerAuth('JWT'),
        UseGuards(JwtAuthGuard, PermissionsGuard),
        AdminOrSuperAdminOnly(),
        Permissions({ ui, actions: ['view'] }),
    );
}
