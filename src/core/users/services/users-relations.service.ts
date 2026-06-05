import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersRelationsService {
    /**
     * Service responsible for defining which relations to load for User entities
     * based on the operation context (e.g., profile update loads avatar only,
     * while admin view might load avatar, roles, and posts).
     * Returns TypeORM relation configuration objects for selective eager loading.
     */

    getCurrentUserRelations = () => [
        'role',
        'avatar',
        'avatar.file',
        'group',
        'group.permissions',
        'subscription',
    ];
}
