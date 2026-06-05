import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { UserEntity } from '../entities/user.entity';
import { FileEntity } from '../../files/entities/file.entity';
import { UsersService } from './users.service';

@Injectable()
export class UsersEntityTransformService {
    /**
     * Service responsible for transforming user entities into specific DTOs
     * by selecting and formatting only the required fields for different contexts
     * (e.g., public profile, admin view, list view)
     */

    constructor(
        @Inject(forwardRef(() => UsersService))
        private readonly usersService: UsersService,
    ) {}

    /**
     * Transforms a file entities into a simplified object.
     */
    transformFiles = (file: FileEntity) => ({
        id: file.id,
        label: file.label,
        path: file.path,
        size: file.size,
        type: file.type,
        width: file.width,
        height: file.height,
    });

    /**
     * Transforms an entities object into a simplified format containing only the ID and label.
     */
    transformEntity = (data: any) => ({
        id: data.id,
        label: data.label,
    });

    /**
     * Transforms user entities to connected user info format
     * Returns user details with role label, avatar info, and password status
     */
    toConnectedUserInfo = (user: UserEntity) => ({
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        role: this.transformEntity(user.role),
        group: user.group ? this.transformEntity(user.group) : null,
        permissions: user.group?.permissions?.length
            ? this.usersService.permsService.transformPermsGroupedByUi(user.group.permissions)
            : [],
        hasPassword: user.password !== undefined,
        color: user.color,
        avatar: user.avatar ? this.transformFiles(user.avatar.file) : null,
        sub: user.subscription
            ? {
                  id: user.subscription?.id,
                  status: user.subscription?.status,
                  period: user.subscription?.period,
                  autoRenew: user.subscription?.autoRenew,
                  cancelAtPeriodEnd: user.subscription?.cancelAtPeriodEnd,
              }
            : null,
    });

    /**
     * Transforms a user entities into an admin user representation, including ID, fullname,
     * status, and transformed nested entities for role, group (if present), and avatar
     * file (if present). Returns the formatted admin object with a Date instance for createdAt.
     */
    transformAdmin = (user: UserEntity) => ({
        id: user.id,
        fullname: user.fullname,
        role: this.transformEntity(user.role),
        status: user.status,
        email: user.email,
        group: user.group ? this.transformEntity(user.group) : null,
        avatar: user.avatar ? this.transformFiles(user.avatar.file) : null,
        createdAt: new Date(user.createdAt),
    });

    /**
     * Transforms an array of user entities into an array of admin user representations
     * by applying the admin transformation to each user.
     */
    transformAdmins = (users: UserEntity[]) => users.map((u) => this.transformAdmin(u));
}
