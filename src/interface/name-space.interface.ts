export interface NameSpaceInterface {
    name: string;
    options: {
        roomPrefix?: string;
        queryParam?: string;
        defaultRoom?: string;
        requireAuth?: boolean;
        sAdminOnly?: boolean;
        adminOnly?: boolean;
        requiredPermissions?: { ui: string; actions: string[] };
    };
}
