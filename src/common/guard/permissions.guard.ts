import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EnvConfigService } from '../../utils/services/config';
import { ErrorHandlerService } from '../response';
import { CurrentUserInterface } from '../../interface';

@Injectable()
export class PermissionsGuard implements CanActivate {
    readonly superAdminLabel: string;
    readonly adminLabel: string;
    readonly userLabel: string;
    readonly supportLabel: string;

    constructor(
        private readonly reflector: Reflector,
        private readonly configService: EnvConfigService,
        private readonly errorHandler: ErrorHandlerService,
    ) {
        this.superAdminLabel = this.configService.sAdminRole;
        this.adminLabel = this.configService.adminRole;
        this.userLabel = this.configService.userRole;
        this.supportLabel = this.configService.supportRole;
    }

    /**
     * Validates role-based access restrictions for a route or action.
     * Checks if the route is restricted to Super Admin, Admin/Super Admin, or non-Admin users.
     * Throws a forbidden error if the user's role does not meet the restrictions.
     * Returns the required permissions (UI and actions) if access is granted.
     */
    checkRoleRestrictions(
        context: ExecutionContext,
        userRoleLabel: string,
    ): { ui: string; actions: string[] } {
        const [
            isRestrictedToSuperAdmin,
            isRestrictedToAdminOrSuperAdmin,
            isRestrictedToNonAdmins,
            requiredPermissions,
        ] = [
            this.reflector.get<boolean>('superAdminOnly', context.getHandler()),
            this.reflector.get<boolean>('adminOrSuperAdminOnly', context.getHandler()),
            this.reflector.get<boolean>('nonAdminOnly', context.getHandler()),
            this.reflector.get<{ ui: string; actions: string[] }>(
                'permissions',
                context.getHandler(),
            ) ||
                this.reflector.get<{ ui: string; actions: string[] }>(
                    'permissions',
                    context.getClass(),
                ),
        ];

        if (isRestrictedToSuperAdmin && userRoleLabel !== this.superAdminLabel)
            this.errorHandler.forbidden(
                `Route is only restricted to user with role: ${this.superAdminLabel}`,
                `Only Super Admin is allowed on this route.`,
            );

        if (
            isRestrictedToAdminOrSuperAdmin &&
            ![this.adminLabel, this.superAdminLabel, this.supportLabel].includes(userRoleLabel)
        )
            this.errorHandler.forbidden(
                `Route is only restricted to user with roles: ${this.superAdminLabel}, ${this.adminLabel} and ${this.supportLabel}`,
                `Only Admin or Super Admin are allowed on this route.`,
            );

        if (isRestrictedToNonAdmins && userRoleLabel !== this.userLabel)
            this.errorHandler.forbidden(
                `Route is only restricted to user with role: ${this.userLabel}`,
                `Only users are allowed on this route.`,
            );

        return requiredPermissions;
    }

    /**
     * Validates if the user has the required permissions to access a specific UI or perform actions.
     * Super Admins are granted automatic access. For other users, checks if the user's permissions
     * include the required UI scope and at least one of the required actions.
     * Throws a forbidden error if permissions are insufficient.
     */
    checkPermissions(
        requiredPermissions: { ui: string; actions: string[] },
        currentUser: CurrentUserInterface,
        userRoleLabel: string,
    ): boolean {
        if (!requiredPermissions || userRoleLabel === this.superAdminLabel) return true;

        const { ui, actions } = requiredPermissions;

        if (!currentUser?.permissions?.[ui])
            return this.errorHandler.forbidden(
                `Unallowed, doesn't have the right permission for this route.`,
                `Access denied: missing permission scope for '${ui}'.`,
            );

        const userActions = currentUser.permissions[ui];
        const hasPermission = actions.some((action) => userActions.includes(action));

        if (!hasPermission)
            this.errorHandler.forbidden(
                `Access denied: missing required permissions for '${ui}' (${actions.join(', ')}).`,
                `Access denied: missing required permissions for '${ui}' (${actions.join(', ')}).`,
            );

        return true;
    }

    /**
     * Determines if the current user is authorized to access a route or resource.
     * Retrieves the user from the request, checks role-based restrictions, and validates permissions.
     * Returns true if access is granted; throws a forbidden error otherwise.
     */
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        if (!request.user) return true;

        const currentUser: CurrentUserInterface = request.user;
        const userRoleLabel = currentUser.role.toLowerCase();

        const requiredPermissions = this.checkRoleRestrictions(context, userRoleLabel);

        return this.checkPermissions(requiredPermissions, currentUser, userRoleLabel);
    }
}
